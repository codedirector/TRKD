import type { 
  Resume, 
  ResumeVersion, 
  AnalyticsSummary, 
  PublicResumeData, 
  User, 
  DocumentCategory, 
  PlanType,
  SubscriptionCycle,
  CloneResumeParams,
  ContributionStats
} from './types';

// Helper to gather device, timezone, locale and country headers for accurate analytics
export function getClientTrackingHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) headers['x-client-timezone'] = tz;
    
    // Detect country from timezone
    if (tz) {
      if (/Asia\/(Kolkata|Calcutta)/i.test(tz)) headers['x-client-country'] = 'India';
      else if (/America\/(New_York|Chicago|Los_Angeles|Denver|Phoenix|Detroit|Indianapolis)/i.test(tz)) headers['x-client-country'] = 'United States';
      else if (/Europe\/(London|Belfast)/i.test(tz)) headers['x-client-country'] = 'United Kingdom';
      else if (/America\/(Toronto|Vancouver|Montreal|Edmonton|Winnipeg|Calgary)/i.test(tz)) headers['x-client-country'] = 'Canada';
      else if (/Europe\/(Berlin|Frankfurt|Munich)/i.test(tz)) headers['x-client-country'] = 'Germany';
      else if (/Australia\/(Sydney|Melbourne|Brisbane|Perth|Adelaide)/i.test(tz)) headers['x-client-country'] = 'Australia';
      else if (/Asia\/Singapore/i.test(tz)) headers['x-client-country'] = 'Singapore';
      else if (/Asia\/Tokyo/i.test(tz)) headers['x-client-country'] = 'Japan';
      else if (/Asia\/(Dubai|Abu_Dhabi)/i.test(tz)) headers['x-client-country'] = 'United Arab Emirates';
    }

    if (navigator.language) {
      headers['x-client-locale'] = navigator.language;
      if (!headers['x-client-country']) {
        if (/[-_]in\b|hi/i.test(navigator.language)) headers['x-client-country'] = 'India';
        else if (/[-_]us\b/i.test(navigator.language)) headers['x-client-country'] = 'United States';
        else if (/[-_](gb|uk)\b/i.test(navigator.language)) headers['x-client-country'] = 'United Kingdom';
        else if (/[-_]ca\b/i.test(navigator.language)) headers['x-client-country'] = 'Canada';
        else if (/[-_]au\b/i.test(navigator.language)) headers['x-client-country'] = 'Australia';
      }
    }

    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      headers['x-client-device'] = 'tablet';
    } else if (/mobile|iphone|android|touch/i.test(ua)) {
      headers['x-client-device'] = 'mobile';
    } else {
      headers['x-client-device'] = 'desktop';
    }
  } catch (e) {
    console.debug('Tracking headers error:', e);
  }
  return headers;
}

class ApiClient {
  private token: string | null = typeof window !== 'undefined' ? localStorage.getItem('trackd_token') : null;
  private userId: string | null = typeof window !== 'undefined' ? localStorage.getItem('trackd_user_id') : null;
  private userMetadata: { displayName?: string; email?: string; avatar?: string } | null = null;

