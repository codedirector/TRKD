import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Copy, Check, ExternalLink, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import type { Resume, User } from '../types';
import { getDocumentPublicUrl } from '../utils/url';

export interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume?: Resume | null;
  currentUser?: User | null;
  url?: string;
  resumeName?: string;
}

const COLOR_THEMES = [
  { name: 'Noir', dark: '#000000', light: '#FFFFFF', bgClass: 'bg-black text-white' },
  { name: 'Orange', dark: '#FF7A00', light: '#FFFDF9', bgClass: 'bg-[#FF7A00] text-black' },
  { name: 'Emerald', dark: '#059669', light: '#F0FDF4', bgClass: 'bg-[#70EE9C] text-black' },
  { name: 'Indigo', dark: '#312E81', light: '#EEF2FF', bgClass: 'bg-indigo-900 text-white' },
];

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  resume,
  currentUser,
  url,
  resumeName,
  onClose,
}) => {
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const username = currentUser?.username || (resume as any)?.userId || 'author';
  const slug = resume?.slug || '';
  const docTitle = resumeName || resume?.name || 'Document';
  const category = resume?.category || 'Document';
  const versionLabel = resume?.publishedVersion?.versionLabel || 'Live';

  // Generate functional URL that works in current environment (including local testing and phone scanning)
  const fullPublicUrl = url && !url.includes('cloudinary')
    ? url
    : (resume ? getDocumentPublicUrl(resume, username) : (typeof window !== 'undefined' ? window.location.origin : 'https://trackd.app'));
  const displayUrl = fullPublicUrl.replace(/^https?:\/\//, '');

  const [qrError, setQrError] = useState<string | null>(null);

  // Generate QR code whenever URL or theme changes (both raster PNG and vector SVG)
  useEffect(() => {
    if (!isOpen || !fullPublicUrl || !fullPublicUrl.trim()) {
      setQrDataUrl('');
      setQrSvgString('');
      return;
    }

    let isMounted = true;
    setQrError(null);

    try {
      // Raster PNG for preview and standard download
      QRCode.toDataURL(fullPublicUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: selectedTheme.dark,
          light: selectedTheme.light,
        },
        errorCorrectionLevel: 'M',
      })
        .then((dataUrl) => {
          if (isMounted) setQrDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error('Failed to generate PNG QR code', err);
          if (isMounted) setQrError('Failed to generate QR preview');
        });

      // Vector SVG for print, business cards, meetups
      QRCode.toString(fullPublicUrl, {
        type: 'svg',
        margin: 2,
        color: {
          dark: selectedTheme.dark,
          light: selectedTheme.light,
        },
        errorCorrectionLevel: 'M',
      })
        .then((svg) => {
          if (isMounted) setQrSvgString(svg);
        })
        .catch((err) => {
          console.error('Failed to generate SVG QR code', err);
        });
    } catch (err: any) {
      console.error('QR code generation error', err);
      if (isMounted) setQrError('Unable to generate QR code');
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, fullPublicUrl, selectedTheme]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
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

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const filePrefix = slug || docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const link = document.createElement('a');
    link.download = `${filePrefix}-trackd-qr.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage('Raster PNG downloaded successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownloadSvg = () => {
    if (!qrSvgString) return;
    const filePrefix = slug || docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${filePrefix}-trackd-qr-vector.svg`;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    setToastMessage('Vector SVG downloaded! Infinite resolution for print & cards.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      {/* Toast inside modal */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-60 animate-in fade-in slide-in-from-top-3 duration-150">
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-xl px-4 py-2.5 flex items-center gap-2 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div 
        id="modal-qrcode-generator"
        className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000] cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-[#FF7A00] border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <QrCode className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-neutral-900 tracking-tight">SHARE DOCUMENT</h3>
            <p className="text-xs font-mono text-neutral-600">Scan to open permanent published URL</p>
          </div>
        </div>

        {/* The Printable QR Display Card */}
        <div 
          className="bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_#000] text-center space-y-3 relative"
        >
          {/* Document Header Info */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold bg-[#FFDE59] text-black px-2 py-0.5 rounded border border-black uppercase">
                {category}
              </span>
              <span className="font-mono text-[11px] font-bold bg-[#70EE9C] text-black px-2 py-0.5 rounded border border-black">
                {versionLabel}
              </span>
            </div>
            <h4 className="font-black text-lg text-neutral-900 tracking-tight pt-1">
              {docTitle}
            </h4>
            <p className="text-xs font-bold text-neutral-600">
              {currentUser?.name || username} • <span className="font-mono">@{username}</span>
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex items-center justify-center py-2">
            <div 
              className="p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] inline-block"
              style={{ backgroundColor: selectedTheme.light }}
            >
              {qrError ? (
                <div className="w-48 h-48 flex flex-col items-center justify-center p-3 text-center">
                  <p className="text-xs font-bold text-red-600">{qrError}</p>
                </div>
              ) : qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`QR code for ${displayUrl}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-black border-t-[#FF7A00] rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* In-Person Prompt & Readable URL */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-[#FFF8EE] border border-black/30 rounded-full px-3 py-1 text-[11px] font-bold text-neutral-800">
              <Smartphone className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Point phone camera to view</span>
            </div>
            <p className="font-mono text-xs font-bold text-neutral-900 truncate bg-neutral-50 border border-black/20 rounded px-2 py-1">
              {displayUrl}
            </p>
          </div>
        </div>

        {/* Color Theme Selector */}
        <div className="mt-4">
          <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1.5">
            QR Color Style
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_THEMES.map((theme) => (
              <button
                key={theme.name}
                type="button"
                onClick={() => setSelectedTheme(theme)}
                className={`py-1.5 px-2 rounded-lg border-2 border-black text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  selectedTheme.name === theme.name
                    ? 'shadow-[2px_2px_0px_0px_#000] ring-2 ring-black font-black'
                    : 'bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
                style={selectedTheme.name === theme.name ? { backgroundColor: theme.dark, color: theme.light } : {}}
              >
                <span>{theme.name}</span>
                {selectedTheme.name === theme.name && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Download Vector SVG Button (Infinite Scaling for Print & Cards) */}
            <button
              id="btn-download-qr-svg"
              type="button"
              onClick={handleDownloadSvg}
              className="flex items-center justify-center gap-1.5 bg-[#FFDE59] hover:bg-[#ffe57e] text-black font-black text-xs py-2.5 px-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              title="Download scalable vector SVG for print, business cards, flyers and high-DPI displays"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>Vector SVG</span>
            </button>

            {/* Download PNG Button */}
            <button
              id="btn-download-qr-png"
              type="button"
              onClick={handleDownloadPng}
              className="flex items-center justify-center gap-1.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-xs py-2.5 px-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
              title="Download standard PNG for web & messaging"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Raster PNG</span>
            </button>
          </div>

          <div className="flex gap-2">
            {/* Copy Link Button */}
            <button
              id="btn-qr-copy-link"
              type="button"
              onClick={handleCopyLink}
              className={`flex-1 flex items-center justify-center gap-2 font-bold text-xs py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer ${
                copiedLink ? 'bg-[#70EE9C] text-black font-black' : 'bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied Canonical URL!' : 'Copy Canonical URL'}</span>
            </button>

            <a
              href={fullPublicUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 flex items-center justify-center gap-1.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-colors"
              title="Open public document in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
