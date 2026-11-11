import React, { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  Plus, 
  Layers, 
  User as UserIcon, 
  ChevronDown, 
  Settings, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';
import { isUserPro, getTrialDaysRemaining } from '../types';
import type { User, Resume } from '../types';

interface NavbarProps {
  currentView: 'landing' | 'about' | 'pricing' | 'dashboard' | 'resume-detail' | 'analytics' | 'public-preview';
  setCurrentView: (view: 'landing' | 'about' | 'pricing' | 'dashboard' | 'resume-detail' | 'analytics' | 'public-preview') => void;
  currentUser: User | null;
  activeResume: Resume | null;
  onOpenCreateModal: () => void;
  onOpenAuthModal: () => void;
  onOpenPricingModal: () => void;
  onOpenPublicResume: (username: string, slug: string) => void;
  onOpenProfileSettings?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  activeResume,
  onOpenCreateModal,
  onOpenAuthModal,
  onOpenPricingModal,
  onOpenProfileSettings,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPro = isUserPro(currentUser);
  const daysLeft = getTrialDaysRemaining(currentUser);
  const username = currentUser?.username || 'user';

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userDropdownOpen]);

  // Close mobile drawer on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (view: 'landing' | 'about' | 'pricing' | 'dashboard') => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b-2 border-black shadow-[0_2px_0px_0px_#000000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
            
            {/* BRAND LOGO */}
            <div className="flex items-center gap-3">
              <button
                id="nav-brand-btn"
                onClick={() => handleNavClick(currentUser ? 'dashboard' : 'landing')}
                className="flex items-center gap-2 text-black font-black tracking-tight text-lg sm:text-xl hover:opacity-90 transition-opacity shrink-0"
                title="Trackd"
              >
                <div className="w-8 h-8 bg-[#FF7A00] border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  <GitBranch className="w-4.5 h-4.5 text-black stroke-[2.5]" />
                </div>
                <span className="font-extrabold font-sans">TRACKD</span>
              </button>
            </div>

            {/* AUTHENTICATED WORKSPACE NAVIGATION (PRD Section 3) */}
            {currentUser ? (
              <div className="hidden md:flex items-center gap-3">
                {/* 1. Documents */}
                <button
                  id="nav-workspace-documents"
                  onClick={() => handleNavClick('dashboard')}
                  className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    currentView === 'dashboard' || currentView === 'resume-detail' || currentView === 'analytics'
                      ? 'bg-neutral-100 text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                      : 'text-neutral-700 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  <Layers className="w-4 h-4 text-black" />
                  <span>Documents</span>
                </button>

                {/* 2. Pricing */}
                <button
                  id="nav-workspace-pricing"
                  onClick={() => handleNavClick('pricing')}
                  className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    currentView === 'pricing'
                      ? 'bg-neutral-100 text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                      : 'text-neutral-700 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  Pricing
                </button>

                {/* 3. About */}
                <button
                  id="nav-workspace-about"
                  onClick={() => handleNavClick('about')}
                  className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    currentView === 'about'
                      ? 'bg-neutral-100 text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                      : 'text-neutral-700 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  About
                </button>

                {/* 4. + New Document */}
                <button
                  id="nav-btn-new-document"
                  onClick={onOpenCreateModal}
                  className="flex items-center gap-1.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ml-1"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>New Document</span>
                </button>

                {/* 5. @username ▼ User Dropdown */}
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    id="nav-user-dropdown-btn"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 bg-white hover:bg-neutral-50 text-black font-extrabold text-xs sm:text-sm px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
                  >
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={currentUser.displayName || currentUser.name}
                      className="w-5 h-5 rounded-full border border-black object-cover"
                    />
                    <span className="font-mono">@{username}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-black rounded-xl shadow-[5px_5px_0px_0px_#000] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      {/* Dropdown Header */}
                      <div className="p-2.5 border-b-2 border-neutral-100 bg-[#FEF6E4] rounded-lg mb-1">
                        <p className="font-black text-xs text-black truncate">{currentUser.displayName || currentUser.name}</p>
                        <p className="text-[11px] font-mono text-neutral-600 truncate">@{username}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border border-black ${
                            isPro ? 'bg-[#70EE9C] text-black' : 'bg-[#FFDE59] text-black'
                          }`}>
                            {isPro ? (currentUser.subscriptionStatus === 'TRIAL' ? `Pro Trial (${daysLeft}d)` : 'Trackd Pro') : 'Free Plan'}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Links */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenProfileSettings) onOpenProfileSettings();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100 rounded-lg text-left transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-neutral-600" />
                        <span>Profile & Links</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenProfileSettings) onOpenProfileSettings();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100 rounded-lg text-left transition-colors"
                      >
                        <Settings className="w-4 h-4 text-neutral-600" />
                        <span>Account Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenPricingModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100 rounded-lg text-left transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-neutral-600" />
                        <span>Plans & Billing</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNavClick('about');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100 rounded-lg text-left transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-neutral-600" />
                        <span>About Trackd</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setHelpModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100 rounded-lg text-left transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-neutral-600" />
                        <span>Help & Support</span>
                      </button>

                      <div className="border-t border-neutral-200 my-1" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 rounded-lg text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* MARKETING PUBLIC NAVIGATION (PRD Section 2 & 3) */
              <div className="hidden md:flex items-center gap-6">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => handleNavClick('landing')}
                    className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'landing' ? 'bg-neutral-100 text-black border-2 border-black font-black' : 'text-neutral-700 hover:text-black'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => handleNavClick('about')}
                    className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'about' ? 'bg-neutral-100 text-black border-2 border-black font-black' : 'text-neutral-700 hover:text-black'
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => handleNavClick('pricing')}
                    className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'pricing' ? 'bg-neutral-100 text-black border-2 border-black font-black' : 'text-neutral-700 hover:text-black'
                    }`}
                  >
                    Pricing
                  </button>
                </nav>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={onOpenAuthModal}
                    className="text-xs sm:text-sm font-bold px-3 py-1.5 text-neutral-800 hover:text-black transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onOpenAuthModal}
                    className="flex items-center gap-1.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-xs sm:text-sm px-4 py-1.5 rounded-xl border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    <span>Get Started</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center gap-2">
              {currentUser && (
                <button
                  onClick={onOpenCreateModal}
                  className="bg-[#FF7A00] text-black p-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                  title="New Document"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] text-black"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* RESPONSIVE MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-black bg-[#FEF6E4] px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            {currentUser ? (
              <div className="space-y-2">
                {/* User info badge */}
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={currentUser.displayName || currentUser.name}
                      className="w-8 h-8 rounded-full border border-black object-cover"
                    />
                    <div>
                      <p className="font-black text-xs text-black">{currentUser.displayName || currentUser.name}</p>
                      <p className="text-[11px] font-mono text-neutral-600">@{username}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-black bg-[#FFDE59]">
                    {isPro ? 'Pro' : 'Free'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className="flex items-center justify-center gap-1.5 bg-white border-2 border-black rounded-xl py-2.5 text-xs font-bold shadow-[2px_2px_0px_0px_#000]"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Docs</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('pricing')}
                    className="flex items-center justify-center gap-1.5 bg-white border-2 border-black rounded-xl py-2.5 text-xs font-bold shadow-[2px_2px_0px_0px_#000]"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pricing</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('about')}
                    className="flex items-center justify-center gap-1.5 bg-white border-2 border-black rounded-xl py-2.5 text-xs font-bold shadow-[2px_2px_0px_0px_#000]"
                  >
                    <span>About</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCreateModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] text-black font-black text-xs py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ New Document</span>
                </button>

                <div className="pt-2 border-t border-black/10 space-y-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenProfileSettings) onOpenProfileSettings();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-white rounded-lg text-left"
                  >
                    <UserIcon className="w-4 h-4 text-neutral-600" />
                    <span>Profile & Links</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenPricingModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-white rounded-lg text-left"
                  >
                    <CreditCard className="w-4 h-4 text-neutral-600" />
                    <span>Plans & Billing</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setHelpModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-800 hover:bg-white rounded-lg text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-neutral-600" />
                    <span>Help</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 rounded-lg text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick('landing')}
                  className="w-full text-left font-bold text-xs py-2 px-3 rounded-lg hover:bg-white"
                >
                  Overview
                </button>
                <button
                  onClick={() => handleNavClick('about')}
                  className="w-full text-left font-bold text-xs py-2 px-3 rounded-lg hover:bg-white"
                >
                  About
                </button>
                <button
                  onClick={() => handleNavClick('pricing')}
                  className="w-full text-left font-bold text-xs py-2 px-3 rounded-lg hover:bg-white"
                >
                  Pricing
                </button>

                <div className="pt-2 border-t border-black/10 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full py-2.5 text-center text-xs font-black bg-[#FF7A00] text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]"
                  >
                    Get Started Free
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* HELP & SUPPORT DIALOG */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setHelpModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000]"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFDE59] border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#000]">
                <HelpCircle className="w-4 h-4 text-black" />
              </div>
              <h3 className="text-xl font-black text-black">Trackd Help & Documentation</h3>
            </div>

            <div className="space-y-3 text-xs text-neutral-800">
              <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000]">
                <h4 className="font-black text-sm mb-1">Permanent Public Links</h4>
                <p>Every document has a permanent URL at <code>/:username/:slug</code>. When you publish a new version, that URL updates instantly with zero broken links.</p>
              </div>

              <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000]">
                <h4 className="font-black text-sm mb-1">Silent Recruiter Telemetry</h4>
                <p>Trackd counts reading duration, downloads, and devices quietly when recruiters view your published documents. If your Pro trial expires, tracking simply pauses while your documents remain safe and accessible.</p>
              </div>

              <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000]">
                <h4 className="font-black text-sm mb-1">Confidential Documents</h4>
                <p>Need confidentiality? Set a 4-to-6 digit PIN. Document contents and PDF downloads are encrypted and locked until verified.</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-black/10 flex justify-end">
              <button
                onClick={() => setHelpModalOpen(false)}
                className="bg-black text-white font-black text-xs px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_#FF7A00]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
