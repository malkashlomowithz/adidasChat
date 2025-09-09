import express from 'express';
import type { Request, Response } from 'express';
import { chatController } from './controllers/chat.controller';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
   res.send('process.env.OPENAI_API_KEY');
});

router.get('/api/hello', (req, res) => {
   res.json({ message: 'Hello from backend!' });
});

router.post('/api/chat', chatController.sendMessage);

export default router;
