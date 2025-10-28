import dotenv from 'dotenv';
import { MongoClient, Db, Collection } from 'mongodb';
import axios from 'axios';

dotenv.config();

/* ------------------------------------ */
/*              INTERFACES              */
/* ------------------------------------ */
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
   value: string | null;
}

interface MondayItem {
   id: string;
   name: string;
   column_values: MondayColumnValue[];
}

/* ------------------------------------ */
/*           ENV + CONFIG               */
/* ------------------------------------ */
const uri = process.env.MONGODB_URI || '';
const dbName = 'test';
const collectionName = 'conversations';
const mondayKey = process.env.MONDAY_API_TOKEN;
const boardId = '5067393276';

// Board column IDs from your structure
const COLUMN_IDS = {
   userId: 'text_mkx5d5rn',
   mongoId: 'text_mkx5aneb',
   conversationId: 'text_mkx5w9ez',
   lastUpdated: 'date_mkx5t89q',
   messages: 'text_mkx5jgs3',
};

if (!uri) throw new Error('❌ MONGODB_URI missing');
if (!mondayKey) throw new Error('❌ MONDAY_API_TOKEN missing');

console.log('🔧 Loaded configuration successfully');

/* ------------------------------------ */
/*        1️⃣ FETCH FROM MONGODB         */
/* ------------------------------------ */
async function getMongoData(): Promise<MongoConversation[]> {
   const client = new MongoClient(uri);
   try {
      await client.connect();
      console.log('✅ Connected to MongoDB');

      const db: Db = client.db(dbName);
      const collection: Collection<MongoConversation> =
         db.collection(collectionName);
      const data = await collection.find({}).toArray();

      console.log(`📦 Found ${data.length} conversations`);
      return data;
   } finally {
      await client.close();
   }
}

