import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import MessagesList from '../components/components/MessagesList';
import type { Message } from '@/types/message';
import ChatInput from '@/components/components/ChatInput';
import { createNewConversation, handleSend } from '@/services/chatServices';

function App() {
   const [messages, setMessages] = useState<Message[]>([]);
   const [input, setInput] = useState('');
   const [conversationId, setConversationId] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
   const [title, setTitle] = useState('');

   useEffect(() => {
      createNewConversation(
         setMessages,
         setInput,
         setTitle,
         setLoading,
         setConversationId
      );
   }, []);

   return (
      <div className="flex h-screen">
         <div className="w-64 bg-gray-100 border-r p-4 flex flex-col items-center">
            <Button
               variant="outline"
               className="flex items-center gap-2 mb-4"
               onClick={() =>
                  createNewConversation(
                     setMessages,
                     setInput,
                     setTitle,
                     setLoading,
                     setConversationId
                  )
               }
            >
               <Plus className="h-4 w-4" />
               New Chat
            </Button>
            <div className="w-full p-2 bg-white rounded-md shadow mb-2 text-center font-semibold">
               {title}
            </div>
         </div>

         <div className="flex-1 flex flex-col items-center justify-end relative">
            <div className="w-2/3 flex-1 overflow-y-auto hide-scrollbar mb-4">
               <MessagesList messages={messages} loading={loading} />
            </div>

            <div className="w-1/2 px-4 py-2">
               <div className="flex items-center gap-2">
                  <ChatInput
                     ref={textareaRef}
                     input={input}
                     setInput={setInput}
                     onSend={() =>
                        handleSend(
                           input,
                           setInput,
                           messages,
                           setMessages,
                           conversationId,
                           setLoading,
                           setTitle
                        )
                     }
                     loading={loading}
                  />
               </div>
            </div>
         </div>
      </div>
   );
}

export default App;
