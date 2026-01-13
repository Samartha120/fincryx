import { Schema, Types, model } from 'mongoose';

export type UserRole = 'customer' | 'admin';

export type UserDocument = {
  _id: Types.ObjectId;
  role: UserRole;

  fullName: string;
  email: string;
  phone?: string;

  passwordHash: string;
  isOtpVerified: boolean;

  otpCodeHash?: string;
  otpExpiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    role: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
      default: 'customer',
      index: true,
    },

    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    phone: { type: String, required: false, trim: true },

    passwordHash: { type: String, required: true },
    isOtpVerified: { type: Boolean, required: true, default: false, index: true },

    otpCodeHash: { type: String, required: false },
    otpExpiresAt: { type: Date, required: false, index: true },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

export const UserModel = model<UserDocument>('User', userSchema);
