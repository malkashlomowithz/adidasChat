import { useEffect, useRef, useState } from 'react';
import MessagesList from '../components/components/MessagesList';
import ChatInput from '../components/components/ChatInput';
import icon from '@/assets/freepik_assistant_1758179812429.png';
import {
   createNewConversation,
   handleSend,
   loadAllConversations,
   loadMessages,
} from '@/services/chatServices';
import type { Message } from '@/types/message';
import Sidebar from '@/components/components/Sidebar';

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
         setConversationId,
         setSelectedCon
      );
      loadAllConversations(setConversations);
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
      loadAllConversations(setConversations);
   };

   const handleSelectConversation = async (con: {
      id: string;
      title: string;
   }) => {
      setSelectedCon(con);
      setTitle(con.title);
      setLoading(true);
      loadAllConversations(setConversations);
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
      <div className="flex h-screen">
         <Sidebar
            title={title}
            conversations={conversations}
            selectedConId={selectedCon?.id || null}
            setSelectedCon={handleSelectConversation}
            onNewConversation={handleNewConversation}
         />

         <div className="flex-1 flex flex-col">
            <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 flex items-center px-6 shadow-md">
               <img src={icon} alt="Ask Me Logo" className="h-24 w-24 mr-4" />

               <div className="flex flex-col">
                  {/* App Name */}
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                     Ask Me
                  </span>

                  {/* Conversation Title */}
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                     {selectedCon?.title || 'New Chat'}
                  </span>
               </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 w-2/3 mx-auto overflow-y-auto hide-scrollbar mb-4">
               <MessagesList messages={messages} loading={loading} />
            </div>

            {/* Chat Input */}
            <div className="w-1/2 mx-auto px-4 py-2">
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
