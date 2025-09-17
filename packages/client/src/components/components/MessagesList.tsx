import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@/types/message';
import TypingLoader from './TypingLoader';

interface MessagesListProps {
   messages: Message[];
   loading: boolean;
}

const MessagesList: React.FC<MessagesListProps> = ({ messages, loading }) => {
   const endRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages, loading]);
   return (
      <div className="flex flex-col flex-1 overflow-y-auto">
         <div className="flex flex-col space-y-2">
            {messages.map((m, i) => (
               <div
                  key={i}
                  className={`rounded-xl p-3 text-sm w-[400px] break-words ${
                     m.sender === 'user'
                        ? 'bg-gray-300 text-gray-800 self-end ml-auto'
                        : 'bg-gray-100 text-gray-800 self-start'
                  }`}
               >
                  <ReactMarkdown>{m.text}</ReactMarkdown>
               </div>
            ))}
            {loading && <TypingLoader />}
            <div ref={endRef} />
         </div>
      </div>
   );
};

export default MessagesList;
