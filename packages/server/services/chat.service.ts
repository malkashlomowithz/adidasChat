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
      // 1. Save the user's message
      const userMessage: Message = {
         sender: 'user',
         text: prompt,
         timestamp: new Date(),
      };
      await conversationRepository.addMessage(conversationId, userMessage);

      // 2. Fetch all previous messages for this conversation
      const conversation =
         await conversationRepository.getConversation(conversationId);
      const messagesForOpenAI =
         conversation?.messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
         })) || [];

      // Add the latest user message
      messagesForOpenAI.push({ role: 'user', content: prompt });

      // 3. Ask OpenAI using all messages as context
      const response = await client.chat.completions.create({
         model: 'gpt-4o-mini',
         messages: messagesForOpenAI,
         temperature: 0.2,
      });

      const botText = response.choices[0].message?.content ?? '';

      // 4. Save bot's response
      const botMessage: Message = {
         sender: 'bot',
         text: botText,
         timestamp: new Date(),
      };
      await conversationRepository.addMessage(conversationId, botMessage);

      return {
         id: response.id,
         message: botText,
      };
   },

   async generateTitle(conversationId: string): Promise<string> {
      const conversation =
         await conversationRepository.getConversation(conversationId);

      if (!conversation) throw new Error('Conversation not found');

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
