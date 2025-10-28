import { useEffect, useRef, useState } from 'react';
import MessagesList from '../components/components/MessagesList';
import ChatInput from '../components/components/ChatInput';
import {
   createNewConversation,
   handleSend,
   loadAllConversations,
   loadMessages,
} from '@/services/chatServices';
import type { Message } from '@/types/message';
import Sidebar from '@/components/components/Sidebar';
import TopBar from '@/components/components/TopBar';

interface AppProps {
   setToken: (token: string | null) => void;
   userId: string | null;
}

function App({ setToken, userId }: AppProps) {
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
         setConversationId,
         setSelectedCon
      );
      loadAllConversations(setConversations, userId);
   }, []);

   const handleNewConversation = () => {
      createNewConversation(
         setMessages,
         setInput,
         setTitle,
         setLoading,
         setConversationId,
         setSelectedCon
      );
      loadAllConversations(setConversations, userId);
   };

   const handleSelectConversation = async (con: {
      id: string;
      title: string;
   }) => {
      setSelectedCon(con);
      setTitle(con.title);
      setLoading(true);
      loadAllConversations(setConversations, userId);
      try {
         const data = await loadMessages(con.id);
         setMessages(data);
         setConversationId(con.id);
      } catch (error) {
         console.error('Failed to load messages:', error);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="flex h-screen bg-white">
         {/* Sidebar */}
         <div className="fixed top-0 left-0 h-screen w-72 z-30">
            <Sidebar
               title={title}
               conversations={conversations}
               selectedConId={selectedCon?.id || null}
               setSelectedCon={handleSelectConversation}
               onNewConversation={handleNewConversation}
            />
         </div>

         {/* Main Area */}
         <div className="ml-72 flex-1 flex flex-col">
            <TopBar title={title} setToken={setToken} />

            <div className="flex-1 flex flex-col pt-20 pb-20 overflow-hidden">
               <div className="flex-1 w-2/3 mx-auto overflow-y-auto hide-scrollbar p-4">
                  {messages.length > 0 && (
                     <MessagesList messages={messages} loading={loading} />
                  )}
               </div>
            </div>

            <div
               className={`transition-all duration-300 flex flex-col ${
                  messages.length === 0
                     ? 'absolute inset-0 items-center justify-center'
                     : 'relative mb-10 items-center justify-center'
               }`}
            >
               <div className="w-1/2">
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
                           userId,
                           setLoading,
                           setTitle,
                           setConversations
                        )
                     }
                     loading={loading}
                  />
               </div>
            </div>
         </div>

         {/* Footer */}
      </div>
   );
}

export default App;