/* ------------------------------------ */
/*        2️⃣ FETCH MONDAY ITEMS         */
/* ------------------------------------ */
async function getMondayItems(): Promise<MondayItem[]> {
   const query = `
    query ($boardId: [ID!]) {
      boards (ids: $boardId) {
        items_page (limit: 500) {
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

   const res = await axios.post(
      'https://api.monday.com/v2',
      { query, variables: { boardId } },
      {
         headers: {
            Authorization: mondayKey,
            'Content-Type': 'application/json',
         },
      }
   );

   if (res.data.errors) {
      console.error('❌ Error fetching Monday items:', res.data.errors);
      return [];
   }

   const items = res.data.data.boards[0]?.items_page?.items || [];
   console.log(`📋 Loaded ${items.length} Monday items`);
   return items;
}

/* ------------------------------------ */
/*        HELPERS                       */
/* ------------------------------------ */
function extractTextValue(value: string | null | undefined): string {
   if (!value) return '';
   let current = value.trim();
   try {
      while (current.startsWith('{') || current.startsWith('"')) {
         const parsed = JSON.parse(current);
         if (typeof parsed === 'string') current = parsed;
         else if (parsed?.text) current = parsed.text;
         else break;
      }
   } catch {
      return value;
   }
   return current.trim();
}

function formatDate(dateInput?: string | Date): string {
   if (!dateInput) return '';
   const d = new Date(dateInput);
   if (isNaN(d.getTime())) return '';
   return d.toISOString().split('T')[0] || '';
}

function findConversationOnMonday(
   convoId: string,
   mondayItems: MondayItem[]
): MondayItem | null {
   const cleanId = String(convoId).trim();
   return (
      mondayItems.find((item) => {
         const field = item.column_values.find(
            (cv) => cv.id === COLUMN_IDS.conversationId
         );
         return extractTextValue(field?.value) === cleanId;
      }) || null
   );
}

/* ------------------------------------ */
/*        3️⃣ CREATE ON MONDAY           */
/* ------------------------------------ */
async function createOnMonday(convo: MongoConversation): Promise<boolean> {
   const messages = (convo.messages || [])
      .map((m, i) => `${i + 1}. [${m.sender}] ${m.text}`)
      .join('\n');

   const columnValues = {
      [COLUMN_IDS.mongoId]: convo._id,
      [COLUMN_IDS.conversationId]: convo.conversationId,
      [COLUMN_IDS.userId]: convo.userId,
      [COLUMN_IDS.lastUpdated]: convo.lastUpdate
         ? { date: formatDate(convo.lastUpdate) }
         : { date: null },
      [COLUMN_IDS.messages]: messages,
   };

   const mutation = `
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
        id
        name
      }
    }
  `;

   try {
      const res = await axios.post(
         'https://api.monday.com/v2',
         {
            query: mutation,
            variables: {
               boardId,
               itemName: convo.title || 'Untitled',
               columnValues: JSON.stringify(columnValues),
            },
         },
         {
            headers: {
               Authorization: mondayKey,
               'Content-Type': 'application/json',
            },
         }
      );

      if (res.data.errors) {
         console.error('❌ Error creating item:', res.data.errors);
         return false;
      }

      console.log(`✅ Created item for conversation ${convo.conversationId}`);
      return true;
   } catch (err: any) {
      console.error(
         '❌ Error creating on Monday:',
         err.response?.data || err.message
      );
      return false;
   }
}

/* ------------------------------------ */
/*        4️⃣ UPDATE ON MONDAY           */
/* ------------------------------------ */
async function updateOnMonday(
   itemId: string,
   convo: MongoConversation
): Promise<boolean> {
   const updates = [
      { id: COLUMN_IDS.mongoId, value: convo._id },
      { id: COLUMN_IDS.conversationId, value: convo.conversationId },
      { id: COLUMN_IDS.userId, value: convo.userId },
      {
         id: COLUMN_IDS.lastUpdated,
         value: { date: formatDate(convo.lastUpdate) },
      },
      {
         id: COLUMN_IDS.messages,
         value: (convo.messages || [])
            .map((m, i) => `${i + 1}. [${m.sender}] ${m.text}`)
            .join('\n'),
      },
   ];

   for (const upd of updates) {
      const mutation = `
      mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value (board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
          id
        }
      }
    `;

      try {
         await axios.post(
            'https://api.monday.com/v2',
            {
               query: mutation,
               variables: {
                  boardId,
                  itemId,
                  columnId: upd.id,
                  value: JSON.stringify(upd.value),
               },
            },
            {
               headers: {
                  Authorization: mondayKey,
                  'Content-Type': 'application/json',
               },
            }
         );
      } catch (err: any) {
         console.error(
            `❌ Failed to update ${upd.id}:`,
            err.response?.data || err.message
         );
         return false;
      }
   }

   console.log(`🔄 Updated item ${itemId} successfully`);
   return true;
}

/* ------------------------------------ */
/*        5️⃣ MAIN SYNC FUNCTION         */
/* ------------------------------------ */
export async function syncMongoToMonday(): Promise<void> {
   console.log('🚀 Starting sync...');
   const mongoData = await getMongoData();
   const mondayItems = await getMondayItems();

   let created = 0,
      updated = 0,
      skipped = 0;

   for (const convo of mongoData) {
      const existing = findConversationOnMonday(
         convo.conversationId,
         mondayItems
      );
      if (!existing) {
         const ok = await createOnMonday(convo);
         if (ok) created++;
         continue;
      }

      const mondayDate = extractTextValue(
         existing.column_values.find((cv) => cv.id === COLUMN_IDS.lastUpdated)
            ?.value
      );
      const mongoDate = formatDate(convo.lastUpdate);

      if (mondayDate === mongoDate) {
         console.log(
            `⏭ Skipping ${convo.conversationId} — already up to date`
         );
         skipped++;
      } else {
         const ok = await updateOnMonday(existing.id, convo);
         if (ok) updated++;
      }

      await new Promise((res) => setTimeout(res, 400)); // avoid rate limits
   }

   console.log(`
=============================
🎯 Sync complete!
✅ Created: ${created}
🔄 Updated: ${updated}
⏭ Skipped: ${skipped}
📊 Total: ${mongoData.length}
=============================
`);
}

/* ------------------------------------ */
/*          RUN IF CALLED DIRECTLY      */
/* ------------------------------------ */
if (require.main === module) {
   syncMongoToMonday();
}
