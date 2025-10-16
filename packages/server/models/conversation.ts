import mongoose, { Schema, Document } from 'mongoose';
import { string } from 'zod';

export type Message = {
   sender: 'user' | 'bot';
   text: string;
   timestamp: Date;
   id: string;
};

export interface ConversationDocument extends Document {
   conversationId: string;
   title?: string;
   messages: Message[];
   lastUpdate: Date;
   userId: string;
}

const MessageSchema = new Schema<Message>(
   {
      sender: { type: String, enum: ['user', 'bot'], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      id: { type: String, required: false },
   },
   { _id: false }
);

const ConversationSchema = new Schema<ConversationDocument>({
   conversationId: { type: String, required: true, unique: true },
   title: { type: String },
   messages: [MessageSchema],
   lastUpdate: { type: Date, default: Date.now },
   userId: { type: String, required: true, unique: true },
});

export const Conversation = mongoose.model<ConversationDocument>(
   'Conversation',
   ConversationSchema
);
