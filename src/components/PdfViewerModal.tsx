import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ExternalLink, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { ResumeVersion } from '../types';

interface PdfViewerModalProps {
  version: ResumeVersion | null;
  onClose: () => void;
  onViewRecorded?: (stats: { totalViews: number; lastViewedAt?: string }) => void | Promise<void>;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ version, onClose, onViewRecorded }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeBlobRef = useRef<string | null>(null);

  // Clean up previous blob when version changes or component unmounts
  useEffect(() => {
    return () => {
      if (activeBlobRef.current) {
        URL.revokeObjectURL(activeBlobRef.current);
        activeBlobRef.current = null;
      }
    };
  }, []);

  // Fetch and validate exact PDF resource whenever version changes
  useEffect(() => {
    if (!version) {
      setBlobUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    // Revoke previous blob if exists
    if (activeBlobRef.current) {
      URL.revokeObjectURL(activeBlobRef.current);
      activeBlobRef.current = null;
    }

    setBlobUrl(null);
    setLoading(true);
    setError(null);

    const resolvePdf = async () => {
      try {
        // Resolve exact version URL via authoritative Trackd endpoint
        const targetUrl = version.fileUrl.startsWith('/api')
          ? version.fileUrl
          : `/api/resumes/${version.resumeId}/versions/${version._id}/file`;

        const res = await fetch(targetUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to load document resource`);
        }

        const contentType = res.headers.get('content-type') || '';
        // If server returned HTML (e.g. accidental fallback), REJECT immediately
        if (contentType.toLowerCase().includes('text/html')) {
          throw new Error('Server returned HTML instead of a PDF file.');
        }

        const blob = await res.blob();
        
        // Validate PDF signature (%PDF-)
        const header = await blob.slice(0, 5).text();
        if (!header.startsWith('%PDF-') && !contentType.toLowerCase().includes('application/pdf')) {
          throw new Error('The document file is not a valid PDF.');
        }

        if (isMounted) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          activeBlobRef.current = url;
          setBlobUrl(url);
          setLoading(false);
          if (onViewRecorded && version) {
            onViewRecorded({
              totalViews: 1,
              lastViewedAt: new Date().toISOString()
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[PdfViewerModal] PDF Resolution Error:', err);
          setError('Unable to preview this PDF.\n\nThe document file could not be loaded.\nPlease try again.');
          setLoading(false);
        }
      }
    };

    resolvePdf();

    return () => {
      isMounted = false;
    };
  }, [version?.resumeId, version?._id, version?.fileUrl]);

  if (!version) return null;

  // Canonical Trackd streaming URL for fallback or direct actions (never exposes raw storage)
  const canonicalUrl = version.fileUrl.startsWith('/api')
    ? version.fileUrl
    : `/api/resumes/${version.resumeId}/versions/${version._id}/file`;
  const downloadUrl = `${canonicalUrl}?download=true`;

  const targetPdfUrl = blobUrl || canonicalUrl;

  const handleOpenTab = () => {
    window.open(targetPdfUrl, '_blank');
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    const targetUrl = canonicalUrl;
    fetch(targetUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.toLowerCase().includes('text/html')) {
          throw new Error('Server returned HTML');
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        if (activeBlobRef.current) URL.revokeObjectURL(activeBlobRef.current);
        activeBlobRef.current = url;
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Retry failed:', err);
        setError('Unable to preview this PDF.\n\nThe document file could not be loaded.\nPlease try again.');
        setLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs">
      <div 
        id="modal-pdf-preview"
        className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-[#FFF8EE] border-b-2 border-black p-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-[#FF7A00] border-2 border-black rounded-lg flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#000] shrink-0">
              <FileText className="w-4 h-4 text-black" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs bg-black text-[#FFDE59] px-2 py-0.5 rounded shrink-0">
                  {version.versionLabel || `v${version.versionNumber}`}
                </span>
                <h3 className="font-black text-base text-neutral-900 truncate max-w-[200px] sm:max-w-md">
                  {version.fileName}
                </h3>
                {version.isPublished && (
                  <span className="bg-[#70EE9C] text-black text-[10px] font-black uppercase px-1.5 py-0.5 rounded border border-black hidden sm:inline-block">
                    Published
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600 truncate mt-0.5">
                Commit: "{version.commitMessage}" • Size: {Math.round((version.fileSize || 0) / 1024)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={targetPdfUrl}
              download={version.fileName}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-[#FFDE59] text-black font-black text-xs px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              type="button"
              onClick={handleOpenTab}
              className="hidden sm:flex items-center gap-1.5 bg-neutral-100 text-black font-bold text-xs px-2.5 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-200 transition-all cursor-pointer"
              title="Open standalone PDF tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Tab</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md border-2 border-black hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000]"
              title="Close viewer"
            >
              <X className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>

        {/* Content Viewer (Strict isolation per version) */}
        <div className="flex-1 bg-neutral-100 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-50 z-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF7A00] mb-2" />
              <p className="font-mono text-xs font-bold text-neutral-600">
                Verifying and rendering {version.versionLabel || `v${version.versionNumber}`} ({version.fileName})...
              </p>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-neutral-50 z-10">
              <div className="max-w-md w-full p-6 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] text-center space-y-4">
                <div className="w-12 h-12 bg-red-100 border-2 border-black rounded-xl flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_#000]">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-base font-black text-neutral-900 mb-1">
                    Unable to preview this PDF
                  </h4>
                  <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                    The document file could not be loaded.
                    Please try again.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#FF7A00] text-black font-black text-xs rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                  <a
                    href={downloadUrl}
                    download={version.fileName}
                    className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            blobUrl && (
              <div className="w-full h-full flex flex-col">
                {/* Mobile Friendly Helper Toolbar */}
                <div className="sm:hidden bg-[#FFDE59] border-b-2 border-black p-2.5 flex items-center justify-between gap-2 text-xs font-bold text-black shadow-[0_2px_0px_0px_#000] z-20">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-4 h-4 shrink-0 text-black" />
                    <span className="truncate">Mobile Reader</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={blobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 rounded border border-black font-black text-[11px] shadow-[1px_1px_0px_0px_#000] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Full View</span>
                    </a>
                    <a
                      href={downloadUrl}
                      download={version.fileName}
                      className="px-2.5 py-1 bg-[#70EE9C] rounded border border-black font-black text-[11px] shadow-[1px_1px_0px_0px_#000] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Save</span>
                    </a>
                  </div>
                </div>

                <object
                  key={`obj-${version.resumeId}-${version._id}`}
                  data={`${blobUrl}#toolbar=1&navpanes=0`}
                  type="application/pdf"
                  className="w-full flex-1 min-h-0"
                >
                  <iframe
                    key={`iframe-${version.resumeId}-${version._id}`}
                    src={`${blobUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full"
                    title={`PDF Preview ${version.versionLabel}`}
                  >
                    <div className="p-8 text-center space-y-4">
                      <p className="font-bold text-sm">Direct preview not supported in this frame.</p>
                      <a
                        href={downloadUrl}
                        download={version.fileName}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF7A00] text-black font-bold rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                      >
                        <Download className="w-4 h-4" />
                        Download to View
                      </a>
                    </div>
                  </iframe>
                </object>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
