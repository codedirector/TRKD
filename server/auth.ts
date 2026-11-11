import type { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import type { User } from '../src/types.js';
import { createClerkClient, verifyToken } from '@clerk/backend';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

/**
 * Authoritative Clerk Authentication Middleware
 * 
 * Verifies authenticated Clerk session / JWT token from Authorization: Bearer <token>.
 * Does NOT trust arbitrary user IDs from client headers.
 * Maps Clerk user ID (user_...) to Trackd user record.
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  let rawToken: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token'] && typeof req.headers['x-auth-token'] === 'string') {
    rawToken = (req.headers['x-auth-token'] as string).trim();
  } else if (req.query.token && typeof req.query.token === 'string') {
    rawToken = req.query.token.trim();
  }

  let user: User | undefined;

  // 1. Authoritative Clerk JWT Token Verification
  if (rawToken && rawToken !== 'guest' && rawToken !== 'null' && rawToken !== 'undefined') {
    if (clerkSecretKey && rawToken.includes('.')) {
      try {
        const verified = await verifyToken(rawToken, {
          secretKey: clerkSecretKey,
        });

        if (verified && verified.sub) {
          const clerkUserId = verified.sub;
          user = db.getUserByClerkId(clerkUserId) || db.getUserById(clerkUserId);

          // If user record not yet synced to Trackd DB, fetch from Clerk API
          if (!user && clerkClient) {
            try {
              const clerkUser = await clerkClient.users.getUser(clerkUserId);
              if (clerkUser) {
                const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
                const firstName = clerkUser.firstName || '';
                const lastName = clerkUser.lastName || '';
                const displayName = `${firstName} ${lastName}`.trim() || clerkUser.username || email.split('@')[0] || 'Trackd User';
                const avatar = clerkUser.imageUrl;
                const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber;
                const username = clerkUser.username || (email ? email.split('@')[0] : `user_${clerkUserId.slice(-6)}`);

                user = db.syncClerkUser({
                  clerkUserId,
                  email,
                  displayName,
                  avatar,
                  phone,
                  username,
                  firstName: firstName || undefined,
                  lastName: lastName || undefined,
                });
              }
            } catch (clerkErr) {
              console.warn('[Auth] Notice fetching Clerk user details:', clerkErr);
            }
          }
        }
      } catch (err: any) {
        // Token invalid or expired
        console.debug('[Auth] Clerk token verification notice:', err?.message || err);
      }
    }

    // 2. Authoritative Session Token Verification
    if (!user) {
      user = db.getUserBySessionToken(rawToken);
    }
  }

  // 3. Authoritative Server-Side Subscription & Trial Expiration Evaluation
  if (user) {
    db.isUserPro(user._id); // Triggers authoritative status update and persists expiry if past endDate
    user = db.getUserById(user._id) || user;
  }

  req.user = user;
  next();
}

/**
 * Route protection guard for authenticated workspace APIs
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Authentication required' });
    return;
  }
  next();
}

/**
 * Authorization helpers (Answers: "Does this user own this document? Can this user publish it?")
 */
export function canManageDocument(user: User | undefined, documentUserId: string): boolean {
  if (!user) return false;
  return user._id === documentUserId || (user.clerkUserId && user.clerkUserId === documentUserId);
}
