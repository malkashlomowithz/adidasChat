import dotenv from 'dotenv';
import { MongoClient, Db, Collection } from 'mongodb';
import axios, { type AxiosResponse } from 'axios';

dotenv.config();

// --- Types & Interfaces ---
interface ConversationMessage {
   sender: string;
   text: string;
}

interface MongoConversation {
   _id: string;
   title?: string;
   conversationId: string;
   messages?: ConversationMessage[];
   lastUpdate?: Date | string;
   userId?: string;
}

interface MondayColumnValue {
   id: string;
   value: string;
}

interface MondayItem {
   id: string;
   name: string;
   column_values: MondayColumnValue[];
}

interface MondayBoardResponse {
   data: {
      boards: Array<{
         items_page: {
            items: MondayItem[];
         };
      }>;
   };
   errors?: Array<{ message: string }>;
}

interface MondayCreateResponse {
   data: {
      create_item: {
         id: string;
         name: string;
      };
   };
   errors?: Array<{ message: string }>;
}

interface ColumnValuesObject {
   [key: string]: string | { date: string | null } | undefined;
}

// --- Load env variables ---
const uri: string | undefined = process.env.MONGODB_URI;
const dbName: string = 'test';
const collectionName: string = 'conversations';
const mondayKey: string | undefined = process.env.MONDAY_API_TOKEN;
const boardId: string = '5064428801';

// Validation
if (!uri) throw new Error('❌ MONGO_URI missing in .env');
if (!mondayKey) throw new Error('❌ MONDAY_API_TOKEN missing in .env');
if (!boardId) throw new Error('❌ BOARD_ID missing in .env');

console.log('🔧 Configuration:');
console.log(`   DB Name: ${dbName}`);
console.log(`   Collection: ${collectionName}`);
console.log(`   Board ID: ${boardId}`);
console.log('');

// --- 1️⃣ Get all data from MongoDB ---
async function getMongoData(): Promise<MongoConversation[]> {
   const client = new MongoClient(uri as string);
   try {
      await client.connect();
      console.log('✅ Connected to MongoDB');

      const db: Db = client.db(dbName);
      const collection: Collection<MongoConversation> =
         db.collection(collectionName);

      const data: MongoConversation[] = await collection.find({}).toArray();
      console.log(`📦 Fetched ${data.length} items from "${collectionName}"`);
      if (data.length > 0)
         console.log('📄 Sample item:', JSON.stringify(data[0], null, 2));

      return data;
   } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ MongoDB Error:', errorMessage);
      throw err;
   } finally {
      await client.close();
      console.log('🔌 MongoDB connection closed\n');
   }
}

// --- 1.5️⃣ Get all items from Monday board ---
async function getMondayItems(): Promise<MondayItem[]> {
   const query = `
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page {
          items {
            id
            name
            column_values {
              id
              value
            }
          }
        }
      }
    }
  `;

   try {
      const response: AxiosResponse<MondayBoardResponse> = await axios.post(
         'https://api.monday.com/v2',
         {
            query,
            variables: {
               boardId: (boardId as string).toString(),
            },
         },
         {
            headers: {
               Authorization: mondayKey,
               'Content-Type': 'application/json',
            },
         }
      );

      if (response.data.errors) {
         console.error(
            '❌ GraphQL Error fetching items:',
            response.data.errors
         );
         return [];
      }

      const items: MondayItem[] =
         response.data.data.boards[0]?.items_page?.items || [];
      console.log(`📋 Fetched ${items.length} items from Monday board\n`);

      // Debug: Log all existing conversation IDs
      console.log('📌 Existing conversation IDs on Monday:');
      items.forEach((item, idx) => {
         const convoIdColumn = item.column_values.find(
            (cv) => cv.id === 'text_mkx4kdy9'
         );
         const rawValue = convoIdColumn?.value || 'N/A';
         const convoId = convoIdColumn?.value
            ? extractTextValue(convoIdColumn.value)
            : 'N/A';
         if (idx < 2) {
            console.log(`   [DEBUG] Raw: ${JSON.stringify(rawValue)}`);
            console.log(
               `   [DEBUG] After extraction: ${JSON.stringify(convoId)}`
            );
            console.log(`   [DEBUG] Extracted length: ${convoId.length}`);
         }
         console.log(`   - Item: "${item.name}" | Convo ID: ${convoId}`);
      });
      console.log('');

      return items;
   } catch (err) {
      const errorMessage =
         err instanceof Error && err instanceof axios.AxiosError && err.response
            ? err.response.data
            : err instanceof Error
              ? err.message
              : String(err);
      console.error('❌ Error fetching Monday items:', errorMessage);
      return [];
   }
}

// --- Helper: Extract text value from Monday column ---
function extractTextValue(value: string | null | undefined): string {
   try {
      if (!value) return '';
      let text: string | Record<string, unknown> = value;

      // Parse outer {"text": "..."} if present
      if (typeof value === 'string' && value.trim().startsWith('{')) {
         const parsed = JSON.parse(value) as Record<string, unknown>;
         if (parsed?.text) text = parsed.text as string;
      }

      // Remove escaped quotes until clean
      while (typeof text === 'string' && /^".*"$/.test(text.trim())) {
         text = text.trim();
         text = text.slice(1, -1);
      }

      return String(text).trim();
   } catch (e) {
      return String(value).trim();
   }
}

