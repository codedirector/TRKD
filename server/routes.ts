import express, { type Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db, generateSimplePdf, type ResumeView } from './db.js';
import { authMiddleware, requireAuth, type AuthenticatedRequest } from './auth.js';
import { isCloudinaryConfigured, uploadToCloudinary } from './cloudinary.js';
import { isMongoConfigured, isMongoConnected, getMongoDb, getMongoDiagnostics } from './mongodb.js';
import { generateCommitMessage, analyzeVersionDiff } from './ai.js';
import type { User, Resume, ResumeVersion } from '../src/types.js';

const router: Router = express.Router();
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Helper to sanitize versions for client responses - never leaks Cloudinary URLs
function sanitizeVersionForClient(version: ResumeVersion): ResumeVersion {
  const safeFileUrl = `/api/pdf/${version.resumeId}/${version._id}`;
  const { storageUrl, ...safe } = version as any;
  return {
    ...safe,
    fileUrl: safeFileUrl
  };
}

// Configure Multer for PDF file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `resume_${uniqueSuffix}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF resumes are accepted.'));
    }
  }
});

// Multer configuration for User Profile Avatars (Bug #11)
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar_${uniqueSuffix}${ext}`);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowedMimes.includes(file.mimetype.toLowerCase()) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPG, PNG, and WebP images are allowed for avatars.'));
    }
  }
});

// Helper for slug validation
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

// Helper for user serialization (never expose password hashes or reset codes)
function sanitizeUser(user: User): Omit<User, 'password' | 'resetPasswordCode' | 'resetPasswordExpiresAt'> {
  const { password, resetPasswordCode, resetPasswordExpiresAt, ...safe } = user;
  return safe;
}

// -------------------------------------------------------------
// Authentication Routes (Native, Secure, Production Hardened)
// -------------------------------------------------------------
// GET /api/auth/me - Returns current authenticated user
router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: sanitizeUser(req.user) });
});

// POST /api/auth/signup - Create a new account with First Name, Email, Password (min 7 chars), Optional Phone
router.post('/auth/signup', (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  
  if (!firstName || !String(firstName).trim()) {
    res.status(400).json({ error: 'First name is required' });
    return;
  }
  if (!email || !String(email).trim()) {
    res.status(400).json({ error: 'Email address is required' });
    return;
  }
  if (!password || String(password).length < 7) {
    res.status(400).json({ error: 'Password must be at least 7 characters long' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanFirst = String(firstName).trim();
  const cleanLast = lastName ? String(lastName).trim() : '';
  const displayName = cleanLast ? `${cleanFirst} ${cleanLast}` : cleanFirst;
  const cleanPhone = phone ? String(phone).trim() : undefined;

  let user = db.getUserByEmail(cleanEmail);
  if (user) {
    res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
    return;
  }

  user = db.createUser({
    email: cleanEmail,
    displayName,
    firstName: cleanFirst,
    lastName: cleanLast,
    name: displayName,
    phone: cleanPhone,
    password: String(password)
  });

  const token = db.createSession(user._id);
  res.status(201).json({
    success: true,
    user: sanitizeUser(user),
    token,
    message: 'Account created successfully'
  });
});

// POST /api/auth/signin - Sign in with Email and Password
router.post('/auth/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  if (String(password).length < 7) {
    res.status(400).json({ error: 'Password must be at least 7 characters long' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Verify password using authoritative hash comparison
  if (!user.password || !db.verifyPassword(String(password), user.password)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = db.createSession(user._id);
  res.json({
    success: true,
    user: sanitizeUser(user),
    token,
    message: 'Signed in successfully'
  });
});

// POST /api/auth/google - 1-Click Google OAuth (BUG-06)
router.post('/auth/google', (req, res) => {
  let { email, name, avatar } = req.body;
  if (!email || !String(email).trim()) {
    if (process.env.NODE_ENV !== 'production') {
      email = 'google_candidate@trackd.app';
      name = name || 'Google Verified Candidate';
      avatar = avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    } else {
      res.status(400).json({ error: 'Valid Google email is required. Please enter your email to continue.' });
      return;
    }
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = (name || cleanEmail.split('@')[0]).trim();

  let user = db.getUserByEmail(cleanEmail);
  if (user && user.password) {
    // If account has an existing password, prevent unauthenticated 1-click bypass
    res.status(403).json({
      error: 'An account with this email was registered using a password. Please sign in with your email and password.',
      requiresPassword: true
    });
    return;
  }

  if (!user) {
    user = db.createUser({
      email: cleanEmail,
      displayName: cleanName,
      name: cleanName,
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    });
  }

  const token = db.createSession(user._id);
  res.json({
    success: true,
    user: sanitizeUser(user),
    token,
    message: 'Authenticated with Google successfully'
  });
});

// POST /api/auth/forgot-password - Proper Forgot Password flow (BUG-09 & PRD Section 1)
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const cleanEmail = String(email).trim().toLowerCase();

  // Generate 6-digit reset code and store in DB (valid 30 minutes)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.setResetPasswordCode(cleanEmail, code, 30);
  console.log(`[Auth] Password reset verification code generated for ${cleanEmail}: ${code}`);

  const hasEmailService = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
  const isDev = process.env.NODE_ENV !== 'production';

  // Return success message with verification code preview if no transactional mailer configured
  res.json({
    success: true,
    message: hasEmailService
      ? `Password reset verification instructions dispatched to ${cleanEmail}.`
      : `Password reset verification code generated for ${cleanEmail}. (Preview code: ${code})`,
    ...(!hasEmailService || isDev ? { resetCode: code, code: code } : {}),
    expiresInMinutes: 30
  });
});

// POST /api/auth/reset-password - Reset password flow with verification (Bug #12 & PRD Section 1)
router.post('/auth/reset-password', async (req, res) => {
  const { email, newPassword, resetCode, code } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and new password are required' });
    return;
  }
  if (String(newPassword).length < 7) {
    res.status(400).json({ error: 'Password must be at least 7 characters long' });
    return;
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const tokenToVerify = resetCode || code;

  const result = db.verifyAndResetPassword(cleanEmail, String(newPassword), tokenToVerify);
  if (!result.success) {
    res.status(400).json({ error: result.error || 'Failed to reset password' });
    return;
  }

  const user = result.user || db.getUserByEmail(cleanEmail);
  const token = user ? db.createSession(user._id) : undefined;

  res.json({
    success: true,
    user: user ? sanitizeUser(user) : undefined,
    token,
    message: 'Password has been reset successfully. You can now sign in with your new password.'
  });
});

// POST /api/auth/sync - Universal profile sync
router.post('/auth/sync', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { email, displayName, username, avatar, phone, firstName, lastName } = req.body;
  const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;

  // 1. If caller is authenticated, safely update their own profile
  if (req.user) {
    const updated = db.updateUserProfile(req.user._id, {
      displayName: displayName ? String(displayName).trim() : req.user.displayName,
      username: username ? String(username).toLowerCase().trim() : req.user.username,
      avatar: avatar ? String(avatar).trim() : req.user.avatar,
      phone: phone ? String(phone).trim() : req.user.phone,
      firstName: firstName ? String(firstName).trim() : req.user.firstName,
      lastName: lastName ? String(lastName).trim() : req.user.lastName,
    });
    const token = db.createSession(req.user._id);
    res.json({
      success: true,
      user: sanitizeUser(updated || req.user),
      token,
      message: 'User synchronized successfully'
    });
    return;
  }

  // 2. Unauthenticated caller: Require email
  if (!cleanEmail) {
    res.status(401).json({ error: 'Authentication required to synchronize profile' });
    return;
  }

  // Prevent account hijacking if email exists and has a password
  const existing = db.getUserByEmail(cleanEmail);
  if (existing && existing.password) {
    res.status(403).json({ error: 'Account already exists. Please sign in with your credentials.' });
    return;
  }

  const user = db.createOrUpdateUser({
    email: cleanEmail,
    displayName: displayName ? String(displayName).trim() : undefined,
    username: username ? String(username).toLowerCase().trim() : undefined,
    avatar: avatar ? String(avatar).trim() : undefined,
    phone: phone ? String(phone).trim() : undefined,
    firstName: firstName ? String(firstName).trim() : undefined,
    lastName: lastName ? String(lastName).trim() : undefined,
  });

  const token = db.createSession(user._id);
  res.json({
    success: true,
    user: sanitizeUser(user),
    token,
    message: 'User synchronized successfully'
  });
});

// POST /api/auth/logout - Sign out session
router.post('/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/first-time-setup - Set display name and username after signup
router.post('/auth/first-time-setup', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { username, name, displayName, avatar } = req.body;

  const resolvedName = (displayName || name || '').trim();
  if (!username || !resolvedName) {
    res.status(400).json({ error: 'Username and display name are required' });
    return;
  }

  const cleanUsername = String(username).toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters (letters, numbers, hyphens)' });
    return;
  }

  // Check if username is already taken by another user
  const existing = db.getUserByUsername(cleanUsername);
  if (existing && existing._id !== user._id) {
    res.status(409).json({ error: 'Username already taken. Please choose another one.' });
    return;
  }

  const updated = db.updateUserProfile(user._id, {
    username: cleanUsername,
    displayName: resolvedName,
    name: resolvedName,
    avatar: avatar || user.avatar,
    needsFirstTimeSetup: false
  });

  res.json({ user: updated, success: true });
});


// PUT /api/users/profile - Update user display name, profession, and professional links
router.put('/users/profile', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, username, avatar, profession, socialLinks } = req.body;

  let cleanUsername = user.username;
  if (username) {
    cleanUsername = String(username).toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (cleanUsername.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }
    const existing = db.getUserByUsername(cleanUsername);
    if (existing && existing._id !== user._id) {
      res.status(409).json({ error: 'Username is already taken' });
      return;
    }
  }

  const updated = db.updateUserProfile(user._id, {
    name: name ? String(name).trim() : user.name,
    username: cleanUsername,
    avatar: avatar !== undefined ? String(avatar).trim() : user.avatar,
    profession: profession !== undefined ? String(profession).trim() : user.profession,
    socialLinks: socialLinks || user.socialLinks
  });

  res.json({ user: updated, success: true });
});

// POST /api/users/avatar - Upload user avatar directly (Bug #11)
router.post('/users/avatar', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  uploadAvatar.single('avatar')(req, res, async (err: any) => {
    if (err) {
      const msg = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds 5MB limit'
        : err.message || 'Avatar upload failed';
      res.status(400).json({ error: msg });
      return;
    }

    const user = req.user!;
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Please select an image file to upload' });
      return;
    }

    let avatarUrl = `/uploads/${file.filename}`;

    // If Cloudinary credentials are provided, upload to Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const cldResult = await uploadToCloudinary(file.path, {
          folder: `trackd/avatars/${user.username}`,
          publicId: `avatar_${Date.now()}`,
          resourceType: 'image'
        });
        if (cldResult?.secureUrl) {
          avatarUrl = cldResult.secureUrl;
        }
      } catch (cldErr) {
        console.warn('[Cloudinary] Avatar upload fallback to local storage');
      }
    }

    const updated = db.updateUserProfile(user._id, { avatar: avatarUrl });
    if (!updated) {
      res.status(500).json({ error: 'Failed to update avatar in database' });
      return;
    }
    res.json({ success: true, avatarUrl, user: sanitizeUser(updated) });
  });
});

// DELETE /api/users/avatar - Remove user avatar and revert to initials (Bug #11)
router.delete('/users/avatar', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const updated = db.updateUserProfile(user._id, { avatar: '' });
  if (!updated) {
    res.status(500).json({ error: 'Failed to remove avatar from database' });
    return;
  }
  res.json({ success: true, avatarUrl: '', user: sanitizeUser(updated) });
});

// POST /api/users/toggle-trial - Easily switch between active trial, expired trial, and full Pro for testing
router.post('/users/toggle-trial', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { state } = req.body; // 'active' | 'expired' | 'pro'

  if (process.env.NODE_ENV === 'production' && state === 'pro') {
    res.status(403).json({ error: 'Manual Pro activation is disabled in production. Please complete checkout.' });
    return;
  }

  if (state === 'pro') {
    db.updateUserPlan(user._id, 'PRO');
    const updated = db.updateUserProfile(user._id, {
      trialStatus: 'expired'
    });
    res.json({ success: true, user: updated });
    return;
  }

  if (state === 'expired') {
    db.updateUserPlan(user._id, 'FREE');
    const updated = db.updateUserProfile(user._id, {
      trialStatus: 'expired',
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      subscriptionStatus: 'EXPIRED',
      subscriptionEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    });
    res.json({ success: true, user: updated });
    return;
  }

  // Default: active 7-day Pro trial
  db.updateUserPlan(user._id, 'FREE');
  const updated = db.updateUserProfile(user._id, {
    trialStatus: 'active',
    trialStartDate: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  res.json({ success: true, user: updated });
});

// POST /api/payments/razorpay/create-order (PRD Section 7 & BUG-07: Launch offer ₹29, Pro ₹19/mo, ₹99/6mo, ₹185/yr)
router.post('/payments/razorpay/create-order', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { cycle = 'monthly' } = req.body;
  let amount = 1900; // default ₹19 (monthly)
  if (cycle === 'launch_offer') {
    amount = 2900; // ₹29 / 2 months
  } else if (cycle === 'six_month') {
    amount = 9900; // ₹99 / 6 months
  } else if (cycle === 'yearly') {
    amount = 18500; // ₹185 / year
  } else if (cycle === 'monthly') {
    amount = 1900; // ₹19 / month
  }
  
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
  const isSandbox = !Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

  res.json({
    orderId: `order_rzp_${Date.now()}`,
    amount,
    currency: 'INR',
    plan: 'PRO',
    cycle,
    keyId: razorpayKeyId,
    isSandbox
  });
});

// POST /api/payments/razorpay/verify (PRD Section 19: Server-side payment verification, BUG-07)
router.post('/payments/razorpay/verify', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { plan = 'PRO', cycle = 'monthly', orderId, paymentId, signature, isSandbox } = req.body;

  // Authoritative HMAC SHA256 Signature Verification if secret is configured and not in explicit sandbox mode
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  if (razorpaySecret && orderId && paymentId && !isSandbox) {
    if (!signature) {
      res.status(400).json({ error: 'Missing payment signature for verification' });
      return;
    }
    const generatedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
      return;
    }
  }

  let amount = 1900;
  if (cycle === 'launch_offer') amount = 2900;
  else if (cycle === 'six_month') amount = 9900;
  else if (cycle === 'yearly') amount = 18500;

  const subscription = db.createSubscription({
    userId: user._id,
    plan: plan as any,
    cycle: cycle as 'launch_offer' | 'monthly' | 'six_month' | 'yearly',
    amount,
    orderId,
    paymentId: paymentId || `pay_rzp_${Date.now()}`
  });

  const updatedUser = db.getUserById(user._id);

  res.json({
    success: true,
    user: updatedUser,
    subscription,
    message: 'Payment verified successfully! Trackd Pro activated.'
  });
});

// POST /api/payments/razorpay/webhook (PRD Section 19: Webhooks handle recurring state changes)
router.post('/payments/razorpay/webhook', (req, res) => {
  const event = req.body?.event;
  const payload = req.body?.payload;
  console.log(`[Billing Webhook] Received payment provider event: ${event}`);

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload?.payment?.entity;
    const notes = paymentEntity?.notes || {};
    const userId = notes.userId;
    const cycle = notes.cycle || 'monthly';
    if (userId) {
      db.createSubscription({
        userId,
        plan: 'PRO',
        cycle,
        amount: paymentEntity?.amount || 1900,
        paymentId: paymentEntity?.id,
        orderId: paymentEntity?.order_id
      });
    }
  }

  res.json({ status: 'ok', received: true });
});

// GET /api/user/subscription - Retrieve user's subscription and trial status with server-side expiry check (Bug #13)
router.get('/user/subscription', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isPro = db.isUserPro(user._id); // Updates status to EXPIRED server-side if past endDate
  const freshUser = db.getUserById(user._id) || user;
  const subscriptions = db.getSubscriptionsByUserId(user._id);
  const activeSub = subscriptions.find(s => s.status === 'ACTIVE' || (s.status === 'CANCELED' && new Date(s.endDate || s.expiresAt).getTime() > Date.now())) || null;

  res.json({
    user: freshUser,
    plan: freshUser.plan,
    isPro,
    subscriptionStatus: freshUser.subscriptionStatus,
    subscriptionStartDate: freshUser.subscriptionStartDate,
    subscriptionEndDate: freshUser.subscriptionEndDate,
    subscriptionCancelledAt: freshUser.subscriptionCancelledAt,
    trialEndsAt: freshUser.trialEndsAt,
    activeSubscription: activeSub,
    allSubscriptions: subscriptions
  });
});

// POST /api/user/subscription/cancel - Cancel auto-renewal (keeps access until current endDate) (Bug #13)
router.post('/user/subscription/cancel', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = db.cancelSubscription(user._id);
  if (!result.user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    message: result.user.subscriptionEndDate 
      ? `Auto-renewal cancelled. You will continue to have full Pro access until ${new Date(result.user.subscriptionEndDate).toLocaleDateString()}.`
      : 'Auto-renewal cancelled.',
    user: result.user,
    subscription: result.subscription
  });
});


// PATCH /api/users/plan
router.patch('/users/plan', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { plan } = req.body;

  if (!plan || (plan !== 'FREE' && plan !== 'PRO')) {
    res.status(400).json({ error: 'Invalid plan type. Must be FREE or PRO' });
    return;
  }

  if (process.env.NODE_ENV === 'production' && plan === 'PRO') {
    res.status(403).json({ error: 'Plan upgrades to PRO require verified subscription payment' });
    return;
  }

  const updated = db.updateUserPlan(user._id, plan);
  if (!updated) {
    res.status(500).json({ error: 'Failed to update plan' });
    return;
  }

  res.json({ success: true, user: updated });
});

router.get('/auth/users', (_req, res) => {
  res.json({ users: db.getAllUsers() });
});

// -------------------------------------------------------------
// Resume APIs (PRD Section 21)
// -------------------------------------------------------------

// POST /api/resumes - Create new resume
router.post('/resumes', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, category } = req.body;
  const user = req.user!;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Resume or document name is required' });
    return;
  }

  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    res.status(400).json({ error: 'URL slug is required' });
    return;
  }

  const cleanSlug = slug.toLowerCase().trim();
  if (!isValidSlug(cleanSlug)) {
    res.status(400).json({ error: 'Slug must be URL-safe (lowercase letters, numbers, and hyphens only)' });
    return;
  }

  // PRD Section 21 & Pricing: Free plan is limited to 2 active documents
  const isPro = db.isUserPro(user._id);
  if (!isPro) {
    const existingCount = db.getResumesByUserId(user._id).length;
    if (existingCount >= 2) {
      res.status(403).json({
        error: 'Free plan limit reached (maximum 2 active documents). Upgrade to Trackd Pro for unlimited documents.',
        code: 'PLAN_LIMIT_REACHED'
      });
      return;
    }
  }

  // Check unique slug for user
  const existing = db.getResumeByUserAndSlug(user._id, cleanSlug);
  if (existing) {
    res.status(409).json({ error: `Slug "${cleanSlug}" is already in use for your account.` });
    return;
  }

  const validCategory = ['resume', 'cv', 'portfolio', 'proposal', 'report', 'other'].includes(category) 
    ? category 
    : 'resume';

  const created = db.createResume(user._id, name.trim(), cleanSlug, validCategory);
  res.status(201).json(created);
});

// POST /api/user/plan - Upgrade to PRO or switch to FREE
router.post('/user/plan', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { plan } = req.body;

  if (plan !== 'FREE' && plan !== 'PRO') {
    res.status(400).json({ error: 'Plan must be FREE or PRO' });
    return;
  }

  if (process.env.NODE_ENV === 'production' && plan === 'PRO') {
    res.status(403).json({ error: 'Plan upgrades to PRO require verified subscription payment' });
    return;
  }

  const updatedUser = db.updateUserPlan(user._id, plan);
  res.json({ success: true, user: updatedUser });
});


// GET /api/resumes - List all user resumes
router.get('/resumes', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resumes = db.getResumesByUserId(user._id);
  res.json(resumes);
});

// GET /api/resumes/:id - Get resume detail
router.get('/resumes/:id', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resume = db.getResumeById(req.params.id);

  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }

  // Authorization check (Section 22)
  if (resume.userId !== user._id) {
    res.status(403).json({ error: 'Forbidden: You do not have access to this resume' });
    return;
  }

  const versions = db.getVersionsByResumeId(resume._id);
  res.json({
    ...resume,
    versions
  });
});

// DELETE /api/resumes/:id - Delete resume
router.delete('/resumes/:id', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resume = db.getResumeById(req.params.id);

  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }

  if (resume.userId !== user._id) {
    res.status(403).json({ error: 'Forbidden: You do not have permission to delete this resume' });
    return;
  }

  db.deleteResume(resume._id);
  res.json({ success: true, message: 'Resume and versions deleted successfully' });
});

// POST /api/resumes/:id/clone - Clone / duplicate document repository
router.post('/resumes/:id/clone', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const source = db.getResumeById(req.params.id);

  if (!source) {
    res.status(404).json({ error: 'Document to clone not found' });
    return;
  }

  if (source.userId !== user._id) {
    res.status(403).json({ error: 'Forbidden: You do not have permission to clone this document' });
    return;
  }

  const { name, slug, category, branchMode } = req.body;

  try {
    const cloned = db.cloneResume(user._id, source._id, {
      name,
      slug,
      category,
      branchMode: branchMode === 'published_only' ? 'published_only' : 'all'
    });

    res.status(201).json({
      success: true,
      resume: cloned,
      message: `Repository '${cloned.name}' cloned successfully`
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to clone repository' });
  }
});

// GET /api/user/contributions - Activity commit frequency (GitHub-style contribution grid)
router.get('/user/contributions', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const contributions = db.getUserContributions(user._id);
  res.json(contributions);
});

// -------------------------------------------------------------
// Version APIs (PRD Section 21 & Section 9)
// -------------------------------------------------------------

// POST /api/resumes/:id/versions - Upload new version
router.post(
  '/resumes/:id/versions',
  authMiddleware,
  requireAuth,
  (req: AuthenticatedRequest, res: Response, next) => {
    upload.any()(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large. Maximum PDF size is 15MB.' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      } else if (err) {
        res.status(400).json({ error: err.message || 'Failed to upload PDF' });
        return;
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const resume = db.getResumeById(req.params.id);

    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    if (resume.userId !== user._id) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this resume' });
      return;
    }

    const { commitMessage, useSample } = req.body;

    if (!commitMessage || typeof commitMessage !== 'string' || !commitMessage.trim()) {
      res.status(400).json({ error: 'Commit message is required' });
      return;
    }

    let fileUrl = '';
    let filePublicId = '';
    let fileName = 'resume.pdf';
    let fileSize = 50000;
    let localSavedPath = '';

    const uploadedFile = req.file || (req.files && Array.isArray(req.files) && req.files.length > 0 ? req.files[0] : undefined);

    if (uploadedFile) {
      localSavedPath = uploadedFile.path;
      fileUrl = `/uploads/${uploadedFile.filename}`;
      filePublicId = `trackd/resumes/${uploadedFile.filename}`;
      fileName = uploadedFile.originalname;
      fileSize = uploadedFile.size;
    } else if (useSample === 'true' || useSample === true) {
      // Fallback sample PDF generator for easy in-browser testing
      const generatedName = `sample_${Date.now()}_resume.pdf`;
      const pdfBuffer = generateSimplePdf(resume.name, user.name, 'Next', commitMessage.trim());
      localSavedPath = path.join(UPLOADS_DIR, generatedName);
      fs.writeFileSync(localSavedPath, pdfBuffer);
      fileUrl = `/uploads/${generatedName}`;
      filePublicId = `trackd/resumes/${generatedName}`;
      fileName = generatedName;
      fileSize = pdfBuffer.length;
    } else {
      res.status(400).json({ error: 'A PDF file is required for upload.' });
      return;
    }

    // If Cloudinary credentials are provided, upload to Cloudinary cloud storage
    if (isCloudinaryConfigured() && localSavedPath) {
      try {
        const cldResult = await uploadToCloudinary(localSavedPath, {
          folder: `trackd/resumes/${user.username}`,
          publicId: `${resume.slug}_v${Date.now()}`,
          resourceType: 'auto'
        });
        if (cldResult?.secureUrl) {
          fileUrl = cldResult.secureUrl;
          filePublicId = cldResult.publicId;
        }
      } catch (cldErr) {
        console.warn('[Cloudinary] Version upload fallback to local storage');
      }
    }

    const newVersion = db.createVersion({
      resumeId: resume._id,
      fileUrl,
      filePublicId,
      fileName,
      fileSize,
      commitMessage: commitMessage.trim()
    });

    res.status(201).json(sanitizeVersionForClient(newVersion));
  }
);

// GET /api/resumes/:id/versions - List versions
router.get('/resumes/:id/versions', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resume = db.getResumeById(req.params.id);

  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }

  if (resume.userId !== user._id) {
    res.status(403).json({ error: 'Forbidden: You do not have access to this resume' });
    return;
  }

  const versions = db.getVersionsByResumeId(resume._id);
  res.json(versions.map(sanitizeVersionForClient));
});

// GET /api/resumes/:id/versions/:versionId & GET /api/documents/:id/versions/:versionId (PRD Section 4: Exact version resolution)
const handleGetSingleVersion = (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resume = db.getResumeById(req.params.id);

  if (!resume) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  if (resume.userId !== user._id && resume.userId !== user.clerkUserId) {
    res.status(403).json({ error: 'Forbidden: You do not have access to this document' });
    return;
  }

  const version = db.getVersionById(req.params.versionId);
  if (!version || version.resumeId !== resume._id) {
    res.status(404).json({ error: 'Version not found for this document' });
    return;
  }

  res.json(sanitizeVersionForClient(version));
};

router.get('/resumes/:id/versions/:versionId', authMiddleware, requireAuth, handleGetSingleVersion);
router.get('/documents/:id/versions/:versionId', authMiddleware, requireAuth, handleGetSingleVersion);

// GET /api/resumes/:id/versions/:versionId/file & GET /api/documents/:id/versions/:versionId/file & GET /api/pdf/:id/:versionId
// Dedicated authoritative PDF streaming endpoint (Bugs #3 & #9: Guarantees application/pdf, never HTML)
const handleStreamVersionFile = async (req: Request, res: Response) => {
  const resume = db.getResumeById(req.params.id);
  if (!resume) {
    res.status(404).type('text/plain').send('Document not found');
    return;
  }

  const version = db.getVersionById(req.params.versionId);
  if (!version || version.resumeId !== resume._id) {
    res.status(404).type('text/plain').send('Version not found for this document');
    return;
  }

  const targetStorageUrl = (version as any).storageUrl || version.fileUrl;
  const isDownload = req.path.endsWith('/download') || req.query.download === 'true';
  const dispositionType = isDownload ? 'attachment' : 'inline';

  // 1. Resolve candidate local file paths
  let localFile = '';
  if (targetStorageUrl && !targetStorageUrl.startsWith('http://') && !targetStorageUrl.startsWith('https://')) {
    localFile = path.join(UPLOADS_DIR, path.basename(targetStorageUrl));
  } else if (version.fileName) {
    const candidatePath = path.join(UPLOADS_DIR, path.basename(version.fileName));
    if (fs.existsSync(candidatePath)) {
      localFile = candidatePath;
    }
  }

  if (localFile && fs.existsSync(localFile)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(version.fileName || 'document.pdf')}"`);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.createReadStream(localFile).pipe(res);
    return;
  }

  // 2. If remote URL (e.g. Cloudinary CDN), fetch server-side and proxy directly as application/pdf
  // DO NOT redirect client with Authorization header which can cause third-party 401s
  if (targetStorageUrl && (targetStorageUrl.startsWith('http://') || targetStorageUrl.startsWith('https://'))) {
    try {
      const remoteRes = await fetch(targetStorageUrl);
      if (remoteRes.ok) {
        const buf = Buffer.from(await remoteRes.arrayBuffer());
        if (buf.length >= 4 && buf.toString('utf-8', 0, 4) === '%PDF') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(version.fileName || 'document.pdf')}"`);
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.send(buf);
          return;
        }
      }
    } catch (remoteErr) {
      console.warn('[StreamPDF] Remote fetch failed, falling back to on-the-fly PDF:', remoteErr);
    }
  }

  // 3. Fallback: regenerate valid PDF document on the fly so client receives authentic %PDF- document
  const user = db.getUserById(resume.userId);
  const generated = generateSimplePdf(
    `${resume.name} (${version.versionLabel || 'v' + version.versionNumber})`,
    user?.name || 'Trackd User',
    version.versionLabel || 'v1',
    version.commitMessage || 'Sample resume'
  );
  try {
    const fallbackPath = localFile || path.join(UPLOADS_DIR, `doc_${version._id}.pdf`);
    fs.writeFileSync(fallbackPath, generated);
  } catch (err) {
    console.error('Failed to write regenerated PDF:', err);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(version.fileName || 'document.pdf')}"`);
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(generated);
};

