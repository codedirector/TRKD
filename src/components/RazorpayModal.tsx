import React, { useState } from 'react';
import { X, ShieldCheck, Zap, Sparkles, Check, ArrowRight, CreditCard, Smartphone, Building2, Lock, Loader2, Flame } from 'lucide-react';
import type { PlanType, SubscriptionCycle } from '../types';
import { api } from '../api';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  initialCycle?: SubscriptionCycle;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  initialCycle = 'launch_offer'
}) => {
  const [cycle, setCycle] = useState<SubscriptionCycle>(initialCycle);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  let priceFormatted = '₹29';
  let subtitleFormatted = 'LIMITED-TIME OFFER — ₹29 / 2 MONTHS';
  if (cycle === 'monthly') {
    priceFormatted = '₹19';
    subtitleFormatted = 'Monthly Pro • ₹19/month';
  } else if (cycle === 'six_month') {
    priceFormatted = '₹99';
    subtitleFormatted = '6 Months Pro • ₹16.50/month (Save 13%)';
  } else if (cycle === 'yearly') {
    priceFormatted = '₹185';
    subtitleFormatted = 'Yearly Pro • ₹15.40/month (Best Value · Save 19%)';
  }

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    setStep('processing');

    try {
      // 1. Create order on backend
      const order = await api.createRazorpayOrder(cycle);
      
      // 2. Payment gateway processing delay
      const paymentId = `pay_rzp_${Date.now()}`;
      await new Promise(resolve => setTimeout(resolve, 1200));

      // 3. Verify payment on backend and upgrade user to PRO
      const verifyRes = await api.verifyRazorpayPayment(
        order.orderId, 
        paymentId, 
        'PRO', 
        cycle, 
        undefined, 
        order.isSandbox !== false
      );

      if (verifyRes.success) {
        setStep('success');
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
          setStep('details');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="modal-razorpay-checkout"
        className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Razorpay Brand Header */}
        <div className="bg-[#0C2340] text-white px-6 py-4 flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#3395FF] rounded-md flex items-center justify-center font-black text-white text-xs border border-white/20">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wide">Razorpay</span>
                <span className="text-[10px] bg-[#3395FF]/30 text-[#85C1FF] px-1.5 py-0.5 rounded font-mono font-bold">
                  TRUSTED
                </span>
              </div>
              <p className="text-[11px] text-neutral-300">Trackd Pro • Secure Checkout</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {step === 'details' && (
            <div className="space-y-5">
              {/* Plan Choice Card */}
              <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000]">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#FF7A00] fill-[#FF7A00]" />
                    <span className="font-black text-base text-neutral-900">Trackd Pro Upgrade</span>
                  </div>
                  <span className="font-mono font-black text-lg text-black">{priceFormatted}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCycle('launch_offer')}
                    className={`py-2 px-2 rounded-lg text-xs font-black border transition-all text-left flex flex-col justify-between ${
                      cycle === 'launch_offer'
                        ? 'bg-[#FFDE59] text-black border-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-neutral-700">Launch Special</span>
                      <span className="bg-black text-[#FFDE59] text-[9px] px-1 rounded font-bold">HOT</span>
                    </div>
                    <span className="text-sm font-black text-black">₹29 <span className="text-[11px] font-normal text-neutral-600">/ 2 mo</span></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCycle('monthly')}
                    className={`py-2 px-2 rounded-lg text-xs font-black border transition-all text-left flex flex-col justify-between ${
                      cycle === 'monthly'
                        ? 'bg-[#FF7A00] text-black border-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-neutral-700">Monthly</span>
                    <span className="text-sm font-black text-black">₹19 <span className="text-[11px] font-normal text-neutral-600">/ mo</span></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCycle('six_month')}
                    className={`py-2 px-2 rounded-lg text-xs font-black border transition-all text-left flex flex-col justify-between ${
                      cycle === 'six_month'
                        ? 'bg-[#A688FA] text-black border-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-neutral-700">6 Months</span>
                      <span className="bg-black text-white text-[9px] px-1 rounded font-bold">13% OFF</span>
                    </div>
                    <span className="text-sm font-black text-black">₹99 <span className="text-[11px] font-normal text-neutral-600">/ 6 mo</span></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCycle('yearly')}
                    className={`py-2 px-2 rounded-lg text-xs font-black border transition-all text-left flex flex-col justify-between ${
                      cycle === 'yearly'
                        ? 'bg-[#70EE9C] text-black border-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-neutral-700">Yearly</span>
                      <span className="bg-black text-[#70EE9C] text-[9px] px-1 rounded font-bold">BEST VALUE</span>
                    </div>
                    <span className="text-sm font-black text-black">₹185 <span className="text-[11px] font-normal text-neutral-600">/ yr</span></span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-600 font-semibold mt-2.5 text-center">
                  {subtitleFormatted}
                </p>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border-2 text-center flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-[#FFDE59] border-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-white border-neutral-300 hover:border-black'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-xs font-black">UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border-2 text-center flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-[#FFDE59] border-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-white border-neutral-300 hover:border-black'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-black">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-2.5 rounded-xl border-2 text-center flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'netbanking'
                        ? 'bg-[#FFDE59] border-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-white border-neutral-300 hover:border-black'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-black">NetBanking</span>
                  </button>
                </div>
              </div>

              {/* Input details based on payment method */}
              {paymentMethod === 'upi' && (
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000]">
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                    Enter UPI ID (Google Pay, PhonePe, Paytm, BHIM)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@okhdfcbank"
                    className="w-full px-3 py-1.5 border border-black rounded-lg text-xs font-mono font-bold"
                  />
                  <div className="flex gap-2 mt-2">
                    {['@okaxis', '@okicici', '@paytm', '@ybl'].map((ext) => (
                      <button
                        key={ext}
                        type="button"
                        onClick={() => setUpiId(`user${ext}`)}
                        className="text-[10px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-1.5 py-0.5 rounded font-mono"
                      >
                        {ext}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000] space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Card Number</span>
                    <input
                      type="text"
                      disabled
                      value="4111 •••• •••• 1111 (Test Card)"
                      className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs font-mono font-bold bg-neutral-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">Expiry</span>
                      <input
                        type="text"
                        disabled
                        value="12/28"
                        className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs font-mono bg-neutral-100"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">CVV</span>
                      <input
                        type="text"
                        disabled
                        value="123"
                        className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs font-mono bg-neutral-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_#000]">
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                    Select Bank
                  </label>
                  <select className="w-full px-3 py-2 border border-black rounded-lg text-xs font-bold bg-neutral-50">
                    <option>HDFC Bank</option>
                    <option>State Bank of India (SBI)</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-2 border-black rounded-lg p-2.5 text-xs text-red-800 font-bold">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  id="btn-razorpay-confirm-pay"
                  type="button"
                  onClick={handlePay}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay {priceFormatted} with Razorpay</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs font-bold text-neutral-600 hover:text-black transition-colors"
                >
                  Maybe Later
                </button>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 font-bold pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-bit SSL Encrypted • RBI Compliant Payment Gateway</span>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 bg-[#FFDE59] border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#000] animate-bounce">
                <Loader2 className="w-7 h-7 text-black animate-spin" />
              </div>
              <div>
                <h4 className="text-xl font-black text-black">Authorizing Payment...</h4>
                <p className="text-xs text-neutral-600 mt-1 font-semibold">
                  Connecting to Razorpay secure banking network
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-[#70EE9C] border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#000]">
                <Check className="w-8 h-8 text-black stroke-[3]" />
              </div>
              <div>
                <span className="inline-block bg-black text-[#70EE9C] font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                  PAYMENT VERIFIED
                </span>
                <h4 className="text-2xl font-black text-black">PRO ACTIVATED!</h4>
                <p className="text-xs text-neutral-700 font-bold mt-1 max-w-xs mx-auto">
                  Unlimited document tracking is now active. All analytics are unlocked!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
