import React, { useState } from 'react';
import { 
  ArrowRight, 
  Check, 
  Sparkles, 
  Lock, 
  GitBranch, 
  FileText, 
  BarChart3, 
  Clock, 
  Calendar, 
  Upload, 
  Star, 
  Eye, 
  Sliders, 
  Mail, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  Code, 
  Zap, 
  ShieldCheck,
  Globe,
  Copy,
  QrCode,
  Download,
  Bell,
  Smartphone,
  Laptop,
  RefreshCw,
  Search,
  Folder,
  Send,
  AlertCircle,
  TrendingUp,
  Flame,
  CheckCircle2,
  Users,
  Compass,
  Layers,
  HelpCircle
} from 'lucide-react';
import type { User } from '../types';
import { 
  SquiggleUnderline, 
  HandDrawnLine,
  DoubleSquiggleLine,
  DoodleCircleLoop,
  DoodleCurlyArrow,
  DoodleArrow,
  DoodleLightbulb,
  DoodleSparkles,
  DoodlePaperPlane,
  DoodleCrown,
  DoodleHeart,
  DoodleCheckBadge,
  DoodleCoffeeMug,
  DoodleTarget,
  DoodleYesBubble, 
  DoodleFace, 
  DoodleFiveStars, 
  DoodleCounting, 
  GoldenKittyBadge, 
  DoodleCelebrationPerson 
} from './TallyDoodles';

interface LandingPageProps {
  currentUser: User | null;
  onGetStarted: () => void;
  onLogin: () => void;
  onGoToDashboard: () => void;
  onGoToAbout: () => void;
  onGoToPricing: () => void;
}

