import axios from 'axios';

const MONDAY_API_URL = 'https://api.monday.com/v2';
const MONDAY_API_KEY =
   'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU3NTY3MjE3OSwiYWFpIjoxMSwidWlkIjo5Mjc2NjUyMCwiaWFkIjoiMjAyNS0xMC0xOVQwNTo1OToyMi4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6Mjk1ODExNDQsInJnbiI6ImV1YzEifQ.pbG6HUA_nTlED_iNnCWUOeMRlYq8L8hh3RupvGS9KBk';
const BOARD_ID = process.env.MONDAY_BOARD_ID_CON!;

/**
 * Creates or updates an item in Monday.com for a conversation
 */
export async function createMondayItem(conversation: any) {
   try {
      console.log('🟢 [MONDAY] Syncing conversation to Monday...');

      // Verify env vars
      if (!MONDAY_API_KEY || !BOARD_ID) {
         console.error(
            '❌ Missing MONDAY_API_KEY or MONDAY_BOARD_ID_CON in environment variables'
         );
         return;
      }

      // Fetch existing items to see if this conversation already exists
      const checkQuery = `
      query ($boardId: [Int]) {
        items_page_by_board (board_id: $boardId, limit: 200) {
          items {
            id
            name
            column_values {
              id
              text
            }
          }
        }
      }
    `;
      const checkRes = await axios.post(
         MONDAY_API_URL,
         { query: checkQuery, variables: { boardId: Number(BOARD_ID) } },
         {
            headers: {
               Authorization: MONDAY_API_KEY,
               'Content-Type': 'application/json',
            },
         }
      );

      const existingItem = checkRes.data.data.items_page_by_board.items.find(
         (item: any) =>
            item.column_values.some(
               (cv: any) =>
                  cv.id === 'text_mkx4kdy9' &&
                  cv.text === conversation.conversationId
            )
      );

      // Format column values
      const columnValues = JSON.stringify({
         text_mkx4kdy9: conversation.conversationId, // ConversationId
         text_mkx4e9tg: conversation.userId || 'N/A', // UserId
         date_mkx4tec8: {
            date: new Date(conversation.lastUpdate).toISOString().split('T')[0],
         },
         long_text_mkx4fy02: {
            text: (conversation.messages || [])
               .map((m: any) => `${m.sender}: ${m.text}`)
               .join('\n'),
         },
         text_mkx45rgd: conversation._id?.toString() || '',
      });

      // Create or update item
      if (existingItem) {
         console.log(
            `🟡 [MONDAY] Updating existing item (${existingItem.id})...`
         );

         const updateQuery = `
        mutation ($itemId: ID!, $columnValues: JSON!, $itemName: String!) {
          change_multiple_column_values(item_id: $itemId, column_values: $columnValues) {
            id
          }
          change_simple_column_value(item_id: $itemId, column_id: "name", value: $itemName)
        }
      `;

         await axios.post(
            MONDAY_API_URL,
            {
               query: updateQuery,
               variables: {
                  itemId: existingItem.id,
                  columnValues,
                  itemName: conversation.title || 'Untitled Conversation',
               },
            },
            {
               headers: {
                  Authorization: MONDAY_API_KEY,
                  'Content-Type': 'application/json',
               },
            }
         );

         console.log(`✅ [MONDAY] Updated item "${conversation.title}"`);
      } else {
         console.log('🟢 [MONDAY] Creating new item...');

         const createQuery = `
        mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
          create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
            id
            name
          }
        }
      `;

         await axios.post(
            MONDAY_API_URL,
            {
               query: createQuery,
               variables: {
                  boardId: BOARD_ID,
                  itemName: conversation.title || 'Untitled Conversation',
                  columnValues,
               },
            },
            {
               headers: {
                  Authorization: MONDAY_API_KEY,
                  'Content-Type': 'application/json',
               },
            }
         );

         console.log(`✅ [MONDAY] Created new item "${conversation.title}"`);
      }
   } catch (err: any) {
      console.error(
         '❌ [MONDAY] Error syncing conversation:',
         err.response?.data || err.message
      );
   }
}