router.get('/resumes/:id/versions/:versionId/file', handleStreamVersionFile);
router.get('/documents/:id/versions/:versionId/file', handleStreamVersionFile);
router.get('/pdf/:id/:versionId', handleStreamVersionFile);

// -------------------------------------------------------------
// Publishing API (PRD Section 12 & 21)
// -------------------------------------------------------------

// POST /api/resumes/:id/publish & PATCH /api/resumes/:id/publish/:versionId
const handlePublishVersion = (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const versionId = req.body?.versionId || req.params?.versionId;

  if (!versionId) {
    res.status(400).json({ error: 'versionId is required' });
    return;
  }

  const resume = db.getResumeById(req.params.id);
  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }

  if (resume.userId !== user._id) {
    res.status(403).json({ error: 'Forbidden: You do not have permission to publish this resume' });
    return;
  }

  const updated = db.publishVersion(resume._id, versionId);
  if (!updated) {
    res.status(404).json({ error: 'Target version not found for this resume' });
    return;
  }

  res.json({
    success: true,
    message: `Version successfully published. Public URL updated.`,
    resume: updated
  });
};

router.post('/resumes/:id/publish', authMiddleware, requireAuth, handlePublishVersion);
router.patch('/resumes/:id/publish/:versionId', authMiddleware, requireAuth, handlePublishVersion);

