//Implementation detail
const conversations = new Map<string, string>();

//export public interface

export const conversationRepository = {
   getLastResponceId(conversationId: string) {
      return conversations.get(conversationId);
   },

   setLastResponceId(conversationId: string, responseId: string) {
      return conversations.set(conversationId, responseId);
   },
};
