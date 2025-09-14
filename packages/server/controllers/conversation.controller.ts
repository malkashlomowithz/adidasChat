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
         content: z.string(),
         timestamp: z.string().optional(),
      })
   ),
});

const updateConversationTitleSchema = z.object({
   conversationId: z.string(),
   title: z.string().min(200, 'Give me a better title'),
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
   id: z.string().uuid('Invalid conversationId format'),
});

export const conversationController = {
   async saveMessages(req: Request, res: Response) {
      // Validate body
      const parseResult = saveMessagesSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      try {
         const { conversationId, messages } = parseResult.data;

         // Update the conversation
         const updatedConvo = await Conversation.findOneAndUpdate(
            { conversationId },
            { $set: { messages } }, // replace messages array
            { new: true } // return the updated document
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
   async createConversation(req: Request, res: Response) {
      const parseResult = createConversationSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      try {
         const conversationId = uuidv4();
         const { title } = parseResult.data;

         const conversation = await Conversation.create({
            conversationId,
            title: title ?? 'New Chat',
            messages: [],
         });

         res.json(conversation);
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to create conversation' });
      }
   },

   async getAllConversations(req: Request, res: Response) {
      try {
         const conversations = await Conversation.find().select(
            'conversationId title'
         );
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

         res.json(updatedConvo);
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to update conversation' });
      }
   },
};
