import { z } from 'zod';

export const registerBodySchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(6).max(20).optional(),
  password: z.string().min(8).max(72),
});

export const loginBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(72),
});

export const otpVerifyBodySchema = z.object({
  email: z.string().email().max(255),
  otp: z.string().min(4).max(10),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(10).optional(),
});