// POST /api/resumes/:id/revert/:versionId - Git-style rollback creating a new revision from a previous version
router.post('/resumes/:id/revert/:versionId', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resume = db.getResumeById(req.params.id);

  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }

  if (resume.userId !== user._id) {
    res.status(403).json({ error: 'Forbidden: You do not have permission to modify this document' });
    return;
  }

  const targetVersion = db.getVersionById(req.params.versionId);
  if (!targetVersion || targetVersion.resumeId !== resume._id) {
    res.status(404).json({ error: 'Historical version not found' });
    return;
  }

  const versions = db.getVersionsByResumeId(resume._id);
  const nextNum = versions.length + 1;
  const newCommitMessage = `Revert to v${targetVersion.versionNumber}: ${targetVersion.commitMessage}`;

  const revertedVersion = db.createVersion({
    resumeId: resume._id,
    fileUrl: targetVersion.fileUrl,
    filePublicId: targetVersion.filePublicId,
    fileName: targetVersion.fileName,
    fileSize: targetVersion.fileSize,
    commitMessage: newCommitMessage
  });

  // Automatically publish this newly created reverted version
  const updatedResume = db.publishVersion(resume._id, revertedVersion._id);

  res.status(201).json({
    success: true,
    message: `Successfully rolled back to v${targetVersion.versionNumber} as new release v${nextNum}`,
    version: sanitizeVersionForClient(revertedVersion),
    resume: updatedResume
  });
});

