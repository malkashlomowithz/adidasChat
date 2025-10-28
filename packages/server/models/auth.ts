import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export type UserRole = 'user' | 'admin';

export interface UserDocument extends Document {
   name: string;
   password: string;
   role: UserRole;
   createdAt: Date;
   updatedAt: Date;
   background?: string;
   comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<UserDocument>(
   {
      name: { type: String, required: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      background: { type: String },
   },
   { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
   if (!this.isModified('password')) return next();
   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
   next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
   candidatePassword: string
): Promise<boolean> {
   return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<UserDocument>('User', UserSchema);
