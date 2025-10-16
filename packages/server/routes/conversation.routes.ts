import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';

const router = Router();

//router.post('/api/conversations', conversationController.createConversation);

router.get('/api/conversations/', conversationController.getAllConversations);

router.get(
   '/api/conversations/:id',
   conversationController.getConversationById
);

router.get(
   '/api/conversations/:id/messages',
   conversationController.getMessagesByConversationId
);

router.put(
   '/api/conversations/:id',
   conversationController.updateConversationById
);

export default router;
