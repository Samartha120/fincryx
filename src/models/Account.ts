import { Schema, Types, model } from 'mongoose';

export type AccountType = 'checking' | 'savings';

export type AccountDocument = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  accountNumber: string;
  type: AccountType;
  currency: string;

  // Store money in minor units (e.g., cents/paise) to avoid floating point errors.
  balanceMinor: number;

  createdAt: Date;
  updatedAt: Date;
};

const accountSchema = new Schema<AccountDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    accountNumber: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['checking', 'savings'], required: true, default: 'checking' },
    currency: { type: String, required: true, default: 'INR' },

    balanceMinor: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

accountSchema.index({ userId: 1, createdAt: -1 });

export const AccountModel = model<AccountDocument>('Account', accountSchema);
