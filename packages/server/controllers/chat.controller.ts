import type { Request, Response } from 'express';
import { productChatService } from '../services/chat.service';
import z from 'zod';

// Implementation detail
const chatSchema = z.object({
   prompt: z
      .string()
      .trim()
      .min(1, 'Oops! You forgot to type your prompt 🙂')
      .max(1000, 'That’s a bit too much text — keep it under 1000 characters'),
   conversationId: z.string().uuid(),
});

const titleSchema = z.object({
   conversationId: z.string().uuid(), // must be a valid UUID
});

// Public interface
export const chatController = {
   async sendMessage(req: Request, res: Response) {
      const parseResult = chatSchema.safeParse(req.body);
      if (!parseResult.success) {
         res.status(400).json(parseResult.error.format());
         return;
      }

      try {
         console.log('log----', parseResult);
         const { prompt, conversationId, userId } = req.body;
         const response = await productChatService.sendMessage(
            prompt,
            conversationId,
            userId
         );

         res.json({ message: response.message });
      } catch (error) {
         res.status(500).json({ error: 'failed to generate a response' });
      }
   },

   async generateTitle(req: Request, res: Response) {
      const parseResult = titleSchema.safeParse(req.body);
      if (!parseResult.success) {
         res.status(400).json(parseResult.error.format());
         return;
      }

      try {
         const { conversationId } = req.body;
         console.log('Created :', conversationId);
         const title =
            await productChatService.generateTitleWithId(conversationId);
         res.json({ title });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: 'failed to generate a title' });
      }
   },
};
