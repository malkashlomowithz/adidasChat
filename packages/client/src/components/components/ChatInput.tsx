import { forwardRef } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import sendImage from '@/assets/send.jpg';

interface ChatInputProps {
   input: string;
   setInput: (value: string) => void;
   onSend: () => void;
   loading: boolean;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
   ({ input, setInput, onSend, loading }, ref) => {
      return (
         <div className="w-full">
            <div className="flex items-center w-full bg-white rounded-xl border border-gray-300 overflow-hidden shadow-md">
               <div className="flex-1 relative">
                  <Textarea
                     ref={ref}
                     placeholder="Ask me anything..."
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading) {
                           e.preventDefault();
                           onSend();
                        }
                     }}
                     className="w-full resize-none border-none outline-none pl-10 pr-2 py-3 text-base placeholder-gray-400"
                     style={{ minHeight: '60px', maxHeight: '200px' }}
                  />
               </div>

               <Button
                  type="submit"
                  onClick={onSend}
                  disabled={loading}
                  className={`p-0 border-none transition-opacity duration-200 ${
                     loading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'opacity-100 cursor-pointer'
                  } mr-2`}
               >
                  <img
                     src={sendImage}
                     alt="Send"
                     className="h-12 w-12 object-contain"
                  />
               </Button>
            </div>

            <p className="mt-3 text-s text-gray-500 text-center">
               This chat has been developed for Adidas. All answers provided are
               based on Adidas’ internal resources.{' '}
            </p>
         </div>
      );
   }
);

ChatInput.displayName = 'ChatInput';
export default ChatInput;