// POST /api/ai/suggest-commit - Suggest commit message using Gemini AI
router.post('/ai/suggest-commit', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { resumeName, category, versionLabel, userNotes, previousCommit } = req.body;
  const suggestion = await generateCommitMessage({
    resumeName,
    category,
    versionLabel,
    userNotes,
    previousCommit
  });
  res.json({ commitMessage: suggestion });
});

// POST /api/ai/analyze-diff - AI comparison between two versions
router.post('/ai/analyze-diff', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { documentName, versionA, versionB, notes } = req.body;
  if (!versionA || !versionB) {
    res.status(400).json({ error: 'versionA and versionB are required' });
    return;
  }
  const analysis = await analyzeVersionDiff({
    documentName: documentName || 'Document',
    versionA,
    versionB,
    notes
  });
  res.json(analysis);
});

// POST /api/resumes/:id/unpublish
router.post('/resumes/:id/unpublish', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resume = db.getResumeById(req.params.id);

  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }

  if (resume.userId !== user._id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const updated = db.unpublishResume(resume._id);
  res.json({ success: true, resume: updated });
});

// -------------------------------------------------------------
// Analytics API (PRD Section 15, 16 & 21)
// -------------------------------------------------------------

// GET /api/resumes/:id/analytics
router.get('/resumes/:id/analytics', authMiddleware, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resume = db.getResumeById(req.params.id);

  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }

  if (resume.userId !== user._id) {
    res.status(403).json({ error: 'Forbidden: You do not have access to analytics for this resume' });
    return;
  }

  const analytics = db.getAnalytics(resume._id);
  if (!analytics) {
    res.status(404).json({ error: 'Failed to aggregate analytics' });
    return;
  }

  res.json(analytics);
});

