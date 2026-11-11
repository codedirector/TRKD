import React, { useState } from 'react';
import { Eye, GitCommit, ExternalLink, BarChart2, Layers, Copy, Check, Trash2, Calendar, Lock, QrCode, GitFork, Sparkles } from 'lucide-react';
import { isUserPro } from '../types';
import type { Resume, User, DocumentCategory } from '../types';
import { QrCodeModal } from './QrCodeModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { getDocumentPublicUrl, getDocumentRelativePath } from '../utils/url';

interface ResumeCardProps {
  resume: Resume;
  currentUser?: User | null;
  onSelectResume: (resume: Resume) => void;
  onOpenAnalytics: (resume: Resume) => void;
  onOpenPublicResume: (username: string, slug: string, shareToken?: string) => void;
  onDeleteResume: (resumeId: string) => void;
  onCloneResume?: (resume: Resume) => void;
  onOpenPricingModal?: () => void;
}

const CATEGORY_COLORS: Record<DocumentCategory, { bg: string; text: string }> = {
  resume: { bg: 'bg-blue-100', text: 'text-blue-900' },
  cv: { bg: 'bg-purple-100', text: 'text-purple-900' },
  portfolio: { bg: 'bg-emerald-100', text: 'text-emerald-900' },
  proposal: { bg: 'bg-amber-100', text: 'text-amber-900' },
  report: { bg: 'bg-rose-100', text: 'text-rose-900' },
  other: { bg: 'bg-neutral-100', text: 'text-neutral-900' }
};

