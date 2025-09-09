import { useEffect, useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Send } from 'lucide-react';

function App() {
   const [messages, setMessages] = useState<{ text: string }[]>([]);
   const [input, setInput] = useState('');
   const [conversationId] = useState('f4b3dbf3-3e32-4cf3-a951-38c5b6fcbabc');

   async function handleSend() {
      if (!input.trim()) return;

      try {
         const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: input, conversationId }),
         });

         if (!res.ok) {
            const error = await res.json();
            console.error('Validation or server error:', error);
            return;
         }

         const data = await res.json();
         setMessages((prev) => [...prev, { text: data.message }]);
         setInput('');
      } catch (err) {
         console.error('Request failed:', err);
      }
   }

   return (
      <>
         <div></div>
         <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <div className="flex items-center gap-2">
               <Input type="text" placeholder="Ask Anything" value={input} />
               <Button type="submit" variant="outline" size="icon">
                  <Send className="h-4 w-4" />
               </Button>
            </div>
         </div>
      </>
   );
}

export default App;