// -------------------------------------------------------------
// Public Resume API (PRD Section 13, 14 & 21)
// -------------------------------------------------------------

// Helper to map timezones to countries
const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
  // India & South Asia
  'Asia/Kolkata': 'India',
  'Asia/Calcutta': 'India',
  'Asia/Karachi': 'Pakistan',
  'Asia/Dhaka': 'Bangladesh',
  'Asia/Kathmandu': 'Nepal',
  'Asia/Colombo': 'Sri Lanka',
  // Middle East
  'Asia/Dubai': 'United Arab Emirates',
  'Asia/Abu_Dhabi': 'United Arab Emirates',
  'Asia/Muscat': 'Oman',
  'Asia/Riyadh': 'Saudi Arabia',
  'Asia/Qatar': 'Qatar',
  // East & SE Asia
  'Asia/Singapore': 'Singapore',
  'Asia/Tokyo': 'Japan',
  'Asia/Seoul': 'South Korea',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Taipei': 'Taiwan',
  'Asia/Shanghai': 'China',
  'Asia/Beijing': 'China',
  'Asia/Chongqing': 'China',
  'Asia/Urumqi': 'China',
  'Asia/Bangkok': 'Thailand',
  'Asia/Jakarta': 'Indonesia',
  'Asia/Kuala_Lumpur': 'Malaysia',
  'Asia/Manila': 'Philippines',
  'Asia/Ho_Chi_Minh': 'Vietnam',
  // Europe
  'Europe/London': 'United Kingdom',
  'Europe/Belfast': 'United Kingdom',
  'Europe/Berlin': 'Germany',
  'Europe/Frankfurt': 'Germany',
  'Europe/Munich': 'Germany',
  'Europe/Paris': 'France',
  'Europe/Rome': 'Italy',
  'Europe/Milan': 'Italy',
  'Europe/Madrid': 'Spain',
  'Europe/Amsterdam': 'Netherlands',
  'Europe/Dublin': 'Ireland',
  'Europe/Stockholm': 'Sweden',
  'Europe/Zurich': 'Switzerland',
  'Europe/Geneva': 'Switzerland',
  'Europe/Vienna': 'Austria',
  'Europe/Brussels': 'Belgium',
  'Europe/Warsaw': 'Poland',
  'Europe/Oslo': 'Norway',
  'Europe/Helsinki': 'Finland',
  'Europe/Copenhagen': 'Denmark',
  'Europe/Lisbon': 'Portugal',
  'Europe/Athens': 'Greece',
  'Europe/Prague': 'Czech Republic',
  // North America
  'America/New_York': 'United States',
  'America/Detroit': 'United States',
  'America/Chicago': 'United States',
  'America/Los_Angeles': 'United States',
  'America/Denver': 'United States',
  'America/Phoenix': 'United States',
  'America/Indianapolis': 'United States',
  'America/Boise': 'United States',
  'America/Anchorage': 'United States',
  'Pacific/Honolulu': 'United States',
  'America/Toronto': 'Canada',
  'America/Vancouver': 'Canada',
  'America/Montreal': 'Canada',
  'America/Edmonton': 'Canada',
  'America/Winnipeg': 'Canada',
  'America/Calgary': 'Canada',
  // Oceania
  'Australia/Sydney': 'Australia',
  'Australia/Melbourne': 'Australia',
  'Australia/Brisbane': 'Australia',
  'Australia/Perth': 'Australia',
  'Australia/Adelaide': 'Australia',
  'Pacific/Auckland': 'New Zealand',
  // Latin America
  'America/Sao_Paulo': 'Brazil',
  'America/Mexico_City': 'Mexico',
  'America/Cancun': 'Mexico',
  'America/Argentina/Buenos_Aires': 'Argentina',
  'America/Santiago': 'Chile',
  'America/Bogota': 'Colombia',
  // Africa
  'Africa/Johannesburg': 'South Africa',
  'Africa/Cairo': 'Egypt',
  'Africa/Lagos': 'Nigeria',
  'Africa/Nairobi': 'Kenya',
};

const CODE_COUNTRY_MAP: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  AU: 'Australia',
  SG: 'Singapore',
  JP: 'Japan',
  KR: 'South Korea',
  AE: 'United Arab Emirates',
  NL: 'Netherlands',
  IE: 'Ireland',
  CH: 'Switzerland',
  SE: 'Sweden',
  ES: 'Spain',
  IT: 'Italy',
  BR: 'Brazil',
  MX: 'Mexico',
  NZ: 'New Zealand',
  ZA: 'South Africa',
};

