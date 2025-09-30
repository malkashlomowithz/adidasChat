import type { Request, Response } from 'express';
import z from 'zod';
import jwt from 'jsonwebtoken';
import { User } from '../models/auth';

const registerSchema = z.object({
   name: z.string().min(1, 'Name is required'),
   password: z.string().min(1, 'Password is required'),
});

const loginSchema = z.object({
   name: z.string().min(2, 'Name is required'),
   password: z.string().min(6, 'Password is required'),
});

export const authController = {
   async register(req: Request, res: Response) {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json(parseResult.error.format());
      }

      try {
         const { name, password } = parseResult.data;

         const existingUser = await User.findOne({ name });
         if (existingUser) {
            return res.status(400).json({ error: 'Name already taken' });
         }

         const user = await User.create({ name, password });

         const token = jwt.sign(
            { userId: user._id, name: user.name },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1Yr' }
         );

         res.status(201).json({
            token,
            userId: user._id,
            message: 'User registered and logged in',
         });
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to register user' });
      }
   },

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

         const isValid = await user.comparePassword(password);
         if (!isValid) {
            return res.status(400).json({ error: 'Invalid name or password' });
         }

         const token = jwt.sign(
            { userId: user._id, name: user.name },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1Yr' }
         );

         res.json({ token, userId: user._id });
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to login' });
      }
   },
};
