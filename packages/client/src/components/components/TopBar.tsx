import React from 'react';
import icon from '@/assets/12345.png';
import logoutIcon from '@/assets/logout.webp';

interface TopBarProps {
   title: string;
   setToken: (token: string | null) => void;
   setUserId?: (userId: string | null) => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, setToken, setUserId }) => {
   const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setToken(null);
      setUserId?.(null);
   };

   return (
      <div className="fixed top-0 left-72 right-0 h-20 bg-gray-100 dark:bg-gray-800 flex items-center justify-between px-6 shadow-md z-20">
         <div className="flex items-center">
            <img src={icon} alt="Ask Me Logo" className="h-20 w-28 mr-4" />
            <div className="flex flex-col">
               <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Ask Me!
               </span>
               <span className="text-sm text-gray-600 dark:text-gray-300">
                  {title || 'New Chat'}
               </span>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <button
               className="flex items-center gap-2 bg-white/80 dark:bg-gray-700/80 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
               onClick={handleLogout}
            >
               <img src={logoutIcon} alt="Log Out" className="h-7 w-7" />
               <span className="text-sm font-medium text-gray-800 dark:text-white">
                  Log Out
               </span>
            </button>
         </div>
      </div>
   );
};

export default TopBar;
