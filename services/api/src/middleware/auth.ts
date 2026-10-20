import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { UserIdentity } from '@cineflow/shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserIdentity;
    }
  }
}

const oauth2Client = new OAuth2Client(config.googleClientId);

/**
 * Validates Google IAP signed header (x-goog-iap-jwt-assertion)
 */
async function verifyIapToken(iapJwt: string): Promise<string | null> {
  try {
    const keysResponse = await oauth2Client.getIapPublicKeys();
    const ticket = await oauth2Client.verifySignedJwtWithCertsAsync(
      iapJwt,
      keysResponse.pubkeys,
      'https://cloud.google.com/iap'
    );
    const payload = ticket.getPayload();
    return payload?.email || null;
  } catch (err) {
    console.error('Failed to verify IAP JWT assertion:', err);
    return null;
  }
}

/**
 * Validates Google OAuth ID token from Bearer header
 */
async function verifyGoogleIdToken(token: string): Promise<string | null> {
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    return payload?.email || null;
  } catch (err) {
    console.error('Failed to verify Google ID token:', err);
    return null;
  }
}

/**
 * Strict Personal Authentication and Authorization Middleware
 * Enforces that only the designated Google Account owner can access resources.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let email: string | null = null;

    if (config.authMode === 'local_dev') {
      // Local development convenience mode
      email = config.authorizedOwnerEmail;
    } else if (config.authMode === 'google_iap') {
      // Identity-Aware Proxy mode
      const iapHeader = req.header('x-goog-iap-jwt-assertion');
      if (!iapHeader) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Missing Identity-Aware Proxy assertion header.',
          },
        });
        return;
      }
      email = await verifyIapToken(iapHeader);
    } else if (config.authMode === 'google_oauth') {
      // Direct Google Bearer token mode
      const authHeader = req.header('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Missing or invalid Authorization header.',
          },
        });
        return;
      }
      const token = authHeader.substring(7);
      email = await verifyGoogleIdToken(token);
    }

    if (!email) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication failed. Invalid identity token.',
        },
      });
      return;
    }

    // STRICT OWNER CHECK: CineFlow AI is strictly private
    if (email.trim().toLowerCase() !== config.authorizedOwnerEmail.toLowerCase()) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. CineFlow AI is strictly private to ${config.authorizedOwnerEmail}.`,
        },
      });
      return;
    }

    req.user = {
      email,
      name: email.split('@')[0],
      isAuthorizedOwner: true,
    };

    next();
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Internal authentication validation failure.',
      },
    });
  }
}
