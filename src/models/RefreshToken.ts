import { Schema, Types, model } from 'mongoose';

export type RefreshTokenDocument = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  // Store hashed refresh token (or hashed jti) for revocation support.
  tokenHash: string;
  expiresAt: Date;

  revokedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
};

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, required: false, index: true },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ userId: 1, createdAt: -1 });

export const RefreshTokenModel = model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema);
