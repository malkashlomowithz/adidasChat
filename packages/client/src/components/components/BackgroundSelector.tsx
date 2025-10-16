import React, { useEffect, useState } from 'react';
import axios from 'axios';
import bg1 from '@/assets/bg1.jpg';
import bg2 from '@/assets/bg2.jpg';
import bg3 from '@/assets/bg3.jpg';
import bg4 from '@/assets/bg4.jpg';
import bg5 from '@/assets/bg5.jpg';
import bg6 from '@/assets/bg6.jpg';
import bg7 from '@/assets/bg7.jpg';
import bg8 from '@/assets/bg8.jpg';
import bg9 from '@/assets/bg9.jpg';
import bg10 from '@/assets/bg10.jpg';
import bg11 from '@/assets/bg11.jpg';
import bg12 from '@/assets/bg12.jpg';
import bg13 from '@/assets/bg13.jpg';
import bg14 from '@/assets/bg14.jpg';
import bg15 from '@/assets/bg15.jpg';
import bg16 from '@/assets/bg16.jpg';
import bg17 from '@/assets/bg17.jpg';
import bg18 from '@/assets/bg18.jpg';
import bg19 from '@/assets/bg19.jpg';
import bg20 from '@/assets/bg20.jpg';

interface BackgroundSelectorProps {
   onSelect: (bg: string) => void;
   userId: string | null;
   token: string | null;
}

const backgrounds = [
   bg1,
   bg2,
   bg3,
   bg4,
   bg5,
   bg6,
   bg7,
   bg8,
   bg9,
   bg10,
   bg11,
   bg12,
   bg13,
   bg14,
   bg15,
   bg16,
   bg17,
   bg18,
   bg19,
   bg20,
];

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
   onSelect,
   userId,
   token,
}) => {
   const [selected, setSelected] = useState<string | null>(null);

   // Load saved background from server or localStorage
   useEffect(() => {
      const fetchBackground = async () => {
         if (!userId) return;

         // First try localStorage
         const saved = localStorage.getItem(`background_${userId}`);
         if (saved) {
            setSelected(saved);
            onSelect(saved);
         }

         // Fetch from server
         if (token) {
            try {
               const res = await axios.get(`/api/users/${userId}`, {
                  headers: { Authorization: `Bearer ${token}` },
               });
               if (res.data.background) {
                  setSelected(res.data.background);
                  onSelect(res.data.background);
                  localStorage.setItem(
                     `background_${userId}`,
                     res.data.background
                  );
               }
            } catch (err) {
               console.error('Failed to fetch user background', err);
            }
         }
      };

      fetchBackground();
   }, [userId, token, onSelect]);

   const handleSelect = async (bg: string) => {
      setSelected(bg);
      onSelect(bg);
      if (userId) {
         localStorage.setItem(`background_${userId}`, bg);

         if (token) {
            try {
               await axios.put(
                  `/api/users/${userId}/background`,
                  { background: bg },
                  { headers: { Authorization: `Bearer ${token}` } }
               );
            } catch (err) {
               console.error('Failed to update background', err);
            }
         }
      }
   };

   return (
      <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide">
         {backgrounds.map((bg, idx) => (
            <div
               key={idx}
               className={`
            flex-shrink-0 w-45 h-32 rounded-lg cursor-pointer overflow-hidden
            border-4 ${selected === bg ? 'border-blue-500' : 'border-gray-300'}
            shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-200
          `}
               onClick={() => handleSelect(bg)}
            >
               <img
                  src={bg}
                  alt={`Background ${idx + 1}`}
                  className="w-full h-full object-cover"
               />
            </div>
         ))}
      </div>
   );
};

export default BackgroundSelector;
