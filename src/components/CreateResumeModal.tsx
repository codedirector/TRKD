import React, { useState } from 'react';
import { X, FileText, AlertCircle, ArrowRight, Sparkles, Upload, Check } from 'lucide-react';
import type { DocumentCategory } from '../types';
import { api } from '../api';

interface CreateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, slug: string, category: DocumentCategory, initialFile?: File, commitMessage?: string) => Promise<void>;
}

const CATEGORIES: { value: DocumentCategory; label: string; desc: string }[] = [
  { value: 'resume', label: 'Resume', desc: 'Job-targeted resume' },
  { value: 'cv', label: 'Curriculum Vitae', desc: 'Academic or detailed CV' },
  { value: 'portfolio', label: 'Portfolio', desc: 'Work samples & case studies' },
  { value: 'proposal', label: 'Proposal', desc: 'Client pitches & bids' },
  { value: 'report', label: 'Report', desc: 'Case study or whitepaper' },
  { value: 'other', label: 'Other Doc', desc: 'Any general PDF document' }
];

export const CreateResumeModal: React.FC<CreateResumeModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('resume');
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [commitMessage, setCommitMessage] = useState('Initial draft');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  const handleAiSuggest = async () => {
    try {
      setGeneratingAi(true);
      const suggestion = await api.suggestCommitMessage({
        resumeName: name || 'Document',
        category,
        versionLabel: 'v1.0',
        userNotes: commitMessage !== 'Initial draft' ? commitMessage : undefined
      });
      if (suggestion) {
        setCommitMessage(suggestion);
      }
    } catch (err: any) {
      console.warn('AI suggestion notice:', err);
    } finally {
      setGeneratingAi(false);
    }
  };

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isManualSlug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  const handleSlugChange = (val: string) => {
    setIsManualSlug(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setError('Only PDF files are accepted.');
        return;
      }
      setInitialFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanSlug = slug.trim();

    if (!cleanName) {
      setError('Document Name is required');
      return;
    }

    if (!cleanSlug) {
      setError('URL slug is required');
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setError('Slug must contain only lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(cleanName, cleanSlug, category, initialFile || undefined, commitMessage);
      setName('');
      setSlug('');
      setCategory('resume');
      setInitialFile(null);
      setCommitMessage('Initial draft');
      setIsManualSlug(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create document');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="modal-create-resume"
        className="bg-[#FEF6E4] border-2 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-lg p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-all shadow-[2px_2px_0px_0px_#000]"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#FF7A00] border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <FileText className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-neutral-900 tracking-tight">CREATE DOCUMENT</h3>
            <p className="text-xs font-mono text-neutral-600">Start a new version-controlled document repository</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border-2 border-black rounded-lg p-3 text-xs text-red-900 flex items-center gap-2 font-bold shadow-[2px_2px_0px_0px_#000]">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Title */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Document Title <span className="text-red-600">*</span>
            </label>
            <input
              id="input-resume-name"
              type="text"
              required
              placeholder="e.g. Software Resume"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Slug <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id="input-resume-slug"
                type="text"
                required
                placeholder="software-resume"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-mono font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
              />
            </div>
            <p className="text-[11px] text-neutral-600 font-mono mt-1">
              Public link: <span className="font-bold text-black underline">trackd.app/@&lt;user&gt;/{slug || 'slug'}</span>
            </p>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-2 rounded-xl border-2 text-left transition-all ${
                    category === cat.value
                      ? 'border-black bg-[#FFDE59] shadow-[2px_2px_0px_0px_#000] font-black text-black'
                      : 'border-black/30 bg-white hover:bg-neutral-50 text-neutral-800 font-bold'
                  }`}
                >
                  <div className="text-xs">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload v1 (PDF) - Roadmap flow */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Upload v1 (PDF)
            </label>
            <div className="bg-white border-2 border-dashed border-black rounded-xl p-4 text-center">
              <input
                id="input-create-v1-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="input-create-v1-file" className="cursor-pointer block">
                <Upload className="w-5 h-5 text-neutral-500 mx-auto mb-1" />
                {initialFile ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span className="truncate max-w-xs">{initialFile.name}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-black text-neutral-800 underline">
                      Choose initial PDF file
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Or you can upload it later in the version timeline
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Commit Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Commit Message
              </label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={generatingAi}
                className="inline-flex items-center gap-1 text-[11px] font-black text-black bg-[#FFDE59] hover:bg-[#fed330] px-2 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer disabled:opacity-50"
                title="Generate AI conventional commit message"
              >
                <Sparkles className="w-3 h-3 text-black" />
                <span>{generatingAi ? 'Generating...' : 'AI Suggest'}</span>
              </button>
            </div>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder='e.g. "feat(init): initial draft for review"'
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-sm font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-black text-xs font-bold rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-resume"
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black text-xs font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
            >
              <span>{submitting ? 'Creating...' : 'Create & Commit'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

