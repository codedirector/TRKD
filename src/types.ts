export type PlanType = 'TRIAL' | 'FREE' | 'PRO';

export type SubscriptionStatus = 'TRIAL' | 'FREE' | 'ACTIVE' | 'CANCELED' | 'EXPIRED';

export type TrialStatus = 'active' | 'expired' | 'none';

export type SubscriptionCycle = 'monthly' | 'six_month' | 'yearly' | 'launch_offer';

export type DocumentCategory = 'resume' | 'cv' | 'portfolio' | 'proposal' | 'report' | 'other';

export interface UserSocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  other?: string;
  showLinkedin?: boolean;
  showGithub?: boolean;
  showPortfolio?: boolean;
  showContact?: boolean;
}

export interface User {
  _id: string; // Internal Trackd User ID
  clerkUserId?: string; // Authoritative Clerk User ID (user_...)
  username: string;
  displayName: string;
  name: string; // alias to displayName
  firstName?: string;
  lastName?: string;
  password?: string;
  professionalHeadline?: string;
  email: string;
  phone?: string;
  avatar?: string;
  profession?: string;
  socialLinks?: UserSocialLinks;
  plan: PlanType;
  trialEndsAt?: string;
  trialStatus?: TrialStatus;
  trialStartDate?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionId: string | null;
  subscriptionCycle?: SubscriptionCycle;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionCancelledAt?: string | null;
  cancelledAt?: string | null;
  resetPasswordCode?: string;
  resetPasswordExpiresAt?: string;
  needsFirstTimeSetup?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  userId: string;
  plan: PlanType;
  cycle: SubscriptionCycle;
  amount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  orderId?: string;
  paymentId?: string;
  startDate?: string;
  endDate?: string;
  startedAt: string;
  expiresAt: string;
  cancelledAt?: string | null;
  createdAt: string;
}

export function isUserPro(user: User | null | undefined): boolean {
  if (!user) return false;
  const now = Date.now();

  // If user has paid subscription
  if (user.plan === 'PRO' || user.subscriptionStatus === 'ACTIVE') {
    if (user.subscriptionEndDate) {
      return new Date(user.subscriptionEndDate).getTime() > now;
    }
    return true;
  }

  // If subscription was cancelled, user retains full Pro access until endDate
  if (user.subscriptionStatus === 'CANCELED' && user.subscriptionEndDate) {
    return new Date(user.subscriptionEndDate).getTime() > now;
  }

  // If on trial
  if (user.subscriptionStatus === 'TRIAL' || user.trialStatus === 'active' || user.plan === 'TRIAL') {
    if (!user.trialEndsAt) return true;
    return new Date(user.trialEndsAt).getTime() > now;
  }

  return false;
}

