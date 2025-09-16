import { useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { Plus, Send } from 'lucide-react';
import MessagesList from '../components/components/MessagesList';
import { Textarea } from '../components/ui/textarea';
import type { Message } from '@/types/message';
import {
   createNewConversation,
   generateChatTitle,
   handleSend,
} from '@/services/chatServices';

function App() {
   const [messages, setMessages] = useState<Message[]>([]);
   const [input, setInput] = useState('');
   const [conversationId, setConversationId] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
   const [title, setTitle] = useState('');

   return (
      <>
         <div className="flex h-screen">
            <div className="w-64 bg-gray-100 border-r">
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
            </div>
            <MessagesList messages={messages} loading={loading} />
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
               <div className="flex items-center gap-2">
                  <Textarea
                     ref={textareaRef}
                     placeholder="Ask Anything"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading)
                           handleSend(
                              input,
                              setInput,
                              messages,
                              setMessages,
                              conversationId,
                              setLoading,
                              setTitle
                           );
                     }}
                     className="resize-none overflow-hidden w-70%"
                     style={{
                        minHeight: '40px',
                        height: 'auto',
                        maxWidth: '400px',
                     }}
                  />
                  <Button
                     type="submit"
                     variant="outline"
                     size="icon"
                     onClick={() =>
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
                     disabled={loading}
                     className={`transition-opacity duration-200 ${
                        loading
                           ? 'opacity-50 cursor-not-allowed'
                           : 'opacity-100 cursor-pointer'
                     }`}
                  >
                     <Send className="h-4 w-4" />
                  </Button>
               </div>
            </div>
         </div>
      </>
   );
}

export default App;
