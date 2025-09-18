import OpenAI from 'openai';
import { franc } from 'franc';
import langs from 'langs';
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

const blockedTopics = [
   'sex',
   'drugs',
   'suicide',
   'terror',
   'weapons',
   'violence',
   'politics',
];

function containsBlockedTopic(prompt: string) {
   return blockedTopics.some((topic) => prompt.toLowerCase().includes(topic));
}

function getBlockedMessage(prompt: string) {
   const langCode = franc(prompt, { minLength: 3 });
   const lang = langs.where('3', langCode);

   const messages: Record<string, string> = {
      hebrew: 'זה נושא חשוב, אבל נדבר על זה כשתגדל/י 😊',
      english:
         'This is an important topic, but we’ll talk about it when you’re older 😊',
      french:
         'C’est un sujet important, mais nous en parlerons quand tu seras plus grand(e) 😊',
      spanish:
         'Es un tema importante, pero hablaremos de eso cuando seas mayor 😊',
   };

   return (
      messages[lang?.name.toLowerCase() || 'english'] || messages['english']
   );
}

export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<ChatResponse> {
      const userMessage: Message = {
         sender: 'user',
         text: prompt,
         timestamp: new Date(),
         id: '',
      };
      await conversationRepository.addMessage(conversationId, userMessage);

      const conversation =
         await conversationRepository.getConversation(conversationId);

      const lastBotMessage = conversation?.messages
         .slice()
         .reverse()
         .find((m) => m.sender === 'bot' && m.id);

      if (containsBlockedTopic(prompt)) {
         const safeReply =
            getBlockedMessage(prompt) ??
            'This is an important topic, but we’ll talk about it when you’re older 😊';
         const botMessage: Message = {
            sender: 'bot',
            text: safeReply,
            timestamp: new Date(),
            id: crypto.randomUUID(),
         };
         await conversationRepository.addMessage(conversationId, botMessage);
         return { id: botMessage.id, message: safeReply };
      }

      const moderation = await client.moderations.create({
         model: 'omni-moderation-latest',
         input: prompt,
      });

      if (moderation.results[0]?.flagged) {
         const safeReply =
            getBlockedMessage(prompt) ??
            'This is an important topic, but we’ll talk about it when you’re older 😊';
         const botMessage: Message = {
            sender: 'bot',
            text: safeReply,
            timestamp: new Date(),
            id: crypto.randomUUID(),
         };
         await conversationRepository.addMessage(conversationId, botMessage);
         return { id: botMessage.id, message: safeReply };
      }

      const response = await client.responses.create({
         model: 'gpt-4o-mini',
         input: [
            {
               role: 'system',
               content: `
          You are a friendly assistant for children ages 6–12.
          Always answer in the same language the child used.
          Keep answers short, simple, and positive.
          If the child asks about an adult or unsafe topic,
          respond with: "${getBlockedMessage(prompt)}"
          `,
            },
            { role: 'user', content: prompt },
         ],
         temperature: 0.2,
         max_output_tokens: 150,
         previous_response_id: lastBotMessage?.id,
      });

      const botText = response.output_text ?? '';

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
         input: `Generate a short, descriptive title (max 3 words) for this conversation:\n${joinedMessages}`,
         temperature: 0.7,
         max_output_tokens: 20,
      });

      const title = response.output_text.trim();

      await conversationRepository.setTitle(conversationId, title);

      return title;
   },
};
