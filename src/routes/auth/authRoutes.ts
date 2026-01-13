import { Router } from 'express';

import { register, loginHandler, verifyOtp, refresh, logoutHandler } from '../../controllers/auth/authController';
import { validateBody } from '../../middlewares/validate';
import {
  loginBodySchema,
  logoutBodySchema,
  otpVerifyBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from '../../validators/authValidators';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerBodySchema), register);
authRouter.post('/login', validateBody(loginBodySchema), loginHandler);
authRouter.post('/otp/verify', validateBody(otpVerifyBodySchema), verifyOtp);
authRouter.post('/refresh', validateBody(refreshBodySchema), refresh);
authRouter.post('/logout', validateBody(logoutBodySchema), logoutHandler);
