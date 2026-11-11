import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle, 
  QrCode, 
  Lock, 
  KeyRound, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  FileText,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import type { PublicResumeData } from '../types';
import { api } from '../api';
import { QrCodeModal } from './QrCodeModal';
import { ErrorBoundary } from './ErrorBoundary';

interface PublicResumeViewerProps {
  token?: string;
  username?: string;
  slug?: string;
  onBackToDashboard?: () => void;
}

export const PublicResumeViewer: React.FC<PublicResumeViewerProps> = ({
  token,
  username,
  slug,
  onBackToDashboard
}) => {
  // Strip optional leading @ from username param
  const cleanUsername = username ? username.replace(/^@/, '') : '';

  const [data, setData] = useState<PublicResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // PIN / Passcode unlock state
  const [passcode, setPasscode] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Failsafe Reading Duration Telemetry State
  const sessionIdRef = useRef<string>('');
  const isTrackingAllowedRef = useRef<boolean>(true);
  const activeDurationRef = useRef<number>(0);

  // Helper to retrieve or generate stable viewing session ID
  const getOrCreateSessionId = (docId: string): string => {
    try {
      const key = `trackd_sess_${docId}`;
      let sid = sessionStorage.getItem(key);
      if (!sid) {
        sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(key, sid);
      }
      return sid;
    } catch {
      return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  };

  // Initial Fetch (by token or username/slug)
  const fetchDocument = () => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const promise = token
      ? api.getResumeByToken(token)
      : (cleanUsername && slug)
        ? api.getPublicResume(cleanUsername, slug)
        : Promise.reject(new Error('Document identifier not specified'));

    promise
      .then(res => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Failed to load document');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    return fetchDocument();
  }, [token, cleanUsername, slug]);

  // Failsafe Idempotent Telemetry Session & Heartbeat
  useEffect(() => {
    if (!data || data.isLocked || !data.publishedVersion) return;

    const sid = getOrCreateSessionId(data.resumeId);
    sessionIdRef.current = sid;

    // 1. Initialize idempotent session once document is rendered
    api.startTrackingSession({
      documentId: data.resumeId,
      versionId: data.publishedVersion._id,
      sessionId: sid
    }).then(res => {
      isTrackingAllowedRef.current = res.trackingAllowed;
    }).catch(() => {
      // Tracking failure must never block PDF viewing
    });

    // 2. Tab Visibility Handling (duration increments only when tab active)
    const ticker = setInterval(() => {
      if (document.visibilityState === 'visible' && isTrackingAllowedRef.current) {
        activeDurationRef.current += 1;
        const s = activeDurationRef.current;
        if ([10, 20, 30, 60, 90, 120, 180, 240, 300, 420, 600].includes(s)) {
          api.sendHeartbeat(sid, s).catch(() => {});
        }
      }
    }, 1000);

    // 3. Exit Sync via sendBeacon
    const handleBeforeUnload = () => {
      if (sessionIdRef.current && activeDurationRef.current > 0 && isTrackingAllowedRef.current) {
        api.sendBeaconExit(sessionIdRef.current, activeDurationRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(ticker);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (sessionIdRef.current && activeDurationRef.current > 0 && isTrackingAllowedRef.current) {
        api.sendBeaconExit(sessionIdRef.current, activeDurationRef.current);
      }
    };
  }, [data?.resumeId, data?.publishedVersion?._id, data?.isLocked]);

  // Unlock confidential PIN document
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setPasscodeError('Please enter the access PIN or passcode');
      return;
    }

    setUnlocking(true);
    setPasscodeError(null);

    try {
      const unlocked = token 
        ? await api.unlockResumeByToken(token, passcode.trim())
        : await api.unlockPublicResume(cleanUsername, slug || '', passcode.trim());
      setData(unlocked);
    } catch (err: any) {
      setPasscodeError(err.message || 'Incorrect PIN. Please verify with the document owner.');
    } finally {
      setUnlocking(false);
    }
  };

  // Determine Authoritative Trackd URLs (Never raw Cloudinary URLs)
  const activeToken = data?.shareToken || token;
  const targetUsername = data?.username || cleanUsername;
  const targetSlug = data?.slug || slug;

  // Clean proxy PDF stream URL
  const pdfUrl = data?.pdfUrl || (activeToken 
    ? `/api/view/${activeToken}/file` 
    : `/api/public/${targetUsername}/${targetSlug}/file`);

  // Clean proxy download URL
  const downloadUrl = data?.downloadUrl || (activeToken 
    ? `/api/view/${activeToken}/download` 
    : `/api/public/${targetUsername}/${targetSlug}/download`);

  // Canonical shareable Trackd URL
  const getFullPublicUrl = () => {
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://trackd.app';
    if (activeToken) {
      return `${origin}/view/${activeToken}`;
    }
    return `${origin}/@${targetUsername}/${targetSlug}`;
  };

  const copyUrl = async () => {
    const targetUrl = getFullPublicUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = targetUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setShowToast(false), 3500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleDownload = () => {
    // Record download analytics event
    if (data?.resumeId && data?.publishedVersion?._id) {
      api.recordDownloadEvent(sessionIdRef.current, data.resumeId, data.publishedVersion._id);
    }
  };

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEF6E4] py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black/15">
            <div className="h-7 w-24 bg-black/10 rounded animate-pulse" />
            <div className="h-6 w-16 bg-black/10 rounded animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="h-8 w-64 bg-black/10 rounded animate-pulse" />
            <div className="h-4 w-40 bg-black/10 rounded animate-pulse" />
          </div>

          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000] rounded-2xl h-[72vh] flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-black border-t-[#FF7A00] rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs font-bold text-neutral-700">Loading document...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State (Not Found, Unpublished, Corrupt)
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FEF6E4] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000] rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-mono text-xl font-black text-black">TRACKD</span>
          </div>
          <div className="w-12 h-12 bg-amber-100 border-2 border-black rounded-xl flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_#000]">
            <AlertCircle className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h3 className="text-xl font-black text-neutral-900 mb-1">
              Document Unavailable
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {error || 'This document is either unpublished, private, or does not exist.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
              >
                Go to Dashboard
              </button>
            )}
            <button
              type="button"
              onClick={fetchDocument}
              className="px-4 py-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. PIN / Passcode Protection Screen (PRD Section 17)
  if (data.isPasscodeProtected && data.isLocked) {
    return (
      <div className="min-h-screen bg-[#FEF6E4] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000] rounded-2xl p-6 sm:p-8 space-y-5">
          {/* Trackd Brand */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-black/15">
            <span className="font-mono text-xl font-black tracking-tight text-black">TRACKD</span>
            <span className="font-mono text-[10px] font-black uppercase bg-[#FFDE59] text-black px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
              Secure
            </span>
          </div>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-100 border-2 border-black rounded-xl flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_#000]">
              <Lock className="w-6 h-6 text-black" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              {data.name}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-neutral-600 max-w-sm mx-auto">
              This document is protected by the owner. Enter the access PIN to view.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 max-w-xs mx-auto">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-900 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>Access PIN</span>
              </label>
              <input
                id="input-public-passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter PIN"
                autoFocus
                className="w-full px-3.5 py-2.5 bg-neutral-50 border-2 border-black rounded-xl font-mono text-center text-lg tracking-widest font-black focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black shadow-[2px_2px_0px_0px_#000]"
              />
            </div>

            {passcodeError && (
              <div className="bg-red-100 border-2 border-red-600 rounded-lg p-2.5 text-xs font-bold text-red-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <button
              id="btn-public-unlock"
              type="submit"
              disabled={unlocking}
              className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-60 transition-all cursor-pointer"
            >
              {unlocking ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-white rounded-full animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Unlock Document</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-black/10 text-center text-[11px] font-mono text-neutral-500">
            Securely encrypted until PIN verification
          </div>
        </div>
      </div>
    );
  }

  // 4. Clean, Authoritative Recipient View:
  // Trackd
  // ────────────────────
  // Document Name
  // [ PDF VIEWER ]
  // [ Download PDF ]

  const dateSource = data.updatedAt || data.publishedVersion?.createdAt;
  const formattedDate = dateSource ? new Date(dateSource).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'Recently';

  const downloadsPermitted = data.allowDownloads !== false;
  const downloadFilename = data.publishedVersion?.fileName || `${data.slug || 'document'}.pdf`;

  return (
    <div className="min-h-screen bg-[#FEF6E4] text-neutral-900 selection:bg-[#FF7A00] selection:text-white">
      {/* Toast Notification for Link Copy */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-[#70EE9C] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl px-4 py-2.5 flex items-center gap-2 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" />
            <span>Trackd link copied to clipboard</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* 1. Trackd Brand Bar & Divider */}
        <header className="flex items-center justify-between pb-3.5 border-b-2 border-black/15">
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-black tracking-tight text-black">
              TRACKD
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-neutral-100 text-black px-3 py-1.5 rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all cursor-pointer"
                title="Return to Owner Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            )}
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-neutral-100 text-black px-3 py-1.5 rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all cursor-pointer"
              title="Copy Trackd document URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </header>

        {/* 2. Document Title Section */}
        <ErrorBoundary fallbackTitle="Document Title">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
            <div className="space-y-1.5 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-tight break-words">
                {data.name}
              </h1>
              <p className="font-mono text-xs text-neutral-600 flex items-center gap-2 flex-wrap">
                {data.userFullName && (
                  <span className="font-bold text-neutral-800">{data.userFullName}</span>
                )}
                {data.userFullName && <span>·</span>}
                <span>Updated {formattedDate}</span>
                {data.publishedVersion?.versionLabel && (
                  <>
                    <span>·</span>
                    <span className="font-bold text-neutral-900">
                      {data.publishedVersion.versionLabel}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Quick Actions (Open in New Tab, Copy Link) */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-neutral-100 text-black px-3 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                title="Open PDF in a new tab"
              >
                <span>New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold bg-white hover:bg-neutral-100 text-black px-3 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                title="Scan QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR</span>
              </button>
            </div>
          </div>
        </ErrorBoundary>

        {/* 3. [ PDF VIEWER ] - Dominant, Authoritative Trackd Viewer */}
        <ErrorBoundary fallbackTitle="Trackd PDF Viewer">
          <section 
            id="trackd-pdf-viewer"
            className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000] rounded-2xl overflow-hidden"
          >
            {/* Viewer Chrome Header */}
            <div className="bg-neutral-100 border-b-2 border-black px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-black/60 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-black/60 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-black/60 inline-block" />
                </div>
                <span className="text-neutral-700 ml-2 truncate font-semibold">
                  {downloadFilename}
                </span>
              </div>

              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Trackd Secure Delivery
              </span>
            </div>

            {/* Embedded PDF Viewport */}
            <div className="w-full h-[78vh] min-h-[620px] bg-neutral-100 relative flex flex-col">
              {/* Mobile Quick Action Banner */}
              <div className="sm:hidden bg-[#FFDE59] border-b-2 border-black p-2.5 flex items-center justify-between gap-2 text-xs font-bold text-black z-10">
                <span className="truncate">Mobile Reader</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-white hover:bg-neutral-100 rounded border border-black font-black text-[11px] shadow-[1px_1px_0px_0px_#000] flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Full Screen</span>
                  </a>
                  {downloadsPermitted && (
                    <a
                      href={downloadUrl}
                      download={downloadFilename}
                      onClick={handleDownload}
                      className="px-2.5 py-1 bg-[#70EE9C] rounded border border-black font-black text-[11px] shadow-[1px_1px_0px_0px_#000] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>

              <object
                data={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                type="application/pdf"
                className="w-full flex-1 min-h-0"
              >
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                  className="w-full h-full"
                  title={data.name}
                >
                  <div className="p-8 text-center space-y-3 max-w-sm mx-auto my-16 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000]">
                    <FileText className="w-10 h-10 text-neutral-700 mx-auto" />
                    <p className="text-xs font-bold text-neutral-800">
                      Inline PDF viewer unsupported on this browser
                    </p>
                    <a
                      href={downloadUrl}
                      download={downloadFilename}
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 bg-[#FF7A00] text-black font-black text-xs px-4 py-2 rounded-lg border border-black shadow-[2px_2px_0px_0px_#000]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </iframe>
              </object>
            </div>
          </section>
        </ErrorBoundary>

        {/* 4. [ Download PDF ] - Prominent Primary Action */}
        <ErrorBoundary fallbackTitle="Download Action">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            {downloadsPermitted ? (
              <a
                id="btn-public-download-pdf"
                href={downloadUrl}
                download={downloadFilename}
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm px-6 py-3.5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[3]" />
                <span>Download PDF</span>
              </a>
            ) : (
              <div className="text-xs font-mono font-bold text-neutral-500 bg-neutral-100 border border-black/20 rounded-xl px-4 py-3">
                Downloads are disabled by the document author
              </div>
            )}

            <div className="text-xs font-mono text-neutral-500 flex items-center gap-1.5">
              <span>Powered by Trackd</span>
              <span>•</span>
              <a href="/" className="underline text-black font-bold hover:text-[#FF7A00]">
                trackd.app
              </a>
            </div>
          </div>
        </ErrorBoundary>

      </div>

      {/* QR Code Modal (with clean Trackd canonical URL) */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        resume={data as any}
        url={getFullPublicUrl()}
        resumeName={data.name}
      />
    </div>
  );
};
