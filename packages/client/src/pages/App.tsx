import { useEffect, useRef, useState } from 'react';
import MessagesList from '../components/components/MessagesList';
import ChatInput from '../components/components/ChatInput';
import {
   createNewConversation,
   handleSend,
   loadAllConversations,
} from '@/services/chatServices';
import type { Message } from '@/types/message';
import Sidebar from '@/components/components/ChatsList';

function App() {
   const [messages, setMessages] = useState<Message[]>([]);
   const [input, setInput] = useState('');
   const [conversationId, setConversationId] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const [title, setTitle] = useState('');
   const [conversations, setConversations] = useState<
      { id: string; title: string }[]
   >([]);
   const [selectedCon, setSelectedCon] = useState<{
      id: string;
      title: string;
   } | null>(null);

   const textareaRef = useRef<HTMLTextAreaElement>(null);

   useEffect(() => {
      createNewConversation(
         setMessages,
         setInput,
         setTitle,
         setLoading,
         setConversationId
      );
      loadAllConversations(setConversations);
   }, []);

   const handleNewConversation = () => {
      createNewConversation(
         setMessages,
         setInput,
         setTitle,
         setLoading,
         setConversationId
      );
   };

   return (
      <div className="flex h-screen">
         <Sidebar
            title={title}
            conversations={conversations}
            selectedConId={selectedCon?.id || null}
            setSelectedCon={setSelectedCon}
            onNewConversation={handleNewConversation}
         />

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
