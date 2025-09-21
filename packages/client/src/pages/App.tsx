import { useEffect, useRef, useState } from 'react';
import MessagesList from '../components/components/MessagesList';
import ChatInput from '../components/components/ChatInput';
import icon from '@/assets/freepik_assistant_1758179812429.png';
import bgImage from '@/assets/bg1.jpg';
import changeBgIcon from '@/assets/gear+heart.png';
import {
   createNewConversation,
   handleSend,
   loadAllConversations,
   loadMessages,
} from '@/services/chatServices';
import type { Message } from '@/types/message';
import Sidebar from '@/components/components/Sidebar';
import TopBar from '@/components/components/TopBar';

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
      <div className="flex h-screen relative">
         <div
            className="fixed inset-0 bg-cover bg-center opacity-40 -z-10"
            style={{ backgroundImage: `url(${bgImage})` }}
         />
         <div className="fixed top-0 left-0 h-screen w-72 z-30">
            <Sidebar
               title={title}
               conversations={conversations}
               selectedConId={selectedCon?.id || null}
               setSelectedCon={handleSelectConversation}
               onNewConversation={handleNewConversation}
            />
         </div>
         <div className="ml-72 flex-1 flex flex-col relative">
            <TopBar title={title} onChangeBackground={() => {}} />
            <div className="flex-1 flex flex-col pt-20 pb-20 overflow-hidden">
               <div className="flex-1 w-2/3 mx-auto overflow-y-auto hide-scrollbar p-4">
                  {messages.length > 0 && (
                     <MessagesList messages={messages} loading={loading} />
                  )}
               </div>
            </div>
            <div className="fixed bottom-0 left-72 right-0 z-20">
               <div className="w-1/2 mx-auto">
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
                           setTitle,
                           setConversations
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
