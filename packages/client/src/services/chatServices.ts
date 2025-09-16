import type { Message } from '@/types/message';
import { v4 as uuidv4 } from 'uuid';

export async function createNewConversation(
   setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
   setInput: React.Dispatch<React.SetStateAction<string>>,
   setTitle: React.Dispatch<React.SetStateAction<string>>,
   setLoading: React.Dispatch<React.SetStateAction<boolean>>,
   setConversationId: React.Dispatch<React.SetStateAction<string | null>>
) {
   setMessages([]);
   setInput('');
   setTitle('New Chat');
   setLoading(false);

   const newId = uuidv4();
   console.log(newId);
   setConversationId(newId);
}

export async function handleSend(
   input: string,
   setInput: React.Dispatch<React.SetStateAction<string>>,
   messages: Message[],
   setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
   conversationId: string | null,
   setLoading: React.Dispatch<React.SetStateAction<boolean>>,
   setTitle: React.Dispatch<React.SetStateAction<string>>
) {
   if (!input.trim()) return;

   setMessages((prev) => [
      ...prev,
      { text: input, sender: 'user', id: undefined, timestamp: new Date() },
   ]);
   setLoading(true);
   setInput('');

   try {
      const res = await fetch('/api/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ prompt: input, conversationId }),
      });

      if (!res.ok) {
         const error = await res.json();
         console.error('Validation or server error:', error);
         setLoading(false);
         return;
      }

      const data = await res.json();
      setMessages((prev) => [
         ...prev,
         {
            id: data.id,
            text: data.message,
            sender: 'bot',
            timestamp: new Date(),
         },
      ]);

      updateTitle(messages.length, setTitle, conversationId);
   } catch (err) {
      console.error('Request failed:', err);
   } finally {
      setLoading(false);
   }
}

export async function generateChatTitle(
   conversationId: string | null,
   setTitle: React.Dispatch<React.SetStateAction<string>>
) {
   if (!conversationId) return;

   try {
      console.log('id:', conversationId);
      const res = await fetch('/api/generate-title', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ conversationId }),
      });

      if (!res.ok) {
         const error = await res.json();
         console.error('Validation or server error:', error);
         setTitle('No Title');
         return;
      }

      const data = await res.json();

      let title = data.title?.trim().replace(/^["']+|["']+$/g, '') || 'Chat';

      setTitle(title);

      setTitle(title);
   } catch (err) {
      console.error('Request failed:', err);
      setTitle('No Title');
   }
}

function updateTitle(
   messageLenth: any,
   setTitle: React.Dispatch<React.SetStateAction<string>>,
   conversationId: string | null
) {
   if (messageLenth === 2) {
      generateChatTitle(conversationId, setTitle);
   }
   if (messageLenth === 10) {
      generateChatTitle(conversationId, setTitle);
   }
}
