import mongoose, { Schema, Document } from 'mongoose';

export type Message = {
   sender: 'user' | 'bot';
   text: string;
   timestamp: Date;
};

export interface ConversationDocument extends Document {
   conversationId: string;
   title?: string;
   messages: Message[];
}

const MessageSchema = new Schema<Message>(
   {
      sender: { type: String, enum: ['user', 'bot'], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
   },
   { _id: false }
);

const ConversationSchema = new Schema<ConversationDocument>({
   conversationId: { type: String, required: true, unique: true },
   title: { type: String },
   messages: [MessageSchema],
});

export const Conversation = mongoose.model<ConversationDocument>(
   'Conversation',
   ConversationSchema
);
