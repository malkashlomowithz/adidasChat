import type { Request, Response } from 'express';
import z from 'zod';
import jwt from 'jsonwebtoken';
import { User } from '../models/auth';

// --- Validation Schemas ---
const registerSchema = z.object({
   name: z.string().min(1, 'Name is required'),
   password: z.string().min(1, 'Password is required'),
});

const loginSchema = z.object({
   name: z.string().min(2, 'Name is required'),
   password: z.string().min(6, 'Password is required'),
});

// --- Auth Controller ---
export const authController = {
   // Register a new user
   async register(req: Request, res: Response) {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      try {
         const { name, password } = parseResult.data;

         // Check if user already exists
         const existingUser = await User.findOne({ name });
         if (existingUser) {
            return res.status(400).json({ error: 'Name already taken' });
         }

         // Create new user
         const user = await User.create({ name, password });
         res.status(201).json({ message: 'User registered', userId: user._id });
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to register user' });
      }
   },

   // Login existing user
   async login(req: Request, res: Response) {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      try {
         const { name, password } = parseResult.data;

         const user = await User.findOne({ name });
         if (!user) {
            return res.status(400).json({ error: 'Invalid name or password' });
         }

         // Compare password using the method from UserSchema
         const isValid = await user.comparePassword(password);
         if (!isValid) {
            return res.status(400).json({ error: 'Invalid name or password' });
         }

         // Generate JWT token (optional, for session management)
         const token = jwt.sign(
            { userId: user._id, name: user.name },
            process.env.JWT_SECRET || 'secret', // Replace with real secret
            { expiresIn: '1Yr' }
         );

         res.json({ token, userId: user._id });
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to login' });
      }
   },
};
