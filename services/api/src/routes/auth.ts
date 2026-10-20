import { Router, Request, Response } from 'express';
import { config } from '../config';

export const authRouter = Router();

// GET /api/auth/me - Return current authenticated identity and authorization status
authRouter.get('/me', (req: Request, res: Response) => {
  const user = req.user;
  res.json({
    success: true,
    data: {
      user: user || null,
      authMode: config.authMode,
      authorizedOwnerEmail: config.authorizedOwnerEmail,
      isAuthorizedOwner: user?.email.toLowerCase() === config.authorizedOwnerEmail.toLowerCase(),
    },
  });
});
