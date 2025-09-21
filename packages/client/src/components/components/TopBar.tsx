import React from 'react';
import icon from '@/assets/freepik_assistant_1758179812429.png';
import changeBgIcon from '@/assets/gear+heart.png';

interface TopBarProps {
   title: string;
   onChangeBackground: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, onChangeBackground }) => {
   return (
      <div className="fixed top-0 left-72 right-0 h-20 bg-gray-100 dark:bg-gray-800 flex items-center justify-between px-6 shadow-md z-20">
         <div className="flex items-center">
            <img src={icon} alt="Ask Me Logo" className="h-24 w-24 mr-4" />
            <div className="flex flex-col">
               <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Ask Me
               </span>
               <span className="text-sm text-gray-600 dark:text-gray-300">
                  {title || 'New Chat'}
               </span>
            </div>
         </div>

         <button
            className="flex items-center gap-2 bg-white/80 dark:bg-gray-700/80 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
            onClick={onChangeBackground}
         >
            <img
               src={changeBgIcon}
               alt="Change Background"
               className="h-10 w-11"
            />
            <span className="text-sm font-medium text-gray-800 dark:text-white">
               Change Background Image
            </span>
         </button>
      </div>
   );
};

export default TopBar;