export function getTrialDaysRemaining(user: User | null | undefined): number {
  if (!user) return 0;
  const isTrial = user.subscriptionStatus === 'TRIAL' || user.trialStatus === 'active';
  if (!isTrial || !user.trialEndsAt) return 0;
  const diff = new Date(user.trialEndsAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  plan: PlanType;
  cycle: SubscriptionCycle;
  description?: string;
}

export interface DocumentItem {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  shareToken?: string;
  category: DocumentCategory;
  publishedVersionId: string | null;
  trackingEnabled: boolean;
  isPasscodeProtected?: boolean;
  passcode?: string;
  passcodeHash?: string; // Stored securely on server, never sent to client
  allowDownloads?: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed / expanded fields
  versionsCount?: number;
  latestVersion?: DocumentVersion | null;
  publishedVersion?: DocumentVersion | null;
  totalViews?: number;
  lastViewedAt?: string | null;
}

// Backward compatibility alias for Resume
export type Resume = DocumentItem;

export interface DocumentVersion {
  _id: string;
  documentId?: string; // alias to resumeId
  resumeId: string; // references DocumentItem / Resume ID
  ownerId?: string; // userId of creator
  versionNumber: number; // 1, 2, 3...
  versionLabel?: string; // "v1", "v2"...
  fileUrl: string;
  storageUrl?: string; // Internal storage URL (e.g. Cloudinary or local path) - never sent to client
  filePublicId: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  status?: string;
  commitMessage: string;
  createdAt: string;
  isPublished?: boolean;
}

// Backward compatibility alias for ResumeVersion
export type ResumeVersion = DocumentVersion;

export interface DocumentView {
  _id: string;
  documentId?: string;
  resumeId: string;
  versionId: string;
  sessionId?: string;
  userId?: string;
  startedAt?: string;
  lastHeartbeatAt?: string;
  durationSeconds?: number;
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  country: string;
  action?: 'view' | 'download' | 'preview';
  downloaded?: boolean;
  status?: 'active' | 'completed';
  timestamp: string;
}

// Backward compatibility alias for ResumeView
export type ResumeView = DocumentView;

export interface DailyViewData {
  date: string; // e.g. "Sep 4"
  fullDate: string; // e.g. "2026-09-04"
  views: number;
}

export interface VersionPerformanceData {
  versionId: string;
  versionLabel: string;
  versionNumber: number;
  commitMessage: string;
  views: number;
  isPublished: boolean;
  createdAt: string;
}

export interface LiveTelemetryEvent {
  id: string;
  type: 'view' | 'download';
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  country: string;
  timestamp: string;
  durationSeconds?: number;
  versionLabel?: string;
}

export interface AnalyticsSummary {
  resumeId: string;
  resumeName: string;
  slug: string;
  category: DocumentCategory;
  trackingEnabled: boolean;
  isLocked: boolean; // Tracking is paused when false/locked
  isTrackingPaused?: boolean;
  isAdvancedAnalyticsLocked?: boolean;
  pauseMessage?: string;
  plan: PlanType;
  trialStatus?: TrialStatus;
  trialDaysRemaining?: number;
  isPasscodeProtected?: boolean;
  totalViews: number;
  todayViews: number;
  weekViews: number;
  totalDownloads: number;
  downloadRate: number; // percentage
  avgDurationSeconds: number;
  durationBreakdown: { category: string; count: number; percentage: number }[];
  recentEvents: LiveTelemetryEvent[];
  publishedVersionLabel: string | null;
  lastViewedAt: string | null;
  dailyViews: DailyViewData[];
  versionPerformance: VersionPerformanceData[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  browserBreakdown: { browser: string; count: number; percentage: number }[];
  countryBreakdown: { country: string; count: number; percentage: number }[];
}

export interface PublicDocumentData {
  resumeId: string;
  shareToken?: string;
  viewId?: string;
  sessionId?: string;
  name: string;
  slug: string;
  category: DocumentCategory;
  username: string;
  userFullName: string;
  userEmail: string;
  userAvatar?: string;
  userProfession?: string;
  professionalHeadline?: string;
  socialLinks?: UserSocialLinks;
  allowDownloads?: boolean;
  downloadAllowed?: boolean;
  publishedVersion?: DocumentVersion;
  pdfUrl?: string;
  downloadUrl?: string;
  totalViews?: number;
  trackingEnabled: boolean;
  trackingAllowed?: boolean;
  isPasscodeProtected?: boolean;
  isLocked?: boolean;
  updatedAt?: string;
  isPrivate?: boolean;
  error?: string;
}

// Backward compatibility alias
export type PublicResumeData = PublicDocumentData;

export interface CloneResumeParams {
  name?: string;
  slug?: string;
  category?: DocumentCategory;
  branchMode?: 'all' | 'published_only';
}

export interface ContributionActivityItem {
  type: 'commit' | 'view' | 'create';
  title: string;
  resumeName: string;
  resumeId: string;
  timestamp: string;
  detail?: string;
}

export interface DayContribution {
  date: string; // YYYY-MM-DD
  total: number;
  commits: number;
  views: number;
  creates: number;
  level: 0 | 1 | 2 | 3 | 4;
  activities: ContributionActivityItem[];
}

export interface ContributionStats {
  totalContributions: number;
  totalCommits: number;
  totalViews: number;
  totalCreates: number;
  currentStreak: number;
  longestStreak: number;
  activeDaysCount: number;
  startDate: string;
  endDate: string;
  days: DayContribution[];
}
