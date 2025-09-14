import type { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
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
   prompt: z
      .string()
      .trim()
      .min(1, 'Need some text to generate a title 🙂')
      .max(200, 'Title prompt too long — keep it short'),
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
         const { prompt, conversationId } = req.body;
         const response = await chatService.sendMessage(prompt, conversationId);

         res.json({ message: response.message });
      } catch (error) {
         res.status(500).json({ error: 'failed to generate a respomse' });
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
         const title = await chatService.generateTitle(conversationId);
         res.json({ title });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: 'failed to generate a title' });
      }
   },
};
