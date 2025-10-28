import mongoose, { Schema, Document } from 'mongoose';

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
   conversationId: { type: String, required: true, unique: true, index: true },
   title: { type: String, default: '' },
   messages: { type: [MessageSchema], default: [] },
   lastUpdate: { type: Date, default: Date.now },
   userId: { type: String, required: true, index: true },
});

// Compound index for efficient user conversation queries
ConversationSchema.index({ userId: 1, lastUpdate: -1 });

// Middleware to update lastUpdate on save
ConversationSchema.pre('save', function (next) {
   this.lastUpdate = new Date();
   next();
});

// Middleware to update lastUpdate on findOneAndUpdate
ConversationSchema.pre('findOneAndUpdate', function (next) {
   this.set({ lastUpdate: new Date() });
   next();
});

export const Conversation = mongoose.model<ConversationDocument>(
   'Conversation',
   ConversationSchema
);
