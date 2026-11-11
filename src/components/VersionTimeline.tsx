import React, { useState } from 'react';
import { 
  GitCommit, 
  Download, 
  Eye, 
  Globe, 
  ArrowUpRight, 
  Upload, 
  Calendar, 
  FileText, 
  Check, 
  Copy, 
  ExternalLink, 
  CheckCheck, 
  QrCode, 
  Smartphone,
  RotateCcw,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';
import type { Resume, ResumeVersion, User } from '../types';
import { PublishModal } from './PublishModal';
import { QrCodeModal } from './QrCodeModal';
import { ErrorBoundary } from './ErrorBoundary';
import { getDocumentPublicUrl, getDocumentDisplayUrl } from '../utils/url';
import { api } from '../api';

interface VersionTimelineProps {
  resume: Resume;
  versions: ResumeVersion[];
  currentUser?: User | null;
  onPublishVersion: (versionId: string) => Promise<void>;
  onOpenUploadModal: () => void;
  onViewPdf: (version: ResumeVersion) => void;
  onOpenPublicResume: (username: string, slug: string, shareToken?: string) => void;
  onVersionReverted?: () => void;
}

export const VersionTimeline: React.FC<VersionTimelineProps> = ({
  resume,
  versions,
  currentUser,
  onPublishVersion,
  onOpenUploadModal,
  onViewPdf,
  onOpenPublicResume,
  onVersionReverted
}) => {
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    versions.length > 0 ? (resume.publishedVersionId || versions[0]._id) : null
  );
  const [publishModalVersion, setPublishModalVersion] = useState<ResumeVersion | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [aiDiffModalOpen, setAiDiffModalOpen] = useState(false);
  const [aiDiffData, setAiDiffData] = useState<{ summary: string; highlights: string[]; recommendations: string[] } | null>(null);
  const [loadingAiDiff, setLoadingAiDiff] = useState(false);

  const username = currentUser?.username || 'user';
  const selectedVersion = versions.find(v => v._id === selectedVersionId) || versions[0];
  const publishedVersion = versions.find(v => v._id === resume.publishedVersionId);
  const publicUrl = getDocumentDisplayUrl(resume, username);
  const getFullPublicUrl = () => getDocumentPublicUrl(resume, username);

  // Revert / Rollback to a historical version as a new commit
  const handleRevert = async (versionId: string) => {
    try {
      setRevertingId(versionId);
      const res = await api.revertVersion(resume._id, versionId);
      setToastMessage(res.message || 'Successfully rolled back to past version as new release');
      setTimeout(() => setToastMessage(null), 3500);
      if (onVersionReverted) {
        onVersionReverted();
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to revert version');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setRevertingId(null);
    }
  };

  // Run AI Version Diff Analysis
  const handleAnalyzeDiff = async () => {
    if (!selectedVersion) return;
    setAiDiffModalOpen(true);
    setLoadingAiDiff(true);
    try {
      const sorted = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
      const currentIndex = sorted.findIndex(v => v._id === selectedVersion._id);
      const baseVersion = currentIndex > 0 ? sorted[currentIndex - 1] : (sorted[1] || selectedVersion);

      const result = await api.analyzeVersionDiff({
        documentName: resume.name,
        versionA: {
          versionLabel: baseVersion.versionLabel || `v${baseVersion.versionNumber}`,
          commitMessage: baseVersion.commitMessage,
          date: baseVersion.createdAt
        },
        versionB: {
          versionLabel: selectedVersion.versionLabel || `v${selectedVersion.versionNumber}`,
          commitMessage: selectedVersion.commitMessage,
          date: selectedVersion.createdAt
        }
      });
      setAiDiffData(result);
    } catch (err: any) {
      console.warn('AI diff error:', err);
    } finally {
      setLoadingAiDiff(false);
    }
  };

  const handleCopyPublicLink = async () => {
    const fullUrl = getFullPublicUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setToastMessage('Public link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handlePublishConfirm = async (versionId: string) => {
    try {
      setPublishingId(versionId);
      await onPublishVersion(versionId);
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card matching complete document flow */}
      <ErrorBoundary
        variant="section"
        componentContext="Repository Header & Public Links"
        fallbackTitle="Repository Header Unavailable"
        fallbackMessage="An error occurred while displaying document link settings and publishing state."
      >
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="bg-[#FFDE59] text-black text-xs font-mono font-bold px-2 py-0.5 rounded border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  Repository: /{resume.slug}
                </span>
                <span className="bg-neutral-100 text-neutral-800 text-xs font-mono font-bold px-2 py-0.5 rounded border border-black">
                  Latest: {versions[0]?.versionLabel || 'v1'}
                </span>
                {resume.publishedVersionId ? (
                  <span className="bg-[#70EE9C] text-black text-xs font-mono font-black px-2 py-0.5 rounded border border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Published ({publishedVersion?.versionLabel || 'v1'})
                  </span>
                ) : (
                  <span className="bg-neutral-200 text-neutral-700 text-xs font-mono font-bold px-2 py-0.5 rounded border border-black">
                    Published: No
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                {resume.name}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                Total {versions.length} {versions.length === 1 ? 'version' : 'versions'} committed. Every publish instantly routes to your permanent link.
              </p>
            </div>

            {/* Action Button: Upload New Version */}
            <div className="flex items-center gap-2">
              <button
                id="btn-upload-new-version"
                onClick={onOpenUploadModal}
                className="flex items-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm px-4 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                <Upload className="w-4 h-4 stroke-[3]" />
                <span>+ Upload New Version</span>
              </button>
            </div>
          </div>

          {/* Stable Public URL Card */}
          {resume.publishedVersionId ? (
            <div className="bg-[#FFF8EE] border-2 border-black rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-[#FF7A00] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Public URL (Permanent):</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-black truncate block">
                    {publicUrl}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
                <button
                  id="btn-open-qr-code"
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FFDE59] hover:bg-[#fed330] text-black font-black text-xs rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all"
                  title="Generate QR code for in-person sharing"
                >
                  <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>QR Code</span>
                </button>

                <button
                  id="btn-copy-public-link"
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-neutral-100 text-black font-bold text-xs rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all"
                >
                  {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  id="btn-open-public-page"
                  type="button"
                  onClick={() => onOpenPublicResume(username, resume.slug, resume.shareToken)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1 px-3.5 py-2 bg-[#70EE9C] hover:bg-[#5dd887] text-black font-black text-xs rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Public Page</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 border-2 border-dashed border-black/40 rounded-xl p-3 text-xs flex items-center justify-between gap-2">
              <span className="text-neutral-600 font-semibold">
                This document is not yet published. Select a version below and click <strong>Publish</strong> to generate your public link.
              </span>
              {versions.length > 0 && (
                <button
                  onClick={() => setPublishModalVersion(versions[0])}
                  className="shrink-0 px-3 py-1 bg-[#FF7A00] text-black font-black rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000]"
                >
                  Publish {versions[0].versionLabel || 'v1'}
                </button>
              )}
            </div>
          )}
        </div>
      </ErrorBoundary>

      {/* Main Grid: Left Timeline + Right Version Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: The Git Version Timeline */}
        <div className="lg:col-span-7 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-black mb-6">
            <div className="flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-black stroke-[2.5]" />
              <h3 className="text-lg font-black text-black">Version History</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-neutral-100 border border-black px-2 py-0.5 rounded">
              HEAD: {versions[0]?.versionLabel || 'v1'}
            </span>
          </div>

          <ErrorBoundary
            variant="section"
            componentContext="Version History Stem & Nodes"
            fallbackTitle="Version History Display Interrupted"
            fallbackMessage="An issue occurred while rendering version history nodes. You can retry rendering or upload a new version."
          >
            {versions.length === 0 ? (
              <div className="text-center py-10 bg-[#FFF8EE] border-2 border-dashed border-black/50 rounded-xl p-6">
                <FileText className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <p className="font-bold text-neutral-800">No versions uploaded yet</p>
                <p className="text-xs text-neutral-600 mt-1 mb-4">Upload your initial PDF to create version v1.</p>
                <button
                  onClick={onOpenUploadModal}
                  className="bg-[#FF7A00] text-black font-bold text-xs px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                >
                  Upload Initial Version (v1)
                </button>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6">
                {/* Vertical Branch Stem Line */}
                <div className="absolute top-3 bottom-3 left-3 sm:left-4 w-1 bg-black -translate-x-1/2 rounded" />

                {versions.map((ver) => {
                  const isCurrentSelected = selectedVersion?._id === ver._id;
                  const isPublished = resume.publishedVersionId === ver._id;
                  const formattedDate = new Date(ver.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <ErrorBoundary
                      key={ver._id}
                      variant="card"
                      componentContext={`Version Commit Node (${ver.versionLabel || ver._id})`}
                      fallbackTitle={`Version ${ver.versionLabel || ver.versionNumber || ''}`}
                      fallbackMessage="This version commit item could not be rendered."
                    >
                      <div 
                        id={`version-node-${ver._id}`}
                        onClick={() => setSelectedVersionId(ver._id)}
                        className={`relative cursor-pointer transition-all ${
                          isCurrentSelected ? 'scale-[1.01]' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        {/* Git Commit Node Dot */}
                        <div 
                          className={`absolute -left-6 sm:-left-8 top-3 w-5 h-5 rounded-full border-2 border-black -translate-x-1/2 flex items-center justify-center transition-all ${
                            isPublished
                              ? 'bg-[#70EE9C] ring-4 ring-emerald-200'
                              : isCurrentSelected
                              ? 'bg-[#FF7A00] ring-4 ring-orange-200'
                              : 'bg-white hover:bg-neutral-200'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-black" />
                        </div>

                        {/* Commit Card */}
                        <div 
                          className={`border-2 border-black rounded-xl p-4 transition-all ${
                            isCurrentSelected
                              ? 'bg-[#FFF8EE] shadow-[4px_4px_0px_0px_#000]'
                              : 'bg-white shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm sm:text-base bg-black text-white px-2 py-0.5 rounded border border-black shadow-[1.5px_1.5px_0px_0px_#FF7A00]">
                                {ver.versionLabel || `v${ver.versionNumber}`}
                              </span>
                              <span className="font-mono text-xs font-semibold text-neutral-500">
                                {ver._id.substring(0, 8)}
                              </span>
                            </div>

                            {isPublished ? (
                              <span className="bg-[#70EE9C] text-black text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                Published
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPublishModalVersion(ver);
                                }}
                                className="bg-[#FF7A00] hover:bg-[#ff851b] text-black text-xs font-black px-2.5 py-1 rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all"
                              >
                                Publish {ver.versionLabel || `v${ver.versionNumber}`}
                              </button>
                            )}
                          </div>

                          {/* Commit Message */}
                          <p className="font-bold text-neutral-900 text-sm sm:text-base my-1">
                            "{ver.commitMessage}"
                          </p>

                          <div className="flex items-center justify-between text-xs text-neutral-500 mt-2 pt-2 border-t border-black/10">
                            <span className="flex items-center gap-1 font-semibold">
                              <Calendar className="w-3.5 h-3.5" />
                              {formattedDate}
                            </span>
                            
                            {/* Quick View & Download on Node */}
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => onViewPdf(ver)}
                                className="flex items-center gap-1 font-bold text-black hover:text-[#FF7A00]"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>
                              <span>•</span>
                              <a
                                href={ver.fileUrl.startsWith('/api') ? `${ver.fileUrl}?download=true` : `/api/resumes/${resume._id}/versions/${ver._id}/file?download=true`}
                                download={ver.fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 font-bold text-black hover:text-[#FF7A00]"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ErrorBoundary>
                  );
                })}
              </div>
            )}
          </ErrorBoundary>
        </div>

        {/* Right Column: Version Detail Panel */}
        <div className="lg:col-span-5 bg-white border-2 border-black shadow-[5px_5px_0px_0px_#000] rounded-xl p-5 sm:p-6 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
            <h3 className="text-lg font-black text-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF7A00]" />
              <span>Version Detail</span>
            </h3>
            {selectedVersion && (
              <span className="font-mono font-black text-sm bg-[#FFDE59] px-2 py-0.5 rounded border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                {selectedVersion.versionLabel || `v${selectedVersion.versionNumber}`}
              </span>
            )}
          </div>

          <ErrorBoundary
            variant="section"
            componentContext="Version Detail Panel"
            fallbackTitle="Version Detail Inspector Interrupted"
            fallbackMessage="An error occurred while inspecting version file metadata or actions."
          >
            {selectedVersion ? (
              <div className="space-y-4">
                {/* Commit details */}
                <div className="bg-[#FFF8EE] border-2 border-black rounded-lg p-3.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 block mb-1">
                    Commit Message
                  </span>
                  <p className="text-base font-bold text-neutral-900 leading-snug">
                    "{selectedVersion.commitMessage}"
                  </p>
                </div>

                {/* Status and metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-50 border-2 border-black rounded-lg p-3">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 block">
                      Status
                    </span>
                    <div className="mt-1">
                      {resume.publishedVersionId === selectedVersion._id ? (
                        <span className="text-sm font-black text-emerald-800 bg-[#70EE9C] px-2 py-0.5 rounded border border-black inline-flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Published
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded border border-black inline-block">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-neutral-50 border-2 border-black rounded-lg p-3">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 block">
                      Created
                    </span>
                    <span className="text-xs font-bold text-neutral-900 mt-1 block">
                      {new Date(selectedVersion.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* File Info */}
                <div className="bg-neutral-50 border-2 border-black rounded-lg p-3 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-500">File Name:</span>
                    <span className="font-bold text-neutral-900 truncate max-w-[180px]">{selectedVersion.fileName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-500">File Size:</span>
                    <span className="font-bold text-neutral-900">{Math.round(selectedVersion.fileSize / 1024)} KB</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Public ID:</span>
                    <span className="font-bold text-neutral-900 truncate max-w-[180px]">{selectedVersion.filePublicId}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  {/* View PDF */}
                  <button
                    id="btn-inspect-view-pdf"
                    onClick={() => onViewPdf(selectedVersion)}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-100 text-black font-bold text-sm py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View PDF</span>
                  </button>

                  {/* Download PDF */}
                  <a
                    id="btn-inspect-download-pdf"
                    href={selectedVersion.fileUrl.startsWith('/api') ? `${selectedVersion.fileUrl}?download=true` : `/api/resumes/${resume._id}/versions/${selectedVersion._id}/file?download=true`}
                    download={selectedVersion.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-sm py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </a>

                  {/* Publish / View Public Button */}
                  {resume.publishedVersionId === selectedVersion._id ? (
                    <div className="space-y-2">
                      <button
                        id="btn-inspect-view-public"
                        onClick={() => onOpenPublicResume(username, resume.slug, resume.shareToken)}
                        className="w-full flex items-center justify-center gap-2 bg-[#70EE9C] hover:bg-[#5dd887] text-black font-black text-sm py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        <Globe className="w-4 h-4" />
                        <span>View Public Page (Live)</span>
                      </button>

                      <button
                        id="btn-inspect-qr-code"
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-[#FFDE59] hover:bg-[#fed330] text-black font-black text-xs py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Generate In-Person QR Code</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn-inspect-publish"
                      disabled={publishingId === selectedVersion._id}
                      onClick={() => setPublishModalVersion(selectedVersion)}
                      className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-sm py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                    >
                      <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                      <span>
                        Publish {selectedVersion.versionLabel || `v${selectedVersion.versionNumber}`}
                      </span>
                    </button>
                  )}

                  {/* AI Diff & Progression Button */}
                  {versions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleAnalyzeDiff}
                      className="w-full flex items-center justify-center gap-2 bg-[#FFDE59] hover:bg-[#fed330] text-black font-black text-xs py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                      title="Analyze changes and recruiter impact using Gemini AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FF7A00] fill-[#FF7A00]" />
                      <span>✨ AI Diff Changelog</span>
                    </button>
                  )}

                  {/* Revert Button (available on older/historical versions) */}
                  {versions.length > 1 && selectedVersion._id !== versions[0]._id && (
                    <button
                      type="button"
                      disabled={revertingId === selectedVersion._id}
                      onClick={() => handleRevert(selectedVersion._id)}
                      className="w-full flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer"
                      title={`Rollback to ${selectedVersion.versionLabel || `v${selectedVersion.versionNumber}`} as a new release`}
                    >
                      {revertingId === selectedVersion._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 text-neutral-800" />
                      )}
                      <span>
                        {revertingId === selectedVersion._id 
                          ? 'Reverting...' 
                          : `Revert to this version (${selectedVersion.versionLabel || `v${selectedVersion.versionNumber}`})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 text-sm">
                Select a version from the timeline to view details.
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>

      {/* Publish Version Modal */}
      {publishModalVersion && (
        <ErrorBoundary
          variant="section"
          componentContext="Publish Modal"
          fallbackTitle="Publish Dialog Interrupted"
          onReset={() => setPublishModalVersion(null)}
        >
          <PublishModal
            isOpen={!!publishModalVersion}
            resume={resume}
            version={publishModalVersion}
            currentUser={currentUser}
            onClose={() => setPublishModalVersion(null)}
            onConfirmPublish={handlePublishConfirm}
            onOpenPublicPage={() => onOpenPublicResume(username, resume.slug)}
            onOpenQrModal={() => {
              setPublishModalVersion(null);
              setShowQrModal(true);
            }}
          />
        </ErrorBoundary>
      )}

      {/* QR Code Modal for In-Person Sharing */}
      {showQrModal && (
        <ErrorBoundary
          variant="section"
          componentContext="QR Code Modal"
          fallbackTitle="QR Code Generator Interrupted"
          onReset={() => setShowQrModal(false)}
        >
          <QrCodeModal
            isOpen={showQrModal}
            resume={resume}
            currentUser={currentUser}
            onClose={() => setShowQrModal(false)}
          />
        </ErrorBoundary>
      )}

      {/* Gemini AI Diff & Changelog Modal */}
      {aiDiffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setAiDiffModalOpen(false);
                setAiDiffData(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#FFDE59] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] shrink-0">
                <Sparkles className="w-5 h-5 text-[#FF7A00] fill-[#FF7A00]" />
              </div>
              <div>
                <h3 className="font-black text-lg text-black">Gemini AI Changelog & Diff</h3>
                <p className="text-xs font-mono text-neutral-600">{resume.name} • {selectedVersion?.versionLabel || 'Latest'}</p>
              </div>
            </div>

            {loadingAiDiff ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF7A00] mx-auto" />
                <p className="text-sm font-bold text-neutral-800">Analyzing document evolution & impact...</p>
                <p className="text-xs text-neutral-500">Gemini is comparing revision commits and tailoring insights.</p>
              </div>
            ) : aiDiffData ? (
              <div className="space-y-4">
                {/* Executive Summary */}
                <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
                    Evolution Summary
                  </span>
                  <p className="text-sm font-bold text-neutral-900 leading-snug">
                    {aiDiffData.summary}
                  </p>
                </div>

                {/* Highlights */}
                {aiDiffData.highlights && aiDiffData.highlights.length > 0 && (
                  <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block mb-2">
                      Key Progression Highlights
                    </span>
                    <ul className="space-y-2">
                      {aiDiffData.highlights.map((h, i) => (
                        <li key={i} className="text-xs font-semibold text-neutral-800 flex items-start gap-2">
                          <span className="text-[#FF7A00] font-black shrink-0">✦</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {aiDiffData.recommendations && aiDiffData.recommendations.length > 0 && (
                  <div className="bg-[#70EE9C]/30 border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 block mb-2">
                      Recruiter Impact Recommendations
                    </span>
                    <ul className="space-y-2">
                      {aiDiffData.recommendations.map((r, i) => (
                        <li key={i} className="text-xs font-bold text-neutral-900 flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3] shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Visual Toast Notification for URL copy */}
      {toastMessage && (
        <div 
          id="toast-timeline-feedback"
          className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="bg-[#70EE9C] text-black border-2 border-black shadow-[5px_5px_0px_0px_#000] rounded-xl px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 bg-white border-2 border-black rounded-lg flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
              <Check className="w-4 h-4 text-black stroke-[3]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-black">
                {toastMessage}
              </p>
              <p className="text-[11px] font-mono text-neutral-800 truncate font-bold">
                {getFullPublicUrl()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

