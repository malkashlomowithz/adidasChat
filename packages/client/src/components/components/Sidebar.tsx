import type { FC } from 'react';
//import { Button } from '../ui/button';
import plus from '@/assets/plus red.jpg';

interface SidebarProps {
   title: string;
   conversations: { id: string; title: string }[];
   selectedConId: string | null;
   setSelectedCon: (con: { id: string; title: string }) => void;
   onNewConversation: () => void;
}

const Sidebar: FC<SidebarProps> = ({
   title,
   conversations,
   selectedConId,
   setSelectedCon,
   onNewConversation,
}) => {
   return (
      <div className="w-72 bg-gray-100 border-r p-4 flex flex-col h-full">
         <button
            className="flex items-center gap-2 mb-4 px-4 py-2 
                    bg-white text-gray-800 border border-gray-300 
                    rounded-lg shadow-md hover:shadow-lg 
                    active:translate-y-1 active:shadow-sm
                    transition-all duration-150"
            onClick={onNewConversation}
         >
            <img src={plus} alt="New" className="h-6 w-6" />
            Start A New Chat
         </button>

         <div className="w-full p-2  rounded-md shadow mb-4 text-center font-semibold">
            {title || 'No conversation selected'}
         </div>

         <div className="flex-1 flex flex-col w-full gap-2 mt-2 overflow-y-auto hide-scrollbar">
            {conversations.map((con) => (
               <div
                  key={con.id || Math.random()}
                  onClick={() => setSelectedCon(con)}
                  className={`p-2 rounded-md cursor-pointer text-center transition-colors ${
                     selectedConId === con.id
                        ? 'bg-gray-300 font-bold'
                        : 'bg-white hover:bg-gray-200'
                  }`}
               >
                  {con.title}
               </div>
            ))}
         </div>
      </div>
   );
};

export default Sidebar;
