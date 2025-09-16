export type Message = {
   sender: 'user' | 'bot';
   text: string;
   timestamp: Date;
   id?: string;
};
