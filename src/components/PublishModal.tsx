import React, { useState } from 'react';
import { X, Globe, Check, ArrowRight, AlertTriangle, QrCode, Copy, CheckCircle2 } from 'lucide-react';
import type { Resume, ResumeVersion, User } from '../types';
import { getDocumentPublicUrl, getDocumentDisplayUrl } from '../utils/url';

interface PublishModalProps {
  isOpen: boolean;
  resume: Resume;
  version: ResumeVersion;
  currentUser?: User | null;
  onClose: () => void;
  onConfirmPublish: (versionId: string) => Promise<void>;
  onOpenPublicPage: () => void;
  onOpenQrModal?: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  resume,
  version,
  currentUser,
  onClose,
  onConfirmPublish,
  onOpenPublicPage,
  onOpenQrModal
}) => {
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const username = currentUser?.username || 'user';
  const publicUrl = getDocumentDisplayUrl(resume, username);
  const fullPublicUrl = getDocumentPublicUrl(resume, username);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullPublicUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullPublicUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setToastMessage('Link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await onConfirmPublish(version._id);
      setPublishedSuccess(true);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      {/* Visual Toast Notification on Copy */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-60 animate-in fade-in slide-in-from-top-3 duration-150">
          <div className="bg-[#70EE9C] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl px-4 py-2.5 flex items-center gap-2 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div 
        id="modal-publish-version"
        className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000]"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {!publishedSuccess ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-[#FF7A00] border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <Globe className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-black">PUBLISH VERSION</h3>
                <p className="text-xs font-mono text-neutral-600">Stable URL Publishing</p>
              </div>
            </div>

            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-neutral-900">
                  Publish {version.versionLabel || `v${version.versionNumber}`}?
                </span>
                <span className="font-mono text-xs bg-black text-white px-2 py-0.5 rounded font-black">
                  {version.versionLabel || `v${version.versionNumber}`}
                </span>
              </div>
              <p className="text-xs text-neutral-600 font-medium">
                "{version.commitMessage}"
              </p>
            </div>

            {/* Stable URL Notice */}
            <div className="bg-[#FFF8EE] border-2 border-black rounded-xl p-3.5 space-y-1.5 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-1.5 text-xs font-black text-neutral-900">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>Your public link will show this version:</span>
              </div>
              <p className="font-mono text-xs font-bold text-neutral-800 bg-white border border-black/40 px-2.5 py-1 rounded truncate">
                {publicUrl}
              </p>
              <p className="text-[11px] text-neutral-600">
                Publishing is instant and does not change your public link. Anyone visiting your link will immediately see {version.versionLabel || `v${version.versionNumber}`}.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-white hover:bg-neutral-100 text-black font-bold text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-publish-action"
                type="button"
                disabled={publishing}
                onClick={handlePublish}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
              >
                <span>{publishing ? 'Publishing...' : `Publish ${version.versionLabel || `v${version.versionNumber}`}`}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 bg-[#70EE9C] border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#000]">
              <Check className="w-7 h-7 text-black stroke-[3]" />
            </div>

            <div>
              <span className="inline-block bg-black text-[#70EE9C] font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                ✓ PUBLISHED
              </span>
              <h3 className="text-2xl font-black text-black">
                {version.versionLabel || `v${version.versionNumber}`} is Live!
              </h3>
              <p className="text-xs text-neutral-700 font-medium mt-1">
                Your public document link now displays this committed version.
              </p>
            </div>

            <div className="bg-white border-2 border-black rounded-xl p-3 text-left shadow-[2px_2px_0px_0px_#000]">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Public URL:</span>
              <p className="font-mono text-xs font-black text-neutral-900 truncate">
                {publicUrl}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all ${
                  copiedLink ? 'bg-[#70EE9C] text-black font-black' : 'bg-white hover:bg-neutral-100 text-black'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
              </button>

              {onOpenQrModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQrModal();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#FFDE59] hover:bg-[#fed330] text-black font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
                >
                  <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Show QR Code</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPublicPage();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#70EE9C] hover:bg-[#5dd887] text-black font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
              >
                <span>Open Page</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
