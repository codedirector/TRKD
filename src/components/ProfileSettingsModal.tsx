import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User as UserIcon, 
  Linkedin, 
  Github, 
  Globe, 
  Mail, 
  Check, 
  Sparkles, 
  Clock, 
  Zap,
  Save,
  Loader2,
  AlertCircle,
  LogOut,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Link as LinkIcon,
  HelpCircle,
  Sliders,
  Upload,
  Trash2
} from 'lucide-react';
import type { User, UserSocialLinks, PlanType, TrialStatus } from '../types';
import { getTrialDaysRemaining, isUserPro } from '../types';
import { api } from '../api';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
  onOpenPricingModal?: () => void;
  onLogout?: () => void;
  onOpenForgotPassword?: () => void;
}

type SettingsTab = 'profile' | 'links' | 'contact' | 'account' | 'billing';

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUserUpdated,
  onOpenPricingModal,
  onLogout,
  onOpenForgotPassword,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  
  // Profile fields (PRD Section 6)
  const [name, setName] = useState(currentUser?.name || currentUser?.displayName || '');
  const [profession, setProfession] = useState(currentUser?.profession || currentUser?.professionalHeadline || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  // Public Links fields (PRD Section 6)
  const [linkedin, setLinkedin] = useState(currentUser?.socialLinks?.linkedin || '');
  const [github, setGithub] = useState(currentUser?.socialLinks?.github || '');
  const [portfolio, setPortfolio] = useState(currentUser?.socialLinks?.portfolio || '');
  const [twitter, setTwitter] = useState(currentUser?.socialLinks?.twitter || '');
  const [showLinkedin, setShowLinkedin] = useState(currentUser?.socialLinks?.showLinkedin !== false);
  const [showGithub, setShowGithub] = useState(currentUser?.socialLinks?.showGithub !== false);
  const [showPortfolio, setShowPortfolio] = useState(currentUser?.socialLinks?.showPortfolio !== false);

  // Contact fields (PRD Section 6)
  const [showContact, setShowContact] = useState(currentUser?.socialLinks?.showContact !== false);

  // Dev controls state (PRD Section 6: strictly hidden behind explicit toggle)
  const [showDevControls, setShowDevControls] = useState(false);
  const [togglingTrial, setTogglingTrial] = useState(false);

  // Avatar upload states (Bug #11)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // Feedback states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || currentUser.displayName || '');
      setProfession(currentUser.profession || currentUser.professionalHeadline || '');
      setAvatar(currentUser.avatar || '');
      setAvatarLoadError(false);
      setLinkedin(currentUser?.socialLinks?.linkedin || '');
      setGithub(currentUser?.socialLinks?.github || '');
      setPortfolio(currentUser?.socialLinks?.portfolio || '');
      setTwitter(currentUser?.socialLinks?.twitter || '');
      setShowLinkedin(currentUser?.socialLinks?.showLinkedin !== false);
      setShowGithub(currentUser?.socialLinks?.showGithub !== false);
      setShowPortfolio(currentUser?.socialLinks?.showPortfolio !== false);
      setShowContact(currentUser?.socialLinks?.showContact !== false);
      setError(null);
      setSuccessNotice(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow re-uploading same file if desired
    e.target.value = '';

    // Validate type (JPG, PNG, WebP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar image size must be less than 5MB.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setError(null);

      const res = await api.uploadAvatar(file);
      setAvatar(res.avatarUrl);
      setAvatarLoadError(false);
      onUserUpdated(res.user);
      setSuccessNotice('Avatar photo uploaded successfully!');
      setTimeout(() => setSuccessNotice(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (isUploadingAvatar) return;
    try {
      setIsUploadingAvatar(true);
      setError(null);

      const res = await api.removeAvatar();
      setAvatar('');
      onUserUpdated(res.user);
      setSuccessNotice('Avatar removed. Reverted to default.');
      setTimeout(() => setSuccessNotice(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to remove avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!name.trim()) {
      setError('Display name is required');
      return;
    }

    try {
      setSaving(true);
      const socialLinks: UserSocialLinks = {
        linkedin: linkedin.trim(),
        github: github.trim(),
        portfolio: portfolio.trim(),
        twitter: twitter.trim(),
        showLinkedin,
        showGithub,
        showPortfolio,
        showContact,
      };

      const res = await api.updateUserProfile({
        name: name.trim(),
        profession: profession.trim(),
        avatar: avatar.trim(),
        socialLinks,
      });

      onUserUpdated(res.user);
      setSuccessNotice('Settings saved successfully!');
      setTimeout(() => {
        setSuccessNotice(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  // Switcher for testing the 7-day Pro trial states (Only accessible in Dev Mode)
  const handleToggleTrialState = async (targetState: 'active' | 'expired' | 'pro') => {
    try {
      setTogglingTrial(true);
      setError(null);
      const res = await api.toggleTrial(targetState);
      onUserUpdated(res.user);
      setSuccessNotice(`Switched trial state to: ${targetState.toUpperCase()}`);
      setTimeout(() => setSuccessNotice(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update trial state');
    } finally {
      setTogglingTrial(false);
    }
  };

  const isPro = isUserPro(currentUser);
  const trialDaysRemaining = getTrialDaysRemaining(currentUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="modal-profile-settings"
        className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 bg-white border-b-2 border-black flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF7A00] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] shrink-0">
              <UserIcon className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-neutral-900 tracking-tight">
                Profile & Settings
              </h3>
              <p className="text-xs text-neutral-600 font-medium">
                Manage your identity, professional links, account security, and billing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000]"
            title="Close Settings"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Tab Navigation (PRD Section 6) */}
        <div className="bg-[#FFF8EE] border-b-2 border-black px-4 pt-3 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 -webkit-overflow-scrolling-touch">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all border-t-2 border-x-2 border-black flex items-center gap-1.5 ${
              activeTab === 'profile' 
                ? 'bg-white text-black -mb-[2px] pb-2.5 shadow-[0_-2px_0px_0px_#000]' 
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all border-t-2 border-x-2 border-black flex items-center gap-1.5 ${
              activeTab === 'links' 
                ? 'bg-white text-black -mb-[2px] pb-2.5 shadow-[0_-2px_0px_0px_#000]' 
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Public Links</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all border-t-2 border-x-2 border-black flex items-center gap-1.5 ${
              activeTab === 'contact' 
                ? 'bg-white text-black -mb-[2px] pb-2.5 shadow-[0_-2px_0px_0px_#000]' 
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all border-t-2 border-x-2 border-black flex items-center gap-1.5 ${
              activeTab === 'account' 
                ? 'bg-white text-black -mb-[2px] pb-2.5 shadow-[0_-2px_0px_0px_#000]' 
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all border-t-2 border-x-2 border-black flex items-center gap-1.5 ${
              activeTab === 'billing' 
                ? 'bg-white text-black -mb-[2px] pb-2.5 shadow-[0_-2px_0px_0px_#000]' 
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#FEF6E4]">
          {error && (
            <div className="mb-4 bg-red-100 border-2 border-black rounded-lg p-3 text-xs text-red-900 font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 bg-[#70EE9C]/30 border-2 border-black rounded-lg p-3 text-xs text-black font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
              <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <form id="settings-form" onSubmit={handleSaveProfile}>
            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                {/* Profile Picture Section (Bug #11: Upload Avatar flow) */}
                <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-3">
                    Profile Picture
                  </label>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Avatar Display */}
                    <div className="relative group shrink-0">
                      {avatar && !avatarLoadError ? (
                        <img
                          src={avatar}
                          alt={name || currentUser.displayName}
                          className="w-16 h-16 rounded-2xl border-2 border-black object-cover shadow-[2px_2px_0px_0px_#000]"
                          onError={() => setAvatarLoadError(true)}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl border-2 border-black bg-[#FFDE59] text-black font-black text-2xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] select-none">
                          {(name || currentUser.displayName || currentUser.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}

                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold">
                          <Loader2 className="w-5 h-5 animate-spin mb-1 text-[#FFDE59]" />
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-1 flex flex-col justify-center space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <input
                          type="file"
                          ref={avatarFileInputRef}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                          onChange={handleAvatarFileSelect}
                          disabled={isUploadingAvatar}
                        />

                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="px-3.5 py-1.5 bg-[#FF7A00] hover:bg-[#e66e00] text-black font-black text-xs rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isUploadingAvatar ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Upload Photo</span>
                            </>
                          )}
                        </button>

                        {avatar && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            disabled={isUploadingAvatar}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-red-50 text-red-700 hover:text-red-900 font-bold text-xs rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-600">
                        JPG, PNG, or WebP up to 5MB. Photo will appear on your workspace and public document profile.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                      Display Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs sm:text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                      Username (Immutable Slug)
                    </label>
                    <div className="flex items-center px-3 py-2 bg-neutral-100 border-2 border-black rounded-xl text-xs sm:text-sm font-mono font-bold text-neutral-700 shadow-[2px_2px_0px_0px_#000]">
                      <span>@{currentUser.username}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    Professional Headline / Role
                  </label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer • Distributed Systems"
                    className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs sm:text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                  />
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Displayed prominently under your name on all verified public documents.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: PUBLIC LINKS */}
            {activeTab === 'links' && (
              <div className="space-y-3.5 animate-in fade-in duration-100">
                <p className="text-xs text-neutral-700 font-semibold mb-2">
                  Enable or hide social links shown in the public document header.
                </p>

                {/* LinkedIn */}
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000] flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#0A66C2] rounded-lg flex items-center justify-center text-white shrink-0">
                    <Linkedin className="w-4 h-4 fill-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-transparent text-xs font-bold text-neutral-900 focus:outline-hidden"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-black text-neutral-800 shrink-0 bg-[#FFDE59] px-2.5 py-1 rounded-md border border-black shadow-[1px_1px_0px_0px_#000]">
                    <input
                      type="checkbox"
                      checked={showLinkedin}
                      onChange={(e) => setShowLinkedin(e.target.checked)}
                      className="w-3.5 h-3.5 accent-black rounded"
                    />
                    <span>Visible</span>
                  </label>
                </div>

                {/* GitHub */}
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000] flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white shrink-0">
                    <Github className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-transparent text-xs font-bold text-neutral-900 focus:outline-hidden"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-black text-neutral-800 shrink-0 bg-[#FFDE59] px-2.5 py-1 rounded-md border border-black shadow-[1px_1px_0px_0px_#000]">
                    <input
                      type="checkbox"
                      checked={showGithub}
                      onChange={(e) => setShowGithub(e.target.checked)}
                      className="w-3.5 h-3.5 accent-black rounded"
                    />
                    <span>Visible</span>
                  </label>
                </div>

                {/* Portfolio */}
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000] flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#FF7A00] rounded-lg flex items-center justify-center text-black shrink-0">
                    <Globe className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="url"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://yourportfolio.dev"
                      className="w-full bg-transparent text-xs font-bold text-neutral-900 focus:outline-hidden"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-black text-neutral-800 shrink-0 bg-[#FFDE59] px-2.5 py-1 rounded-md border border-black shadow-[1px_1px_0px_0px_#000]">
                    <input
                      type="checkbox"
                      checked={showPortfolio}
                      onChange={(e) => setShowPortfolio(e.target.checked)}
                      className="w-3.5 h-3.5 accent-black rounded"
                    />
                    <span>Visible</span>
                  </label>
                </div>

                {/* Twitter / X */}
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000] flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white shrink-0 font-black text-sm font-mono">
                    𝕏
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://x.com/username (optional)"
                      className="w-full bg-transparent text-xs font-bold text-neutral-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONTACT */}
            {activeTab === 'contact' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#FFDE59] border border-black rounded-lg flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-neutral-900">
                          Public Contact Button
                        </h4>
                        <p className="text-xs text-neutral-600 font-medium">
                          Allow recruiters to open a mail composer directly to: <strong>{currentUser.email}</strong>
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-black text-neutral-900 shrink-0 bg-[#FFDE59] px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                      <input
                        type="checkbox"
                        checked={showContact}
                        onChange={(e) => setShowContact(e.target.checked)}
                        className="w-4 h-4 accent-black rounded"
                      />
                      <span>{showContact ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 border-2 border-neutral-300 rounded-xl text-xs text-neutral-700 space-y-1">
                  <p className="font-bold text-neutral-900">Notice:</p>
                  <p>
                    When enabled, visitors seeing your verified public resume can click "Get in Touch" to contact you directly. Your email is protected against web scrapers.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                {/* Clean user account summary (Bug #10: debug panels & internal IDs completely removed) */}
                <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-100">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                        Account Email
                      </span>
                      <span className="text-xs font-bold text-neutral-900">
                        {currentUser.email}
                      </span>
                    </div>
                    <span className="bg-[#70EE9C] text-black text-[10px] font-mono font-black px-2 py-0.5 rounded border border-black">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                        Username
                      </span>
                      <span className="text-xs font-mono font-bold text-neutral-900">
                        @{currentUser.username}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#FFF8EE] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-5 h-5 text-neutral-800" />
                    <div>
                      <h5 className="text-xs font-black text-neutral-900">Password & Security</h5>
                      <p className="text-[11px] text-neutral-600">Change your password or manage credentials</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenForgotPassword) onOpenForgotPassword();
                    }}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-black text-xs font-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
                  >
                    Reset Password
                  </button>
                </div>

                {onLogout && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black rounded-xl border-2 border-red-600 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out from Trackd</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: BILLING & ENTITLEMENTS */}
            {activeTab === 'billing' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                        Subscription Plan
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-lg font-black text-neutral-900">
                          {isPro ? 'Trackd Pro' : currentUser.trialStatus === 'active' ? '7-Day Pro Trial' : 'Trackd Free'}
                        </span>
                        {isPro ? (
                          <span className="bg-[#70EE9C] text-black border border-black font-black text-[10px] px-2 py-0.5 rounded flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                            <Zap className="w-3 h-3 fill-black" />
                            <span>ACTIVE PRO</span>
                          </span>
                        ) : currentUser.trialStatus === 'active' ? (
                          <span className="bg-[#FFDE59] text-black border border-black font-black text-[10px] px-2 py-0.5 rounded flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                            <Clock className="w-3 h-3" />
                            <span>{trialDaysRemaining} DAYS LEFT</span>
                          </span>
                        ) : (
                          <span className="bg-neutral-200 text-neutral-800 border border-black font-black text-[10px] px-2 py-0.5 rounded">
                            TRACKING PAUSED
                          </span>
                        )}
                      </div>
                    </div>

                    {onOpenPricingModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPricingModal();
                        }}
                        className="px-3.5 py-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black text-xs font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isPro ? 'View Plans' : 'Upgrade to Pro'}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed pt-2 border-t border-neutral-200">
                    {isPro 
                      ? 'Full recruiter telemetry, page dwell duration, geographical breakdown, and unlimited tracking enabled.'
                      : currentUser.trialStatus === 'active'
                      ? `Enjoy full Pro tracking features for the next ${trialDaysRemaining} days. Permanent storage and version commits remain free forever.`
                      : 'Tracking is paused. Your documents are completely safe and viewable, but Trackd is no longer collecting analytics until renewed.'}
                  </p>
                </div>

                {/* PRD Section 6: Development test controls hidden behind explicit dev mode toggle */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
                    <button
                      type="button"
                      onClick={() => setShowDevControls(!showDevControls)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-600 hover:text-black underline"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{showDevControls ? 'Hide Developer Test Controls' : 'Show Developer Test Controls'}</span>
                    </button>
                  </div>

                  {showDevControls && (
                    <div className="mt-3 p-3.5 bg-neutral-100 border-2 border-dashed border-neutral-400 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-neutral-800">
                          Dev Sandbox Trial Switcher:
                        </span>
                        <span className="text-[10px] bg-neutral-200 px-1.5 py-0.5 rounded font-mono">
                          Testing Only
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={togglingTrial}
                          onClick={() => handleToggleTrialState('active')}
                          className={`text-xs font-black py-1.5 rounded-lg border-2 border-black transition-all ${
                            currentUser.trialStatus === 'active' ? 'bg-[#FFDE59] shadow-[2px_2px_0px_0px_#000]' : 'bg-white hover:bg-neutral-50'
                          }`}
                        >
                          7-Day Trial
                        </button>
                        <button
                          type="button"
                          disabled={togglingTrial}
                          onClick={() => handleToggleTrialState('expired')}
                          className={`text-xs font-black py-1.5 rounded-lg border-2 border-black transition-all ${
                            currentUser.trialStatus === 'expired' ? 'bg-neutral-800 text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-white hover:bg-neutral-50'
                          }`}
                        >
                          Expired Pro
                        </button>
                        <button
                          type="button"
                          disabled={togglingTrial}
                          onClick={() => handleToggleTrialState('pro')}
                          className={`text-xs font-black py-1.5 rounded-lg border-2 border-black transition-all ${
                            isPro ? 'bg-[#70EE9C] shadow-[2px_2px_0px_0px_#000]' : 'bg-white hover:bg-neutral-50'
                          }`}
                        >
                          Active Pro
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FFF8EE] border-t-2 border-black flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
          >
            Close
          </button>

          {(activeTab === 'profile' || activeTab === 'links' || activeTab === 'contact') && (
            <button
              form="settings-form"
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black text-xs font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
