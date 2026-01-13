import { Schema, Types, model } from 'mongoose';

export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type TransactionType = 'transfer' | 'loan_disbursement' | 'loan_payment';

export type TransactionDocument = {
  _id: Types.ObjectId;

  userId: Types.ObjectId;
  fromAccountId?: Types.ObjectId;
  toAccountId?: Types.ObjectId;

  type: TransactionType;
  status: TransactionStatus;
  amountMinor: number;
  currency: string;

  reference: string;
  note?: string;

  createdAt: Date;
  updatedAt: Date;
};

const transactionSchema = new Schema<TransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    fromAccountId: { type: Schema.Types.ObjectId, ref: 'Account', required: false, index: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: 'Account', required: false, index: true },

    type: {
      type: String,
      enum: ['transfer', 'loan_disbursement', 'loan_payment'],
      required: true,
      default: 'transfer',
      index: true,
    },
    status: { type: String, enum: ['pending', 'completed', 'failed'], required: true, default: 'completed' },

    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: 'INR' },

    reference: { type: String, required: true, index: true },
    note: { type: String, required: false, trim: true },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ fromAccountId: 1, createdAt: -1 });
transactionSchema.index({ toAccountId: 1, createdAt: -1 });

export const TransactionModel = model<TransactionDocument>('Transaction', transactionSchema);
