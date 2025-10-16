import { useEffect, useRef, useState } from 'react';
import MessagesList from '../components/components/MessagesList';
import ChatInput from '../components/components/ChatInput';
import bgImage from '@/assets/bg1.jpg';
import {
   createNewConversation,
   handleSend,
   loadAllConversations,
   loadMessages,
} from '@/services/chatServices';
import type { Message } from '@/types/message';
import Sidebar from '@/components/components/Sidebar';
import TopBar from '@/components/components/TopBar';
import BackgroundSelector from '@/components/components/BackgroundSelector';

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
   const [background, setBackground] = useState<string | null>(null);
   const [showBgSelector, setShowBgSelector] = useState(false); // modal toggle

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

   useEffect(() => {
      if (userId) {
         const saved = localStorage.getItem(`background_${userId}`);
         if (saved) setBackground(saved);
      }
   }, [userId]);

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
      <div className="flex h-screen relative">
         {/* Background */}
         <div
            className="fixed inset-0 bg-cover bg-center opacity-40 -z-10"
            style={{ backgroundImage: `url(${background || bgImage})` }}
         />

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
         <div className="ml-72 flex-1 flex flex-col relative">
            <TopBar
               title={title}
               clickChangeBackground={() => setShowBgSelector(true)}
               setToken={setToken}
            />

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
         <div className="fixed bottom-1 right-4 text-xs text-gray-500 z-50">
            <samp>
               © Built with love for curious kids everywhere, by Malky
               Shlomowitz.
            </samp>
         </div>

         {/* Background Selector Modal */}
         {showBgSelector && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
               <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 w-2/3 max-w-3xl backdrop-blur-sm shadow-lg">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                     Choose Background
                  </h2>
                  <BackgroundSelector
                     onSelect={(bg) => {
                        setBackground(bg);
                        setShowBgSelector(false);
                     }}
                     userId={userId || null}
                     token={null}
                  />
                  <button
                     className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                     onClick={() => setShowBgSelector(false)}
                  >
                     Cancel
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}

export default App;