const ALTERNATIVE_HEADLINES = [
  "Stop sending documents into the void.",
  "Send it. Track it. Know what happened.",
  "Your document went out. Now what?",
  "Don't just send. Know.",
  "The document is sent. The waiting game isn't.",
  "Stop wondering. Start tracking.",
  "Because “I sent it” isn't the end of the story."
];

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onGetStarted,
  onLogin,
  onGoToDashboard,
  onGoToAbout,
  onGoToPricing
}) => {
  // Active Headline Picker
  const [headlineIndex, setHeadlineIndex] = useState(0);

  // Live Interactive Hero Studio States
  const [docTitle, setDocTitle] = useState('Senior Full-Stack Engineer Resume');
  const [activeVersion, setActiveVersion] = useState<'v1.0' | 'v1.2' | 'v2.0'>('v2.0');
  const [copiedLink, setCopiedLink] = useState(false);
  const [simulatedAlert, setSimulatedAlert] = useState<string | null>(null);
  const [downloadCount, setDownloadCount] = useState(14);
  const [trackingActive, setTrackingActive] = useState(true);

  // Problem section refresh simulation
  const [refreshCount, setRefreshCount] = useState(3);
  const [refreshWaiting, setRefreshWaiting] = useState(false);

  // Interactive changelog diff in Product Studio
  const [activeDiffTab, setActiveDiffTab] = useState<'summary' | 'experience' | 'skills'>('experience');

  // Interactive Live Signal Simulator (FOMO Section)
  const [activeSignal, setActiveSignal] = useState<'change' | 'attention' | 'followup'>('attention');

  // How it works interactive step
  const [activeStep, setActiveStep] = useState<number>(0);

  // FAQ Accordion open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSimulateRecruiterView = () => {
    setSimulatedAlert('🎉 Recruiter at Stripe (San Francisco) just opened your resume on Chrome / macOS (Reading Time: 3m 42s · Downloaded PDF)');
    setDownloadCount(prev => prev + 1);
    setTimeout(() => setSimulatedAlert(null), 6000);
  };

  const handleSimulateRefresh = () => {
    setRefreshWaiting(true);
    setTimeout(() => {
      setRefreshCount(prev => prev + 1);
      setRefreshWaiting(false);
    }, 600);
  };

  const handlePrimaryCta = () => {
    if (currentUser) {
      onGoToDashboard();
    } else {
      onGetStarted();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-neutral-900 font-sans selection:bg-[#FF7A00] selection:text-black overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b-2 border-black overflow-hidden bg-[#FEF6E4]/50">
        
        {/* Floating Doodles (Desktop & Tablet) */}
        <div className="absolute top-8 left-6 sm:left-12 hidden md:block opacity-90 select-none pointer-events-none">
          <DoodleFace className="w-14 h-14 text-neutral-900" />
        </div>

        <div className="absolute top-10 right-8 sm:right-16 hidden md:block select-none pointer-events-none">
          <DoodleYesBubble className="w-20 h-16" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Eyebrow */}
          <div className="relative inline-flex items-center gap-2 bg-[#FFDE59] border-2 border-black px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-[2px_2px_0px_0px_#000] mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <Sparkles className="w-4 h-4 fill-black text-black" />
            <span className="tracking-wide">Your next opportunity might already be moving.</span>
            <DoodleSparkles className="absolute -top-3.5 -right-5 w-6 h-6 pointer-events-none" />
          </div>

          {/* Headline with Squiggle Underline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 leading-[1.14] mb-6 min-h-[1.2em] transition-all">
            {headlineIndex === 0 ? (
              <>
                Stop sending documents into the{' '}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="relative z-10">void.</span>
                  <SquiggleUnderline 
                    color="#FF7A00" 
                    className="absolute left-0 -bottom-1 sm:-bottom-2.5 w-full h-3 sm:h-4.5 pointer-events-none z-0" 
                  />
                </span>
              </>
            ) : (
              <span className="relative inline-block">
                <span className="relative z-10">{ALTERNATIVE_HEADLINES[headlineIndex]}</span>
                <SquiggleUnderline 
                  color="#FF7A00" 
                  className="absolute left-0 -bottom-1 sm:-bottom-2 w-full h-3 pointer-events-none z-0" 
                />
              </span>
            )}
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-neutral-700 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            Track what matters, see what changed, and know when your document is actually getting attention — before the opportunity disappears.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
            <button
              id="hero-start-tracking-btn"
              onClick={handlePrimaryCta}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-base sm:text-lg px-8 py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_#000] transition-all"
            >
              <span>{currentUser ? 'Open My Documents →' : 'Start Tracking — It’s Free'}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              onClick={onGoToPricing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-100 text-black font-black text-base px-6 py-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <span>View Pricing</span>
            </button>
          </div>

          {/* Supporting Microcopy */}
          <p className="text-xs sm:text-sm font-mono font-bold text-neutral-600 mb-8 italic">
            Free forever. No credit card. Start with up to 2 documents.
          </p>

          {/* Looping Curly Arrow pointing to Interactive Studio */}
          <div className="relative flex justify-center items-center mt-2 mb-2">
            <div className="relative inline-flex items-center gap-2">
              <span className="text-xs font-mono font-black text-neutral-800 bg-[#FFDE59] px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
                Try the interactive studio below ↓
              </span>
              <DoodleCurlyArrow className="w-8 h-8 text-neutral-900 rotate-12" />
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. FOMO STRIP (SCROLLING MARQUEE) */}
      {/* ========================================================================= */}
      <div className="bg-[#FFDE59] border-b-2 border-black py-2.5 overflow-hidden select-none">
        <div className="animate-marquee whitespace-nowrap font-black font-mono text-xs sm:text-sm tracking-wider flex items-center gap-6 text-black">
          <span>YOUR RESUME IS MOVING • YOUR PORTFOLIO IS MOVING • YOUR OPPORTUNITY IS MOVING • DON'T MISS THE SIGNAL • Someone just opened a document. Was it yours? •</span>
          <span>YOUR RESUME IS MOVING • YOUR PORTFOLIO IS MOVING • YOUR OPPORTUNITY IS MOVING • DON'T MISS THE SIGNAL • Someone just opened a document. Was it yours? •</span>
          <span>YOUR RESUME IS MOVING • YOUR PORTFOLIO IS MOVING • YOUR OPPORTUNITY IS MOVING • DON'T MISS THE SIGNAL • Someone just opened a document. Was it yours? •</span>
          <span>YOUR RESUME IS MOVING • YOUR PORTFOLIO IS MOVING • YOUR OPPORTUNITY IS MOVING • DON'T MISS THE SIGNAL • Someone just opened a document. Was it yours? •</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PROBLEM SECTION ("THE AWKWARD PART") */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-white">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FF7A00] text-black px-3.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              THE AWKWARD PART
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-4">
              You clicked Send. Then the guessing started.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* The Guessing Experience */}
            <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000]">
              <div className="space-y-4 text-base sm:text-lg text-neutral-800 font-medium">
                <p className="font-bold text-neutral-900">You sent the resume.</p>
                <p className="font-bold text-neutral-900">You sent the proposal.</p>
                <p className="font-bold text-neutral-900">You sent the portfolio.</p>
                <p className="text-neutral-500 font-mono text-sm pt-2">And now?</p>

                <div className="p-4 bg-red-50 border-2 border-black rounded-xl text-red-900 font-black text-lg sm:text-xl shadow-[3px_3px_0px_0px_#000]">
                  Refresh. Wait. Wonder. Repeat.
                </div>

                <ul className="space-y-2 text-sm sm:text-base text-neutral-700 pt-2 font-mono">
                  <li className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">?</span>
                    <span>Was it opened?</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">?</span>
                    <span>Did they look at the latest version?</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">?</span>
                    <span>Did they ignore it?</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">?</span>
                    <span>Did something change?</span>
                  </li>
                </ul>

                <div className="pt-4 border-t-2 border-black font-black text-xl text-black">
                  You shouldn't have to guess.
                </div>
              </div>
            </div>

            {/* Interactive Refresh Simulator (Visual proof of the pain) */}
            <div className="bg-[#FEF6E4] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000] text-center space-y-6">
              <div className="w-16 h-16 bg-[#FFDE59] border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#000]">
                <RefreshCw className={`w-8 h-8 text-black ${refreshWaiting ? 'animate-spin' : ''}`} />
              </div>

              <div>
                <span className="text-xs font-mono font-black uppercase text-neutral-500">
                  The Anxiety Loop Simulator
                </span>
                <h3 className="text-2xl font-black text-black mt-1">
                  Inbox Refreshed {refreshCount} Times
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-2">
                  Click below to simulate waiting in silence for an ATS or client response.
                </p>
              </div>

              <div className="p-4 bg-white border-2 border-black rounded-xl font-mono text-xs text-neutral-700 shadow-[2px_2px_0px_0px_#000] text-left space-y-1">
                <div className="text-neutral-400">Status: Sent via email attachment</div>
                <div className="text-neutral-800 font-bold">Current Signal: ∅ Silence</div>
                <div className="text-red-600 font-bold">Recruiter Activity: Unknown</div>
              </div>

              <button
                onClick={handleSimulateRefresh}
                className="w-full py-3 bg-white hover:bg-neutral-100 text-black font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Again (Still wondering...)</span>
              </button>

              <div className="text-xs font-mono font-bold text-neutral-500">
                Trackd solves this permanently by streaming live telemetry the second they click.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TRANSITION (BIG STATEMENT) */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFDE59] border-b-2 border-black text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-block relative">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 leading-tight">
              You already did the hard part.
              <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10">Now know what happens next.</span>
                <DoodleCircleLoop color="#FF7A00" className="absolute -left-3 -top-2 w-[105%] h-[120%] pointer-events-none z-0" />
              </span>
            </h2>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PRODUCT INTRODUCTION + INTERACTIVE STUDIO */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-[#FFFDF9]">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#70EE9C] text-black px-3.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              MEET YOUR DOCUMENT'S NEW SIDEKICK
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-4">
              Track the stuff you actually care about.
            </h2>
            <p className="text-neutral-700 font-medium text-base sm:text-lg">
              Keep an eye on your important documents without turning your workflow into a spreadsheet nightmare.
            </p>

            {/* Stepper Formula */}
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0px_0px_#000] mt-6 font-mono font-black text-xs sm:text-sm">
              <span className="text-[#FF7A00]">Upload</span>
              <span>→</span>
              <span className="text-[#FF7A00]">Track</span>
              <span>→</span>
              <span className="text-[#70EE9C] bg-black px-1.5 py-0.5 rounded">Understand</span>
              <span className="text-neutral-500 font-normal ml-1">That's it.</span>
            </div>
          </div>

          {/* Interactive Live Mockup Studio Browser */}
          <div className="bg-white border-2 sm:border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_#000] sm:shadow-[10px_10px_0px_0px_#000] overflow-hidden">
            
            {/* Window Chrome */}
            <div className="bg-[#FEF6E4] border-b-2 border-black px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5C5C] border border-black inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#FFDE59] border border-black inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#70EE9C] border border-black inline-block" />
                </div>
                <span className="text-xs font-mono font-black text-neutral-700 hidden sm:inline ml-2">
                  Trackd Studio — Live Interactive Preview
                </span>
              </div>

              {/* URL Bar */}
              <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg px-3 py-1 text-xs font-mono font-bold shadow-[2px_2px_0px_0px_#000] max-w-full truncate">
                <DoodlePaperPlane className="w-4 h-4 text-[#FF7A00] shrink-0" />
                <span className="text-neutral-500">trackd.app/@</span>
                <span className="text-black font-black">alex/senior-engineer</span>
                <button
                  onClick={handleCopyLink}
                  className="ml-1 p-0.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-black"
                  title="Copy permanent link"
                >
                  {copiedLink ? (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">Copied!</span>
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold bg-[#70EE9C] text-black px-2 py-0.5 rounded border border-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping inline-block" />
                  <span>● WATCHING SIGNALS</span>
                </span>
              </div>
            </div>

            {/* Document Controls */}
            <div className="p-4 sm:p-6 bg-[#FFFDF9] border-b-2 border-black">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Editable Title */}
                <div className="flex-1">
                  <label className="block text-[11px] font-mono font-black uppercase text-neutral-500 mb-1">
                    Document Name (Editable)
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full font-black text-lg sm:text-xl text-neutral-900 bg-white border-2 border-black rounded-lg px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>

                {/* Git Version Switcher */}
                <div className="flex flex-col sm:items-end">
                  <label className="block text-[11px] font-mono font-black uppercase text-neutral-500 mb-1">
                    Select Active Version Tag
                  </label>
                  <div className="inline-flex rounded-lg border-2 border-black p-1 bg-white shadow-[2px_2px_0px_0px_#000]">
                    {(['v1.0', 'v1.2', 'v2.0'] as const).map((ver) => (
                      <button
                        key={ver}
                        onClick={() => setActiveVersion(ver)}
                        className={`px-3 py-1 rounded text-xs font-mono font-black transition-all ${
                          activeVersion === ver
                            ? 'bg-black text-[#FFDE59] shadow-[1px_1px_0px_0px_#FF7A00]'
                            : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                        }`}
                      >
                        {ver} {ver === 'v2.0' && '★ Live'}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Version Commit Message */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-200 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-black bg-[#FFDE59] px-2 py-0.5 rounded border border-black">
                    Commit:
                  </span>
                  <span className="text-neutral-700">
                    {activeVersion === 'v2.0' && 'Refactored distributed infra metrics (+38% cost savings noted)'}
                    {activeVersion === 'v1.2' && 'Tailored for senior staff roles; added Kubernetes leadership'}
                    {activeVersion === 'v1.0' && 'Initial release version for tech applications'}
                  </span>
                </div>
                <span className="text-neutral-500">Updated 2 days ago</span>
              </div>
            </div>

            {/* Document Content View */}
            <div className="p-4 sm:p-6 bg-neutral-50">
              <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[3px_3px_0px_0px_#000] relative">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-black/10 gap-3">
                  <div>
                    <h4 className="text-lg font-black text-black">Alex Mercer</h4>
                    <p className="text-xs font-mono text-neutral-600">
                      alex.mercer@dev · San Francisco, CA · trackd.app/@alex/senior-engineer
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSimulateRecruiterView}
                      className="text-xs font-black bg-[#FF7A00] hover:bg-[#ff851b] text-black px-3 py-1.5 rounded-lg border border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Simulate Recruiter Open</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Alert */}
                {simulatedAlert && (
                  <div className="mt-4 p-3 bg-[#FFDE59] border-2 border-black rounded-lg text-xs font-bold text-neutral-900 shadow-[2px_2px_0px_0px_#000] flex items-center gap-2 animate-bounce">
                    <Bell className="w-4 h-4 text-black shrink-0" />
                    <span>{simulatedAlert}</span>
                  </div>
                )}

                {/* Body Content */}
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-black text-neutral-900">Senior Distributed Systems Lead @ Finscale</span>
                      <span className="text-neutral-500">2022 – Present</span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-700 font-medium mt-1 leading-relaxed">
                      {activeVersion === 'v2.0' ? (
                        <span className="bg-[#70EE9C]/40 px-1 py-0.5 rounded font-bold">
                          [v2.0 Update] Architected real-time event streaming pipeline processing 140M daily events with 99.99% uptime, cutting AWS compute costs by{' '}
                          <span className="relative inline-block px-1">
                            <span className="relative z-10 font-black">38%</span>
                            <DoodleCircleLoop color="#FF7A00" className="absolute -left-1 -top-1 w-11 h-7 pointer-events-none z-0" />
                          </span>.
                        </span>
                      ) : (
                        <span>Built event streaming platform on Node.js and Redis cluster handling 50M requests daily.</span>
                      )}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between text-xs font-mono text-neutral-600 gap-2">
                    <div className="flex items-center gap-4">
                      <span>Telemetry: <strong>{trackingActive ? 'ON' : 'OFF'}</strong></span>
                      <span>Total Reads: <strong>142</strong></span>
                      <span>Downloads: <strong>{downloadCount}</strong></span>
                    </div>
                    <span className="text-[#FF7A00] font-black">One URL · Never Breaks</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Studio Bottom Bar */}
            <div className="bg-[#FEF6E4] border-t-2 border-black px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono font-bold">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>Published to live canonical link in 1 click</span>
              </div>
              <button
                onClick={handlePrimaryCta}
                className="text-black font-black hover:text-[#FF7A00] flex items-center gap-1 hover:underline"
              >
                <span>Track your own document →</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. THE 4 CORE FEATURES (01-KNOW, 02-SEE, 03-MOVE, 04-ORGANIZE) */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-white">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-3.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              SIGNAL-FIRST ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-4">
              Stop guessing. Start knowing.
            </h2>
            <p className="text-neutral-700 font-medium text-base sm:text-lg">
              Four deliberate capabilities engineered so you never lose track of an opportunity again.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* FEATURE 01 — KNOW */}
            <div className="relative bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[5px_5px_0px_0px_#000] flex flex-col justify-between overflow-hidden">
              <DoodleLightbulb className="absolute top-5 right-5 w-8 h-8 text-neutral-800 opacity-80 pointer-events-none" />
              <div>
                <div className="inline-block bg-[#FFDE59] border border-black px-2.5 py-0.5 rounded text-xs font-mono font-black mb-4">
                  01 — KNOW
                </div>
                <h3 className="text-2xl font-black text-neutral-900 mb-3">
                  Know when things change.
                </h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed mb-4">
                  Stop digging through folders trying to remember which version you sent. Track your documents and keep every important change on your radar.
                </p>
              </div>

              <div className="mt-4 p-3 bg-[#FEF6E4] border border-black rounded-xl font-mono text-xs font-black text-neutral-900 shadow-[2px_2px_0px_0px_#000]">
                No more “final_v7_REAL_final.pdf”.
              </div>
            </div>

            {/* FEATURE 02 — SEE */}
            <div className="relative bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[5px_5px_0px_0px_#000] flex flex-col justify-between overflow-hidden">
              <DoodleSparkles className="absolute top-5 right-5 w-8 h-8 text-neutral-800 opacity-80 pointer-events-none" />
              <div>
                <div className="inline-block bg-[#70EE9C] border border-black px-2.5 py-0.5 rounded text-xs font-mono font-black mb-4">
                  02 — SEE
                </div>
                <h3 className="text-2xl font-black text-neutral-900 mb-3">
                  See what's getting attention.
                </h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed mb-4">
                  Your document shouldn't become a black hole after you send it. Get signals that help you understand what's happening — so you can decide what to do next.
                </p>
              </div>

              <div className="mt-4 p-3 bg-[#FEF6E4] border border-black rounded-xl font-mono text-xs font-black text-neutral-900 shadow-[2px_2px_0px_0px_#000]">
                Less guessing. More knowing.
              </div>
            </div>

            {/* FEATURE 03 — MOVE */}
            <div className="relative bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[5px_5px_0px_0px_#000] flex flex-col justify-between overflow-hidden">
              <DoodleTarget className="absolute top-5 right-5 w-8 h-8 text-neutral-800 opacity-80 pointer-events-none" />
              <div>
                <div className="inline-block bg-[#FF7A00] border border-black px-2.5 py-0.5 rounded text-xs font-mono font-black mb-4">
                  03 — MOVE
                </div>
                <h3 className="text-2xl font-black text-neutral-900 mb-3">
                  Catch the moment before it passes.
                </h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed mb-4">
                  Opportunities don't wait forever. When something changes, you'll know. When something needs your attention, you'll see it.
                </p>
              </div>

              <div className="mt-4 p-3 bg-[#FEF6E4] border border-black rounded-xl font-mono text-xs font-black text-neutral-900 shadow-[2px_2px_0px_0px_#000]">
                When it's time to follow up, you won't be three days late.
              </div>
            </div>

            {/* FEATURE 04 — ORGANIZE */}
            <div className="relative bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[5px_5px_0px_0px_#000] flex flex-col justify-between overflow-hidden">
              <DoodleCheckBadge className="absolute top-5 right-5 w-8 h-8 text-neutral-800 opacity-80 pointer-events-none" />
              <div>
                <div className="inline-block bg-[#A0C4FF] border border-black px-2.5 py-0.5 rounded text-xs font-mono font-black mb-4">
                  04 — ORGANIZE
                </div>
                <h3 className="text-2xl font-black text-neutral-900 mb-3">
                  Your documents. Finally under control.
                </h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed mb-4">
                  Everything important in one place. No digging through Downloads. No hunting through Drive. No wondering which file is the latest.
                </p>
              </div>

              <div className="mt-4 p-3 bg-[#FEF6E4] border border-black rounded-xl font-mono text-xs font-black text-neutral-900 shadow-[2px_2px_0px_0px_#000]">
                One place. Zero chaos.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOMO SECTION: "THE SIGNAL YOU DON'T WANT TO MISS" */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-[#FEF6E4]">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FF7A00] text-black px-3.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              THE SIGNAL YOU DON'T WANT TO MISS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-4">
              What if they looked at it... and you never knew?
            </h2>
            <div className="space-y-3 text-base sm:text-lg font-medium text-neutral-700 max-w-xl mx-auto">
              <p>Every day, opportunities move forward.</p>
              <p className="font-bold text-black">Someone opens a resume. Someone checks a proposal. Someone reviews a portfolio. Someone makes a decision.</p>
              <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] text-neutral-900 font-bold">
                The worst part? <span className="font-black text-red-600">You might never know it happened.</span> Until now.
              </div>
            </div>
          </div>

          {/* Interactive Live Signal Simulator */}
          <div className="bg-white border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-black gap-3 mb-6">
              <div>
                <span className="text-xs font-mono font-black text-neutral-500 uppercase">Live Opportunity Signals</span>
                <h3 className="text-xl font-black text-black">Test Notification Signal Types</h3>
              </div>
              <div className="flex gap-2">
                {(['attention', 'change', 'followup'] as const).map((sig) => (
                  <button
                    key={sig}
                    onClick={() => setActiveSignal(sig)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black capitalize transition-all ${
                      activeSignal === sig
                        ? 'bg-[#FFDE59] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
                    }`}
                  >
                    {sig === 'attention' && 'Attention Signal'}
                    {sig === 'change' && 'Change Signal'}
                    {sig === 'followup' && 'Follow-up Signal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Display the active signal banner */}
            <div className="p-5 bg-[#FEF6E4] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] flex items-start gap-4">
              <div className="w-10 h-10 bg-[#FF7A00] border-2 border-black rounded-lg flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
                <Bell className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1">
                {activeSignal === 'attention' && (
                  <>
                    <div className="text-xs font-mono font-black text-[#FF7A00] uppercase tracking-wider">Attention Alert</div>
                    <h4 className="text-base sm:text-lg font-black text-black mt-0.5">You might want to see this.</h4>
                    <p className="text-xs sm:text-sm font-medium text-neutral-700 mt-1">
                      There's new activity on one of your tracked documents. A reviewer in New York just spent 4m 12s on page 2.
                    </p>
                  </>
                )}
                {activeSignal === 'change' && (
                  <>
                    <div className="text-xs font-mono font-black text-emerald-700 uppercase tracking-wider">Change Detected</div>
                    <h4 className="text-base sm:text-lg font-black text-black mt-0.5">👀 Something changed</h4>
                    <p className="text-xs sm:text-sm font-medium text-neutral-700 mt-1">
                      We spotted new activity on this document. The client reopened your proposal after 48 hours of silence.
                    </p>
                  </>
                )}
                {activeSignal === 'followup' && (
                  <>
                    <div className="text-xs font-mono font-black text-purple-700 uppercase tracking-wider">Smart Timing Signal</div>
                    <h4 className="text-base sm:text-lg font-black text-black mt-0.5">Still waiting?</h4>
                    <p className="text-xs sm:text-sm font-medium text-neutral-700 mt-1">
                      It might be time to follow up. Your document was reviewed twice today by team members in the same company IP range.
                    </p>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SOCIAL PROOF STYLE SECTION */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-white">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-3.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              AUDIENCE MATCH
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-3">
              Built for people who hate waiting.
            </h2>
            <p className="text-neutral-700 font-medium">
              Whoever you are, Trackd gives you clear, actionable certainty.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Job Seekers */}
            <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#FFDE59] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] mb-4">
                  <FileText className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-neutral-900 mb-2">Job seekers</h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                  Know what's happening after you hit apply.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-neutral-200 text-xs font-mono font-bold text-neutral-600">
                Zero guessing games
              </div>
            </div>

            {/* Freelancers */}
            <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#70EE9C] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] mb-4">
                  <TrendingUp className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-neutral-900 mb-2">Freelancers</h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                  Know which proposals deserve a follow-up.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-neutral-200 text-xs font-mono font-bold text-neutral-600">
                Time client calls perfectly
              </div>
            </div>

            {/* Creators */}
            <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#FF7A00] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] mb-4">
                  <Layers className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-neutral-900 mb-2">Creators</h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                  Keep track of the work you're sending out.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-neutral-200 text-xs font-mono font-bold text-neutral-600">
                Portfolios on canonical links
              </div>
            </div>

            {/* Founders */}
            <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#A0C4FF] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] mb-4">
                  <Compass className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-neutral-900 mb-2">Founders</h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                  Stay on top of important documents without the chaos.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-neutral-200 text-xs font-mono font-bold text-neutral-600">
                Confidential pitch decks
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. HOW IT WORKS: "THREE CLICKS BETWEEN SENT AND IN THE KNOW" */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-[#FEF6E4]">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FF7A00] text-black px-3.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              EFFORTLESS ONBOARDING
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-3">
              Three clicks between “sent” and “in the know.”
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 01 */}
            <div 
              onClick={() => setActiveStep(0)}
              className={`p-6 sm:p-8 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] cursor-pointer transition-all ${
                activeStep === 0 ? 'ring-2 ring-black bg-[#FFFDF7]' : 'hover:-translate-y-1'
              }`}
            >
              <div className="text-3xl sm:text-4xl font-black font-mono text-[#FF7A00] mb-3">01</div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">Add it.</h3>
              <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                Drop in the document that matters.
              </p>
              <div className="mt-6 font-mono text-xs font-bold text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                PDF upload in 5 seconds
              </div>
            </div>

            {/* Step 02 */}
            <div 
              onClick={() => setActiveStep(1)}
              className={`p-6 sm:p-8 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] cursor-pointer transition-all ${
                activeStep === 1 ? 'ring-2 ring-black bg-[#FFFDF7]' : 'hover:-translate-y-1'
              }`}
            >
              <div className="text-3xl sm:text-4xl font-black font-mono text-[#FFDE59] mb-3">02</div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">Track it.</h3>
              <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                Let us keep an eye on it.
              </p>
              <div className="mt-6 font-mono text-xs font-bold text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                We're watching it 24/7
              </div>
            </div>

            {/* Step 03 */}
            <div 
              onClick={() => setActiveStep(2)}
              className={`p-6 sm:p-8 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] cursor-pointer transition-all ${
                activeStep === 2 ? 'ring-2 ring-black bg-[#FFFDF7]' : 'hover:-translate-y-1'
              }`}
            >
              <div className="text-3xl sm:text-4xl font-black font-mono text-[#70EE9C] mb-3">03</div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">Know.</h3>
              <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                Get the signal when something worth knowing happens.
              </p>
              <div className="mt-6 font-mono text-xs font-bold text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                Instant actionable certainty
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. ANALYTICS SECTION: "YOUR DOCUMENTS HAVE A STORY" */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-white">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-3.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              YOUR DOCUMENTS HAVE A STORY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-3">
              See the activity behind the file.
            </h2>
            <p className="text-neutral-700 font-medium text-base sm:text-lg">
              Instead of staring at a filename, see the bigger picture.
            </p>
          </div>

          {/* Stats Box */}
          <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#000]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-black/10">
              
              <div className="pt-4 sm:pt-0 sm:px-4">
                <div className="text-5xl sm:text-6xl font-black font-mono text-neutral-900 mb-1">
                  12
                </div>
                <div className="text-sm font-bold text-neutral-600">Documents tracked</div>
              </div>

              <div className="pt-4 sm:pt-0 sm:px-4">
                <div className="text-5xl sm:text-6xl font-black font-mono text-[#FF7A00] mb-1">
                  48
                </div>
                <div className="text-sm font-bold text-neutral-600">Changes detected</div>
              </div>

              <div className="pt-4 sm:pt-0 sm:px-4">
                <div className="text-5xl sm:text-6xl font-black font-mono text-emerald-700 mb-1">
                  24%
                </div>
                <div className="text-sm font-bold text-neutral-600">More activity this week</div>
              </div>

            </div>

            {/* Microcopy Callout */}
            <div className="mt-8 pt-6 border-t-2 border-black/10 text-center">
              <span className="inline-block bg-[#FEF6E4] border-2 border-black px-4 py-1.5 rounded-full font-black text-sm sm:text-base shadow-[2px_2px_0px_0px_#000]">
                The file is quiet. The data isn't.
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOMO / URGENCY SECTION */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-[#FFDE59] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 mb-4">
            The opportunity won't wait for you to check again.
          </h2>
          <p className="text-lg sm:text-xl text-neutral-800 font-medium mb-8">
            You could keep refreshing. Or you could let your documents tell you when something matters.
          </p>

          <button
            onClick={handlePrimaryCta}
            className="inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 text-[#FFDE59] font-black text-base sm:text-lg px-8 py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#FF7A00] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <span>Start Tracking Free →</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. PRICING PLANS & PRICING FOMO */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-white">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mb-3">
              Start free. Upgrade when you need it.
            </h2>
            <p className="text-neutral-700 font-medium text-base sm:text-lg">
              Transparent, fair, no sneaky surprise paywalls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* FREE PLAN */}
            <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-2.5 py-0.5 rounded border border-black">
                  START FREE
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 mt-3 mb-2">
                  Two documents. Zero excuses.
                </h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed mb-6">
                  Track your first two important documents completely free. No credit card. No complicated setup. No “free trial ends tomorrow” nonsense. Just start.
                </p>

                <div className="text-4xl font-black font-mono text-black mb-6">
                  ₹0 <span className="text-sm font-sans font-bold text-neutral-500">/ forever</span>
                </div>

                <ul className="space-y-2.5 text-sm font-bold text-neutral-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>2 Tracked Documents</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Permanent canonical link</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Git version timeline history</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Basic view activity counts</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-neutral-200">
                <button
                  onClick={handlePrimaryCta}
                  className="w-full py-3.5 bg-white hover:bg-neutral-100 text-black font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  Track My First Document →
                </button>
              </div>
            </div>

            {/* PRO PLAN */}
            <div className="relative bg-[#FEF6E4] border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_#000] flex flex-col justify-between">
              
              {/* Doodle Crown */}
              <div className="absolute -top-8 right-6 select-none pointer-events-none">
                <DoodleCrown className="w-8 h-8 text-[#FF7A00] rotate-12" />
              </div>

              <div>
                <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FF7A00] text-black px-2.5 py-0.5 rounded border border-black">
                  WHEN TWO ISN'T ENOUGH
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 mt-3 mb-2">
                  Got more documents? We've got you.
                </h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed mb-6">
                  Upgrade when you need more. Full telemetry, instant alerts, and unlimited document repositories.
                </p>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black font-mono text-black">₹19</span>
                  <span className="text-sm font-sans font-bold text-neutral-600">/ month</span>
                </div>

                <div className="inline-block bg-[#70EE9C] text-black text-xs font-black px-2.5 py-1 rounded border border-black mb-6">
                  Plus: Get 1 month free.
                </div>

                <ul className="space-y-2.5 text-sm font-bold text-neutral-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>Unlimited tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>Advanced analytics (duration & geo)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>More insights & read receipt alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>Everything in Free included</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-black/10">
                <button
                  onClick={onGoToPricing}
                  className="w-full py-3.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  Go Pro →
                </button>
              </div>
            </div>

          </div>

          {/* Pricing FOMO Callout */}
          <div className="mt-12 p-6 bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] text-center max-w-2xl mx-auto">
            <h4 className="text-xl font-black text-neutral-900 mb-2">
              Why pay after you miss the opportunity?
            </h4>
            <p className="text-sm text-neutral-700 font-medium">
              The free plan lets you start. Pro gives you room to keep going. Start free. Upgrade when you need it.
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FREQUENTLY ASKED QUESTIONS */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-[#FEF6E4]">
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center mb-14">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-3.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              CLEAR ANSWERS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-3">
              Questions & Answers
            </h2>
            <p className="text-neutral-700 font-medium">
              Everything you need to know about links, versioning, and privacy.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Will my public links break when I upload a new version?",
                a: "Never! Your canonical link (e.g. trackd.app/@yourname/resume) always serves your currently published version. When you upload a new version, you can review it in draft mode or publish it immediately. Recruiter links update seamlessly without breaking."
              },
              {
                q: "Can recruiters tell that I am tracking their views?",
                a: "No. The document viewer appears completely clean, distraction-free, and professional. We do not display intrusive tracking banners or popups. The telemetry is lightweight server-side analytics."
              },
              {
                q: "Can I roll back to an earlier resume version if needed?",
                a: "Yes! Trackd keeps your full version history. If you realize an older version worked better for a specific type of application, you can re-publish any previous version with a single click."
              },
              {
                q: "What types of documents can I host on Trackd?",
                a: "Trackd supports any PDF document: Software Engineering CVs, Product Design Portfolios, Freelance Proposals, Executive Resumes, Pitch Decks, Research Papers, and Technical Whitepapers."
              },
              {
                q: "How does the Free tier work?",
                a: "Trackd is free forever with up to 2 active tracked documents, unlimited version releases per document, canonical links, and view counts. Upgrade to Pro when you need unlimited documents and advanced telemetry."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="border-2 border-black rounded-xl bg-white shadow-[3px_3px_0px_0px_#000] overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-5 flex items-center justify-between font-black text-base sm:text-lg text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-sm sm:text-base font-medium text-neutral-700 leading-relaxed border-t border-neutral-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 14. FINAL CTA: "YOUR NEXT MOVE" */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-b-2 border-black text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          
          <div className="flex justify-center mb-6">
            <DoodleCelebrationPerson className="w-24 h-24 text-neutral-900" />
          </div>

          <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-3.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            YOUR NEXT MOVE
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 mt-4 mb-4">
            Don't send it and forget it.
          </h2>

          <p className="text-lg sm:text-xl text-neutral-700 font-medium max-w-xl mx-auto mb-8 leading-relaxed">
            Track it. Watch it. Know what's happening. And be ready when the opportunity moves.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handlePrimaryCta}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-base sm:text-lg px-8 py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
            >
              <span>Start Tracking — Free</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="mt-4 text-xs font-mono font-bold text-neutral-500">
            *Your first 2 documents are on us.
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 15. FOOTER WITH SPECIFIED TAGLINES */}
      {/* ========================================================================= */}
      <footer className="bg-[#FEF6E4] py-16 px-4 sm:px-6 lg:px-8 border-b-2 border-black">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b-2 border-black/10">
            
            {/* Col 1: Brand & Bio */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[#FF7A00] border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                  <GitBranch className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <span className="font-extrabold text-xl tracking-tight">Trackd</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-neutral-700 leading-relaxed mb-4">
                The simplest way to version, publish, and track your documents.
              </p>
              <div className="text-xs font-mono font-bold text-neutral-500">
                © {new Date().getFullYear()} Trackd.
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <div className="font-mono text-xs font-black uppercase tracking-wider text-neutral-500 mb-4">
                PRODUCT
              </div>
              <ul className="space-y-2.5 text-sm font-bold">
                <li>
                  <button onClick={handlePrimaryCta} className="hover:text-[#FF7A00] hover:underline">
                    {currentUser ? 'Open Workspace' : 'Track My First Document'}
                  </button>
                </li>
                {!currentUser && (
                  <>
                    <li>
                      <button onClick={onGoToPricing} className="hover:text-[#FF7A00] hover:underline">
                        Pricing Plans
                      </button>
                    </li>
                    <li>
                      <button onClick={onGoToAbout} className="hover:text-[#FF7A00] hover:underline">
                        About Us
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Col 3: Capabilities */}
            <div>
              <div className="font-mono text-xs font-black uppercase tracking-wider text-neutral-500 mb-4">
                CAPABILITIES
              </div>
              <ul className="space-y-2.5 text-sm font-bold text-neutral-700">
                <li>01 — Know when things change</li>
                <li>02 — See what gets attention</li>
                <li>03 — Catch the moment</li>
                <li>04 — One place, zero chaos</li>
              </ul>
            </div>

            {/* Col 4: Community */}
            <div>
              <div className="font-mono text-xs font-black uppercase tracking-wider text-neutral-500 mb-4">
                COMMUNITY
              </div>
              <ul className="space-y-2.5 text-sm font-bold text-neutral-700">
                <li>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-black flex items-center gap-1.5">
                    <span>GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
                <li>
                  <a href="mailto:support@trackd.app" className="hover:text-black flex items-center gap-1.5">
                    <span>Contact Team</span>
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Footer Taglines */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <span className="text-base sm:text-lg font-black text-black block">
                Send less into the unknown.
              </span>
              <span className="text-xs font-mono font-bold text-neutral-600">
                Less guessing. More knowing. • Your documents have signals. We help you see them.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black bg-[#70EE9C] text-black px-2.5 py-1 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
                Stop refreshing. Start knowing.
              </span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
