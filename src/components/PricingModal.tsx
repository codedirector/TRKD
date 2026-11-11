import React, { useState } from 'react';
import { X, Check, Zap, Sparkles, ShieldCheck, ArrowRight, Flame } from 'lucide-react';
import type { PlanType, SubscriptionCycle } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  currentPlan: PlanType;
  onClose: () => void;
  onSelectPlan: (plan: PlanType) => Promise<void>;
  onOpenRazorpay?: (billingCycle: SubscriptionCycle) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  currentPlan,
  onClose,
  onSelectPlan,
  onOpenRazorpay
}) => {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<SubscriptionCycle>('launch_offer');

  if (!isOpen) return null;

  const handleUpgrade = async (cycle: SubscriptionCycle) => {
    if (onOpenRazorpay) {
      onClose();
      onOpenRazorpay(cycle);
      return;
    }

    try {
      setLoading(true);
      await onSelectPlan('PRO');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        id="modal-pricing-plans"
        className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-3xl p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000]"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-[#FFDE59] border-2 border-black rounded-full px-3.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>TRACKD PRICING & ENTITLEMENTS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Document Version Control & Live Telemetry
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-neutral-700 max-w-lg mx-auto mt-1.5">
            Every account includes a <strong>7-Day Full Pro Trial</strong>. Permanent PDF storage, versioning, and public sharing remain <strong>Free Forever (₹0)</strong>.
          </p>
        </div>

        {/* Special Launch Offer Banner (PRD Section 7) */}
        <div className="mb-6 bg-[#FFDE59] border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-[#FFDE59] rounded-xl flex items-center justify-center font-black shrink-0">
              <Flame className="w-6 h-6 text-[#FF7A00] fill-[#FF7A00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-black text-white px-2 py-0.5 rounded">
                  LIMITED-TIME OFFER — ₹29 / 2 MONTHS
                </span>
              </div>
              <p className="text-xs font-bold text-neutral-900 mt-0.5">
                Unlock full Pro tracking and recruiter telemetry for 60 days. After 2 months, tracking pauses unless renewed.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleUpgrade('launch_offer')}
            className="flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-xs px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all shrink-0"
          >
            <span>Claim for ₹29</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* FREE PLAN */}
          <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-neutral-900">Trackd Free</h3>
                <span className="font-mono text-[11px] font-bold bg-neutral-100 border border-black px-2 py-0.5 rounded">
                  ₹0 Forever
                </span>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-black">₹0</span>
                <span className="text-xs text-neutral-600 font-bold ml-1">/ permanent</span>
              </div>

              <ul className="space-y-2 text-xs font-bold text-neutral-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Upload & manage PDFs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Full version history (v1, v2, v3...)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Permanent document storage (never deleted)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Normal document sharing & QR codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Basic view counters</span>
                </li>
                <li className="flex items-center gap-2 text-neutral-500 font-normal">
                  <Check className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>Tracking paused after trial ends</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black/10">
              <button
                disabled
                className="w-full py-2 bg-neutral-100 text-neutral-600 border-2 border-neutral-300 font-bold text-xs rounded-lg cursor-not-allowed"
              >
                Included by Default
              </button>
            </div>
          </div>

          {/* PRO PLAN WITH CYCLES */}
          <div className="bg-[#FFFAF0] border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#FF7A00] fill-[#FF7A00]" />
                  <h3 className="text-xl font-black text-neutral-900">Trackd Pro</h3>
                </div>
                <span className="font-mono text-[10px] font-black uppercase bg-[#70EE9C] text-black border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#000]">
                  Full Telemetry
                </span>
              </div>

              {/* Cycle Selector Pills */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] mb-4">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`py-1.5 px-2 text-center rounded-lg text-[11px] font-black transition-all ${
                    billingCycle === 'monthly' ? 'bg-[#FF7A00] text-black' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  ₹19/mo
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('six_month')}
                  className={`py-1.5 px-2 text-center rounded-lg text-[11px] font-black transition-all ${
                    billingCycle === 'six_month' ? 'bg-[#FF7A00] text-black' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  ₹99/6mo
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`py-1.5 px-2 text-center rounded-lg text-[11px] font-black transition-all ${
                    billingCycle === 'yearly' ? 'bg-[#70EE9C] text-black' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  ₹185/yr
                </button>
              </div>

              <div className="mb-4">
                {billingCycle === 'launch_offer' && (
                  <div>
                    <span className="text-3xl font-black">₹29</span>
                    <span className="text-xs text-neutral-600 font-bold ml-1">/ 2 months</span>
                    <p className="text-[11px] font-bold text-[#FF7A00]">Launch Special (Save 24%)</p>
                  </div>
                )}
                {billingCycle === 'monthly' && (
                  <div>
                    <span className="text-3xl font-black">₹19</span>
                    <span className="text-xs text-neutral-600 font-bold ml-1">/ month</span>
                    <p className="text-[11px] font-bold text-neutral-600">Standard monthly tracking</p>
                  </div>
                )}
                {billingCycle === 'six_month' && (
                  <div>
                    <span className="text-3xl font-black">₹99</span>
                    <span className="text-xs text-neutral-600 font-bold ml-1">/ 6 months</span>
                    <p className="text-[11px] font-bold text-emerald-700">₹16.50/mo (Save 13%)</p>
                  </div>
                )}
                {billingCycle === 'yearly' && (
                  <div>
                    <span className="text-3xl font-black">₹185</span>
                    <span className="text-xs text-neutral-600 font-bold ml-1">/ year</span>
                    <p className="text-[11px] font-bold text-emerald-700">₹15.40/mo (Best Value · Save 19%)</p>
                  </div>
                )}
              </div>

              <ul className="space-y-2 text-xs font-bold text-neutral-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Real-time reading duration telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Device, country & browser breakdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Version performance & comparisons</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Separate download tracking & ratios</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Unlimited tracked documents</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black/10">
              <button
                onClick={() => handleUpgrade(billingCycle)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black border-2 border-black font-black text-xs rounded-xl shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <span>Upgrade to Pro ({billingCycle === 'launch_offer' ? '₹29' : billingCycle === 'six_month' ? '₹99' : billingCycle === 'yearly' ? '₹185' : '₹19'})</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