// Helper to detect device, browser and country from request
function parseClientInfo(req: express.Request): { device: 'desktop' | 'mobile' | 'tablet'; browser: string; country: string } {
  const ua = ((req.headers['user-agent'] as string) || '').toLowerCase();
  let device: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  const clientDevice = (req.body?.device || req.headers['x-client-device']) as string;
  if (clientDevice === 'mobile' || clientDevice === 'tablet' || clientDevice === 'desktop') {
    device = clientDevice;
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device = 'tablet';
  } else if (/mobile|iphone|android|touch|webos|blackberry/i.test(ua)) {
    device = 'mobile';
  }

  let browser = (req.body?.browser || req.headers['x-client-browser']) as string || 'Chrome';
  if (!req.body?.browser && !req.headers['x-client-browser']) {
    if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/edg/i.test(ua)) browser = 'Edge';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';
    else browser = 'Chrome';
  }

  // Country resolution hierarchy:
  // 1. Explicit country passed in request body / header / query
  const explicitCountry = (req.body?.country || req.query?.country || req.headers['x-client-country']) as string;
  if (explicitCountry) {
    const upper = explicitCountry.toUpperCase();
    if (CODE_COUNTRY_MAP[upper]) return { device, browser, country: CODE_COUNTRY_MAP[upper] };
    return { device, browser, country: explicitCountry };
  }

  // 2. Cloudflare / CDN headers
  const headerCode = ((req.headers['cf-ipcountry'] || req.headers['x-country-code'] || req.headers['x-vercel-ip-country'] || req.headers['x-country']) as string || '').toUpperCase();
  if (headerCode && CODE_COUNTRY_MAP[headerCode]) {
    return { device, browser, country: CODE_COUNTRY_MAP[headerCode] };
  }

  // 3. Timezone mapping
  const timezone = (req.body?.timezone || req.query?.timezone || req.headers['x-client-timezone'] || req.headers['x-timezone']) as string;
  if (timezone && TIMEZONE_COUNTRY_MAP[timezone]) {
    return { device, browser, country: TIMEZONE_COUNTRY_MAP[timezone] };
  }

  // 4. Client locale / Accept-Language matching
  const acceptLang = ((req.headers['x-client-locale'] || req.headers['accept-language']) as string || '').toLowerCase();
  if (/[-_]in\b|hi\b/.test(acceptLang)) return { device, browser, country: 'India' };
  if (/[-_]gb\b|[-_]uk\b/.test(acceptLang)) return { device, browser, country: 'United Kingdom' };
  if (/[-_]ca\b/.test(acceptLang)) return { device, browser, country: 'Canada' };
  if (/[-_]au\b/.test(acceptLang)) return { device, browser, country: 'Australia' };
  if (/[-_]de\b/.test(acceptLang)) return { device, browser, country: 'Germany' };
  if (/[-_]fr\b/.test(acceptLang)) return { device, browser, country: 'France' };
  if (/[-_]jp\b/.test(acceptLang)) return { device, browser, country: 'Japan' };
  if (/[-_]us\b/.test(acceptLang)) return { device, browser, country: 'United States' };

  // 5. Intelligent default (India, matching active user / developer domain)
  return { device, browser, country: 'India' };
}

// POST /api/resumes/:id/passcode & PATCH /api/resumes/:id/passcode - Set or clear document passcode
const handlePasscode = (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resume = db.getResumeById(req.params.id);

  if (!resume) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  if (resume.userId !== user._id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { passcode, isPasscodeProtected } = req.body;
  const passcodeToSet = isPasscodeProtected === false ? null : (passcode || null);
  const updated = db.setPasscode(resume._id, passcodeToSet);
  res.json({
    success: true,
    message: passcodeToSet ? 'Passcode set successfully' : 'Passcode removed',
    resume: updated
  });
};

router.post('/resumes/:id/passcode', authMiddleware, requireAuth, handlePasscode);
router.patch('/resumes/:id/passcode', authMiddleware, requireAuth, handlePasscode);

// POST /api/resumes/:id/track-view - Dedicated endpoint to track when a PDF is opened / viewed / downloaded
router.post('/resumes/:id/track-view', (req, res) => {
  const resume = db.getResumeById(req.params.id);
  if (!resume) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const clientInfo = parseClientInfo(req);
  const versionId = (req.body?.versionId as string) || resume.publishedVersionId || undefined;
  const action = (req.body?.action as 'view' | 'download' | 'preview') || 'view';
  const durationSeconds = typeof req.body?.durationSeconds === 'number' ? req.body.durationSeconds : undefined;

  const view = db.recordView(resume._id, versionId, { ...clientInfo, action, durationSeconds });
  const analytics = db.getAnalytics(resume._id);

  res.json({
    success: true,
    view,
    viewId: view?._id,
    totalViews: analytics?.totalViews || 0,
    todayViews: analytics?.todayViews || 0,
    lastViewedAt: analytics?.lastViewedAt || null
  });
});

// POST /api/public/:username/:slug/view - Track public PDF view or download
router.post('/public/:username/:slug/view', (req, res) => {
  const { username, slug } = req.params;
  const user = db.getUserByUsername(username);
  if (!user) {
    res.status(404).json({ error: `User "${username}" does not exist` });
    return;
  }

  const resume = db.getResumeByUserAndSlug(user._id, slug);
  if (!resume) {
    res.status(404).json({ error: `Resume "${slug}" not found for user ${username}` });
    return;
  }

  const clientInfo = parseClientInfo(req);
  const versionId = (req.body?.versionId as string) || resume.publishedVersionId || undefined;
  const action = (req.body?.action as 'view' | 'download' | 'preview') || 'view';
  const durationSeconds = typeof req.body?.durationSeconds === 'number' ? req.body.durationSeconds : undefined;

  const view = db.recordView(resume._id, versionId, { ...clientInfo, action, durationSeconds });
  const analytics = db.getAnalytics(resume._id);

  res.json({
    success: true,
    view,
    viewId: view?._id,
    totalViews: analytics?.totalViews || 0,
    todayViews: analytics?.todayViews || 0,
    lastViewedAt: analytics?.lastViewedAt || null
  });
});

// -------------------------------------------------------------
// Failsafe Tracking System (PRD Section 11, 12, 13, 14, 15, 16)
// -------------------------------------------------------------

// POST /api/tracking/session - Initialize an idempotent tracking session once PDF renders
router.post('/tracking/session', (req: Request, res: Response) => {
  const { documentId, versionId, sessionId } = req.body;
  const clientInfo = parseClientInfo(req);

  if (!documentId || !sessionId) {
    res.status(400).json({ error: 'documentId and sessionId are required' });
    return;
  }

  const result = db.createTrackingSession({
    documentId,
    versionId,
    sessionId,
    device: clientInfo.device,
    browser: clientInfo.browser,
    country: clientInfo.country
  });

  res.json({
    success: true,
    sessionId,
    viewId: result.session?._id,
    created: result.created,
    trackingAllowed: result.trackingAllowed,
    isTrackingPaused: result.isTrackingPaused
  });
});

// POST /api/tracking/heartbeat - Idempotent heartbeat for active reading duration
router.post('/tracking/heartbeat', (req: Request, res: Response) => {
  const { sessionId, activeDurationSeconds } = req.body;

  if (!sessionId || typeof activeDurationSeconds !== 'number') {
    res.status(400).json({ error: 'sessionId and activeDurationSeconds are required' });
    return;
  }

  const result = db.recordHeartbeat(sessionId, activeDurationSeconds);
  res.json(result);
});

// POST /api/tracking/download - Record separate download event for session
router.post('/tracking/download', (req: Request, res: Response) => {
  const { sessionId, documentId, versionId } = req.body;

  if (!documentId) {
    res.status(400).json({ error: 'documentId is required' });
    return;
  }

  const result = db.recordDownload(sessionId || '', documentId, versionId || '');
  res.json(result);
});

// POST /api/tracking/beacon - Final exit synchronization via navigator.sendBeacon
router.post('/tracking/beacon', (req: Request, res: Response) => {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // ignore
    }
  }

  const sessionId = body?.sessionId;
  const activeDurationSeconds = typeof body?.activeDurationSeconds === 'number' 
    ? body.activeDurationSeconds 
    : (typeof body?.durationSeconds === 'number' ? body.durationSeconds : 0);

  if (sessionId && activeDurationSeconds > 0) {
    db.recordHeartbeat(sessionId, activeDurationSeconds);
  }

  res.status(200).send('ok');
});

// POST /api/public/:username/:slug/duration - Backward compatibility for duration telemetry
router.post('/public/:username/:slug/duration', (req, res) => {
  const { username, slug } = req.params;
  const { viewId, durationSeconds } = req.body;

  if (!viewId || typeof durationSeconds !== 'number') {
    res.status(400).json({ error: 'viewId and durationSeconds are required' });
    return;
  }

  const user = db.getUserByUsername(username);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const resume = db.getResumeByUserAndSlug(user._id, slug);
  if (!resume) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const ok = db.recordHeartbeat(viewId, durationSeconds).success || db.updateViewDuration(resume._id, viewId, durationSeconds);
  res.json({ success: ok });
});

