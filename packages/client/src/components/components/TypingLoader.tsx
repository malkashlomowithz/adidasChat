import React from 'react';

const typingSentences = [
   '🤖 Thinking of a magical answer...',
   '✨ The bot is cooking up a reply...',
   '🧚‍♂️ Little ideas are forming...',
   '💬 Shh… the bot is whispering...',
   '🌟 The magic is happening...',
   '🤗 Preparing a fun reply...',
   '📝 Just a moment…',
   '⌛ Thinking…',
   '💭 Let me see…',
   '🕵️‍♂️ Searching for an answer…',
];

const TypingLoader: React.FC = () => {
   // Pick a random sentence
   const sentence =
      typingSentences[Math.floor(Math.random() * typingSentences.length)];

   return (
      <div className="rounded-xl p-3 text-sm bg-gray-200 text-gray-600 flex items-center gap-3 w-[400px]">
         <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce delay-0"></span>
            <span className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
            <span className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce delay-300"></span>
         </div>
         <span>{sentence}</span>

         <style>
            {`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
          .animate-bounce {
            animation: bounce 1.2s infinite ease-in-out;
          }
          .delay-0 { animation-delay: 0s; }
          .delay-150 { animation-delay: 0.15s; }
          .delay-300 { animation-delay: 0.3s; }
        `}
         </style>
      </div>
   );
};

export default TypingLoader;
