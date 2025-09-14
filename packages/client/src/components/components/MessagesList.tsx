import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import type { Message } from '@/types/message';

interface MessagesListProps {
   messages: Message[];
   loading: boolean;
}

const MessagesList: React.FC<MessagesListProps> = ({ messages, loading }) => {
   return (
      <div className="p-4 space-y-2 max-w-md mx-auto">
         {messages.map((m, i) => (
            <div
               key={i}
               className={`rounded-xl p-2 text-sm max-w-[80%] ${
                  m.sender === 'user'
                     ? 'bg-gray-300 text-gray-800 self-end ml-auto'
                     : 'bg-gray-100 text-gray-800 self-start'
               }`}
            >
               <ReactMarkdown>{m.text}</ReactMarkdown>
            </div>
         ))}

         {loading && (
            <div className="rounded-xl p-2 text-sm bg-gray-200 text-gray-600 flex items-center gap-2 max-w-[80%]">
               <Loader2 className="animate-spin h-4 w-4" /> Bot is typing...
            </div>
         )}
      </div>
   );
};

export default MessagesList;
