import { Conversation, type Message } from '../models/conversation';

export type { Message };

export const conversationRepository = {
   async addMessage(conversationId: string, message: Message, userId: string) {
      // Add a message, create conversation if it doesn't exist, return updated conversation
      return Conversation.findOneAndUpdate(
         { conversationId }, // filter
         {
            $set: { userId }, // ensure userId is set (or updated)
            $push: { messages: message }, // add message to messages array
         },
         { upsert: true, new: true } // create if not exist, return updated doc
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
