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

async function addUserToMonday(userData: {
   name: string;
   role: string;
   createdAt: Date;
   updatedAt: Date;
}) {
   const mondayApiToken =
      'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU3NzA4NDY1NiwiYWFpIjoxMSwidWlkIjo5NDE0MjE1OSwiaWFkIjoiMjAyNS0xMC0yMlQxMDozMzo0OC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MzIxMDk1MjcsInJnbiI6ImV1YzEifQ.JD1o7eTpH5bsxmnikxp4bDP0Girn9P48NWnGNaN_148';
   const boardId = '5056920933';

   if (!mondayApiToken || !boardId) {
      console.error('Monday.com credentials not configured');
      console.error(mondayApiToken, boardId);
      return;
   }

   const query = `
      mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
         create_item (
            board_id: $boardId,
            item_name: $itemName,
            column_values: $columnValues
         ) {
            id
         }
      }
   `;

   const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
   };

   const columnValues = {
      color_mkx0342a: { label: userData.role },
      date_mkx02f5: { date: formatDate(userData.createdAt) },
      date_mkx0ahjp: { date: formatDate(userData.updatedAt) },
   };

   const variables = {
      boardId: boardId,
      itemName: userData.name,
      columnValues: JSON.stringify(columnValues),
   };

   try {
      const response = await fetch('https://api.monday.com/v2', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Authorization: mondayApiToken,
            'API-Version': '2024-10',
         },
         body: JSON.stringify({ query, variables }),
      });

      const result = (await response.json()) as {
         data?: any;
         errors?: Array<{ message: string }>;
      };

      if (result.errors) {
         console.error('Monday.com API error:', result.errors);
      } else {
         console.log('User added to Monday.com successfully:', result.data);
      }

      return result;
   } catch (error) {
      console.error('Failed to add user to Monday.com:', error);
   }
}

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

         const user = await User.create({
            name,
            password,
         });

         // Add user to Monday.com board
         addUserToMonday({
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
         }).catch((err) => {
            console.error('Monday.com sync failed:', err);
         });

         const token = jwt.sign(
            { userId: user._id, name: user.name },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1y' }
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
            { expiresIn: '1y' }
         );

         res.json({
            token,
            userId: user._id,
            background: user.background || null,
         });
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to login' });
      }
   },

   async updateBackground(req: Request, res: Response) {
      try {
         const { userId } = req.body;
         const { background } = req.body;

         if (!userId || !background) {
            return res
               .status(400)
               .json({ error: 'userId and background are required' });
         }

         const user = await User.findByIdAndUpdate(
            userId,
            { background },
            { new: true }
         );

         if (!user) {
            return res.status(404).json({ error: 'User not found' });
         }

         res.json({
            message: 'Background updated successfully',
            user: {
               _id: user._id,
               name: user.name,
               background: user.background,
            },
         });
      } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Failed to update background' });
      }
   },
};
