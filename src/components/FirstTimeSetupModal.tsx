import React, { useState } from 'react';
import { Sparkles, ArrowRight, User as UserIcon, AtSign, Check, AlertCircle } from 'lucide-react';
import type { User } from '../types';
import { api } from '../api';

interface FirstTimeSetupModalProps {
  isOpen: boolean;
  currentUser?: User | null;
  onComplete: (updatedUser: User) => void;
}

export const FirstTimeSetupModal: React.FC<FirstTimeSetupModalProps> = ({
  isOpen,
  currentUser,
  onComplete
}) => {
  if (!isOpen || !currentUser) return null;

  const [username, setUsername] = useState(currentUser?.username || '');
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (cleanUser.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, hyphens)');
      return;
    }

    if (!displayName.trim()) {
      setError('Please provide a display name');
      return;
    }

    try {
      setLoading(true);
      const res = await api.completeFirstTimeSetup({
        username: cleanUser,
        name: displayName.trim(),
        avatar: currentUser.avatar
      });
      onComplete(res.user);
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="modal-first-time-setup"
        className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-md p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Step Indicator */}
        <div className="inline-flex items-center gap-1.5 bg-[#FFDE59] border-2 border-black rounded-full px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>FIRST-TIME SETUP</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mb-1">
          Welcome to Trackd!
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-neutral-700 mb-6">
          Set up your permanent creator handle and display name for your published documents.
        </p>

        {error && (
          <div className="mb-4 bg-red-100 border-2 border-black rounded-lg p-3 text-xs text-red-900 font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              <span>Display Name</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1">
              <AtSign className="w-3.5 h-3.5" />
              <span>Choose Username</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. alexrivera"
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-mono font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
            />
            {/* Live URL Preview */}
            <div className="mt-2 bg-white/80 border border-black/30 rounded-lg p-2 font-mono text-[11px] text-neutral-600 flex items-center gap-1.5">
              <span className="font-bold text-black">Public URL:</span>
              <span className="text-[#FF7A00] font-bold truncate">
                trackd.app/{username || 'username'}/&lt;slug&gt;
              </span>
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-2">
            <button
              id="btn-first-time-setup-continue"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Setting up...' : 'Continue to Dashboard'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
