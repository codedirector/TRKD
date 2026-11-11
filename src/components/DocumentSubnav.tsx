import React, { useState } from 'react';
import { 
  FileText, 
  BarChart3, 
  Globe, 
  ArrowLeft, 
  Check, 
  Copy, 
  ExternalLink, 
  QrCode, 
  Eye, 
  Clock, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import type { Resume, User } from '../types';
import { QrCodeModal } from './QrCodeModal';
import { getDocumentPublicUrl } from '../utils/url';

interface DocumentSubnavProps {
  currentView: 'resume-detail' | 'analytics' | 'public-preview';
  setCurrentView: (view: 'dashboard' | 'resume-detail' | 'analytics' | 'public-preview') => void;
  activeResume: Resume;
  currentUser: User | null;
  onOpenPublicResume: (username: string, slug: string, shareToken?: string) => void;
  onOpenPricingModal: () => void;
}

export const DocumentSubnav: React.FC<DocumentSubnavProps> = ({
  currentView,
  setCurrentView,
  activeResume,
  currentUser,
  onOpenPublicResume,
  onOpenPricingModal
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const username = currentUser?.username || 'user';
  const isPublished = Boolean(activeResume.publishedVersionId);
  const publishedLabel = activeResume.publishedVersion?.versionLabel || 'v1';
  const isTrackingLocked = !activeResume.trackingEnabled;

  const getFullPublicUrl = () => getDocumentPublicUrl(activeResume, username);

  const handleCopyLink = async () => {
    const url = getFullPublicUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Format last viewed
  let lastViewedText = 'No visits yet';
  if (activeResume.lastViewedAt) {
    const diffMs = Date.now() - new Date(activeResume.lastViewedAt).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) lastViewedText = 'Just now';
    else if (diffMins < 60) lastViewedText = `${diffMins}m ago`;
    else if (diffHours < 24) lastViewedText = `${diffHours}h ago`;
    else lastViewedText = `${diffDays}d ago`;
  }

  return (
    <div className="bg-white border-2 border-black rounded-xl p-3.5 sm:p-4 shadow-[4px_4px_0px_0px_#000] mb-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        
        {/* Left: Back Link & Document Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="subnav-back-to-docs"
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all shrink-0"
            title="Return to all documents"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All Docs</span>
          </button>

          <div className="h-6 w-px bg-neutral-300 shrink-0 hidden sm:block" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {activeResume.name}
              </h1>

              {/* Category Pill */}
              <span className="text-[10px] font-mono font-black uppercase bg-neutral-100 border border-black px-1.5 py-0.5 rounded">
                {activeResume.category || 'resume'}
              </span>

              {/* Published status */}
              {isPublished ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-[#70EE9C] text-black border border-black px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  Live: {publishedLabel}
                </span>
              ) : (
                <span className="text-[11px] font-mono font-bold bg-neutral-200 text-neutral-700 border border-black px-1.5 py-0.5 rounded">
                  Draft
                </span>
              )}
            </div>

            {/* Quick Metrics Line */}
            <div className="flex items-center gap-3 text-xs text-neutral-600 mt-1 font-mono">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-[#FF7A00]" />
                <span className="font-bold text-black">{activeResume.totalViews || 0}</span> views
              </span>
              <span className="text-neutral-300">•</span>
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>Last: {lastViewedText}</span>
              </span>
              <span className="text-neutral-300 hidden sm:inline">•</span>
              <span className="text-neutral-500 hidden sm:inline truncate">
                /{activeResume.slug}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Document Context Tabs */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Versions Tab */}
          <button
            id="subnav-tab-versions"
            onClick={() => setCurrentView('resume-detail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 border-black ${
              currentView === 'resume-detail'
                ? 'bg-[#FF7A00] text-black font-black shadow-[2px_2px_0px_0px_#000]'
                : 'bg-white hover:bg-neutral-100 text-neutral-700 shadow-[1px_1px_0px_0px_#000]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Versions</span>
            {activeResume.versionsCount !== undefined && (
              <span className="ml-0.5 text-[10px] font-mono bg-black text-white px-1.5 py-0.5 rounded font-black">
                {activeResume.versionsCount}
              </span>
            )}
          </button>

          {/* Analytics Tab */}
          <button
            id="subnav-tab-analytics"
            onClick={() => setCurrentView('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 border-black ${
              currentView === 'analytics'
                ? 'bg-[#FF7A00] text-black font-black shadow-[2px_2px_0px_0px_#000]'
                : 'bg-white hover:bg-neutral-100 text-neutral-700 shadow-[1px_1px_0px_0px_#000]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
            {isTrackingLocked ? (
              <span className="text-[9px] bg-black text-[#FFDE59] px-1.5 py-0.5 rounded font-mono font-black flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                LOCK
              </span>
            ) : (
              <span className="text-[10px] font-mono bg-black text-[#FFDE59] px-1.5 py-0.5 rounded font-black">
                {activeResume.totalViews || 0}
              </span>
            )}
          </button>

          {/* Public Link / Preview */}
          {isPublished && (
            <button
              id="subnav-btn-public"
              onClick={() => onOpenPublicResume(username, activeResume.slug, activeResume.shareToken)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-[#70EE9C] hover:bg-[#5dd887] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all"
              title="Open public live preview"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Link</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          )}

          {/* QR Code trigger */}
          {isPublished && (
            <button
              id="subnav-btn-qr"
              onClick={() => setShowQrModal(true)}
              className="p-1.5 bg-[#FFDE59] hover:bg-[#fed330] text-black border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all"
              title="QR code for in-person scan"
            >
              <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <QrCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          resume={activeResume}
          currentUser={currentUser}
          url={getFullPublicUrl()}
          resumeName={activeResume.name}
        />
      )}
    </div>
  );
};
