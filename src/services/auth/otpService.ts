import { ApiError } from '../../middlewares/errorMiddleware';
import { UserModel } from '../../models/User';
import { hashPassword, verifyPassword } from '../../utils/password';

const MOCK_OTP = '123456';

export async function issueMockOtp(email: string): Promise<{ otp: string; expiresAt: Date }> {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, 'User not found');

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const otpCodeHash = await hashPassword(MOCK_OTP);

  user.otpCodeHash = otpCodeHash;
  user.otpExpiresAt = expiresAt;
  await user.save();

  const exposeOtp = process.env.NODE_ENV !== 'production';
  return { otp: exposeOtp ? MOCK_OTP : '******', expiresAt };
}

export async function verifyMockOtp(email: string, otp: string): Promise<void> {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, 'User not found');

  if (!user.otpCodeHash || !user.otpExpiresAt) throw new ApiError(400, 'OTP not issued');
  if (user.otpExpiresAt.getTime() < Date.now()) throw new ApiError(400, 'OTP expired');

  const ok = await verifyPassword(otp, user.otpCodeHash);
  if (!ok) throw new ApiError(400, 'Invalid OTP');

  user.isOtpVerified = true;
  user.otpCodeHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save();
}