export const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  currentUser,
  onSelectResume,
  onOpenAnalytics,
  onOpenPublicResume,
  onDeleteResume,
  onCloneResume,
  onOpenPricingModal
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const username = currentUser?.username || 'user';
  const publicPath = getDocumentRelativePath(resume, username);
  const isPro = isUserPro(currentUser);
  const hasTracking = isPro || resume.trackingEnabled !== false;
  const fullPublicUrl = getDocumentPublicUrl(resume, username);

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullPublicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(resume.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const category = (resume.category || 'resume') as DocumentCategory;
  const catStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

  return (
    <div 
      id={`resume-card-${resume._id}`}
      className="bg-white border-2 border-black shadow-[5px_5px_0px_0px_#000000] rounded-xl p-5 sm:p-6 transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000000] flex flex-col justify-between"
    >
      <div>
        {/* Card Header: Category & Tracking Status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-black ${catStyle.bg} ${catStyle.text}`}>
            {category.toUpperCase()}
          </span>

          {hasTracking ? (
            <span 
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-black bg-[#70EE9C] px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_0px_#000]"
              title="Live Telemetry Active. Real-time document reading and download telemetry is recording."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
              <span>Live Telemetry Active</span>
            </span>
          ) : (
            <button
              onClick={onOpenPricingModal}
              className="inline-flex items-center gap-1 text-[11px] font-black text-black bg-[#FFDE59] px-2 py-0.5 rounded border border-black hover:bg-[#ffd93d] transition-colors"
              title="Telemetry paused. Upgrade to Pro for active real-time tracking."
            >
              <Lock className="w-3 h-3 text-black" />
              <span>Upgrade for Telemetry</span>
            </button>
          )}
        </div>

        {/* Card Title & Badges */}
        <div className="flex items-start justify-between gap-2.5 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 leading-tight break-words">
              {resume.name}
            </h3>
            <p className="text-xs font-mono text-neutral-600 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-neutral-500">slug:</span>
              <span className="font-bold text-black bg-neutral-100 px-1.5 py-0.5 rounded border border-black/30 truncate max-w-[200px]">
                {resume.slug}
              </span>
            </p>
          </div>

          {/* Published Status Pill */}
          {resume.publishedVersion ? (
            <span className="inline-flex items-center gap-1.5 bg-[#70EE9C] text-black font-mono font-black text-xs px-2.5 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000] whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
              {resume.publishedVersion.versionLabel || `v${resume.publishedVersion.versionNumber}`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 font-mono font-bold text-xs px-2.5 py-1 rounded-full border-2 border-black whitespace-nowrap shrink-0">
              Draft
            </span>
          )}
        </div>

        {/* Card Body: Stats and details */}
        <div className="grid grid-cols-3 gap-2 my-4 bg-[#FFF8EE] border-2 border-black rounded-lg p-3">
          <div className="text-center border-r-2 border-black/20">
            <span className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
              Latest
            </span>
            <span className="text-base sm:text-lg font-black text-black font-mono">
              {resume.latestVersion ? (resume.latestVersion.versionLabel || `v${resume.latestVersion.versionNumber}`) : '—'}
            </span>
          </div>
          <div className="text-center border-r-2 border-black/20">
            <span className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
              Views
            </span>
            {hasTracking ? (
              <span className="text-base sm:text-lg font-black text-[#FF6B00] font-mono">
                {resume.totalViews ?? 0}
              </span>
            ) : (
              <span className="text-xs font-black text-neutral-500 font-mono flex items-center justify-center gap-0.5 mt-1">
                <Lock className="w-3 h-3" /> Pro
              </span>
            )}
          </div>
          <div className="text-center">
            <span className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
              Versions
            </span>
            <span className="text-base sm:text-lg font-black text-black font-mono">
              {resume.versionsCount ?? 0}
            </span>
          </div>
        </div>

        {/* Public link preview */}
        {resume.publishedVersionId ? (
          <div className="mb-4 bg-neutral-50 border-2 border-black/80 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="truncate text-neutral-700 flex items-center gap-1.5 min-w-0">
              <span className="text-black font-bold shrink-0">Link:</span>
              <span className="truncate underline underline-offset-2">{publicPath}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQrModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-black rounded font-bold text-black hover:bg-[#FFDE59] transition-colors shadow-[1px_1px_0px_0px_#000]"
                title="Generate QR code for this link"
              >
                <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-[11px]">QR</span>
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-black rounded font-bold text-black hover:bg-[#FFDE59] transition-colors shadow-[1px_1px_0px_0px_#000]"
                title="Copy public URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-800 flex items-center gap-2">
            <GitCommit className="w-4 h-4 shrink-0 text-amber-700" />
            <span>Publish a version to activate your stable public link.</span>
          </div>
        )}

        <div className="text-xs text-neutral-500 flex items-center gap-1.5 mb-4 font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>Updated {formattedDate}</span>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3.5 border-t-2 border-black/15 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Manage Versions */}
          <button
            id={`btn-manage-${resume._id}`}
            onClick={() => onSelectResume(resume)}
            className="flex items-center gap-1.5 bg-[#FF7A00] text-black font-bold text-xs sm:text-sm px-3.5 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Versions</span>
          </button>

          {/* Analytics */}
          <button
            id={`btn-analytics-${resume._id}`}
            onClick={() => onOpenAnalytics(resume)}
            className={`flex items-center gap-1.5 text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
              hasTracking ? 'bg-[#FFDE59]' : 'bg-neutral-200 text-neutral-800'
            }`}
          >
            {hasTracking ? (
              <BarChart2 className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>{hasTracking ? 'Analytics' : 'Pro Only'}</span>
          </button>

          {/* View Resume Public */}
          {resume.publishedVersionId && (
            <button
              id={`btn-view-public-${resume._id}`}
              onClick={() => onOpenPublicResume(username, resume.slug, resume.shareToken)}
              className="flex items-center gap-1 bg-white hover:bg-neutral-100 text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
              title="Open Public Share URL"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          )}

          {/* Clone / Duplicate Repository */}
          <button
            id={`btn-clone-${resume._id}`}
            onClick={() => onCloneResume?.(resume)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#FFDE59] text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            title="Clone repository to branch off a specialized version for a specific job application"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Clone</span>
          </button>
        </div>

        {/* Delete */}
        <button
          id={`btn-delete-${resume._id}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteModal(true);
          }}
          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-black transition-all shrink-0"
          title="Delete document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          resume={resume}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => onDeleteResume(resume._id)}
        />
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <QrCodeModal
          isOpen={showQrModal}
          resume={resume}
          currentUser={currentUser}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
};

