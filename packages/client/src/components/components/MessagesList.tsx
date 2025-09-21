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
      <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-2">
         {messages.map((m, i) => {
            const isUser = m.sender === 'user';
            return (
               <div
                  key={i}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
               >
                  <div
                     className={`
                        max-w-[70%] px-4 py-2 text-sm break-words
                        rounded-2xl shadow-sm
                        ${isUser ? 'bg-gray-300 text-gray-800' : 'bg-gray-100 text-gray-800'}
                     `}
                  >
                     <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
               </div>
            );
         })}
         {loading && <TypingLoader />}
         <div ref={endRef} />
      </div>
   );
};

export default MessagesList;
