import React from 'react';
import { 
  GitBranch, 
  Layers, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  FileText, 
  Sparkles, 
  Heart,
  Users,
  Compass,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  SquiggleUnderline, 
  DoodleYesBubble, 
  DoodleFace, 
  DoodleFiveStars, 
  DoodleCounting, 
  DoodleCelebrationPerson,
  DoodleCircleLoop,
  DoodleLightbulb,
  DoodleHeart,
  DoodleSparkles,
  DoodleCoffeeMug,
  DoodleTarget,
  DoodleCheckBadge
} from './TallyDoodles';

interface AboutPageProps {
  onGetStarted: () => void;
  onGoToPricing: () => void;
  onGoToDashboard: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onGetStarted,
  onGoToPricing,
  onGoToDashboard
}) => {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-neutral-900 font-sans selection:bg-[#FF7A00] selection:text-black">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b-2 border-black bg-[#FEF6E4] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="bg-[#FF7A00] text-black px-2 py-0.5 rounded border border-black font-mono font-black">
              ABOUT TRACKD
            </span>
            <span className="text-neutral-600 hidden sm:inline">The origin story, team, and why versioning matters.</span>
          </div>
          <button 
            onClick={onGoToPricing}
            className="hover:underline flex items-center gap-1 text-black font-extrabold"
          >
            <span>See Plans & Pricing</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black overflow-hidden">
        {/* Floating background doodles */}
        <div className="absolute top-8 left-6 sm:left-16 hidden md:block opacity-90">
          <DoodleFace className="w-14 h-14 text-neutral-900" />
        </div>
        <div className="absolute top-12 right-8 sm:right-20 hidden md:block">
          <DoodleYesBubble className="w-20 h-16" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#FFDE59] border-2 border-black px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-[2px_2px_0px_0px_#000] mb-6">
            <Sparkles className="w-4 h-4 fill-black" />
            <span>THE TRACKD MISSION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 leading-[1.14] mb-6">
            Putting an end to{' '}
            <span className="relative inline-block whitespace-nowrap text-[#FF7A00]">
              <span className="relative z-10">resume_v4_FINAL.pdf</span>
              <SquiggleUnderline 
                color="#000000" 
                className="absolute left-0 -bottom-1 sm:-bottom-2.5 w-full h-3 sm:h-4.5 pointer-events-none z-0" 
              />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-700 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            We built Trackd because sharing high-stakes career documents shouldn’t feel like dropping messages into an ATS void. 
            We are bringing Git-style version control, canonical permanence, and real-time read receipts to modern professionals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-base sm:text-lg px-8 py-3.5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_#000] transition-all"
            >
              <span>Start Tracking — It’s Free</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              onClick={onGoToPricing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-100 text-black font-black text-base px-6 py-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all"
            >
              <span>Explore Pro Features</span>
            </button>
          </div>

          {/* Social Proof Numbers */}
          <div className="mt-14 pt-8 border-t-2 border-dashed border-neutral-300 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-black">120K+</div>
              <div className="text-xs sm:text-sm font-bold text-neutral-600 mt-1">Documents Tracked</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-black">45+</div>
              <div className="text-xs sm:text-sm font-bold text-neutral-600 mt-1">Countries Represented</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-black">99.9%</div>
              <div className="text-xs sm:text-sm font-bold text-neutral-600 mt-1">CDN Uptime</div>
            </div>
            <div>
              <div className="relative inline-block px-1">
                <span className="relative z-10 text-3xl sm:text-4xl font-black font-mono text-black">3.8x</span>
                <DoodleCircleLoop color="#FF7A00" className="absolute -left-2 -top-1 w-16 h-12 pointer-events-none z-0" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-neutral-600 mt-1">Higher Recruiter Response</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Origin Story: The Old Way vs The Trackd Way */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-3 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              THE FRUSTRATION THAT STARTED IT ALL
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-4">
              Software has GitHub. Why did resumes still live in 2004?
            </h2>
            <p className="text-neutral-700 font-medium">
              Every job seeker has experienced the anxiety of sending an email attachment and waiting into total silence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way Card */}
            <div className="bg-[#FFF4F2] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[5px_5px_0px_0px_#000] relative">
              <div className="inline-block bg-[#FF5C5C] text-white border-2 border-black px-3 py-1 rounded-lg text-xs font-black uppercase font-mono shadow-[2px_2px_0px_0px_#000] mb-5">
                The Old Broken Way
              </div>
              <ul className="space-y-4 text-sm sm:text-base font-bold text-neutral-800">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-black text-lg leading-none shrink-0">✕</span>
                  <span><strong>The Post-Send Panic:</strong> You email your resume to 25 recruiters, only to spot a painful typo on line 3 ten minutes later. It is impossible to unsend.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-black text-lg leading-none shrink-0">✕</span>
                  <span><strong>Desktop Chaos:</strong> 15 files named <code>resume_v2.pdf</code>, <code>resume_stripe.pdf</code>, <code>resume_real_FINAL(1).pdf</code> cluttering your drive.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-black text-lg leading-none shrink-0">✕</span>
                  <span><strong>The ATS Void:</strong> Zero signal if anyone ever downloaded your file, opened your portfolio, or forwarded your pitch deck.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-black text-lg leading-none shrink-0">✕</span>
                  <span><strong>Broken Outdated Links:</strong> Old versions floating around recruiter Slack channels with outdated contact info or stale accomplishments.</span>
                </li>
              </ul>
            </div>

            {/* The Trackd Way Card */}
            <div className="bg-[#EBFBF0] border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[5px_5px_0px_0px_#000] relative">
              <div className="inline-block bg-[#70EE9C] text-black border-2 border-black px-3 py-1 rounded-lg text-xs font-black uppercase font-mono shadow-[2px_2px_0px_0px_#000] mb-5">
                The Trackd Way
              </div>
              <ul className="space-y-4 text-sm sm:text-base font-bold text-neutral-900">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-700 font-black text-lg leading-none shrink-0">✓</span>
                  <span><strong>One Canonical Link:</strong> <code>trackd.app/@alex/resume</code> always serves your current published release, anywhere on the web.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-700 font-black text-lg leading-none shrink-0">✓</span>
                  <span><strong>Instant Silent Updates:</strong> Spot a typo? Fix it and push <code>v1.4</code> in 5 seconds. Everyone with the link instantly sees the correction.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-700 font-black text-lg leading-none shrink-0">✓</span>
                  <span><strong>Live Recruiter Telemetry:</strong> Receive instant read receipts when a company in Seattle opens your CV and downloads the PDF.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-700 font-black text-lg leading-none shrink-0">✓</span>
                  <span><strong>Complete Git Timeline:</strong> Full rollback history, changelog notes, custom slugs, and QR codes for in-person networking.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-[#FEF6E4]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FF7A00] text-black px-3 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              OUR PHILOSOPHY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-4">
              Built on 4 uncompromised principles
            </h2>
            <p className="text-neutral-700 font-medium">
              How we approach software design, privacy, and user empowerment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Principle 1 */}
            <div className="relative bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between overflow-hidden">
              <DoodleLightbulb className="absolute top-4 right-4 w-7 h-7 text-neutral-800 opacity-80 pointer-events-none" />
              <div>
                <div className="w-12 h-12 bg-[#FFDE59] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] mb-4">
                  <GitBranch className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black mb-2">Version Control for Humans</h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                  Developers rely on Git because history is precious. We brought tags, rollback points, and clear changelogs to career docs without terminal complexity.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-neutral-100 font-mono text-xs font-bold text-neutral-500">
                #Principle 01
              </div>
            </div>

            {/* Principle 2 */}
            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#70EE9C] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] mb-4">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black mb-2">Privacy Without Creepiness</h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                  We don’t sell candidate data or run invasive third-party ad pixels. Our telemetry is pure, transparent server analytics focused on document delivery.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-neutral-100 font-mono text-xs font-bold text-neutral-500">
                #Principle 02
              </div>
            </div>

            {/* Principle 3 */}
            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[#A0C4FF] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] mb-4">
                  <Zap className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black mb-2">Instant Canonical Speed</h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                  PDFs are served via global low-latency CDN edge nodes. Whether the reviewer is in Tokyo or London, your document renders instantly in sub-200ms.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-neutral-100 font-mono text-xs font-bold text-neutral-500">
                #Principle 03
              </div>
            </div>

            {/* Principle 4 */}
            <div className="relative bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between overflow-hidden">
              <DoodleCoffeeMug className="absolute top-4 right-4 w-7 h-7 text-neutral-800 opacity-80 pointer-events-none" />
              <div>
                <div className="w-12 h-12 bg-[#FF7A00] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] mb-4">
                  <Heart className="w-6 h-6 stroke-[2.5] text-black" />
                </div>
                <h3 className="text-xl font-black mb-2">Craft & Personality</h3>
                <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                  Job hunting is stressful enough. We believe software should feel human, delightful, and crafted with thoughtful details rather than corporate sterility.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t-2 border-neutral-100 font-mono text-xs font-bold text-neutral-500">
                #Principle 04
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Journey & Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-3 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              THE ROADMAP & MILESTONES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mt-4 mb-4">
              From late night prototype to 120,000+ career documents
            </h2>
          </div>

          <div className="relative border-l-4 border-black ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
            {/* Item 1 */}
            <div className="relative">
              <div className="absolute -left-[35px] sm:-left-[51px] top-1 w-6 h-6 rounded-full bg-[#FF7A00] border-2 border-black shadow-[1px_1px_0px_0px_#000]" />
              <div className="font-mono text-xs font-black uppercase tracking-wider text-[#FF7A00] mb-1">
                JANUARY 2024 · THE GENESIS
              </div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">
                "Wait, did the recruiter ever look at my resume?"
              </h3>
              <p className="text-neutral-700 font-medium text-sm sm:text-base leading-relaxed">
                During a wave of tech layoffs, our co-founder applied to 40 roles with customized PDF variants. After receiving an unexpected interview for an outdated role description, the realization hit: job seekers are flying completely blind. Trackd v0.1 was coded in 48 hours.
              </p>
            </div>

            {/* Item 2 */}
            <div className="relative">
              <div className="absolute -left-[35px] sm:-left-[51px] top-1 w-6 h-6 rounded-full bg-[#FFDE59] border-2 border-black shadow-[1px_1px_0px_0px_#000]" />
              <div className="font-mono text-xs font-black uppercase tracking-wider text-neutral-800 mb-1">
                AUGUST 2024 · 25,000 USERS
              </div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">
                Launch on Product Hunt & Golden Kitty Nomination
              </h3>
              <p className="text-neutral-700 font-medium text-sm sm:text-base leading-relaxed">
                Word spread organically across tech Twitter and LinkedIn. Product designers, software engineers, and founders began using Trackd not just for CVs, but for client design proposals, pitch decks, and consulting portfolios.
              </p>
            </div>

            {/* Item 3 */}
            <div className="relative">
              <div className="absolute -left-[35px] sm:-left-[51px] top-1 w-6 h-6 rounded-full bg-[#70EE9C] border-2 border-black shadow-[1px_1px_0px_0px_#000]" />
              <div className="font-mono text-xs font-black uppercase tracking-wider text-emerald-700 mb-1">
                TODAY · TRACKD 2.0
              </div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">
                Real-Time Recruiter Telemetry, QR Codes & Team Workspaces
              </h3>
              <p className="text-neutral-700 font-medium text-sm sm:text-base leading-relaxed">
                With instant download tracking, custom slugs, passcodes, and seamless Razorpay/Stripe billing, Trackd powers career milestones for top talent landing offers at OpenAI, Stripe, Figma, and Google.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FEF6E4] text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex justify-center mb-6">
            <DoodleCelebrationPerson className="w-28 h-28 text-neutral-900" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mb-6">
            Take control of your career documents today.
          </h2>
          <p className="text-lg text-neutral-700 font-medium max-w-xl mx-auto mb-8">
            Create your first document in 30 seconds. One link, full version history, and real-time read telemetry.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-base sm:text-lg px-8 py-3.5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_#000] transition-all"
            >
              <span>Create My Free Document</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              onClick={onGoToPricing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-100 text-black font-black text-base px-6 py-3.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all"
            >
              <span>View Pricing Plans</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
