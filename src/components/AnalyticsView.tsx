import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  Eye, TrendingUp, Calendar, Clock, CheckCircle2, Smartphone, Monitor, Tablet, 
  Globe2, Lock, Sparkles, Zap, ArrowRight, RefreshCw, MapPin, Download, KeyRound, 
  ShieldCheck, FileDown, Activity, Check, X, Shield, Timer, ChevronRight
} from 'lucide-react';
import type { AnalyticsSummary } from '../types';
import { api } from '../api';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary;
  onBackToResume: () => void;
  onOpenPricingModal?: () => void;
  onRefresh?: () => Promise<void> | void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, onBackToResume, onOpenPricingModal, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeVal, setPasscodeVal] = useState('');
  const [savingPasscode, setSavingPasscode] = useState(false);
  const [passcodeSuccess, setPasscodeSuccess] = useState<string | null>(null);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const handleRefreshClick = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleSavePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPasscode(true);
    setPasscodeError(null);
    try {
      const code = passcodeVal.trim() || null;
      if (code && !/^\d{4,6}$/.test(code)) {
        setPasscodeError('PIN must be 4 to 6 digits (numbers only)');
        setSavingPasscode(false);
        return;
      }
      await api.setPasscode(analytics.resumeId, code);
      setPasscodeSuccess(code ? 'Access PIN lock activated!' : 'Access PIN removed. Document is public.');
      if (onRefresh) await onRefresh();
      setTimeout(() => {
        setPasscodeSuccess(null);
        setShowPasscodeModal(false);
      }, 1500);
    } catch (err: any) {
      setPasscodeError(err.message || 'Failed to update passcode');
    } finally {
      setSavingPasscode(false);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs || secs <= 0) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // If analytics/tracking is paused due to expired trial/pro (PRD Section 8)
  if (analytics.isTrackingPaused || analytics.isLocked) {
    return (
      <div className="space-y-6">
        {/* Top Bar */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Document Analytics
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {analytics.resumeName}
            </h2>
            <p className="text-xs text-neutral-600 font-mono mt-0.5">
              Slug: /{analytics.slug}
            </p>
          </div>

          <button
            onClick={onBackToResume}
            className="self-start sm:self-center px-4 py-2 bg-[#FFDE59] text-black font-bold text-sm rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
          >
            ← Back to Versions
          </button>
        </div>

        {/* Tracking is paused Container (PRD Section 8) */}
        <div 
          id="analytics-paused-card"
          className="bg-[#FEF6E4] border-2 border-black shadow-[6px_6px_0px_0px_#000] rounded-2xl p-6 sm:p-10 text-center max-w-2xl mx-auto"
        >
          <div className="w-16 h-16 bg-[#FFDE59] border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#000] mb-5">
            <Lock className="w-8 h-8 text-black stroke-[2.5]" />
          </div>

          <span className="inline-flex items-center gap-1 bg-black text-[#FFDE59] font-mono text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            🔒 Tracking is paused
          </span>

          <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mb-2">
            Tracking is paused
          </h3>

          <p className="text-sm font-semibold text-neutral-700 max-w-lg mx-auto leading-relaxed mb-6">
            Your documents are safe, but Trackd is no longer collecting analytics for them.
          </p>

          {/* Pro Benefits Box */}
          <div className="bg-white border-2 border-black rounded-xl p-5 mb-6 text-left shadow-[3px_3px_0px_0px_#000]">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-black/10">
              <Zap className="w-4 h-4 text-[#FF7A00] fill-[#FF7A00]" />
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Resume Tracking — ₹19/month (or ₹29 for 2 months)
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-neutral-800">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-black">✓</span>
                <span>Active reading dwell duration</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-black">✓</span>
                <span>Recruiter telemetry alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-black">✓</span>
                <span>Version-by-version performance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-black">✓</span>
                <span>Device, browser & Country breakdown</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="btn-resume-tracking-analytics"
              onClick={onOpenPricingModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Resume Tracking — ₹19/month</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
            <button
              onClick={onBackToResume}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-neutral-100 text-black font-bold text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all"
            >
              Manage Versions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format last viewed
  let lastViewedFormatted = 'Never';
  let lastViewedExact = 'No visits yet';
  if (analytics.lastViewedAt) {
    const diffMs = Date.now() - new Date(analytics.lastViewedAt).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) lastViewedFormatted = 'Just now';
    else if (diffMins < 60) lastViewedFormatted = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    else if (diffHours < 24) lastViewedFormatted = `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    else if (diffDays === 1) lastViewedFormatted = 'Yesterday';
    else lastViewedFormatted = `${diffDays} days ago`;

    const d = new Date(analytics.lastViewedAt);
    lastViewedExact = `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-1">
            Analytics & Insights
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            {analytics.resumeName}
          </h2>
          <p className="text-xs text-neutral-600 font-mono mt-0.5">
            Slug: /{analytics.slug}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onRefresh && (
            <button
              id="btn-refresh-analytics"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 text-black font-bold text-xs rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all disabled:opacity-60"
              title="Refresh live analytics data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FF7A00]' : ''}`} />
              <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
            </button>
          )}

          <button
            onClick={onBackToResume}
            className="self-start sm:self-center px-4 py-2 bg-[#FFDE59] text-black font-bold text-sm rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
          >
            ← Back to Versions
          </button>
        </div>
      </div>

      {/* 5 Primary Metric Cards (PRD Section 15) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Views */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Views</span>
            <Eye className="w-4 h-4 text-[#FF7A00]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            {analytics.totalViews}
          </p>
          <span className="text-[11px] text-neutral-500 font-semibold block mt-1">All-time visitors</span>
        </div>

        {/* Today */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Today</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            {analytics.todayViews}
          </p>
          <span className="text-[11px] text-neutral-500 font-semibold block mt-1">Past 24 hours</span>
        </div>

        {/* This Week */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">This Week</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            {analytics.weekViews}
          </p>
          <span className="text-[11px] text-neutral-500 font-semibold block mt-1">Last 7 days</span>
        </div>

        {/* Published Version */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            {analytics.publishedVersionLabel || 'None'}
          </p>
          <span className="text-[11px] text-neutral-500 font-semibold block mt-1">Live version</span>
        </div>

        {/* Last Viewed */}
        <div className="col-span-2 sm:col-span-1 bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Last Viewed</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-lg sm:text-xl font-black text-neutral-900 truncate">
            {lastViewedFormatted}
          </p>
          <span className="text-[11px] text-neutral-500 font-semibold block mt-1 truncate" title={analytics.lastViewedAt || undefined}>
            {lastViewedExact}
          </span>
        </div>
      </div>

      {/* Row 2: Deep Telemetry & Confidential Protection Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* PDF Download Telemetry */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileDown className="w-4 h-4 text-[#FF7A00]" />
                <span>PDF Downloads</span>
              </span>
              <span className="font-mono text-xs font-bold bg-[#FFDE59] px-2 py-0.5 rounded border border-black">
                {analytics.downloadRate || 0}% rate
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
                {analytics.totalDownloads || 0}
              </span>
              <span className="text-xs font-bold text-neutral-500">saved offline</span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-2 pt-2 border-t border-black/10">
            Saved copies indicate deep evaluation or offline forwarding to team leads.
          </p>
        </div>

        {/* Reading Duration Telemetry */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-emerald-600" />
                <span>Avg Read Duration</span>
              </span>
              <span className="font-mono text-xs font-bold bg-[#70EE9C] text-black px-2 py-0.5 rounded border border-black">
                Telemetry
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
                {formatDuration(analytics.avgDurationSeconds || 0)}
              </span>
              <span className="text-xs font-bold text-neutral-500">per session</span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-2 pt-2 border-t border-black/10">
            Real-time viewport beacons differentiate fast skimmers from thorough reviewers.
          </p>
        </div>

        {/* Confidential Passcode Status & Manager */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Confidential Security</span>
              </span>
              <span className={`font-mono text-[11px] font-black px-2 py-0.5 rounded border border-black ${
                analytics.isPasscodeProtected ? 'bg-amber-200 text-black' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {analytics.isPasscodeProtected ? 'PIN LOCKED' : 'PUBLIC LINK'}
              </span>
            </div>
            <p className="text-sm font-black text-neutral-900">
              {analytics.isPasscodeProtected ? 'Protected with Access PIN' : 'Open Access Document'}
            </p>
          </div>
          <button
            onClick={() => setShowPasscodeModal(true)}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#FEF6E4] hover:bg-[#ffeec2] text-black font-bold text-xs rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-black" />
            <span>{analytics.isPasscodeProtected ? 'Change / Remove Access PIN' : 'Set Confidential Access PIN'}</span>
          </button>
        </div>
      </div>

      {/* Activity Status Banner (No activity yet vs Change detected) */}
      {analytics.totalViews === 0 ? (
        <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_#000] text-center space-y-1">
          <h4 className="text-lg font-black text-neutral-900">Nothing to report... yet. 👀</h4>
          <p className="text-xs sm:text-sm font-medium text-neutral-600">
            We'll let you know when something worth seeing happens.
          </p>
        </div>
      ) : (
        <div className="bg-[#70EE9C]/30 border-2 border-black rounded-xl p-3.5 flex items-center justify-between shadow-[3px_3px_0px_0px_#000] text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-base">👀</span>
            <span>Something changed: We spotted new activity on this document.</span>
          </div>
          <span className="font-mono text-[11px] bg-white border border-black px-2 py-0.5 rounded">
            Live Telemetry
          </span>
        </div>
      )}

      {/* Main Chart: Views by Day (PRD Section 15) */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-black">
          <div>
            <h3 className="text-lg font-black text-black">Daily View Activity</h3>
            <p className="text-xs text-neutral-600">Visitor volume tracked across recent dates</p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#FFDE59] border border-black px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#000]">
            Last 7 Days
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.dailyViews} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#000', fontSize: 12, fontWeight: 700 }}
                axisLine={{ stroke: '#000', strokeWidth: 2 }}
                tickLine={{ stroke: '#000' }}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fill: '#000', fontSize: 12, fontWeight: 700 }}
                axisLine={{ stroke: '#000', strokeWidth: 2 }}
                tickLine={{ stroke: '#000' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] p-2.5 rounded-lg font-mono text-xs">
                        <p className="font-bold text-black border-b border-neutral-200 pb-1">{label}</p>
                        <p className="text-[#FF7A00] font-black text-sm mt-1">
                          {payload[0].value} {Number(payload[0].value) === 1 ? 'view' : 'views'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="views" 
                fill="#FF7A00" 
                stroke="#000000" 
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Version Performance (PRD Section 16) + Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Version Performance (PRD Section 16) */}
        <div className="lg:col-span-7 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
            <div>
              <h3 className="text-lg font-black text-black">Version Performance</h3>
              <p className="text-xs text-neutral-600">Breakdown of views received while each version was active</p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#70EE9C] border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#000]">
              {analytics.versionPerformance.length} Releases
            </span>
          </div>

          <div className="space-y-3">
            {analytics.versionPerformance.map((vp) => {
              const maxViews = Math.max(...analytics.versionPerformance.map(v => v.views), 1);
              const percentage = Math.round((vp.views / maxViews) * 100);

              return (
                <div 
                  key={vp.versionId}
                  className="bg-[#FFF8EE] border-2 border-black rounded-lg p-3.5 space-y-2 shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black bg-black text-white px-2 py-0.5 rounded text-xs">
                        {vp.versionLabel}
                      </span>
                      <span className="font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-[280px]">
                        {vp.commitMessage}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {vp.isPublished && (
                        <span className="text-[10px] font-mono font-bold bg-[#70EE9C] border border-black px-1.5 py-0.5 rounded">
                          Current Live
                        </span>
                      )}
                      <span className="font-mono font-black text-base text-[#FF7A00]">
                        {vp.views} <span className="text-xs text-neutral-600 font-normal">views</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-white border border-black rounded-full overflow-hidden">
                    <div 
                      className={`h-full border-r border-black transition-all ${
                        vp.isPublished ? 'bg-[#70EE9C]' : 'bg-[#FF7A00]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Demographics: Devices & Countries */}
        <div className="lg:col-span-5 space-y-6">
          {/* Device Breakdown */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5">
            <h3 className="text-base font-black text-black pb-2 border-b-2 border-black mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#FF7A00]" />
              <span>Devices</span>
            </h3>

            <div className="space-y-3">
              {analytics.deviceBreakdown.map(item => (
                <div key={item.device} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 capitalize">
                    {item.device === 'desktop' && <Monitor className="w-3.5 h-3.5 text-neutral-700" />}
                    {item.device === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-neutral-700" />}
                    {item.device === 'tablet' && <Tablet className="w-3.5 h-3.5 text-neutral-700" />}
                    <span>{item.device}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500">{item.count} views</span>
                    <span className="font-mono bg-neutral-100 border border-black px-1.5 py-0.5 rounded w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Geography Breakdown */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5">
            <h3 className="text-base font-black text-black pb-2 border-b-2 border-black mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-[#FF7A00]" />
                <span>Visitor Countries</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500 font-bold">
                {analytics.countryBreakdown.reduce((acc, c) => acc + c.count, 0)} visits
              </span>
            </h3>

            {analytics.countryBreakdown.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-xs font-mono space-y-1">
                <MapPin className="w-6 h-6 text-neutral-400 mx-auto" />
                <p className="font-bold text-neutral-700">No geo data yet</p>
                <p>Visitor countries will appear as public views occur.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {analytics.countryBreakdown.map(item => (
                  <div key={item.country} className="space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-neutral-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF7A00]" />
                        {item.country}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 font-normal">{item.count} views</span>
                        <span className="font-mono bg-[#FFF8EE] border border-black/40 px-1.5 py-0.5 rounded text-[11px] font-black">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 border border-neutral-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#FF7A00] rounded-full transition-all" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reading Duration Telemetry Depth (PRD Feature) */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-black mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-[#FF7A00]" />
              <h3 className="text-lg font-black text-black">Reading Duration Telemetry</h3>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Beacon signals monitor active viewport engagement to evaluate candidate review depth
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-[#70EE9C] text-black border border-black px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#000]">
              Avg: {formatDuration(analytics.avgDurationSeconds || 0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(analytics.durationBreakdown || []).map((item, idx) => {
            const colors = [
              { bar: 'bg-amber-400', tag: 'Fast Skim' },
              { bar: 'bg-blue-500', tag: 'Moderate Review' },
              { bar: 'bg-emerald-500', tag: 'Deep Evaluation' },
            ][idx % 3];

            return (
              <div key={item.category} className="bg-neutral-50 border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-neutral-800">{item.category}</span>
                  <span className="text-[10px] font-mono font-bold bg-white border border-black px-1.5 py-0.5 rounded">
                    {colors.tag}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-black font-mono text-neutral-900">{item.count}</span>
                  <span className="font-mono text-xs font-bold text-neutral-600">{item.percentage}% of readers</span>
                </div>
                <div className="w-full h-2.5 bg-white border border-black rounded-full overflow-hidden">
                  <div className={`h-full ${colors.bar} rounded-full transition-all`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Telemetry Radar (Recent Events Feed) */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-black mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse border border-black" />
            <div>
              <h3 className="text-lg font-black text-black">Live Telemetry Radar</h3>
              <p className="text-xs text-neutral-600">Chronological telemetry feed of reader interactions and offline saves</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-neutral-100 border border-black px-2 py-1 rounded">
            Latest {analytics.recentEvents?.length || 0} Events
          </span>
        </div>

        {(!analytics.recentEvents || analytics.recentEvents.length === 0) ? (
          <div className="text-center py-8 text-neutral-500 text-xs font-mono space-y-1">
            <Activity className="w-6 h-6 text-neutral-400 mx-auto" />
            <p className="font-bold text-neutral-700">No events captured yet</p>
            <p>Send your permanent canonical link to recruiters to initiate live telemetry.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {analytics.recentEvents.map((evt) => {
              const evtTime = new Date(evt.timestamp);
              const isDownload = evt.type === 'download';

              return (
                <div key={evt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#000] ${
                      isDownload ? 'bg-[#FF7A00] text-black' : 'bg-[#FFDE59] text-black'
                    }`}>
                      {isDownload ? <Download className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-[11px] font-black px-1.5 py-0.5 rounded border border-black uppercase ${
                          isDownload ? 'bg-orange-100 text-orange-950' : 'bg-emerald-100 text-emerald-950'
                        }`}>
                          {isDownload ? 'Offline PDF Saved' : 'Document Read'}
                        </span>
                        {evt.versionLabel && (
                          <span className="font-mono text-[11px] bg-neutral-100 border border-black/30 px-1 rounded text-neutral-700">
                            {evt.versionLabel}
                          </span>
                        )}
                        {typeof evt.durationSeconds === 'number' && evt.durationSeconds > 0 && (
                          <span className="font-mono text-[11px] font-bold text-neutral-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            {formatDuration(evt.durationSeconds)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 font-medium mt-0.5 flex items-center gap-2">
                        <span>{evt.device}</span>
                        <span>•</span>
                        <span>{evt.browser}</span>
                        <span>•</span>
                        <span>{evt.country}</span>
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right font-mono text-[11px] text-neutral-500 shrink-0">
                    {evtTime.toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                    {evtTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confidential Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowPasscodeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border-2 border-black hover:bg-neutral-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#FFDE59] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000] shrink-0">
                <KeyRound className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-black text-neutral-900">Confidential Access PIN</h3>
                <p className="text-xs text-neutral-600">Lock sensitive decks, rate cards, or portfolios with a 4–6 digit PIN</p>
              </div>
            </div>

            {passcodeSuccess ? (
              <div className="bg-[#70EE9C] border-2 border-black rounded-xl p-4 text-center font-bold text-sm text-black mb-2 shadow-[2px_2px_0px_0px_#000]">
                {passcodeSuccess}
              </div>
            ) : (
              <form onSubmit={handleSavePasscode} className="space-y-4">
                {passcodeError && (
                  <div className="bg-red-50 border-2 border-red-500 rounded-xl p-3 text-xs font-bold text-red-700">
                    {passcodeError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                    Access PIN (4–6 Digits)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={passcodeVal}
                    onChange={(e) => setPasscodeVal(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="e.g. 1234 or 908123"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border-2 border-black rounded-lg font-mono text-center tracking-widest text-base font-black focus:bg-white focus:outline-hidden"
                    maxLength={6}
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Leave blank to remove PIN protection and make this document publicly accessible.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingPasscode}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{savingPasscode ? 'Saving...' : passcodeVal.trim() ? 'Save & Lock Document' : 'Make Public (No PIN)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasscodeModal(false)}
                    className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-sm rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
