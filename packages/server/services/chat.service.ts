import OpenAI from 'openai';
import {
   conversationRepository,
   type Message,
} from '../repositories/conversation.repository';

const client = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});

type ChatResponse = {
   id: string;
   message: string;
};

export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<ChatResponse> {
      // 1. Save user message
      const userMessage: Message = {
         sender: 'user',
         text: prompt,
         timestamp: new Date(),
         id: '',
      };
      await conversationRepository.addMessage(conversationId, userMessage);

      // 2. Fetch conversation
      const conversation =
         await conversationRepository.getConversation(conversationId);

      // 3. Find last responseId
      const lastBotMessage = conversation?.messages
         .slice()
         .reverse()
         .find((m) => m.sender === 'bot' && m.id);

      // 4. Ask OpenAI
      const response = await client.responses.create({
         model: 'gpt-4o-mini',
         input: prompt,
         temperature: 0.2,
         max_output_tokens: 100,
         previous_response_id: lastBotMessage?.id,
      });

      const botText = response.output_text ?? '';

      // 5. Save bot message
      const botMessage: Message = {
         sender: 'bot',
         text: botText,
         timestamp: new Date(),
         id: response.id,
      };
      await conversationRepository.addMessage(conversationId, botMessage);

      return {
         id: response.id,
         message: botText,
      };
   },

   async generateTitleWithId(conversationId: string): Promise<string> {
      const conversation =
         await conversationRepository.getConversation(conversationId);
      if (!conversation) {
         console.error('[generateTitle] Conversation not found in DB');
         throw new Error('Conversation not found');
      }
      const joinedMessages = conversation.messages
         .map((m) => `${m.sender}: ${m.text}`)
         .join('\n');

      const response = await client.responses.create({
         model: 'gpt-4o-mini',
         input: `Generate a short, descriptive title (max 5 words) for this conversation:\n${joinedMessages}`,
         temperature: 0.7,
         max_output_tokens: 20,
      });

      const title = response.output_text.trim();

      await conversationRepository.setTitle(conversationId, title);

      return title;
   },
};
