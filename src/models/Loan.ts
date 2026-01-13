import { Schema, Types, model } from 'mongoose';

export type LoanStatus = 'pending' | 'approved' | 'rejected';

export type LoanDocument = {
  _id: Types.ObjectId;

  userId: Types.ObjectId;
  accountId: Types.ObjectId;

  principalMinor: number;
  currency: string;

  // Annual interest in basis points (bps): 1200 = 12.00%
  annualInterestBps: number;
  termMonths: number;

  status: LoanStatus;
  decisionNote?: string;

  decidedByUserId?: Types.ObjectId;
  decidedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
};

const loanSchema = new Schema<LoanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },

    principalMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: 'INR' },

    annualInterestBps: { type: Number, required: true, min: 0, max: 100000 },
    termMonths: { type: Number, required: true, min: 1, max: 600 },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true, default: 'pending', index: true },
    decisionNote: { type: String, required: false, trim: true },

    decidedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    decidedAt: { type: Date, required: false },
  },
  { timestamps: true },
);

loanSchema.index({ status: 1, createdAt: -1 });
loanSchema.index({ userId: 1, createdAt: -1 });

export const LoanModel = model<LoanDocument>('Loan', loanSchema);
