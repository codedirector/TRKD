import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitBranch, Plus, FileText, BarChart3, Globe, ExternalLink, 
  Github, Linkedin, Mail, ArrowRight, Layers, Sparkles, AlertCircle, 
  CheckCircle2, RefreshCw, Search, Zap, Lock, Filter, User as UserIcon,
  GitFork, Flame
} from 'lucide-react';
import type { User, Resume, ResumeVersion, AnalyticsSummary, DocumentCategory, PlanType, SubscriptionCycle, ContributionStats } from './types';
import { isUserPro, getTrialDaysRemaining } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { ResumeCard } from './components/ResumeCard';
import { VersionTimeline } from './components/VersionTimeline';
import { AnalyticsView } from './components/AnalyticsView';
import { PublicResumeViewer } from './components/PublicResumeViewer';
import { CreateResumeModal } from './components/CreateResumeModal';
import { UploadVersionModal } from './components/UploadVersionModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { LandingPage } from './components/LandingPage';
import { AboutPage } from './components/AboutPage';
import { PricingPage } from './components/PricingPage';
import { FirstTimeSetupModal } from './components/FirstTimeSetupModal';
import { RazorpayModal } from './components/RazorpayModal';
import { DocumentSubnav } from './components/DocumentSubnav';
import { CommitContributionGrid } from './components/CommitContributionGrid';
import { CloneResumeModal } from './components/CloneResumeModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { currentUser: authUser, isLoaded: isAuthLoaded, isSignedIn, signOut: authSignOut } = useAuth();

  // Navigation & View State
  const [currentView, setCurrentView] = useState<'landing' | 'about' | 'pricing' | 'dashboard' | 'resume-detail' | 'analytics' | 'public-preview'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/about') return 'about';
      if (path === '/pricing') return 'pricing';
      if (path === '/landing' || path === '/overview') return 'landing';
      if (path.startsWith('/view/') || path.match(/^\/@[^/]+\/[^/]+$/)) return 'public-preview';
      const hasAuthToken = localStorage.getItem('trackd_token');
      if (!hasAuthToken && (path === '/' || path === '')) return 'landing';
    }
    return 'dashboard';
  });
  const [publicParams, setPublicParams] = useState<{ username?: string; slug?: string; token?: string } | null>(null);

  // Data State
  const [currentUser, setCurrentUser] = useState<User | null>(authUser);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [activeResumeVersions, setActiveResumeVersions] = useState<ResumeVersion[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<'all' | DocumentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signup');
  const [isFirstTimeSetupOpen, setIsFirstTimeSetupOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayCycle, setRazorpayCycle] = useState<SubscriptionCycle>('monthly');
  const [viewingPdfVersion, setViewingPdfVersion] = useState<ResumeVersion | null>(null);

  // Clone Modal State
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloningSourceResume, setCloningSourceResume] = useState<Resume | null>(null);

  // Activity Contributions State
  const [contributions, setContributions] = useState<ContributionStats | null>(null);
  const [loadingContributions, setLoadingContributions] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Activity Contributions
  const loadContributions = useCallback(async () => {
    try {
      setLoadingContributions(true);
      const data = await api.getUserContributions();
      setContributions(data);
    } catch (err) {
      console.warn('Notice loading contribution activity:', err);
    } finally {
      setLoadingContributions(false);
    }
  }, []);

  // Navigation Helper with History PushState
  type AppView = 'landing' | 'about' | 'pricing' | 'dashboard' | 'resume-detail' | 'analytics' | 'public-preview';

  const navigateTo = useCallback((view: AppView, pushState: boolean = true) => {
    setCurrentView(view);
    if (typeof window !== 'undefined' && pushState) {
      if (view === 'about') {
        window.history.pushState({ view }, '', '/about');
      } else if (view === 'pricing') {
        window.history.pushState({ view }, '', '/pricing');
      } else if (view === 'landing') {
        window.history.pushState({ view }, '', '/landing');
      } else if (view === 'dashboard') {
        window.history.pushState({ view }, '', '/');
      }
    }
  }, []);

  // Check URL pathname for public resume link (e.g. /@shobhit/software-engineer) or custom pages, and listen to browser back/forward
  useEffect(() => {
    const parseRoute = () => {
      const path = window.location.pathname;
      if (path === '/about') {
        setCurrentView('about');
        return;
      }
      if (path === '/pricing') {
        setCurrentView('pricing');
        return;
      }
      if (path === '/landing' || path === '/overview') {
        setCurrentView('landing');
        return;
      }
      const tokenMatch = path.match(/^\/view\/([a-zA-Z0-9_-]+)$/);
      if (tokenMatch) {
        setPublicParams({ token: tokenMatch[1] });
        setCurrentView('public-preview');
        return;
      }
      const viewSlugMatch = path.match(/^\/view\/@?([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/);
      if (viewSlugMatch) {
        setPublicParams({ username: viewSlugMatch[1], slug: viewSlugMatch[2] });
        setCurrentView('public-preview');
        return;
      }
      const match = path.match(/^\/@?([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/);
      if (match && match[1] !== 'api' && match[1] !== 'dashboard' && match[1] !== 'about' && match[1] !== 'pricing' && match[1] !== 'view') {
        setPublicParams({ username: match[1], slug: match[2] });
        setCurrentView('public-preview');
        return;
      }
      if (path === '/' || path === '') {
        const hasToken = localStorage.getItem('trackd_token');
        if (!hasToken) {
          setCurrentView('landing');
        } else {
          setCurrentView('dashboard');
        }
      }
    };

    parseRoute();
    window.addEventListener('popstate', parseRoute);
    return () => window.removeEventListener('popstate', parseRoute);
  }, []);

  // Fetch Current User & Resumes
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const list = await api.getResumes();
        setResumes(list);
        loadContributions();
        // BUG-04 fix: Keep user on 'about' or 'pricing' if explicitly opened, only redirect 'landing' to 'dashboard'
        setCurrentView(prev => prev === 'landing' ? 'dashboard' : prev);

        // Set first resume active if available
        if (list.length > 0) {
          setActiveResume(list[0]);
          try {
            const vers = await api.getVersions(list[0]._id);
            setActiveResumeVersions(vers);
          } catch {
            setActiveResumeVersions([]);
          }
        } else {
          setActiveResume(null);
          setActiveResumeVersions([]);
        }
      } else {
        setResumes([]);
        setActiveResume(null);
        setActiveResumeVersions([]);
        setContributions(null);
      }
    } catch (err: any) {
      console.warn('Notice loading user data:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [loadContributions]);

  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
      loadUserData();
    } else if (isAuthLoaded && !isSignedIn) {
      setCurrentUser(null);
      setResumes([]);
      setActiveResume(null);
      setActiveResumeVersions([]);
      setContributions(null);
    }
  }, [authUser, isAuthLoaded, isSignedIn, loadUserData]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // When user is signed in and visits root landing page, redirect to dashboard
  useEffect(() => {
    if (currentUser && currentView === 'landing' && (window.location.pathname === '/' || window.location.pathname === '')) {
      setCurrentView('dashboard');
    }
  }, [currentUser, currentView]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await authSignOut();
      setCurrentUser(null);
      setResumes([]);
      setActiveResume(null);
      setActiveResumeVersions([]);
      setContributions(null);
      showToast('Logged out successfully', 'info');
      navigateTo('landing');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Handle cloning a resume into a duplicate repository
  const handleCloneResume = async (
    sourceResumeId: string, 
    params: {
      name: string;
      slug: string;
      category: DocumentCategory;
      branchMode: 'all' | 'published_only';
    }
  ) => {
    const cloned = await api.cloneResume(sourceResumeId, params);
    setResumes(prev => [cloned, ...prev]);
    showToast(`Branched repository "${cloned.name}"!`);
    loadContributions();
  };

  // Load versions whenever active resume changes
  const selectResume = async (resume: Resume) => {
    setActiveResume(resume);
    try {
      const vers = await api.getVersions(resume._id);
      setActiveResumeVersions(vers);
      setCurrentView('resume-detail');
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    }
  };

  // Open Analytics for a Resume
  const openAnalytics = async (resume: Resume) => {
    setActiveResume(resume);
    try {
      const data = await api.getAnalytics(resume._id);
      setAnalyticsData(data);
      setCurrentView('analytics');
    } catch (err: any) {
      showToast(err.message || 'Failed to load analytics', 'info');
    }
  };

  // Open Public Resume Viewer
  const openPublicResume = (username: string, slug: string, shareToken?: string) => {
    const cleanUser = username.replace(/^@/, '');
    setPublicParams({ username: cleanUser, slug, token: shareToken });
    setCurrentView('public-preview');
    if (shareToken) {
      window.history.pushState({}, '', `/view/${shareToken}`);
    } else {
      window.history.pushState({}, '', `/@${cleanUser}/${slug}`);
    }
  };

  // Create Document / Resume with optional v1 upload
  const handleCreateResume = async (
    name: string, 
    slug: string, 
    category: DocumentCategory = 'resume',
    initialFile?: File,
    commitMessage?: string
  ) => {
    const created = await api.createResume(name, slug, category);

    if (initialFile) {
      const formData = new FormData();
      formData.append('pdf', initialFile);
      formData.append('file', initialFile);
      formData.append('commitMessage', commitMessage || 'Initial draft');
      formData.append('tags', 'v1,initial');
      await api.uploadVersion(created._id, formData);
    }

    showToast(`Created document "${created.name}"`);
    await loadUserData();
    const fullCreated = await api.getResume(created._id);
    await selectResume(fullCreated);
  };

  // Plan update handler
  const handleSelectPlan = async (plan: PlanType) => {
    try {
      const res = await api.updateUserPlan(plan);
      setCurrentUser(res.user);
      showToast(plan === 'PRO' ? 'Upgraded to Trackd Pro! Unlimited tracking unlocked.' : 'Switched to Trackd Free plan.');
      await loadUserData();
      if (activeResume) {
        const updatedAnalytics = await api.getAnalytics(activeResume._id);
        setAnalyticsData(updatedAnalytics);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update plan', 'info');
    }
  };

  // Delete Resume
  const handleDeleteResume = async (resumeId: string) => {
    try {
      await api.deleteResume(resumeId);
      showToast('Document repository deleted');
      await loadUserData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document', 'info');
    }
  };

  // Upload New Version
  const handleUploadVersion = async (formData: FormData) => {
    if (!activeResume) return;
    const newVer = await api.uploadVersion(activeResume._id, formData);
    showToast(`Committed ${newVer.versionLabel || 'new version'}: "${newVer.commitMessage}"`);

    // Reload active resume and versions
    const updatedResume = await api.getResume(activeResume._id);
    setActiveResume(updatedResume);
    setActiveResumeVersions(updatedResume.versions);

    // Refresh resumes list & contributions in background
    api.getResumes().then(setResumes);
    loadContributions();
  };

  // Publish Version
  const handlePublishVersion = async (versionId: string) => {
    if (!activeResume) return;
    const res = await api.publishVersion(activeResume._id, versionId);
    showToast(res.message || 'Version published successfully');

    const updated = await api.getResume(activeResume._id);
    setActiveResume(updated);
    setActiveResumeVersions(updated.versions);
    api.getResumes().then(setResumes);
    loadContributions();
  };

  // Filtered documents
  const filteredDocuments = resumes.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || (doc.category || 'resume') === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doc.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isPro = isUserPro(currentUser);
  const isTrialActive = currentUser?.trialStatus === 'active' && currentUser?.plan !== 'PRO';
  const trialDaysRemaining = getTrialDaysRemaining(currentUser);
  const trackedCount = resumes.filter(r => r.trackingEnabled).length;
  const lockedCount = resumes.filter(r => !r.trackingEnabled).length;

  return (
    <div className="min-h-screen bg-[#FEF6E4] text-neutral-900 pb-20 font-sans selection:bg-[#FF7A00] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl px-4 py-3 flex items-center gap-2.5 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Floating Neo-Brutalist Navbar matching image */}
      {currentView !== 'public-preview' && (
        <ErrorBoundary
          variant="section"
          componentContext="Application Navigation Bar"
          fallbackTitle="Navigation Bar Interrupted"
        >
          <Navbar
            currentView={currentView}
            setCurrentView={(view) => navigateTo(view)}
            currentUser={currentUser}
            activeResume={activeResume}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenAuthModal={() => {
              setAuthInitialMode('signin');
              setIsAuthModalOpen(true);
            }}
            onOpenPricingModal={() => setIsPricingModalOpen(true)}
            onOpenPublicResume={openPublicResume}
            onOpenProfileSettings={() => setIsProfileModalOpen(true)}
            onLogout={handleLogout}
          />
        </ErrorBoundary>
      )}

      {/* VIEW: LANDING PAGE */}
      {currentView === 'landing' && (
        <div className="animate-in fade-in duration-150">
          <LandingPage
            currentUser={currentUser}
            onGetStarted={() => {
              if (currentUser) {
                navigateTo('dashboard');
              } else {
                setAuthInitialMode('signup');
                setIsAuthModalOpen(true);
              }
            }}
            onLogin={() => {
              setAuthInitialMode('signin');
              setIsAuthModalOpen(true);
            }}
            onGoToDashboard={() => navigateTo('dashboard')}
            onGoToAbout={() => navigateTo('about')}
            onGoToPricing={() => navigateTo('pricing')}
          />
        </div>
      )}

      {/* VIEW: ABOUT PAGE (BUG-03 fix: Available to both authenticated & guest users) */}
      {currentView === 'about' && (
        <div className="animate-in fade-in duration-150">
          <AboutPage
            onGetStarted={() => {
              if (currentUser) {
                navigateTo('dashboard');
              } else {
                setAuthInitialMode('signup');
                setIsAuthModalOpen(true);
              }
            }}
            onGoToPricing={() => navigateTo('pricing')}
            onGoToDashboard={() => navigateTo('dashboard')}
          />
        </div>
      )}

      {/* VIEW: PRICING PAGE (BUG-03 fix: Available to both authenticated & guest users) */}
      {currentView === 'pricing' && (
        <div className="animate-in fade-in duration-150">
          <PricingPage
            currentUser={currentUser}
            onSelectPlan={handleSelectPlan}
            onOpenRazorpay={(cycle) => {
              setIsPricingModalOpen(false);
              setRazorpayCycle(cycle);
              setIsRazorpayModalOpen(true);
            }}
            onGetStarted={() => {
              if (currentUser) {
                navigateTo('dashboard');
              } else {
                setAuthInitialMode('signup');
                setIsAuthModalOpen(true);
              }
            }}
            onGoToDashboard={() => navigateTo('dashboard')}
          />
        </div>
      )}

      {/* Main Container for Dashboard, Details, Analytics */}
      {currentView !== 'landing' && currentView !== 'about' && currentView !== 'pricing' && currentView !== 'public-preview' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorBoundary
            variant="page"
            componentContext="Workspace Main Layout"
            fallbackTitle="Workspace Layout Interrupted"
            fallbackMessage="A runtime failure occurred while rendering the workspace layout. Your documents, versions, and analytics remain securely stored."
            onNavigateHome={() => {
              setCurrentView('dashboard');
              setActiveResume(null);
            }}
            onReset={() => loadUserData()}
          >
        {/* VIEW 1: DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Dashboard Header & KPI Metrics Bar */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left: Platform Title and User Info */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-black bg-[#FFDE59] border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#000]">
                      TRACKD PLATFORM
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 border border-black/30 px-2 py-0.5 rounded">
                      {currentUser?.plan === 'PRO' 
                        ? '★ Pro Edition' 
                        : isTrialActive 
                          ? `★ 7-Day Pro Trial (${trialDaysRemaining}d left)` 
                          : 'Free Plan'}
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-500">
                      @{currentUser?.username || 'user'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-900">
                    Document Repositories
                  </h1>

                  <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                    Git-inspired version control, stable public links, and recruiter view tracking for your resumes, CVs, portfolios, and proposals.
                  </p>

                  {/* Quick Profile Links */}
                  <div className="flex items-center gap-2.5 pt-1 text-black flex-wrap">
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#FFDE59] hover:bg-[#fed330] px-2.5 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] transition-all"
                      title="Edit Profile & Professional Links"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>{currentUser?.name || 'Profile & Links'}</span>
                    </button>

                    {currentUser?.socialLinks?.linkedin && (
                      <a
                        href={currentUser.socialLinks.linkedin.startsWith('http') ? currentUser.socialLinks.linkedin : `https://${currentUser.socialLinks.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] transition-all"
                        title="LinkedIn Profile"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                        <span className="hidden sm:inline">LinkedIn</span>
                      </a>
                    )}

                    {currentUser?.socialLinks?.github && (
                      <a
                        href={currentUser.socialLinks.github.startsWith('http') ? currentUser.socialLinks.github : `https://${currentUser.socialLinks.github}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] transition-all"
                        title="GitHub Profile"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">GitHub</span>
                      </a>
                    )}

                    {currentUser?.socialLinks?.portfolio && (
                      <a
                        href={currentUser.socialLinks.portfolio.startsWith('http') ? currentUser.socialLinks.portfolio : `https://${currentUser.socialLinks.portfolio}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000] transition-all"
                        title="Personal Portfolio"
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Portfolio</span>
                      </a>
                    )}

                    {/* Activity Streak Pill */}
                    <div 
                      className="inline-flex items-center gap-1.5 text-xs font-bold font-mono bg-[#FFF8EE] px-2.5 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]"
                      title="Commit & signal activity frequency"
                    >
                      <Flame className="w-3.5 h-3.5 text-[#FF7A00] fill-[#FF7A00]" />
                      <span>{contributions?.currentStreak || 0}d streak • {contributions?.totalContributions || 0} activities</span>
                    </div>
                  </div>
                </div>

                {/* Right: Live KPI Stat Badges & Quick Action */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-80 shrink-0">
                  <div className="grid grid-cols-3 gap-2.5 flex-1 text-center">
                    <div className="bg-[#FFFDF7] border-2 border-black rounded-lg p-2.5 shadow-[2px_2px_0px_0px_#000]">
                      <span className="block text-2xl font-black font-mono text-black">{resumes.length}</span>
                      <span className="text-[10px] uppercase font-black text-neutral-600">Total Docs</span>
                    </div>
                    <div className="bg-[#FFFDF7] border-2 border-black rounded-lg p-2.5 shadow-[2px_2px_0px_0px_#000]">
                      <span className="block text-2xl font-black font-mono text-emerald-700">
                        {resumes.filter(r => r.publishedVersionId).length}
                      </span>
                      <span className="text-[10px] uppercase font-black text-neutral-600">Published</span>
                    </div>
                    <div className="bg-[#FFFDF7] border-2 border-black rounded-lg p-2.5 shadow-[2px_2px_0px_0px_#000]">
                      <span className="block text-2xl font-black font-mono text-[#FF7A00]">
                        {resumes.reduce((acc, r) => acc + (r.totalViews || 0), 0)}
                      </span>
                      <span className="text-[10px] uppercase font-black text-neutral-600">Total Views</span>
                    </div>
                  </div>

                  <button
                    id="btn-hero-create-resume"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm py-2.5 px-4 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Create New Document</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Plan Entitlement Notice Banner */}
            {currentUser?.plan === 'PRO' ? (
              <div className="bg-[#70EE9C]/30 border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-emerald-700 fill-emerald-600 shrink-0" />
                  <div>
                    <span className="font-black text-neutral-900 block">Trackd Pro Active (Unlimited)</span>
                    <span className="text-neutral-700 font-normal">
                      Full recruiter analytics telemetry, real-time view alerts, and unlimited document tracking active.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsPricingModalOpen(true)}
                  className="font-mono text-xs font-black bg-white hover:bg-neutral-100 px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                >
                  Manage Subscription
                </button>
              </div>
            ) : isTrialActive ? (
              <div 
                id="banner-trial-active"
                className="bg-[#70EE9C]/20 border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#70EE9C] border border-black rounded-lg flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_#000]">
                    <Sparkles className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <span className="font-black text-neutral-900 block">
                      7-Day Full Pro Trial Active • {trialDaysRemaining} Day{trialDaysRemaining === 1 ? '' : 's'} Remaining
                    </span>
                    <span className="text-neutral-700">
                      All Pro features, recruiter telemetry, and unlimited document tracking are unlocked for you.
                    </span>
                  </div>
                </div>

                <button
                  id="btn-banner-pricing"
                  onClick={() => setIsPricingModalOpen(true)}
                  className="self-start sm:self-center flex items-center gap-1.5 bg-[#FFDE59] hover:bg-[#fed330] text-black font-black px-3.5 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all whitespace-nowrap"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>View Pro Plans (From ₹19/mo)</span>
                </button>
              </div>
            ) : (
              <div 
                id="banner-plan-entitlement"
                className="bg-[#FFF8EE] border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#FFDE59] border border-black rounded-lg flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_#000]">
                    <Lock className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <span className="font-black text-neutral-900 block">
                      Free Plan • 7-Day Pro Trial Expired
                    </span>
                    <span className="text-neutral-700">
                      Permanent public links and document downloads stay active forever. Upgrade for real-time recruiter telemetry & alerts.
                    </span>
                  </div>
                </div>

                <button
                  id="btn-banner-upgrade"
                  onClick={() => setIsPricingModalOpen(true)}
                  className="self-start sm:self-center flex items-center gap-1.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black px-3.5 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all whitespace-nowrap"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Unlock Pro (₹19/mo)</span>
                </button>
              </div>
            )}

            {/* Document Filters & Search Header */}
            <div className="border-t-2 border-black pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-mono font-black text-sm shadow-[2px_2px_0px_0px_#FF7A00]">
                    {filteredDocuments.length}
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                      My Documents
                    </h3>
                    <p className="text-xs text-neutral-600">
                      Manage PDF versions, stable URLs, and visitor analytics
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search documents or slugs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-black rounded-lg text-xs font-semibold placeholder:text-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-black"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" />
                  <span>Category:</span>
                </span>

                {(['all', 'resume', 'cv', 'portfolio', 'proposal', 'report', 'other'] as const).map((cat) => {
                  const count = cat === 'all' 
                    ? resumes.length 
                    : resumes.filter(r => (r.category || 'resume') === cat).length;
                  const label = cat === 'all' ? 'All' : cat.toUpperCase();

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg border-2 border-black font-bold whitespace-nowrap transition-all shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] ${
                        selectedCategory === cat 
                          ? 'bg-[#FFDE59] text-black font-black' 
                          : 'bg-white hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="ml-1 text-[10px] font-mono opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Resumes / Documents Grid */}
              {loading ? (
                <div className="text-center py-14 space-y-3">
                  <div className="w-10 h-10 border-4 border-black border-t-[#FF7A00] rounded-full animate-spin mx-auto" />
                  <p className="text-base font-black font-mono text-neutral-900">Checking the signals...</p>
                  <p className="text-xs font-mono text-neutral-600">Watching closely... 👀</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="bg-white border-2 border-black rounded-2xl p-10 text-center max-w-lg mx-auto space-y-4 shadow-[6px_6px_0px_0px_#000]">
                  <div className="w-14 h-14 bg-[#FFDE59] border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#000]">
                    <FileText className="w-7 h-7 text-black stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-neutral-900">
                      {searchQuery || selectedCategory !== 'all' ? 'No matching documents' : "It's suspiciously quiet in here."}
                    </h4>
                    <p className="text-sm font-medium text-neutral-700 mt-1 max-w-sm mx-auto">
                      {searchQuery || selectedCategory !== 'all' 
                        ? 'Try clearing your search query or selecting a different category filter.' 
                        : "Add your first document and we'll start watching."}
                    </p>
                  </div>
                  {searchQuery || selectedCategory !== 'all' ? (
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                      className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs px-4 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                      <span>Add a Document →</span>
                    </button>
                  )}
                </div>
              ) : (
                <ErrorBoundary
                  variant="section"
                  componentContext="Document Repository Gallery"
                  fallbackTitle="Document Gallery Unavailable"
                  fallbackMessage="An error occurred while displaying your documents gallery. You can retry loading or reload your documents."
                  onReset={() => loadUserData()}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocuments.map((doc) => (
                      <ErrorBoundary
                        key={doc._id}
                        variant="card"
                        componentContext={`Document Card: ${doc.name || doc.slug || doc._id}`}
                        fallbackTitle={doc.name || 'Document Record'}
                        fallbackMessage="This document card could not be rendered. Your repository data remains intact."
                        onReset={() => loadUserData()}
                      >
                        <ResumeCard
                          resume={doc}
                          currentUser={currentUser}
                          onSelectResume={selectResume}
                          onOpenAnalytics={openAnalytics}
                          onOpenPublicResume={openPublicResume}
                          onDeleteResume={handleDeleteResume}
                          onCloneResume={(resume) => {
                            setCloningSourceResume(resume);
                            setIsCloneModalOpen(true);
                          }}
                          onOpenPricingModal={() => setIsPricingModalOpen(true)}
                        />
                      </ErrorBoundary>
                    ))}
                  </div>
                </ErrorBoundary>
              )}

              {/* Visual Commit & Signal Contribution Grid (GitHub-style) */}
              <ErrorBoundary
                variant="section"
                componentContext="Activity Contribution Heatmap"
                fallbackTitle="Activity Contribution Grid"
                fallbackMessage="Failed to render activity contribution heatmap."
                onReset={() => loadContributions()}
              >
                <div className="pt-2">
                  <CommitContributionGrid
                    contributions={contributions}
                    loading={loadingContributions}
                    onRefresh={loadContributions}
                  />
                </div>
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* DOCUMENT CONTEXT SUBNAV (Clean document navigation between Versions, Analytics, Public Link) */}
        {(currentView === 'resume-detail' || currentView === 'analytics') && activeResume && (
          <ErrorBoundary
            variant="section"
            componentContext="Document Navigation Subnav"
            fallbackTitle="Document Navigation Subnav"
            onNavigateHome={() => setCurrentView('dashboard')}
          >
            <DocumentSubnav
              currentView={currentView}
              setCurrentView={setCurrentView}
              activeResume={activeResume}
              currentUser={currentUser}
              onOpenPublicResume={openPublicResume}
              onOpenPricingModal={() => setIsPricingModalOpen(true)}
            />
          </ErrorBoundary>
        )}

        {/* VIEW 2: RESUME DETAIL & VERSION TIMELINE */}
        {currentView === 'resume-detail' && activeResume && (
          <ErrorBoundary
            variant="page"
            componentContext={`Document Detail & Version Timeline (${activeResume.name})`}
            fallbackTitle={`Unable to render "${activeResume.name}" versions`}
            fallbackMessage="A runtime failure occurred while rendering document versions or timeline history. You can return to your dashboard or retry loading."
            onNavigateHome={() => {
              setCurrentView('dashboard');
              setActiveResume(null);
            }}
            onReset={async () => {
              const refreshed = await api.getResume(activeResume._id);
              if (refreshed) {
                setActiveResume(refreshed);
                setActiveResumeVersions(refreshed.versions);
              }
            }}
          >
            <div className="animate-in fade-in duration-150">
              <VersionTimeline
                resume={activeResume}
                versions={activeResumeVersions}
                currentUser={currentUser}
                onPublishVersion={handlePublishVersion}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                onViewPdf={(ver) => setViewingPdfVersion(ver)}
                onOpenPublicResume={openPublicResume}
                onVersionReverted={async () => {
                  if (activeResume) {
                    const refreshed = await api.getResume(activeResume._id);
                    if (refreshed) {
                      setActiveResume(refreshed);
                      setActiveResumeVersions(refreshed.versions);
                      setResumes(prev => prev.map(r => r._id === refreshed._id ? refreshed : r));
                    }
                  }
                }}
              />
            </div>
          </ErrorBoundary>
        )}

        {/* VIEW 3: ANALYTICS DASHBOARD */}
        {currentView === 'analytics' && analyticsData && (
          <ErrorBoundary
            variant="page"
            componentContext={`Document Analytics (${activeResume?.name || 'Document'})`}
            fallbackTitle="Analytics Dashboard Error"
            fallbackMessage="A runtime failure occurred while rendering analytics charts. Your view and download records are safely stored."
            onNavigateHome={() => setCurrentView('resume-detail')}
            onReset={async () => {
              if (activeResume) {
                const refreshed = await api.getAnalytics(activeResume._id);
                setAnalyticsData(refreshed);
              }
            }}
          >
            <div className="animate-in fade-in duration-150">
              <AnalyticsView
                analytics={analyticsData}
                onBackToResume={() => setCurrentView('resume-detail')}
                onRefresh={async () => {
                  if (activeResume) {
                    const refreshed = await api.getAnalytics(activeResume._id);
                    setAnalyticsData(refreshed);
                    setActiveResume(prev => prev ? { ...prev, totalViews: refreshed.totalViews, lastViewedAt: refreshed.lastViewedAt } : null);
                    setResumes(prev => prev.map(r => r._id === activeResume._id ? { ...r, totalViews: refreshed.totalViews, lastViewedAt: refreshed.lastViewedAt } : r));
                  }
                }}
                onOpenPricingModal={() => {
                  setRazorpayCycle('monthly');
                  setIsRazorpayModalOpen(true);
                }}
              />
            </div>
          </ErrorBoundary>
        )}

          </ErrorBoundary>
        </main>
      )}

      {/* VIEW 4: PUBLIC RESUME PREVIEW */}
      {currentView === 'public-preview' && publicParams && (
        <div className="animate-in fade-in duration-150">
          <ErrorBoundary
            variant="page"
            componentContext="Public Resume Viewer"
            fallbackTitle="Public Document Preview Failed"
            fallbackMessage="An unexpected error occurred while rendering the public document preview."
            onNavigateHome={() => {
              window.history.pushState({}, '', '/');
              setCurrentView('dashboard');
            }}
          >
            <PublicResumeViewer
              token={publicParams.token}
              username={publicParams.username}
              slug={publicParams.slug}
              onBackToDashboard={() => {
                window.history.pushState({}, '', '/');
                setCurrentView('dashboard');
              }}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Modals */}
      <ErrorBoundary
        variant="section"
        componentContext="Create Document Modal"
        fallbackTitle="Document Creation Dialog Interrupted"
        onReset={() => setIsCreateModalOpen(false)}
      >
        <CreateResumeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateResume}
        />
      </ErrorBoundary>

      {activeResume && (
        <ErrorBoundary
          variant="section"
          componentContext="Upload Version Modal"
          fallbackTitle="Version Upload Dialog Interrupted"
          onReset={() => setIsUploadModalOpen(false)}
        >
          <UploadVersionModal
            isOpen={isUploadModalOpen}
            resumeName={activeResume.name}
            nextVersionLabel={`v${(activeResumeVersions[0]?.versionNumber || 0) + 1}`}
            onClose={() => setIsUploadModalOpen(false)}
            onSubmit={handleUploadVersion}
          />
        </ErrorBoundary>
      )}

      {/* Clone Document Repository Modal */}
      {isCloneModalOpen && cloningSourceResume && (
        <ErrorBoundary
          variant="section"
          componentContext="Clone Document Modal"
          fallbackTitle="Clone Dialog Interrupted"
          onReset={() => {
            setIsCloneModalOpen(false);
            setCloningSourceResume(null);
          }}
        >
          <CloneResumeModal
            isOpen={isCloneModalOpen}
            sourceResume={cloningSourceResume}
            currentUser={currentUser}
            onClose={() => {
              setIsCloneModalOpen(false);
              setCloningSourceResume(null);
            }}
            onClone={handleCloneResume}
          />
        </ErrorBoundary>
      )}

      <ErrorBoundary
        variant="section"
        componentContext="PDF Viewer Modal"
        fallbackTitle="PDF Document Viewer Interrupted"
        fallbackMessage="Failed to render document preview modal."
        onReset={() => setViewingPdfVersion(null)}
      >
        <PdfViewerModal
          version={viewingPdfVersion}
          onClose={() => setViewingPdfVersion(null)}
          onViewRecorded={async (stats) => {
            if (activeResume) {
              const updatedViews = (activeResume.totalViews || 0) + 1;
              setActiveResume(prev => prev ? { ...prev, totalViews: updatedViews, lastViewedAt: stats.lastViewedAt } : null);
              setResumes(prev => prev.map(r => r._id === activeResume._id ? { ...r, totalViews: updatedViews, lastViewedAt: stats.lastViewedAt } : r));
              try {
                const refreshed = await api.getAnalytics(activeResume._id);
                setAnalyticsData(refreshed);
              } catch (e) {
                console.debug('Analytics auto-refresh error:', e);
              }
            }
          }}
        />
      </ErrorBoundary>

      <ErrorBoundary
        variant="section"
        componentContext="Pricing Modal"
        fallbackTitle="Pricing Dialog Interrupted"
        onReset={() => setIsPricingModalOpen(false)}
      >
        <PricingModal
          isOpen={isPricingModalOpen}
          currentPlan={currentUser?.plan || 'FREE'}
          onClose={() => setIsPricingModalOpen(false)}
          onSelectPlan={handleSelectPlan}
          onOpenRazorpay={(cycle) => {
            setIsPricingModalOpen(false);
            setRazorpayCycle(cycle);
            setIsRazorpayModalOpen(true);
          }}
        />
      </ErrorBoundary>

      <ErrorBoundary
        variant="section"
        componentContext="Razorpay Payment Modal"
        fallbackTitle="Payment Dialog Interrupted"
        onReset={() => setIsRazorpayModalOpen(false)}
      >
        <RazorpayModal
          isOpen={isRazorpayModalOpen}
          initialCycle={razorpayCycle}
          onClose={() => setIsRazorpayModalOpen(false)}
          onPaymentSuccess={async () => {
            setIsRazorpayModalOpen(false);
            await loadUserData();
            showToast('Pro Plan Activated! Unlimited tracking unlocked.');
          }}
        />
      </ErrorBoundary>

      <ErrorBoundary
        variant="section"
        componentContext="Authentication Modal"
        fallbackTitle="Authentication Dialog Interrupted"
        onReset={() => setIsAuthModalOpen(false)}
      >
        <AuthModal
          isOpen={isAuthModalOpen}
          currentUser={currentUser}
          initialMode={authInitialMode}
          onClose={() => setIsAuthModalOpen(false)}
          onUserChanged={(user, isNew) => {
            setCurrentUser(user);
            loadUserData();
            if (user) {
              showToast(`Signed in as @${user.username}`);
              if (user.needsFirstTimeSetup || isNew) {
                setIsFirstTimeSetupOpen(true);
              } else {
                navigateTo('dashboard');
              }
            } else {
              showToast('Logged out successfully', 'info');
              navigateTo('landing');
            }
          }}
        />
      </ErrorBoundary>

      {currentUser && (
        <ErrorBoundary
          variant="section"
          componentContext="First Time Setup Modal"
          fallbackTitle="Setup Dialog Interrupted"
          onReset={() => setIsFirstTimeSetupOpen(false)}
        >
          <FirstTimeSetupModal
            isOpen={isFirstTimeSetupOpen || Boolean(currentUser?.needsFirstTimeSetup)}
            currentUser={currentUser}
            onComplete={(updated) => {
              setCurrentUser(updated);
              setIsFirstTimeSetupOpen(false);
              loadUserData();
              navigateTo('dashboard');
              showToast(`Profile updated! Welcome @${updated.username}`);
            }}
          />
        </ErrorBoundary>
      )}

      {currentUser && (
        <ErrorBoundary
          variant="section"
          componentContext="Profile Settings Modal"
          fallbackTitle="Profile Settings Dialog Interrupted"
          onReset={() => setIsProfileModalOpen(false)}
        >
          <ProfileSettingsModal
            isOpen={isProfileModalOpen}
            currentUser={currentUser}
            onClose={() => setIsProfileModalOpen(false)}
            onUserUpdated={(updated) => {
              setCurrentUser(updated);
              showToast('Profile & links saved successfully');
            }}
            onOpenPricingModal={() => {
              setIsProfileModalOpen(false);
              setIsPricingModalOpen(true);
            }}
            onLogout={handleLogout}
            onOpenForgotPassword={() => {
              setIsProfileModalOpen(false);
              setAuthInitialMode('forgot');
              setIsAuthModalOpen(true);
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