// --- 1.75️⃣ Check if conversation ID exists in Monday board ---
function conversationExistsOnMonday(
   convoId: string | undefined,
   mondayItems: MondayItem[]
): boolean {
   if (!convoId) return false;

   const cleanConvoId: string = String(convoId).trim();

   const found = mondayItems.find((item) => {
      const convoIdColumn = item.column_values.find(
         (cv) => cv.id === 'text_mkx4kdy9'
      );
      if (!convoIdColumn) return false;

      const columnValue: string = extractTextValue(convoIdColumn.value);
      const matches: boolean = columnValue === cleanConvoId;

      // Debug: show first few comparisons
      if (mondayItems.indexOf(item) < 3 && cleanConvoId.includes('792d505f')) {
         console.log(
            `   [DEBUG] Comparing: "${columnValue}" (len: ${columnValue.length}) === "${cleanConvoId}" (len: ${cleanConvoId.length})`
         );
      }

      return matches;
   });

   return !!found;
}

// --- 2️⃣ Send a single conversation to Monday ---
async function sendToMonday(
   convo: MongoConversation
): Promise<string | boolean> {
   const itemName: string = convo.title || 'Untitled Conversation';
   console.log(`\n📤 Creating: "${itemName}"`);

   // Convert messages array to readable string
   const messagesText: string = Array.isArray(convo.messages)
      ? convo.messages
           .map((msg, i) => `${i + 1}. [${msg.sender}] ${msg.text}`)
           .join('\n')
      : '';

   // Prepare column values based on your board columns
   const columnValuesObj: ColumnValuesObject = {
      text_mkx45rgd: convo._id || '',
      text_mkx4kdy9: convo.conversationId || '',
      date_mkx4tec8: convo.lastUpdate
         ? { date: formatDate(convo.lastUpdate) }
         : undefined,
      text_mkx4e9tg: convo.userId || '',
      long_text_mkx4fy02: messagesText || '',
   };

   // Clean undefined values
   Object.keys(columnValuesObj).forEach((key) => {
      if (columnValuesObj[key] === undefined) delete columnValuesObj[key];
   });

   const columnValues: string = JSON.stringify(columnValuesObj);

   const mutation = `
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `;

   try {
      const response: AxiosResponse<MondayCreateResponse> = await axios.post(
         'https://api.monday.com/v2',
         {
            query: mutation,
            variables: {
               boardId: (boardId as string).toString(),
               itemName,
               columnValues,
            },
         },
         {
            headers: {
               Authorization: mondayKey,
               'Content-Type': 'application/json',
            },
         }
      );

      if (response.data.errors) {
         console.error(
            `❌ GraphQL Error for "${itemName}":`,
            response.data.errors
         );
         return false;
      }

      const itemId: string = response.data.data.create_item.id;
      console.log(`✅ Created "${itemName}" (Item ID: ${itemId})`);
      return itemId;
   } catch (err) {
      const errorMessage =
         err instanceof Error && err instanceof axios.AxiosError && err.response
            ? err.response.data
            : err instanceof Error
              ? err.message
              : String(err);
      console.error(`❌ Error creating "${itemName}":`, errorMessage);
      return false;
   }
}

// --- Helper: Format date for Monday.com ---
function formatDate(dateInput: Date | string | undefined): string | null {
   try {
      if (!dateInput) return null;
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0] || Date(); // YYYY-MM-DD
   } catch {
      return null;
   }
}

// --- 3️⃣ Main Sync ---
export async function syncMongoToMonday(): Promise<void> {
   console.log('🚀 Starting sync...\n');

   try {
      const data: MongoConversation[] = await getMongoData();
      if (data.length === 0) {
         console.log('⚠️ No data to sync. Exiting.');
         return;
      }

      console.log(''); // spacing
      const mondayItems: MondayItem[] = await getMondayItems();
      console.log(''); // spacing

      let success: number = 0;
      let fail: number = 0;
      let skipped: number = 0;

      for (const convo of data) {
         console.log(
            `\n🔍 Checking: "${convo.title || 'Untitled Conversation'}" (ID: ${convo.conversationId})`
         );

         // Check if conversation already exists on Monday
         if (conversationExistsOnMonday(convo.conversationId, mondayItems)) {
            console.log(`⏭️  Skipped - already exists`);
            skipped++;
         } else {
            console.log(`   → Not found on Monday, creating...`);
            const result = await sendToMonday(convo);
            if (result) success++;
            else fail++;
         }

         await new Promise((res) => setTimeout(res, 500)); // prevent rate limits
      }

      console.log('\n' + '='.repeat(50));
      console.log(`🎉 Sync complete!`);
      console.log(`✅ Created: ${success}`);
      console.log(`❌ Failed: ${fail}`);
      console.log(`⏭️  Skipped: ${skipped}`);
      console.log(`📊 Total: ${data.length}`);
      console.log('='.repeat(50));
   } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Sync failed:', errorMessage);
      process.exit(1);
   }
}
