import express, { request } from 'express';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.routes';
import conversationRoutes from './routes/conversation.routes';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';

mongoose
   .connect(process.env.MONGODB_URI as string)
   .then(() => console.log('✅ MongoDB connected'))
   .catch((err) => console.error('❌ MongoDB connection error:', err));

dotenv.config();
const app = express();
app.use(express.json());
app.use(chatRoutes);
app.use(conversationRoutes);
app.use(authRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
   console.log(`Server is running on http://localhost:${port}`);
});
