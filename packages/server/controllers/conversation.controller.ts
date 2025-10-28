import type { Request, Response } from 'express';
import { Conversation } from '../models/conversation';
import { v4 as uuidv4 } from 'uuid';
import z from 'zod';
import mondaySDK from 'monday-sdk-js';
import { syncMongoToMonday } from '../services/syncToMonday.service';

// Initialize Monday SDK
const monday = mondaySDK();
monday.setToken(process.env.MONDAY_API_TOKEN!);

// Your Monday.com board ID
const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID!;

// Column IDs from your Monday board
const MONDAY_COLUMNS = {
   conversationId: 'text_mkx4kdy9',
   lastUpdated: 'date_mkx4tec8',
   messages: 'long_text_mkx4fy02',
   userId: 'text_mkx4e9tg',
   _id: 'text_mkx45rgd',
};

// Schemas
const saveMessagesSchema = z.object({
   conversationId: z.string(),
   messages: z.array(
      z.object({
         sender: z.string(),
         text: z.string(),
         timestamp: z.string().optional(),
         id: z.string(),
      })
   ),
   title: z.string(),
});

const updateConversationTitleSchema = z.object({
   conversationId: z.string(),
   title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title too long'),
});

const createConversationSchema = z.object({
   title: z
      .string()
      .trim()
      .min(1, 'Conversation title is required')
      .max(200, 'Title too long — keep it under 200 characters')
      .optional(),
});

const getConversationByIdSchema = z.object({
   id: z.string(),
});

// Helper function to create/update Monday item
async function upsertMondayItem(conversation: any) {
   try {
      const messagesJson = JSON.stringify(conversation.messages);
      const lastUpdated = new Date(conversation.lastUpdate)
         .toISOString()
         .split('T')[0];

      // Search for existing item by conversationId
      const searchQuery = `query {
         items_page_by_column_values (
            board_id: ${MONDAY_BOARD_ID},
            columns: [{column_id: "${MONDAY_COLUMNS.conversationId}", column_values: ["${conversation.conversationId}"]}]
         ) {
            items {
               id
            }
         }
      }`;

      const searchResponse = await monday.api(searchQuery);
      const existingItems =
         searchResponse.data?.items_page_by_column_values?.items || [];

      if (existingItems.length > 0) {
         // Update existing item
         const itemId = existingItems[0].id;
         const updateQuery = `mutation {
            change_multiple_column_values(
               item_id: ${itemId},
               board_id: ${MONDAY_BOARD_ID},
               column_values: ${JSON.stringify(
                  JSON.stringify({
                     [MONDAY_COLUMNS.lastUpdated]: { date: lastUpdated },
                     [MONDAY_COLUMNS.messages]: messagesJson,
                     [MONDAY_COLUMNS.userId]: conversation.userId || '',
                     [MONDAY_COLUMNS._id]: conversation._id.toString(),
                  })
               )}
            ) {
               id
            }
         }`;
         await monday.api(updateQuery);
         console.log(`Updated Monday item ${itemId}`);
      } else {
         // Create new item
         const createQuery = `mutation {
            create_item(
               board_id: ${MONDAY_BOARD_ID},
               item_name: ${JSON.stringify(conversation.title)},
               column_values: ${JSON.stringify(
                  JSON.stringify({
                     [MONDAY_COLUMNS.conversationId]:
                        conversation.conversationId,
                     [MONDAY_COLUMNS.lastUpdated]: { date: lastUpdated },
                     [MONDAY_COLUMNS.messages]: messagesJson,
                     [MONDAY_COLUMNS.userId]: conversation.userId || '',
                     [MONDAY_COLUMNS._id]: conversation._id.toString(),
                  })
               )}
            ) {
               id
            }
         }`;
         await monday.api(createQuery);
         console.log(
            `Created new Monday item for conversation ${conversation.conversationId}`
         );
      }
   } catch (error) {
      console.error('Error syncing to Monday:', error);
      throw error;
   }
}

export const conversationController = {
   async saveMessages(req: Request, res: Response) {
      console.log('conversation----!!!!!!!!---');
      const parseResult = saveMessagesSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      try {
         const { conversationId, messages } = parseResult.data;

         const updatedConvo = await Conversation.findOneAndUpdate(
            { conversationId },
            {
               $set: {
                  messages,
                  lastUpdate: new Date(),
               },
            },
            { new: true }
         );

         if (!updatedConvo) {
            return res.status(404).json({ error: 'Conversation not found' });
         }

         // Sync to Monday.com
         await upsertMondayItem(updatedConvo);

         res.json(updatedConvo);
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to save messages' });
      }
   },

   async getAllConversations(req: Request, res: Response) {
      try {
         const { userId } = req.query;

         const filter: any = {};
         if (userId) filter.userId = userId;

         const conversations = await Conversation.find(filter)
            .select('conversationId title lastUpdate userId')
            .sort({ lastUpdate: -1 });

         res.json(conversations);
         console.log('_______Syncing Mongo To Monday_______');
         await syncMongoToMonday();
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to fetch conversations' });
      }
   },

   async getConversationById(req: Request, res: Response) {
      const parseResult = getConversationByIdSchema.safeParse(req.params);
      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      try {
         const { id } = parseResult.data;
         const convo = await Conversation.findOne({ conversationId: id });

         if (!convo) {
            return res.status(404).json({ error: 'Conversation not found' });
         }

         res.json(convo);
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to fetch conversation' });
      }
   },

   async updateConversationById(req: Request, res: Response) {
      const parseResult = updateConversationTitleSchema.safeParse({
         conversationId: req.body.conversationId,
         title: req.body.title,
      });

      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      const { conversationId, title } = parseResult.data;

      try {
         const updatedConvo = await Conversation.findOneAndUpdate(
            { conversationId },
            { $set: { title } },
            { new: true }
         );

         if (!updatedConvo) {
            return res.status(404).json({ error: 'Conversation not found' });
         }

         // Sync title update to Monday.com
         await upsertMondayItem(updatedConvo);

         res.json(updatedConvo);
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to update conversation' });
      }
   },

   getMessagesByConversationId: async (req: Request, res: Response) => {
      const parseResult = getConversationByIdSchema.safeParse(req.params);
      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      try {
         const { id } = parseResult.data;

         const conversation = await Conversation.findOne({
            conversationId: id,
         });

         if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
         }

         console.log('conversation------------------');
         res.json(conversation.messages || []);
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to load messages' });
      }
   },
};
