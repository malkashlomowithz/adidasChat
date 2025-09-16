import { forwardRef } from 'react';
import { Send } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

interface ChatInputProps {
   input: string;
   setInput: (value: string) => void;
   onSend: () => void;
   loading: boolean;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
   ({ input, setInput, onSend, loading }, ref) => {
      return (
         <div className="w-full pb-8">
            {' '}
            {/* Add bottom padding here */}
            <div className="flex items-center gap-2 w-full">
               <Textarea
                  ref={ref}
                  placeholder="Ask Anything"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter' && !loading) {
                        e.preventDefault(); // prevent newline
                        onSend();
                     }
                  }}
                  className="resize-none overflow-hidden w-full"
                  style={{ minHeight: '40px', maxHeight: '150px' }}
               />
               <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  onClick={onSend}
                  disabled={loading}
                  className={`transition-opacity duration-200 ${
                     loading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'opacity-100 cursor-pointer'
                  }`}
               >
                  <Send className="h-4 w-4" />
               </Button>
            </div>
         </div>
      );
   }
);

ChatInput.displayName = 'ChatInput';
export default ChatInput;
