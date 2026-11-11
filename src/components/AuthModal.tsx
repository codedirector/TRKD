import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone as PhoneIcon, 
  ArrowRight, 
  ArrowLeft,
  Eye, 
  EyeOff, 
  AlertCircle, 
  Check, 
  LogOut, 
  Loader2, 
  ShieldCheck,
  KeyRound,
  Copy,
  RefreshCw
} from 'lucide-react';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onUserChanged: (user: User | null, isNew?: boolean) => void;
  initialMode?: 'signin' | 'signup' | 'forgot' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUserChanged,
  initialMode = 'signup'
}) => {
  const { 
    signIn,
    signUp,
    signInWithGoogle,
    signOut 
  } = useAuth();

  // Mode: 'signin' | 'signup' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>(initialMode);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [activeGeneratedCode, setActiveGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setError(null);
      setSuccessNotice(null);
      if (currentUser?.email && !email) {
        setEmail(currentUser.email);
      }
    }
  }, [isOpen, initialMode, currentUser]);

  if (!isOpen) return null;

  // Google 1-Click Login (BUG-06)
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanEmail = email.trim();
      const user = await signInWithGoogle(cleanEmail ? {
        email: cleanEmail,
        name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || undefined
      } : undefined);
      onUserChanged(user, user.needsFirstTimeSetup);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Email + Password Submit (Sign In / Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 7) {
      setError('Password must be at least 7 characters long');
      return;
    }

    if (authMode === 'signup') {
      const cleanFirst = firstName.trim();
      if (!cleanFirst) {
        setError('First name is required');
        return;
      }
    }

    try {
      setLoading(true);
      const cleanFirst = firstName.trim();
      const cleanLast = lastName.trim();
      const cleanPhone = phone.trim();

      let user: User;
      if (authMode === 'signup') {
        user = await signUp({
          firstName: cleanFirst,
          lastName: cleanLast || undefined,
          email: cleanEmail,
          password,
          phone: cleanPhone || undefined
        });
      } else {
        user = await signIn({
          email: cleanEmail,
          password
        });
      }

      onUserChanged(user, authMode === 'signup' || user.needsFirstTimeSetup);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Submit (Dispatches verification code)
  const handleForgotPasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your account email address');
      return;
    }

    try {
      setLoading(true);
      const res = await api.forgotPassword(cleanEmail);
      const code = res.resetCode || res.code;
      if (code) {
        setActiveGeneratedCode(code);
        setResetCode(code);
      }
      setSuccessNotice(res.message || 'Password reset verification code has been dispatched.');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password reset instructions');
    } finally {
      setLoading(false);
    }
  };

  // Quick Resend Code Handler
  const handleResendCode = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your account email address first');
      return;
    }
    try {
      setResendingCode(true);
      setError(null);
      const res = await api.forgotPassword(cleanEmail);
      const code = res.resetCode || res.code;
      if (code) {
        setActiveGeneratedCode(code);
        setResetCode(code);
      }
      setSuccessNotice('A new verification code has been generated and auto-filled.');
    } catch (err: any) {
      setError(err.message || 'Failed to generate new code');
    } finally {
      setResendingCode(false);
    }
  };

  // Reset Password Submit (Sets new password with verification code)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your account email address');
      return;
    }

    const tokenToUse = resetCode.trim() || activeGeneratedCode || '';
    if (!tokenToUse) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    if (password.length < 7) {
      setError('New password must be at least 7 characters long');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword({
        email: cleanEmail,
        newPassword: password,
        resetCode: tokenToUse
      });
      setSuccessNotice(res.message || 'Password reset successfully! Updating session...');

      if (res.user) {
        setTimeout(() => {
          onUserChanged(res.user);
          onClose();
        }, 1200);
      } else {
        setTimeout(() => {
          setAuthMode('signin');
          setPassword('');
          setConfirmPassword('');
          setResetCode('');
          setActiveGeneratedCode(null);
          setSuccessNotice('You can now sign in with your new password.');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please verify your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      onUserChanged(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="modal-auth"
        className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-md p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* If already signed in: Account Overview (unless resetting password) */}
        {currentUser && authMode !== 'forgot' && authMode !== 'reset' ? (
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 bg-[#FFDE59] border-2 border-black rounded-full px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000]">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
              <span>ACTIVE SESSION</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Account Identity</h2>
              <p className="text-xs font-mono text-neutral-600">Connected account details & privileges</p>
            </div>

            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser.displayName || currentUser.name}
                  className="w-12 h-12 rounded-full border-2 border-black object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-black truncate">{currentUser.displayName || currentUser.name}</h3>
                  <p className="text-xs font-mono font-bold text-neutral-600">@{currentUser.username}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{currentUser.email}</p>
                  {currentUser.phone && (
                    <p className="text-[11px] font-mono text-neutral-500 truncate">📞 {currentUser.phone}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t-2 border-neutral-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-500 font-mono">Plan</span>
                  <p className="font-extrabold text-black">{currentUser.plan}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-500 font-mono">Status</span>
                  <p className="font-bold text-emerald-700">{currentUser.subscriptionStatus || 'Active'}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('forgot');
                  setError(null);
                  setSuccessNotice(null);
                  if (currentUser?.email) setEmail(currentUser.email);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-neutral-100 text-black font-black text-xs py-3 px-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <KeyRound className="w-4 h-4 text-black" />
                <span>Reset Password</span>
              </button>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 hover:border-red-600 text-red-700 font-black text-xs py-3 px-4 rounded-xl border-2 border-red-600 shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : authMode === 'forgot' ? (
          /* FORGOT PASSWORD VIEW (Bug #12) */
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-[#FFDE59] border-2 border-black rounded-full px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000] mb-1">
              <KeyRound className="w-3.5 h-3.5 text-black" />
              <span>RECOVER ACCESS</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                Forgot Password?
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-neutral-700">
                Enter your account email to receive a password recovery verification code.
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-black rounded-xl p-3 text-xs text-red-900 font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successNotice && (
              <div className="bg-[#70EE9C]/30 border-2 border-black rounded-xl p-3 text-xs text-black font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
                <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Generated Verification Code Preview Card */}
            {activeGeneratedCode && (
              <div className="bg-[#FFDE59]/30 border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000] space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-black">
                    <Mail className="w-4 h-4 text-black" />
                    <span>Your Verification Code</span>
                  </div>
                  <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full">
                    Valid 30 Mins
                  </span>
                </div>
                <p className="text-xs font-semibold text-neutral-800">
                  Your 6-digit code has been generated. Use it below to set your new password:
                </p>
                <div className="flex items-center justify-between bg-white border-2 border-black rounded-xl px-4 py-2.5 shadow-[2px_2px_0px_0px_#000]">
                  <span className="font-mono text-2xl font-black tracking-widest text-[#FF7A00]">
                    {activeGeneratedCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(activeGeneratedCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-[#FFDE59] hover:bg-[#fed330] text-black text-xs font-black rounded-lg border border-black flex items-center gap-1.5 shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-green-700 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('reset');
                    setError(null);
                    setSuccessNotice(null);
                  }}
                  className="w-full py-2.5 px-3 bg-[#70EE9C] hover:bg-[#5dd887] text-black text-xs font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <span>Continue to Set New Password (Code Auto-Filled)</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Account Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm py-3 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{activeGeneratedCode ? 'Request New Code' : 'Send Verification Code'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {successNotice && !activeGeneratedCode && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('reset');
                    setError(null);
                    setSuccessNotice(null);
                  }}
                  className="w-full py-2.5 px-3 bg-[#FFDE59] hover:bg-[#fed330] text-black text-xs font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
                >
                  Enter Verification Code & Set Password →
                </button>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError(null);
                    setSuccessNotice(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          </div>
        ) : authMode === 'reset' ? (
          /* SET NEW PASSWORD VIEW (Bug #12) */
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-[#70EE9C] border-2 border-black rounded-full px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000] mb-1">
              <KeyRound className="w-3.5 h-3.5 text-black" />
              <span>NEW CREDENTIALS</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                Set New Password
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-neutral-700">
                Enter your verification code and choose a new secure password.
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-black rounded-xl p-3 text-xs text-red-900 font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successNotice && (
              <div className="bg-[#70EE9C]/30 border-2 border-black rounded-xl p-3 text-xs text-black font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
                <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Helper banner if code is active */}
            {activeGeneratedCode && (
              <div className="bg-[#FFDE59]/30 border-2 border-black rounded-xl p-3 text-xs font-bold text-neutral-900 flex items-center justify-between shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-black shrink-0" />
                  <span>Verification Code: <strong className="font-mono font-black text-sm tracking-wider text-[#FF7A00]">{activeGeneratedCode}</strong> (Auto-filled below)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(activeGeneratedCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="text-[11px] font-black underline hover:text-[#FF7A00]"
                >
                  {copiedCode ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black uppercase tracking-wider text-black">
                    Verification Code <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={resendingCode || loading}
                    onClick={handleResendCode}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-neutral-700 hover:text-black hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${resendingCode ? 'animate-spin' : ''}`} />
                    <span>{resendingCode ? 'Sending...' : 'Resend Code'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. 123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-mono font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center justify-between">
                  <span>New Password <span className="text-red-600">*</span></span>
                  <span className="text-[10px] font-mono font-bold text-neutral-500">Min 7 chars</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={7}
                    placeholder="•••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Confirm New Password <span className="text-red-600">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={7}
                  placeholder="•••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#70EE9C] hover:bg-[#5dd887] text-black font-black text-sm py-3 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Set New Password</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError(null);
                    setSuccessNotice(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Sign In & Sign Up Views */
          <div className="space-y-4">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#FFDE59] border-2 border-black rounded-full px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>{authMode === 'signup' ? 'JOIN TRACKD' : 'WELCOME BACK'}</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                {authMode === 'signup' ? 'Create Your Account' : 'Sign In to Trackd'}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-neutral-700">
                {authMode === 'signup' 
                  ? 'Start publishing and tracking your resume versions' 
                  : 'Access your document repositories and view telemetry'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-100 border-2 border-black rounded-xl p-3 text-xs text-red-900 font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {successNotice && (
              <div className="bg-[#70EE9C]/30 border-2 border-black rounded-xl p-3 text-xs text-black font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
                <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Mode Switcher Tabs: Sign In vs Sign Up */}
            <div className="flex p-1 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                  authMode === 'signin'
                    ? 'bg-[#FF7A00] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                  authMode === 'signup'
                    ? 'bg-[#FF7A00] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* 1-Click Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 text-black font-black text-sm py-2.5 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Neo-brutalist Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-black/20"></div>
              </div>
              <span className="relative px-3 bg-[#FEF6E4] text-[10px] font-black uppercase tracking-wider text-neutral-600 font-mono">
                OR CONTINUE WITH EMAIL
              </span>
            </div>

            {/* Native Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* First Name & Last Name (Signup mode) */}
              {authMode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rivera"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center justify-between">
                  <span>Password <span className="text-red-600">*</span></span>
                  <span className="text-[10px] font-mono font-bold text-neutral-500">
                    Min. 7 characters
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={7}
                    placeholder="•••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 7 && (
                  <p className="text-[11px] font-mono font-bold text-amber-700 mt-1">
                    {7 - password.length} more character{7 - password.length > 1 ? 's' : ''} needed (min 7)
                  </p>
                )}

                {/* Bug #12: Visible "Forgot password?" link below password field in Sign In mode */}
                {authMode === 'signin' && (
                  <div className="flex justify-end pt-1.5">
                    <button
                      type="button"
                      id="btn-forgot-password"
                      onClick={() => {
                        setAuthMode('forgot');
                        setError(null);
                        setSuccessNotice(null);
                      }}
                      className="text-xs font-black text-neutral-700 hover:text-[#FF7A00] underline transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Phone Number (OPTIONAL) */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1 flex items-center justify-between">
                    <span>Phone Number</span>
                    <span className="text-[10px] font-mono bg-neutral-200 border border-black/40 text-neutral-700 px-1.5 py-0.5 rounded font-bold">
                      optional
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210 (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-600 font-mono mt-1">
                    Optional: for direct recruiter callbacks & WhatsApp notifications
                  </p>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm py-3 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Mode Toggle Switch */}
              <div className="text-center pt-2">
                {authMode === 'signup' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setError(null);
                      setSuccessNotice(null);
                    }}
                    className="text-xs font-bold text-neutral-700 hover:text-black transition-colors"
                  >
                    Already have an account? <span className="font-black text-[#FF7A00] underline">Sign In</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setError(null);
                      setSuccessNotice(null);
                    }}
                    className="text-xs font-bold text-neutral-700 hover:text-black transition-colors"
                  >
                    Don't have an account? <span className="font-black text-[#FF7A00] underline">Sign Up</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
