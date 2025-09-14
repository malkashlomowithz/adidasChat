import { Conversation, type Message } from '../models/conversation';

export type { Message };

export const conversationRepository = {
   async addMessage(conversationId: string, message: Message) {
      // Add a message, create conversation if it doesn't exist, return updated conversation
      return Conversation.findOneAndUpdate(
         { conversationId },
         { $push: { messages: message } },
         { upsert: true, new: true }
      ).exec();
   },

   async getConversation(conversationId: string) {
      return Conversation.findOne({ conversationId }).exec();
   },

   async setTitle(conversationId: string, title: string) {
      return Conversation.findOneAndUpdate(
         { conversationId },
         { title },
         { new: true }
      ).exec();
   },
};
