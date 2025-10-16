import type { Request, Response } from 'express';
import { Conversation } from '../models/conversation';
import { v4 as uuidv4 } from 'uuid';
import z from 'zod';

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

         res.json(updatedConvo);
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to save messages' });
      }
   },
   //    async createConversation(req: Request, res: Response) {
   //       const parseResult = createConversationSchema.safeParse(req.body);
   //       if (!parseResult.success) {
   //          return res.status(400).json(parseResult.error.format());
   //       }

   //       try {
   //          const conversationId = uuidv4();
   //          const { title } = parseResult.data;
   // console.log('conversation-------')
   //          const conversation = await Conversation.create({
   //             conversationId,
   //             title: title ?? 'No Title',
   //             messages: [],
   //             lastUpdate: Date.now,
   //          });
   //         console.log('conversation-------', conversation)
   //          res.json(conversation);
   //       } catch (err) {
   //          console.error(err);
   //          res.status(500).json({ error: 'Failed to create conversation' });
   //       }
   //    },

   async getAllConversations(req: Request, res: Response) {
      try {
         const { userId } = req.query; // ✅ read from query string

         const filter: any = {};
         if (userId) filter.userId = userId;

         const conversations = await Conversation.find(filter)
            .select('conversationId title lastUpdate userId')
            .sort({ lastUpdate: -1 });

         res.json(conversations);
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
      // Validate input
      const parseResult = updateConversationTitleSchema.safeParse({
         conversationId: req.body.conversationId, // match schema
         title: req.body.title,
      });

      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      const { conversationId, title } = parseResult.data;

      try {
         // Find by conversationId and update

         const updatedConvo = await Conversation.findOneAndUpdate(
            { conversationId }, // find by conversationId
            { $set: { title } }, // update the title
            { new: true } // return updated document
         );
         if (!updatedConvo) {
            return res.status(404).json({ error: 'Conversation not found' });
         }
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to update conversation' });
      }
   },

   getMessagesByConversationId: async (req: Request, res: Response) => {
      // 1. Validate route params with Zod
      const parseResult = getConversationByIdSchema.safeParse(req.params);
      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      try {
         const { id } = parseResult.data;

         // 2. Find conversation by conversationId (UUID string)
         const conversation = await Conversation.findOne({
            conversationId: id,
         });

         if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
         }

         // 3. Return messages
         console.log('conversation------------------');
         res.json(conversation.messages || []);
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to load messages' });
      }
   },
};