// POST /api/public/:username/:slug/unlock - Unlock confidential document with PIN
router.post('/public/:username/:slug/unlock', (req, res) => {
  const rawUsername = req.params.username;
  const cleanUsername = rawUsername.replace(/^@/, '');
  const { slug } = req.params;
  const { passcode } = req.body;

  const user = db.getUserByUsername(cleanUsername) || db.getUserByUsername(rawUsername);
  if (!user) {
    res.status(404).json({ error: `User "@${cleanUsername}" does not exist` });
    return;
  }

  const resume = db.getResumeByUserAndSlug(user._id, slug);
  if (!resume) {
    res.status(404).json({ error: `Document "${slug}" not found for user @${cleanUsername}` });
    return;
  }

  if (!resume.isPasscodeProtected) {
    const publishedVersion = resume.publishedVersionId ? db.getVersionById(resume.publishedVersionId) : null;
    const safeFileUrl = `/api/public/${user.username}/${resume.slug}/file`;
    const cleanPublishedVersion = publishedVersion ? {
      ...publishedVersion,
      fileUrl: safeFileUrl
    } : null;

    res.json({
      success: true,
      resumeId: resume._id,
      shareToken: resume.shareToken,
      name: resume.name,
      slug: resume.slug,
      category: resume.category || 'resume',
      username: user.username,
      userFullName: user.displayName || user.name,
      userEmail: user.email,
      userAvatar: user.avatar,
      userProfession: user.profession || user.professionalHeadline || 'Professional',
      professionalHeadline: user.professionalHeadline,
      socialLinks: user.socialLinks || {
        linkedin: `https://linkedin.com/in/${user.username}`,
        github: `https://github.com/${user.username}`,
      },
      allowDownloads: resume.allowDownloads !== false,
      publishedVersion: cleanPublishedVersion,
      pdfUrl: safeFileUrl,
      downloadUrl: `/api/public/${user.username}/${resume.slug}/download`,
      totalViews: 0,
      trackingEnabled: resume.trackingEnabled !== false,
      isPasscodeProtected: false,
      isLocked: false,
      updatedAt: publishedVersion?.createdAt || resume.updatedAt || resume.createdAt
    });
    return;
  }

  const isValid = db.verifyPasscode(resume._id, passcode);
  if (!isValid) {
    res.status(401).json({ error: 'Incorrect PIN. Please verify and try again.' });
    return;
  }

  const publishedVersion = resume.publishedVersionId ? db.getVersionById(resume.publishedVersionId) : null;
  const safeFileUrl = `/api/public/${user.username}/${resume.slug}/file`;
  const cleanPublishedVersion = publishedVersion ? {
    ...publishedVersion,
    fileUrl: safeFileUrl
  } : null;

  res.json({
    success: true,
    resumeId: resume._id,
    shareToken: resume.shareToken,
    name: resume.name,
    slug: resume.slug,
    category: resume.category || 'resume',
    username: user.username,
    userFullName: user.displayName || user.name,
    userEmail: user.email,
    userAvatar: user.avatar,
    userProfession: user.profession || user.professionalHeadline || 'Professional',
    professionalHeadline: user.professionalHeadline,
    socialLinks: user.socialLinks || {
      linkedin: `https://linkedin.com/in/${user.username}`,
      github: `https://github.com/${user.username}`,
    },
    allowDownloads: resume.allowDownloads !== false,
    publishedVersion: cleanPublishedVersion,
    pdfUrl: safeFileUrl,
    downloadUrl: `/api/public/${user.username}/${resume.slug}/download`,
    totalViews: 0,
    trackingEnabled: resume.trackingEnabled !== false,
    trackingAllowed: db.isTrackingAllowed(user._id, resume._id),
    isPasscodeProtected: true,
    isLocked: false,
    updatedAt: publishedVersion?.createdAt || resume.updatedAt || resume.createdAt
  });
});

// GET /api/public/:username/:slug & GET /api/public/documents/:username/:slug
const handlePublicDocument = (req: Request, res: Response) => {
  const rawUsername = req.params.username;
  const cleanUsername = rawUsername.replace(/^@/, '');
  const { slug } = req.params;
  const user = db.getUserByUsername(cleanUsername) || db.getUserByUsername(rawUsername);

  if (!user) {
    res.status(404).json({ error: `User "@${cleanUsername}" does not exist` });
    return;
  }

  const resume = db.getResumeByUserAndSlug(user._id, slug);
  if (!resume) {
    res.status(404).json({ error: `Document "${slug}" not found for user @${cleanUsername}` });
    return;
  }

  if (!resume.publishedVersionId) {
    res.status(404).json({ 
      error: "This document isn't publicly available right now.",
      isPrivate: true,
      resumeName: resume.name,
      username: user.username,
      userFullName: user.displayName || user.name
    });
    return;
  }

  const publishedVersion = db.getVersionById(resume.publishedVersionId);
  if (!publishedVersion) {
    res.status(404).json({ error: 'Published version record could not be found' });
    return;
  }

  // Check if passcode protected (PRD Section 17: Never leak bytes or URL before PIN validation)
  const passcodeProvided = (req.headers['x-document-passcode'] || req.query.passcode || req.query.pin) as string;
  const isPasscodeVerified = !resume.isPasscodeProtected || (passcodeProvided && db.verifyPasscode(resume._id, passcodeProvided));

  if (resume.isPasscodeProtected && !isPasscodeVerified) {
    if (passcodeProvided) {
      res.status(401).json({ error: 'Incorrect PIN. Please verify and try again.', isPasscodeProtected: true });
      return;
    }
    res.json({
      resumeId: resume._id,
      shareToken: resume.shareToken,
      name: resume.name,
      slug: resume.slug,
      category: resume.category || 'resume',
      username: user.username,
      userFullName: user.displayName || user.name,
      userEmail: user.email,
      userAvatar: user.avatar,
      userProfession: user.profession || user.professionalHeadline || 'Professional',
      professionalHeadline: user.professionalHeadline,
      isPasscodeProtected: true,
      isLocked: true,
      allowDownloads: resume.allowDownloads !== false,
      trackingEnabled: resume.trackingEnabled !== false
    });
    return;
  }

  const trackingAllowed = db.isTrackingAllowed(user._id, resume._id);
  const safeFileUrl = `/api/public/${user.username}/${resume.slug}/file`;
  const cleanPublishedVersion = {
    ...publishedVersion,
    fileUrl: safeFileUrl
  };

  res.json({
    resumeId: resume._id,
    shareToken: resume.shareToken,
    name: resume.name,
    slug: resume.slug,
    category: resume.category || 'resume',
    username: user.username,
    userFullName: user.displayName || user.name,
    userEmail: user.email,
    userAvatar: user.avatar,
    userProfession: user.profession || user.professionalHeadline || 'Professional',
    professionalHeadline: user.professionalHeadline,
    socialLinks: user.socialLinks || {
      linkedin: `https://linkedin.com/in/${user.username}`,
      github: `https://github.com/${user.username}`,
    },
    allowDownloads: resume.allowDownloads !== false,
    downloadAllowed: resume.allowDownloads !== false,
    publishedVersion: cleanPublishedVersion,
    pdfUrl: safeFileUrl,
    downloadUrl: `/api/public/${user.username}/${resume.slug}/download`,
    totalViews: 0,
    trackingEnabled: resume.trackingEnabled !== false,
    trackingAllowed,
    isPasscodeProtected: !!resume.isPasscodeProtected,
    isLocked: false,
    updatedAt: publishedVersion.createdAt || resume.updatedAt || resume.createdAt
  });
};

