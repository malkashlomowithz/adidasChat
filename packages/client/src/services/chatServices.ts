import type { Message } from '@/types/message';
import { v4 as uuidv4 } from 'uuid';

export async function createNewConversation(
   setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
   setInput: React.Dispatch<React.SetStateAction<string>>,
   setTitle: React.Dispatch<React.SetStateAction<string>>,
   setLoading: React.Dispatch<React.SetStateAction<boolean>>,
   setConversationId: React.Dispatch<React.SetStateAction<string | null>>,
   setSelectedCon: React.Dispatch<
      React.SetStateAction<{ id: string; title: string } | null>
   >
) {
   setMessages([]);
   setInput('');
   setTitle('New Chat');
   setLoading(false);
   const newId = uuidv4();
   console.log(newId);
   setConversationId(newId);
   setSelectedCon(null);
}

export async function handleSend(
   input: string,
   setInput: React.Dispatch<React.SetStateAction<string>>,
   messages: Message[],
   setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
   conversationId: string | null,
   userId: string | null,
   setLoading: React.Dispatch<React.SetStateAction<boolean>>,
   setTitle: React.Dispatch<React.SetStateAction<string>>,
   setConversations: React.Dispatch<
      React.SetStateAction<{ id: string; title: string }[]>
   >
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
         body: JSON.stringify({ prompt: input, conversationId, userId }),
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

      // update the title when needed
      updateTitle(messages.length, setTitle, conversationId);

      if (conversationId) {
         setConversations((prev) => {
            const current = prev.find((c) => c.id === conversationId);
            if (!current) return prev;

            const filtered = prev.filter((c) => c.id !== conversationId);

            return [{ ...current }, ...filtered];
         });
      }
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
   if (messageLenth === 0) {
      generateChatTitle(conversationId, setTitle);
   }
   if (messageLenth === 2) {
      generateChatTitle(conversationId, setTitle);
   }
   if (messageLenth === 10) {
      generateChatTitle(conversationId, setTitle);
   }
}

export async function loadAllConversations(
   setConversations: React.Dispatch<
      React.SetStateAction<{ id: string; title: string }[]>
   >,
   userId: string | null
) {
   if (!userId) {
      console.warn('No userId provided — skipping conversation load.');
      setConversations([]);
      return;
   }

   try {
      const res = await fetch(
         `/api/conversations?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok)
         throw new Error(`Failed to load conversations: ${res.statusText}`);

      const data: Array<{ conversationId: string; title?: string }> =
         await res.json();

      const mapped = data.map((con) => ({
         id: con.conversationId,
         title: con.title?.trim().replace(/^["']+|["']+$/g, '') || 'No Title',
      }));

      setConversations(mapped);
      console.log('can sync nowwwwwwwww');
   } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]); // clear or keep previous depending on your preference
   }
}

export async function loadMessages(conversationId: string) {
   const res = await fetch(`/api/conversations/${conversationId}/messages`);
   if (!res.ok) throw new Error('Failed to load messages');
   return res.json();
}