  public setAuth(
    token: string | null,
    userId?: string | null,
    metadata?: { displayName?: string; email?: string; avatar?: string } | null
  ) {
    this.token = token;
    this.userId = userId || token;
    if (metadata) {
      this.userMetadata = metadata;
    }
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('trackd_token', token);
        if (this.userId) localStorage.setItem('trackd_user_id', this.userId);
      } else {
        localStorage.removeItem('trackd_token');
        localStorage.removeItem('trackd_user_id');
      }
    }
  }

  public clearAuth() {
    this.setAuth(null, null);
    this.userMetadata = null;
  }

  public getUserId(): string | null {
    return this.userId;
  }

  public getToken(): string {
    return this.token || '';
  }

  public setToken(token: string) {
    this.setAuth(token);
  }
  public clearToken() {
    this.clearAuth();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      headers['x-auth-token'] = this.token;
    }
    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }
    if (!this.token && !this.userId) {
      headers['x-guest'] = 'true';
    }
    return headers;
  }

  // Native Auth Methods
  async signUp(data: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sign up');
    }
    const result = await res.json();
    if (result.token) {
      this.setAuth(result.token, result.user?._id, {
        displayName: result.user?.displayName,
        email: result.user?.email,
        avatar: result.user?.avatar
      });
    }
    return result;
  }

  async signIn(data: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sign in');
    }
    const result = await res.json();
    if (result.token) {
      this.setAuth(result.token, result.user?._id, {
        displayName: result.user?.displayName,
        email: result.user?.email,
        avatar: result.user?.avatar
      });
    }
    return result;
  }

  async signInWithGoogle(data?: {
    email?: string;
    name?: string;
    avatar?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {})
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Google login failed');
    }
    const result = await res.json();
    if (result.token) {
      this.setAuth(result.token, result.user?._id, {
        displayName: result.user?.displayName,
        email: result.user?.email,
        avatar: result.user?.avatar
      });
    }
    return result;
  }

  // Profile Sync
  async syncUser(data: Partial<User>): Promise<User> {
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sync user');
    }
    const result = await res.json();
    if (result.token) {
      this.setAuth(result.token, result.user?._id);
    }
    return result.user;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', { headers: this.getHeaders() });
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  }

  async completeFirstTimeSetup(profile: { username: string; name: string; avatar?: string }): Promise<{ user: User; success: boolean }> {
    const res = await fetch('/api/auth/first-time-setup', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save setup');
    }
    return res.json();
  }

  async updateUserProfile(profile: {
    name?: string;
    username?: string;
    avatar?: string;
    profession?: string;
    socialLinks?: import('./types').UserSocialLinks;
  }): Promise<{ user: User; success: boolean }> {
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  }

  async uploadAvatar(file: File): Promise<{ user: User; avatarUrl: string; success: boolean }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/users/avatar', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to upload avatar' }));
      throw new Error(err.error || 'Failed to upload avatar');
    }

    return res.json();
  }

  async removeAvatar(): Promise<{ user: User; avatarUrl: string; success: boolean }> {
    const res = await fetch('/api/users/avatar', {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to remove avatar' }));
      throw new Error(err.error || 'Failed to remove avatar');
    }

    return res.json();
  }

  async toggleTrial(state: 'active' | 'expired' | 'pro'): Promise<{ user: User; success: boolean }> {
    const res = await fetch('/api/users/toggle-trial', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ state })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to toggle trial state');
    }
    return res.json();
  }

  async createRazorpayOrder(cycle: SubscriptionCycle = 'monthly'): Promise<{ 
    orderId: string; 
    amount: number; 
    currency: string; 
    plan: PlanType; 
    cycle: SubscriptionCycle;
    keyId?: string;
    isSandbox?: boolean;
  }> {
    const res = await fetch('/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ cycle })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to initialize payment');
    }
    return res.json();
  }

  async verifyRazorpayPayment(
    orderId: string, 
    paymentId: string, 
    plan: PlanType = 'PRO', 
    cycle?: SubscriptionCycle,
    signature?: string,
    isSandbox?: boolean
  ): Promise<{ success: boolean; user: User; message: string }> {
    const res = await fetch('/api/payments/razorpay/verify', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ orderId, paymentId, plan, cycle, signature, isSandbox })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to verify payment');
    }
    return res.json();
  }

  async listUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users');
    if (!res.ok) return [];
    const data = await res.json();
    return data.users;
  }

  async updateUserPlan(plan: PlanType): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/users/plan', {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ plan })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update plan');
    }
    return res.json();
  }

  async getUserSubscription(): Promise<{
    user: User;
    plan: PlanType;
    isPro: boolean;
    subscriptionStatus: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    subscriptionCancelledAt?: string | null;
    trialEndsAt?: string;
    activeSubscription: import('./types').Subscription | null;
    allSubscriptions: import('./types').Subscription[];
  }> {
    const res = await fetch('/api/user/subscription', { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch subscription status');
    }
    return res.json();
  }

  async cancelSubscription(): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch('/api/user/subscription/cancel', {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to cancel subscription' }));
      throw new Error(err.error || 'Failed to cancel subscription');
    }
    return res.json();
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; resetCode?: string; code?: string; expiresInMinutes?: number }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to request password reset' }));
      throw new Error(err.error || 'Failed to request password reset');
    }
    return res.json();
  }

  async resetPassword(params: { email: string; newPassword: string; resetCode?: string; code?: string }): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to reset password' }));
      throw new Error(err.error || 'Failed to reset password');
    }
    const data = await res.json();
    if (data.token && data.user) {
      this.setAuth(data.token, data.user._id, {
        displayName: data.user.displayName,
        email: data.user.email,
        avatar: data.user.avatar
      });
    }
    return data;
  }

  // Resumes / Documents
  async getResumes(): Promise<Resume[]> {
    if (!this.token && !this.userId) return [];
    try {
      const res = await fetch('/api/resumes', { headers: this.getHeaders() });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) return [];
        return [];
      }
      return res.json();
    } catch {
      return [];
    }
  }

  async getResume(id: string): Promise<(Resume & { versions: ResumeVersion[] }) | null> {
    try {
      const res = await fetch(`/api/resumes/${id}`, { headers: this.getHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async createResume(name: string, slug: string, category: DocumentCategory = 'resume'): Promise<Resume> {
    const res = await fetch('/api/resumes', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, slug, category })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create resume');
    }
    return res.json();
  }


  async deleteResume(id: string): Promise<void> {
    const res = await fetch(`/api/resumes/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete resume');
    }
  }

  // Clone document repository
  async cloneResume(id: string, params: CloneResumeParams = {}): Promise<Resume> {
    const res = await fetch(`/api/resumes/${id}/clone`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to clone repository');
    }
    const data = await res.json();
    return data.resume || data;
  }

  // User Activity Contribution Grid
  async getUserContributions(): Promise<ContributionStats> {
    const res = await fetch('/api/user/contributions', {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch contribution activity');
    }
    return res.json();
  }

  // Versions
  async getVersions(resumeId: string): Promise<ResumeVersion[]> {
    const res = await fetch(`/api/resumes/${resumeId}/versions`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
  }

  async uploadVersion(resumeId: string, formData: FormData): Promise<ResumeVersion> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      headers['x-auth-token'] = this.token;
    }
    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }
    const res = await fetch(`/api/resumes/${resumeId}/versions`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload resume version');
    }
    return res.json();
  }

  // Publishing
  async publishVersion(resumeId: string, versionId: string): Promise<{ success: boolean; message?: string; resume: Resume }> {
    const res = await fetch(`/api/resumes/${resumeId}/publish`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ versionId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to publish version');
    }
    return res.json();
  }

  async unpublishResume(resumeId: string): Promise<{ success: boolean; resume: Resume }> {
    const res = await fetch(`/api/resumes/${resumeId}/unpublish`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to unpublish resume');
    }
    return res.json();
  }

  // Revert / Rollback to a historical version as a new commit
  async revertVersion(resumeId: string, versionId: string): Promise<{ success: boolean; message?: string; version: ResumeVersion; resume: Resume }> {
    const res = await fetch(`/api/resumes/${resumeId}/revert/${versionId}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to revert to version');
    }
    return res.json();
  }

  // Gemini AI: Suggest Git Commit Message
  async suggestCommitMessage(options: {
    resumeName?: string;
    category?: string;
    versionLabel?: string;
    userNotes?: string;
    previousCommit?: string;
  }): Promise<string> {
    try {
      const res = await fetch('/api/ai/suggest-commit', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(options)
      });
      if (!res.ok) {
        return 'feat(revision): update document structure and content';
      }
      const data = await res.json();
      return data.commitMessage || 'feat(revision): update document structure and content';
    } catch {
      return 'feat(revision): update document structure and content';
    }
  }

  // Gemini AI: Version Diff Analysis
  async analyzeVersionDiff(options: {
    documentName: string;
    versionA: { versionLabel: string; commitMessage: string; date?: string };
    versionB: { versionLabel: string; commitMessage: string; date?: string };
    notes?: string;
  }): Promise<{ summary: string; highlights: string[]; recommendations: string[] }> {
    const res = await fetch('/api/ai/analyze-diff', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(options)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to analyze version diff');
    }
    return res.json();
  }

  // Passcode Protection for Confidential Proposals & Decks
  async setPasscode(resumeId: string, passcode: string | null): Promise<{ success: boolean; message: string; resume: Resume }> {
    const res = await fetch(`/api/resumes/${resumeId}/passcode`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ passcode })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update passcode');
    }
    return res.json();
  }

  // Analytics
  async getAnalytics(resumeId: string): Promise<AnalyticsSummary> {
    const trackingHeaders = getClientTrackingHeaders();
    const res = await fetch(`/api/resumes/${resumeId}/analytics`, { 
      headers: { ...this.getHeaders(), ...trackingHeaders } 
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch resume analytics');
    }
    return res.json();
  }

  // Track View (PDF Opened, Downloaded, or Viewed)
  async trackView(
    resumeId: string, 
    versionId?: string, 
    action: 'view' | 'download' | 'preview' | 'open_pdf' = 'open_pdf',
    durationSeconds?: number
  ): Promise<{ success: boolean; totalViews: number; lastViewedAt: string | null; viewId?: string }> {
    try {
      const trackingHeaders = getClientTrackingHeaders();
      const res = await fetch(`/api/resumes/${resumeId}/track-view`, {
        method: 'POST',
        headers: { ...this.getHeaders(), ...trackingHeaders },
        body: JSON.stringify({ versionId, action: action === 'open_pdf' ? 'view' : action, durationSeconds })
      });
      if (!res.ok) {
        return { success: false, totalViews: 0, lastViewedAt: null };
      }
      return res.json();
    } catch {
      return { success: false, totalViews: 0, lastViewedAt: null };
    }
  }

  // Public Resume
  async getPublicResume(username: string, slug: string, passcode?: string): Promise<PublicResumeData> {
    const trackingHeaders = getClientTrackingHeaders();
    const headers: Record<string, string> = { ...trackingHeaders };
    if (passcode) {
      headers['x-document-passcode'] = passcode;
    }
    const res = await fetch(`/api/public/${username}/${slug}`, {
      headers
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Public resume not found');
    }
    return res.json();
  }

  // Get public document by secure clean token (/view/:token)
  async getResumeByToken(token: string, passcode?: string): Promise<PublicResumeData> {
    const trackingHeaders = getClientTrackingHeaders();
    const headers: Record<string, string> = { ...trackingHeaders };
    if (passcode) {
      headers['x-document-passcode'] = passcode;
    }
    const res = await fetch(`/api/view/${token}`, {
      headers
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Document not found');
    }
    return res.json();
  }

  // Unlock document by secure clean token with passcode/PIN
  async unlockResumeByToken(token: string, passcode: string): Promise<PublicResumeData> {
    const res = await fetch(`/api/view/${token}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Incorrect passcode');
    }
    return res.json();
  }

  // Unlock confidential public resume with passcode/PIN
  async unlockPublicResume(username: string, slug: string, passcode: string): Promise<PublicResumeData> {
    const res = await fetch(`/api/public/${username}/${slug}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Incorrect passcode');
    }
    return res.json();
  }

  // Track public view or download
  async trackPublicView(
    username: string, 
    slug: string, 
    versionId?: string,
    action: 'view' | 'download' | 'preview' = 'view',
    durationSeconds?: number
  ): Promise<{ success: boolean; totalViews: number; lastViewedAt: string | null; viewId?: string }> {
    try {
      const trackingHeaders = getClientTrackingHeaders();
      const res = await fetch(`/api/public/${username}/${slug}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...trackingHeaders },
        body: JSON.stringify({ versionId, action, durationSeconds })
      });
      if (!res.ok) return { success: false, totalViews: 0, lastViewedAt: null };
      return res.json();
    } catch {
      return { success: false, totalViews: 0, lastViewedAt: null };
    }
  }

  // Reading Duration Telemetry Beacon
  async trackDuration(
    username: string,
    slug: string,
    viewId: string,
    durationSeconds: number
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/public/${username}/${slug}/duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewId, durationSeconds }),
        keepalive: true // Allows beacon transmission during unload
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // PRD Section 4: Exact Document Version Resolution (fixes preview bug)
  async getExactVersion(documentId: string, versionId: string): Promise<ResumeVersion> {
    const res = await fetch(`/api/documents/${documentId}/versions/${versionId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      // Fallback to resumes path
      const fallback = await fetch(`/api/resumes/${documentId}/versions/${versionId}`, {
        headers: this.getHeaders()
      });
      if (!fallback.ok) {
        throw new Error('Failed to load document version');
      }
      return fallback.json();
    }
    return res.json();
  }

  // PRD Section 11 & 12: Idempotent Tracking Session
  async startTrackingSession(data: {
    documentId: string;
    versionId: string;
    sessionId: string;
  }): Promise<{ success: boolean; sessionId: string; viewId?: string; trackingAllowed: boolean; isTrackingPaused: boolean }> {
    try {
      const trackingHeaders = getClientTrackingHeaders();
      const res = await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...trackingHeaders },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        return { success: false, sessionId: data.sessionId, trackingAllowed: false, isTrackingPaused: false };
      }
      return res.json();
    } catch {
      return { success: false, sessionId: data.sessionId, trackingAllowed: false, isTrackingPaused: false };
    }
  }

  // PRD Section 13 & 14: Validated Active Duration Heartbeat
  async sendHeartbeat(sessionId: string, activeDurationSeconds: number): Promise<{ success: boolean; durationSeconds: number }> {
    try {
      const res = await fetch('/api/tracking/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, activeDurationSeconds }),
        keepalive: true
      });
      if (!res.ok) return { success: false, durationSeconds: activeDurationSeconds };
      return res.json();
    } catch {
      return { success: false, durationSeconds: activeDurationSeconds };
    }
  }

  // PRD Section 15: Download Event Tracking
  async recordDownloadEvent(sessionId: string, documentId: string, versionId: string): Promise<void> {
    try {
      await fetch('/api/tracking/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, documentId, versionId })
      });
    } catch {
      // Non-blocking
    }
  }

  // PRD Section 13: Beacon Exit Sync
  sendBeaconExit(sessionId: string, activeDurationSeconds: number): boolean {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify({ sessionId, activeDurationSeconds })], { type: 'application/json' });
        return navigator.sendBeacon('/api/tracking/beacon', blob);
      } catch {
        return false;
      }
    }
    return false;
  }
}

export const api = new ApiClient();
