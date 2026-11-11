import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  ChevronDown, 
  Flame, 
  Layers, 
  ShieldCheck, 
  Globe, 
  Star,
  LayoutGrid
} from 'lucide-react';
import { 
  SquiggleUnderline, 
  DoodleCircleLoop,
  DoodleCurlyArrow,
  DoodleCrown,
  DoodleCheckBadge,
  DoodleCelebrationPerson 
} from './TallyDoodles';
import type { User, PlanType, SubscriptionCycle } from '../types';

interface PricingPageProps {
  currentUser: User | null;
  onSelectPlan: (plan: PlanType) => Promise<void>;
  onOpenRazorpay: (cycle: SubscriptionCycle) => void;
  onGetStarted: () => void;
  onGoToDashboard: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  currentUser,
  onSelectPlan,
  onOpenRazorpay,
  onGetStarted,
  onGoToDashboard
}) => {
  const [billingCycle, setBillingCycle] = useState<SubscriptionCycle>('yearly');
  const [viewMode, setViewMode] = useState<'stack' | 'grid'>('grid');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrollY, setScrollY] = useState(0);
  const isPro = currentUser?.plan === 'PRO';

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleProCheckout = (cycleToUse?: SubscriptionCycle) => {
    onOpenRazorpay(cycleToUse || billingCycle);
  };

  const handleFreeSelect = () => {
    if (currentUser) {
      onGoToDashboard();
    } else {
      onGetStarted();
    }
  };

  const getProPriceDisplay = () => {
    switch (billingCycle) {
      case 'launch_offer':
        return { price: '₹29', period: '/ 2 months', note: '₹14.50/mo · Special launch offer' };
      case 'monthly':
        return { price: '₹19', period: '/ month', note: 'Flexible monthly billing · Cancel anytime' };
      case 'six_month':
        return { price: '₹99', period: '/ 6 months', note: '₹16.50/mo · Save 13%' };
      case 'yearly':
      default:
        return { price: '₹185', period: '/ year', note: '₹15.40/mo · Save 19% · Best value' };
    }
  };

  const proPrice = getProPriceDisplay();

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-neutral-900 font-sans selection:bg-[#FF7A00] selection:text-black">
      {/* Hero Header */}
      <section className="pt-14 pb-10 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-[#FEF6E4] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#FFDE59] border-2 border-black px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-[2px_2px_0px_0px_#000] mb-5">
            <Sparkles className="w-4 h-4 fill-black" />
            <span>TRANSPARENT, HONEST PRICING</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 leading-[1.15] mb-5">
            Invest in your career.{' '}
            <span className="relative inline-block whitespace-nowrap text-[#FF7A00]">
              <span className="relative z-10">Never send a broken link.</span>
              <SquiggleUnderline 
                color="#000000" 
                className="absolute left-0 -bottom-1 sm:-bottom-2 w-full h-3 sm:h-4 pointer-events-none z-0" 
              />
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-700 max-w-xl mx-auto font-medium leading-relaxed mb-6">
            Permanent document storage and version commits are 100% free forever. Upgrade to Pro for recruiter dwell telemetry and real-time read receipts.
          </p>

          {/* Launch Offer Pill */}
          <div className="inline-flex items-center gap-2.5 bg-black text-white px-4 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#FF7A00]">
            <Flame className="w-4 h-4 text-[#FF7A00] fill-[#FF7A00]" />
            <span className="text-xs sm:text-sm font-black">
              Limited-Time Launch Special: Full Pro for ₹29 / 2 Months
            </span>
            <button
              onClick={() => handleProCheckout('launch_offer')}
              className="ml-2 bg-[#FF7A00] text-black font-black text-xs px-2.5 py-1 rounded-lg hover:bg-[#ff851b] transition-all"
            >
              Claim ₹29
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Controller Bar with Parallax View Toggle */}
      <div className="sticky top-16 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b-2 border-black py-3 px-4 shadow-[0_3px_0px_0px_#000]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Billing Cycle Selector */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] overflow-x-auto max-w-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                billingCycle === 'monthly'
                  ? 'bg-black text-[#FFDE59] shadow-[1.5px_1.5px_0px_0px_#FF7A00]'
                  : 'text-neutral-700 hover:text-black'
              }`}
            >
              Monthly (₹19/mo)
            </button>
            <button
              onClick={() => setBillingCycle('six_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                billingCycle === 'six_month'
                  ? 'bg-black text-[#FFDE59] shadow-[1.5px_1.5px_0px_0px_#FF7A00]'
                  : 'text-neutral-700 hover:text-black'
              }`}
            >
              6 Months (₹99)
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                billingCycle === 'yearly'
                  ? 'bg-black text-[#FFDE59] shadow-[1.5px_1.5px_0px_0px_#FF7A00]'
                  : 'text-neutral-700 hover:text-black'
              }`}
            >
              <span>Yearly (₹185/yr)</span>
              <span className="bg-[#70EE9C] text-black text-[9px] px-1 rounded font-black uppercase">
                Save 19%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('launch_offer')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                billingCycle === 'launch_offer'
                  ? 'bg-[#FF7A00] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                  : 'text-neutral-700 hover:text-black'
              }`}
            >
              <Flame className="w-3 h-3 fill-black text-black" />
              <span>Offer (₹29)</span>
            </button>
          </div>

          {/* View Mode Toggle: Sticky Stack Parallax vs Grid */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wider hidden md:inline">
              Layout:
            </span>
            <div className="inline-flex items-center bg-white p-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              <button
                onClick={() => setViewMode('stack')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  viewMode === 'stack'
                    ? 'bg-[#FFDE59] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Sticky Parallax Card Deck"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sticky Parallax</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#FFDE59] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Standard 3-Column Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Pricing Plans Section */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-white relative">
        {viewMode === 'stack' ? (
          /* ========================================================================= */
          /* STICKY PARALLAX STACKING CARDS DECK                                        */
          /* ========================================================================= */
          <div className="max-w-4xl mx-auto space-y-12 relative pb-20">
            {/* Card 1: Free Forever Plan */}
            <div 
              className="sticky top-32 z-10 bg-[#FFFDF9] border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000] transition-transform duration-200"
              style={{
                transform: scrollY > 300 ? 'scale(0.985)' : 'scale(1)',
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-black/10">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-black uppercase bg-[#FFDE59] border border-black px-2.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000]">
                      STARTER
                    </span>
                    <span className="text-xs font-bold text-neutral-500 font-mono">01 OF 03</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-neutral-900">
                    Trackd Free
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-neutral-600 mt-0.5">
                    Permanent canonical links, version history, and QR codes.
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <div className="flex items-baseline gap-1 md:justify-end">
                    <span className="text-4xl sm:text-5xl font-black text-neutral-900">₹0</span>
                    <span className="text-sm font-bold text-neutral-500">/ forever</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 block">
                    7-Day Pro Trial automatically included
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-6 text-xs sm:text-sm font-bold text-neutral-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Unlimited Document Uploads & Commits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Permanent Canonical Links (<code>trackd.app/view/:token</code>)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Git Version Timeline & Revisions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Vector & PNG QR Code Generator</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-neutral-500 hidden sm:inline">
                  Free forever with zero credit card required
                </span>
                <button
                  onClick={handleFreeSelect}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-black bg-white hover:bg-neutral-100 font-black text-xs sm:text-sm text-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all ml-auto"
                >
                  Start Free (7-Day Pro Trial) →
                </button>
              </div>
            </div>

            {/* Card 2: Trackd Pro (Highlighted with Parallax Depth) */}
            <div 
              className="sticky top-40 z-20 bg-[#FEF6E4] border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[10px_10px_0px_0px_#000] relative transition-transform duration-200"
              style={{
                transform: scrollY > 600 ? 'scale(0.99)' : 'scale(1)',
              }}
            >
              {/* Doodle Crown */}
              <div className="absolute -top-7 right-8 select-none pointer-events-none hidden sm:block">
                <DoodleCrown className="w-9 h-9 text-[#FF7A00] rotate-12" />
              </div>

              {/* Recommended Badge */}
              <div className="absolute -top-3.5 left-8 bg-[#FF7A00] text-black border-2 border-black px-3.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>Recommended Choice</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-black/20 pt-2">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-black uppercase bg-[#70EE9C] border border-black px-2.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000]">
                      PRO TELEMETRY
                    </span>
                    <span className="text-xs font-bold text-neutral-600 font-mono">02 OF 03</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-neutral-900">
                    Trackd Pro Edition
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-neutral-800 mt-0.5">
                    Live dwell reading duration, geo & device telemetry, and read receipt notifications.
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <div className="flex items-baseline gap-1 md:justify-end">
                    <span className="text-4xl sm:text-5xl font-black text-neutral-900">
                      {proPrice.price}
                    </span>
                    <span className="text-sm font-bold text-neutral-700">
                      {proPrice.period}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-800 block">
                    {proPrice.note}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-6 text-xs sm:text-sm font-black text-neutral-900">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5] shrink-0" />
                  <span>Uninterrupted Recruiter Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5] shrink-0" />
                  <span>Real-Time Reading Duration (Seconds/Minutes)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5] shrink-0" />
                  <span>Geographic City/Country Breakdown & Device Types</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5] shrink-0" />
                  <span>Separate PDF Download Tracking & Ratios</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5] shrink-0" />
                  <span>Passcode Lock for Confidential Documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5] shrink-0" />
                  <span>Everything in Free Forever</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-bold text-neutral-700">
                  Instant UPI (Google Pay, PhonePe, Paytm), Cards & NetBanking supported.
                </span>
                <button
                  onClick={() => handleProCheckout()}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl border-2 border-black bg-[#FF7A00] hover:bg-[#ff851b] font-black text-sm text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-2 ml-auto"
                >
                  <span>{isPro ? 'Manage Active Pro Plan' : `Upgrade to Pro (${proPrice.price})`}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Card 3: Teams & Studios */}
            <div className="sticky top-48 z-30 bg-[#FFFDF9] border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[12px_12px_0px_0px_#000]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-black/10">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-black uppercase bg-neutral-200 border border-black px-2.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000]">
                      ORGANIZATION
                    </span>
                    <span className="text-xs font-bold text-neutral-500 font-mono">03 OF 03</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-neutral-900">
                    Teams & Studios
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-neutral-600 mt-0.5">
                    For boutique agencies, recruiter teams, and startups.
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <div className="flex items-baseline gap-1 md:justify-end">
                    <span className="text-4xl sm:text-5xl font-black text-neutral-900">₹1,999</span>
                    <span className="text-sm font-bold text-neutral-500">/ month</span>
                  </div>
                  <span className="text-[11px] font-bold text-neutral-500 block">
                    Billed annually or ₹2,499 monthly
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-6 text-xs sm:text-sm font-bold text-neutral-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />
                  <span>Up to 5 Team Member Seats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />
                  <span>Custom Domain CNAME (<code>docs.yourbrand.com</code>)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />
                  <span>Consolidated Team Analytics Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />
                  <span>CSV Telemetry Export & Priority Support</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-neutral-500 hidden sm:inline">
                  White-labeled links and custom branding
                </span>
                <button
                  onClick={() => handleProCheckout('yearly')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-black bg-white hover:bg-neutral-100 font-black text-xs sm:text-sm text-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all ml-auto"
                >
                  Start Team Workspace →
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STANDARD 3-COLUMN GRID VIEW                                                */
          /* ========================================================================= */
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Free */}
            <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000] flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-black uppercase bg-[#FFDE59] border border-black px-2.5 py-1 rounded">
                  STARTER
                </span>
                <h3 className="text-2xl font-black text-neutral-900 mt-3 mb-2">Trackd Free</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black">₹0</span>
                  <span className="text-xs text-neutral-500 font-bold">/ forever</span>
                </div>
                <ul className="space-y-2.5 text-xs font-bold text-neutral-800 border-t-2 border-neutral-200 pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Unlimited Document Uploads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Permanent Canonical Links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Git Version Timeline Revisions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Vector QR Code Generator</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleFreeSelect}
                className="w-full py-3 rounded-xl border-2 border-black bg-white hover:bg-neutral-100 font-black text-xs shadow-[2px_2px_0px_0px_#000]"
              >
                Start Free (7-Day Pro Trial)
              </button>
            </div>

            {/* Pro */}
            <div className="bg-[#FEF6E4] border-3 border-black rounded-2xl p-6 sm:p-7 shadow-[9px_9px_0px_0px_#000] flex flex-col justify-between relative transform lg:-translate-y-2">
              {/* Doodle Crown */}
              <div className="absolute -top-7 right-6 select-none pointer-events-none hidden sm:block">
                <DoodleCrown className="w-8 h-8 text-[#FF7A00] rotate-12" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-black uppercase bg-[#FF7A00] text-black border border-black px-2.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000]">
                    PRO EDITION
                  </span>
                  <span className="text-[10px] font-black bg-[#70EE9C] text-black px-2 py-0.5 rounded border border-black">
                    Recommended
                  </span>
                </div>
                <h3 className="text-2xl font-black text-neutral-900 mb-2">Trackd Pro</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black">{proPrice.price}</span>
                  <span className="text-xs text-neutral-600 font-bold">{proPrice.period}</span>
                </div>
                <p className="text-[11px] font-black text-emerald-800 mb-4">{proPrice.note}</p>
                <ul className="space-y-2.5 text-xs font-black text-neutral-900 border-t-2 border-black/20 pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5]" />
                    <span>Uninterrupted Recruiter Telemetry</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5]" />
                    <span>Live Dwell Reading Duration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5]" />
                    <span>Geo Location & Device Breakdown</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5]" />
                    <span>PDF Download Tracking & Alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#FF7A00] stroke-[3.5]" />
                    <span>Passcode Protection</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleProCheckout()}
                className="w-full py-3.5 rounded-xl border-2 border-black bg-[#FF7A00] hover:bg-[#ff851b] font-black text-xs shadow-[3px_3px_0px_0px_#000] flex items-center justify-center gap-1.5"
              >
                <span>Upgrade to Pro ({proPrice.price})</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            {/* Teams */}
            <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000] flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-black uppercase bg-neutral-200 border border-black px-2.5 py-1 rounded">
                  STUDIOS
                </span>
                <h3 className="text-2xl font-black text-neutral-900 mt-3 mb-2">Teams & Studios</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black">₹1,999</span>
                  <span className="text-xs text-neutral-500 font-bold">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs font-bold text-neutral-800 border-t-2 border-neutral-200 pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>Up to 5 Team Member Seats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>Custom Domain (docs.domain.com)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>Consolidated Analytics Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>CSV Export & Priority Support</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleProCheckout('yearly')}
                className="w-full py-3 rounded-xl border-2 border-black bg-white hover:bg-neutral-100 font-black text-xs shadow-[2px_2px_0px_0px_#000]"
              >
                Start Team Workspace
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Feature Comparison Matrix (Clean, Streamlined) */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-[#FEF6E4]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-mono font-black uppercase bg-[#FFDE59] px-3 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              FEATURE COMPARISON
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 mt-3">
              Everything side-by-side
            </h2>
          </div>

          <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_#000]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-[#FFFDF9] text-xs sm:text-sm font-black text-neutral-900">
                    <th className="p-3.5 sm:p-4 w-1/2">Capability</th>
                    <th className="p-3.5 sm:p-4 text-center border-l-2 border-black">Free (₹0)</th>
                    <th className="p-3.5 sm:p-4 text-center bg-[#FFDE59]/30 border-l-2 border-black">Pro ({proPrice.price})</th>
                    <th className="p-3.5 sm:p-4 text-center border-l-2 border-black">Teams (₹1,999)</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-t-2 border-black text-xs font-bold">
                  <tr>
                    <td className="p-3.5 text-neutral-800">Permanent PDF Hosting & Commits</td>
                    <td className="p-3.5 text-center font-mono border-l-2 border-black">Unlimited</td>
                    <td className="p-3.5 text-center font-mono font-black text-emerald-700 bg-[#FFDE59]/20 border-l-2 border-black">Unlimited</td>
                    <td className="p-3.5 text-center font-mono font-black text-emerald-700 border-l-2 border-black">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 text-neutral-800">Canonical Links & QR Codes</td>
                    <td className="p-3.5 text-center border-l-2 border-black">✓</td>
                    <td className="p-3.5 text-center font-black bg-[#FFDE59]/20 border-l-2 border-black">✓</td>
                    <td className="p-3.5 text-center font-black border-l-2 border-black">✓</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 text-neutral-800">Recruiter Session Dwell Time (Duration)</td>
                    <td className="p-3.5 text-center text-neutral-400 border-l-2 border-black">—</td>
                    <td className="p-3.5 text-center font-black text-emerald-700 bg-[#FFDE59]/20 border-l-2 border-black">✓</td>
                    <td className="p-3.5 text-center font-black text-emerald-700 border-l-2 border-black">✓</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 text-neutral-800">Geographic & Device Intelligence</td>
                    <td className="p-3.5 text-center text-neutral-400 border-l-2 border-black">—</td>
                    <td className="p-3.5 text-center font-black text-emerald-700 bg-[#FFDE59]/20 border-l-2 border-black">✓</td>
                    <td className="p-3.5 text-center font-black text-emerald-700 border-l-2 border-black">✓</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 text-neutral-800">Download Telemetry Events</td>
                    <td className="p-3.5 text-center text-neutral-400 border-l-2 border-black">—</td>
                    <td className="p-3.5 text-center font-black text-emerald-700 bg-[#FFDE59]/20 border-l-2 border-black">✓</td>
                    <td className="p-3.5 text-center font-black text-emerald-700 border-l-2 border-black">✓</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 text-neutral-800">Passcode Protection</td>
                    <td className="p-3.5 text-center text-neutral-400 border-l-2 border-black">—</td>
                    <td className="p-3.5 text-center font-black text-emerald-700 bg-[#FFDE59]/20 border-l-2 border-black">✓</td>
                    <td className="p-3.5 text-center font-black text-emerald-700 border-l-2 border-black">✓</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 text-neutral-800">Custom Domain & Team Seats</td>
                    <td className="p-3.5 text-center text-neutral-400 border-l-2 border-black">—</td>
                    <td className="p-3.5 text-center text-neutral-400 bg-[#FFDE59]/20 border-l-2 border-black">—</td>
                    <td className="p-3.5 text-center font-black text-emerald-700 border-l-2 border-black">✓ (5 Seats)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-black uppercase bg-[#FFDE59] px-3 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              PRICING FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 mt-3">
              Questions & Answers
            </h2>
          </div>

          <div className="space-y-3.5">
            {[
              {
                q: "Can I use Trackd for free forever?",
                a: "Yes! Trackd's Free tier is 100% free with no time limit. You get permanent PDF storage, unlimited versions, canonical links, and basic view counts without paying a rupee."
              },
              {
                q: "What payment methods are supported via Razorpay?",
                a: "Razorpay supports all major UPI apps (Google Pay, PhonePe, Paytm, BHIM), credit & debit cards (Visa, Mastercard, RuPay), NetBanking across 50+ banks, and international cards seamlessly."
              },
              {
                q: "What happens to my links if my Pro trial expires?",
                a: "Your existing canonical links will never break. Recruiters can always open and read your published PDFs. Deep dwell duration telemetry and download alerts pause until renewed."
              },
              {
                q: "Can recruiters tell that I am tracking their views?",
                a: "No! The PDF viewer looks like a clean, high-performance document reader. Telemetry is gathered unobtrusively without showing any creepy popups or distracting banners to the reviewer."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="border-2 border-black rounded-xl bg-[#FFFDF9] shadow-[3px_3px_0px_0px_#000] overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-4 flex items-center justify-between font-black text-sm sm:text-base text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm font-medium text-neutral-700 leading-relaxed border-t border-neutral-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clean Call-to-Action */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-[#FEF6E4] text-center">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center mb-3">
            <DoodleCelebrationPerson className="w-16 h-16 text-neutral-900" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 mb-2">
            Ready to upgrade your job hunt?
          </h2>
          <p className="text-sm text-neutral-700 font-medium mb-6">
            Join thousands of professionals sharing documents with Git-style versioning and recruiter telemetry.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => handleProCheckout()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <span>Get Trackd Pro ({proPrice.price})</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
            <button
              onClick={handleFreeSelect}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-neutral-100 text-black font-black text-sm px-6 py-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
            >
              <span>Start Free (₹0)</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
