import type { FC } from 'react';
import { Button } from '../ui/button';
import Plus from '@/assets/plus.png';

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
      <div className="w-72 bg-gray-100 border-r p-4 flex flex-col">
         <Button
            variant="outline"
            className="flex items-center gap-2 mb-4"
            onClick={onNewConversation}
         >
            <img src={Plus} alt="New" className="h-8 w-8" />
            Start A New Chat
         </Button>

         <div className="w-full p-2 bg-white rounded-md shadow mb-4 text-center font-semibold">
            {title || 'No conversation selected'}
         </div>

         <div className="flex flex-col w-full gap-2 mt-2 overflow-y-auto">
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
