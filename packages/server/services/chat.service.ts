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

// רשימת נושאים חסומים
const blockedTopics = [
   'sex',
   'drugs',
   'suicide',
   'terror',
   'weapons',
   'violence',
   'politics',
];

// בדיקה אם ההודעה מכילה נושא חסום
function containsBlockedTopic(prompt: string) {
   return blockedTopics.some((topic) => prompt.toLowerCase().includes(topic));
}

// מחזיר הודעה חסומה לפי שפה
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

// טיפול בהודעה חסומה ושמירתה במסד
async function handleBlockedMessage(
   prompt: string,
   conversationId: string,
   userId: string
): Promise<Message> {
   const safeReply = getBlockedMessage(prompt);
   const botMessage: Message = {
      sender: 'bot',
      text: safeReply || '',
      timestamp: new Date(),
      id: crypto.randomUUID(),
   };
   await conversationRepository.addMessage(conversationId, botMessage, userId);
   return botMessage;
}

export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string,
      userId: string
   ): Promise<ChatResponse> {
      // יוצרים הודעת משתמש
      const userMessage: Message = {
         sender: 'user',
         text: prompt,
         timestamp: new Date(),
         id: crypto.randomUUID(),
      };
      await conversationRepository.addMessage(
         conversationId,
         userMessage,
         userId
      );

      // שולפים את השיחה
      const conversation =
         await conversationRepository.getConversation(conversationId);

      // מוצאים את ההודעה האחרונה של הבוט שאינה חסומה
      const lastBotMessage = conversation?.messages
         .slice()
         .reverse()
         .find(
            (m) => m.sender === 'bot' && m.id && !containsBlockedTopic(m.text)
         );

      // בדיקת נושא חסום מול רשימת הנושאים
      let safeReply: string | null = null;
      const moderation = await client.moderations.create({
         model: 'omni-moderation-latest',
         input: prompt,
      });

      if (containsBlockedTopic(prompt) || moderation.results[0]?.flagged) {
         const blockedMsg = await handleBlockedMessage(
            prompt,
            conversationId,
            userId
         );
         safeReply = blockedMsg.text;
         // **אל תחזירי return כאן** - השיחה ממשיכה
      }

      // יצירת תגובת הבוט הרגילה
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

      const botText =
         response.output_text ?? safeReply ?? 'Oops, something went wrong';

      const botMessage: Message = {
         sender: 'bot',
         text: botText,
         timestamp: new Date(),
         id: response.id,
      };
      await conversationRepository.addMessage(
         conversationId,
         botMessage,
         userId
      );

      return { id: botMessage.id, message: botText };
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
