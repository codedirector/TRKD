import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, Check, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../api';

interface UploadVersionModalProps {
  isOpen: boolean;
  resumeName: string;
  nextVersionLabel: string;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export const UploadVersionModal: React.FC<UploadVersionModalProps> = ({
  isOpen,
  resumeName,
  nextVersionLabel,
  onClose,
  onSubmit
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [useSample, setUseSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAiSuggest = async () => {
    try {
      setGeneratingAi(true);
      const suggestion = await api.suggestCommitMessage({
        resumeName,
        versionLabel: nextVersionLabel,
        userNotes: commitMessage || undefined
      });
      if (suggestion) {
        setCommitMessage(suggestion);
      }
    } catch (err: any) {
      console.warn('AI suggestion error:', err);
    } finally {
      setGeneratingAi(false);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (selected: File | null) => {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }

    // Validate type
    const isPdf = selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Invalid file type. Only PDF documents are allowed.');
      setFile(null);
      return;
    }

    // Validate size (15MB)
    if (selected.size > 15 * 1024 * 1024) {
      setError('File is too large. Maximum size is 15MB.');
      setFile(null);
      return;
    }

    setFile(selected);
    setUseSample(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!commitMessage.trim()) {
      setError('Commit message is required (e.g. "Added internship experience")');
      return;
    }

    if (!file && !useSample) {
      setError('Please select a PDF file or check "Use generated sample PDF"');
      return;
    }

    const formData = new FormData();
    formData.append('commitMessage', commitMessage.trim());
    if (file) {
      formData.append('pdf', file);
    } else if (useSample) {
      formData.append('useSample', 'true');
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
      setFile(null);
      setCommitMessage('');
      setUseSample(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload version');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        id="modal-upload-resume"
        className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md border-2 border-black hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000]"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#FF7A00] border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <Upload className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-neutral-900">Upload New Resume</h3>
              <span className="font-mono text-xs font-black bg-black text-white px-2 py-0.5 rounded">
                {nextVersionLabel}
              </span>
            </div>
            <p className="text-xs text-neutral-600">{resumeName}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-2 border-black rounded-lg p-3 text-xs text-red-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
              PDF Resume <span className="text-red-500">*</span>
            </label>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver 
                  ? 'border-[#FF7A00] bg-[#FFF8EE] scale-[1.01]' 
                  : file 
                  ? 'border-black bg-emerald-50' 
                  : 'border-black hover:bg-neutral-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
              />

              {file ? (
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold">
                  <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                  <span className="text-sm font-mono truncate max-w-[280px]">{file.name}</span>
                  <span className="text-xs text-neutral-500 font-normal">({Math.round(file.size / 1024)} KB)</span>
                </div>
              ) : useSample ? (
                <div className="flex items-center justify-center gap-2 text-[#FF7A00] font-bold">
                  <Sparkles className="w-5 h-5 stroke-[2.5]" />
                  <span className="text-sm">Using Auto-generated Sample Resume PDF</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <FileText className="w-8 h-8 text-neutral-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-neutral-800">
                    Click to browse or drag & drop resume PDF
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Accepts PDF only (up to 15MB)
                  </p>
                </div>
              )}
            </div>

            {/* Quick option: Use sample */}
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setUseSample(prev => !prev);
                  if (!useSample) setFile(null);
                }}
                className={`text-xs font-bold px-2 py-1 rounded border border-black flex items-center gap-1 transition-all ${
                  useSample ? 'bg-[#FFDE59] shadow-[1px_1px_0px_0px_#000]' : 'bg-neutral-100 hover:bg-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{useSample ? '✓ Sample PDF Selected' : 'Test with sample PDF'}</span>
              </button>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-[11px] text-red-600 hover:underline font-bold"
                >
                  Clear file
                </button>
              )}
            </div>
          </div>

          {/* Commit Message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
                Commit Message <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={generatingAi}
                className="inline-flex items-center gap-1.5 text-[11px] font-black bg-[#FFDE59] hover:bg-[#ffe169] text-black px-2.5 py-1 rounded-lg border border-black shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-60 transition-all cursor-pointer"
                title="Generate Git-style commit message with Gemini AI"
              >
                {generatingAi ? (
                  <Loader2 className="w-3 h-3 animate-spin text-black" />
                ) : (
                  <Sparkles className="w-3 h-3 text-[#FF7A00] fill-[#FF7A00]" />
                )}
                <span>{generatingAi ? 'Generating...' : '✨ AI Suggest'}</span>
              </button>
            </div>
            <input
              id="input-commit-message"
              type="text"
              required
              placeholder="e.g. feat(experience): quantify distributed latency metrics"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border-2 border-black rounded-lg text-sm font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#FF7A00] shadow-[1px_1px_0px_0px_#000] transition-all font-mono"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Describe what changed in this version release or click AI Suggest.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-black text-sm font-bold rounded-lg border-2 border-black transition-all"
            >
              Cancel
            </button>
            <button
              id="btn-submit-upload-version"
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black text-sm font-black rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'Uploading...' : 'Upload & Commit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
