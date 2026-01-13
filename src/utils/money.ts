import { z } from 'zod';

export const moneyMinorSchema = z
  .number()
  .int('Amount must be an integer in minor units')
  .positive('Amount must be positive');

export function assertNonNegativeMinor(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer (minor units)`);
  }
}