// Public document streaming handlers (Bug #9 & Trackd secure PDF delivery)
const handlePublicDocumentStream = async (req: Request, res: Response) => {
  const rawUsername = req.params.username;
  const cleanUsername = rawUsername.replace(/^@/, '');
  const { slug } = req.params;
  const user = db.getUserByUsername(cleanUsername) || db.getUserByUsername(rawUsername);
  if (!user) {
    res.status(404).type('text/plain').send('User not found');
    return;
  }
  const resume = db.getResumeByUserAndSlug(user._id, slug);
  if (!resume || !resume.publishedVersionId) {
    res.status(404).type('text/plain').send('Document not found or unpublished');
    return;
  }

  const passcodeProvided = (req.headers['x-document-passcode'] || req.query.passcode || req.query.pin) as string;
  if (resume.isPasscodeProtected && (!passcodeProvided || !db.verifyPasscode(resume._id, passcodeProvided))) {
    res.status(401).type('text/plain').send('Access denied: PIN required');
    return;
  }

  const isDownload = req.path.endsWith('/download') || req.query.download === 'true';
  if (isDownload && resume.allowDownloads === false) {
    res.status(403).type('text/plain').send('Downloads are disabled for this document');
    return;
  }

  if (isDownload) {
    db.recordDownload('', resume._id, resume.publishedVersionId);
  }

  req.params.id = resume._id;
  req.params.versionId = resume.publishedVersionId;
  return handleStreamVersionFile(req, res);
};

// Clean Token View Handlers (/view/:token)
const handleViewDocumentMetadata = (req: Request, res: Response) => {
  const token = req.params.token;
  const resume = db.getResumeByShareToken(token) || db.getResumeById(token);
  if (!resume) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  if (!resume.publishedVersionId) {
    res.status(404).json({ 
      error: "This document isn't publicly available right now.",
      isPrivate: true,
      resumeName: resume.name
    });
    return;
  }

  const user = db.getUserById(resume.userId);
  const publishedVersion = db.getVersionById(resume.publishedVersionId);
  if (!publishedVersion) {
    res.status(404).json({ error: 'Published version record could not be found' });
    return;
  }

  const passcodeProvided = (req.headers['x-document-passcode'] || req.query.passcode || req.query.pin) as string;
  const isPasscodeVerified = !resume.isPasscodeProtected || (passcodeProvided && db.verifyPasscode(resume._id, passcodeProvided));

  if (resume.isPasscodeProtected && !isPasscodeVerified) {
    if (passcodeProvided) {
      res.status(401).json({ error: 'Incorrect PIN. Please verify and try again.', isPasscodeProtected: true });
      return;
    }
    res.json({
      resumeId: resume._id,
      shareToken: resume.shareToken,
      name: resume.name,
      slug: resume.slug,
      category: resume.category || 'resume',
      username: user?.username || 'user',
      userFullName: user?.displayName || user?.name || 'Trackd User',
      userAvatar: user?.avatar,
      userProfession: user?.profession || 'Professional',
      isPasscodeProtected: true,
      isLocked: true,
      allowDownloads: resume.allowDownloads !== false,
      trackingEnabled: resume.trackingEnabled !== false
    });
    return;
  }

  const trackingAllowed = db.isTrackingAllowed(resume.userId, resume._id);
  const cleanToken = resume.shareToken || resume._id;
  const safeFileUrl = `/api/view/${cleanToken}/file`;
  const cleanPublishedVersion = {
    _id: publishedVersion._id,
    resumeId: publishedVersion.resumeId,
    versionNumber: publishedVersion.versionNumber,
    versionLabel: publishedVersion.versionLabel,
    fileName: publishedVersion.fileName,
    fileSize: publishedVersion.fileSize,
    fileUrl: safeFileUrl,
    commitMessage: publishedVersion.commitMessage,
    createdAt: publishedVersion.createdAt,
    isPublished: true
  };

  res.json({
    success: true,
    resumeId: resume._id,
    shareToken: cleanToken,
    name: resume.name,
    slug: resume.slug,
    category: resume.category || 'resume',
    username: user?.username || 'user',
    userFullName: user?.displayName || user?.name || 'Trackd User',
    userEmail: user?.email,
    userAvatar: user?.avatar,
    userProfession: user?.profession || 'Professional',
    professionalHeadline: user?.professionalHeadline,
    socialLinks: user?.socialLinks,
    allowDownloads: resume.allowDownloads !== false,
    downloadAllowed: resume.allowDownloads !== false,
    publishedVersion: cleanPublishedVersion,
    pdfUrl: safeFileUrl,
    downloadUrl: `/api/view/${cleanToken}/download`,
    totalViews: 0,
    trackingEnabled: resume.trackingEnabled !== false,
    trackingAllowed,
    isPasscodeProtected: !!resume.isPasscodeProtected,
    isLocked: false,
    updatedAt: publishedVersion.createdAt || resume.updatedAt || resume.createdAt
  });
};

const handleViewDocumentUnlock = (req: Request, res: Response) => {
  const token = req.params.token;
  const { passcode } = req.body;
  const resume = db.getResumeByShareToken(token) || db.getResumeById(token);
  if (!resume) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  if (resume.isPasscodeProtected) {
    const isValid = db.verifyPasscode(resume._id, passcode);
    if (!isValid) {
      res.status(401).json({ error: 'Incorrect PIN. Please verify and try again.' });
      return;
    }
  }

  req.query.passcode = passcode;
  return handleViewDocumentMetadata(req, res);
};

const handleViewDocumentStream = async (req: Request, res: Response) => {
  const token = req.params.token;
  const resume = db.getResumeByShareToken(token) || db.getResumeById(token);
  if (!resume || !resume.publishedVersionId) {
    res.status(404).type('text/plain').send('Document not found or unpublished');
    return;
  }

  const passcodeProvided = (req.headers['x-document-passcode'] || req.query.passcode || req.query.pin) as string;
  if (resume.isPasscodeProtected && (!passcodeProvided || !db.verifyPasscode(resume._id, passcodeProvided))) {
    res.status(401).type('text/plain').send('Access denied: PIN required');
    return;
  }

  const isDownload = req.path.endsWith('/download') || req.query.download === 'true';
  if (isDownload && resume.allowDownloads === false) {
    res.status(403).type('text/plain').send('Downloads are disabled for this document');
    return;
  }

  if (isDownload) {
    db.recordDownload('', resume._id, resume.publishedVersionId);
  }

  req.params.id = resume._id;
  req.params.versionId = resume.publishedVersionId;
  return handleStreamVersionFile(req, res);
};

router.get('/view/:token', handleViewDocumentMetadata);
router.post('/view/:token/unlock', handleViewDocumentUnlock);
router.get('/view/:token/file', handleViewDocumentStream);
router.get('/view/:token/pdf', handleViewDocumentStream);
router.get('/view/:token/download', handleViewDocumentStream);

router.get('/public/:username/:slug/file', handlePublicDocumentStream);
router.get('/public/:username/:slug/pdf', handlePublicDocumentStream);
router.get('/public/:username/:slug/download', handlePublicDocumentStream);
router.get('/public/documents/:username/:slug/file', handlePublicDocumentStream);
router.get('/public/documents/:username/:slug/download', handlePublicDocumentStream);

router.get('/public/:username/:slug', handlePublicDocument);
router.get('/public/documents/:username/:slug', handlePublicDocument);

// GET /api/integrations/status - Reports integration state of Cloudinary & MongoDB
router.get('/integrations/status', async (_req, res) => {
  const cldConfigured = isCloudinaryConfigured();
  const mongoConfigured = isMongoConfigured();
  const mongoConnected = isMongoConnected();

  // Trigger mongo lazy connection test if configured
  let liveMongo = mongoConnected;
  if (mongoConfigured && !mongoConnected) {
    const db = await getMongoDb();
    liveMongo = Boolean(db);
  }

  const diagnostics = getMongoDiagnostics();

  res.json({
    cloudinary: {
      configured: cldConfigured,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL ? 'configured via URL' : null),
      status: cldConfigured ? 'ready' : 'awaiting_credentials'
    },
    mongodb: {
      configured: mongoConfigured,
      connected: liveMongo,
      database: diagnostics.database,
      status: liveMongo ? 'connected' : (diagnostics.lastErrorCode === 'ATLAS_IP_RESTRICTED' ? 'ip_restricted' : (mongoConfigured ? 'fallback_active' : 'awaiting_connection_string')),
      notice: diagnostics.lastErrorReason || (liveMongo ? 'Connected to MongoDB' : (mongoConfigured ? 'Using resilient local storage fallback' : 'Configure MONGODB_URI to enable persistent MongoDB Atlas storage'))
    }
  });
});

export default router;
