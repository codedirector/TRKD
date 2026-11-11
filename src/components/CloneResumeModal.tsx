import React, { useState, useEffect } from 'react';
import { GitFork, Layers, FileText, Check, AlertCircle, ArrowRight, X, Sparkles } from 'lucide-react';
import type { Resume, User, DocumentCategory } from '../types';

interface CloneResumeModalProps {
  isOpen: boolean;
  sourceResume: Resume | null;
  currentUser: User | null;
  onClose: () => void;
  onClone: (sourceResumeId: string, params: {
    name: string;
    slug: string;
    category: DocumentCategory;
    branchMode: 'all' | 'published_only';
  }) => Promise<void>;
}

const QUICK_SPECIALIZATIONS = [
  'Fintech & Payments',
  'Frontend Specialist',
  'Senior / Staff Lead',
  'Remote Role',
  'Stripe Tailored',
  'Google / Big Tech'
];

export const CloneResumeModal: React.FC<CloneResumeModalProps> = ({
  isOpen,
  sourceResume,
  currentUser,
  onClose,
  onClone
}) => {
  if (!isOpen || !sourceResume) return null;

  const [name, setName] = useState(`${sourceResume.name} (Fork)`);
  const [slug, setSlug] = useState(`${sourceResume.slug}-copy`);
  const [category, setCategory] = useState<DocumentCategory>(sourceResume.category || 'resume');
  const [branchMode, setBranchMode] = useState<'all' | 'published_only'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize defaults when sourceResume opens
  useEffect(() => {
    if (sourceResume) {
      setName(`${sourceResume.name} (Fork)`);
      setSlug(`${sourceResume.slug}-copy`);
      setCategory(sourceResume.category || 'resume');
      setBranchMode('all');
      setError(null);
    }
  }, [sourceResume]);

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto generate slug if user hasn't heavily customized it
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    if (generated) {
      setSlug(generated);
    }
  };

  const applySpecialization = (tag: string) => {
    const cleanSource = sourceResume.name.replace(/\s*\([^)]*\)$/, '');
    const newName = `${cleanSource} (${tag})`;
    setName(newName);
    const newSlug = `${sourceResume.slug}-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-');
    setSlug(newSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for your cloned document repository.');
      return;
    }
    if (!slug.trim()) {
      setError('A URL-safe slug is required.');
      return;
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');

    try {
      setIsSubmitting(true);
      setError(null);
      await onClone(sourceResume._id, {
        name: name.trim(),
        slug: cleanSlug,
        category,
        branchMode
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to clone repository.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const username = currentUser?.username || 'user';
  const previewSlug = slug.trim() || 'my-slug';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="modal-clone-resume"
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-3 border-black shadow-[8px_8px_0px_0px_#000] rounded-2xl w-full max-w-lg p-6 sm:p-7 my-8 space-y-5 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg border-2 border-black hover:bg-neutral-100 transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 bg-[#FFDE59] text-black font-black text-xs px-2.5 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <GitFork className="w-3.5 h-3.5" />
            <span>CLONE REPOSITORY</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-neutral-900">
            Branch Document Repository
          </h2>
          <p className="text-xs text-neutral-600 font-medium">
            Duplicate <span className="font-bold text-black">"{sourceResume.name}"</span> into a separate repository to customize and tailor for a specific job application.
          </p>
        </div>

        {/* Source info pill */}
        <div className="bg-[#FFF8EE] border-2 border-black rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-[#FF7A00] border border-black rounded-lg flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_#000]">
              <FileText className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="truncate">
              <span className="font-bold text-neutral-900 truncate block">{sourceResume.name}</span>
              <span className="text-neutral-500 font-mono text-[10px]">
                {sourceResume.category.toUpperCase()} • {sourceResume.publishedVersion ? (sourceResume.publishedVersion.versionLabel || `v${sourceResume.publishedVersion.versionNumber}`) : 'No published version'}
              </span>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-black font-mono bg-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
            Source
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-900 rounded-xl p-3 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Specialization Presets */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-700 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3 text-[#FF7A00]" />
              <span>Target Role / Application Preset</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SPECIALIZATIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => applySpecialization(tag)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-black bg-neutral-50 hover:bg-[#FFDE59] text-black shadow-[1px_1px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* New Resume Name */}
          <div>
            <label htmlFor="clone-input-name" className="block text-xs font-black uppercase tracking-wider text-neutral-800 mb-1">
              New Repository Name *
            </label>
            <input
              id="clone-input-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer (Stripe)"
              className="w-full bg-white border-2 border-black rounded-lg px-3.5 py-2 text-sm font-bold text-black focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          {/* New Resume Slug */}
          <div>
            <label htmlFor="clone-input-slug" className="block text-xs font-black uppercase tracking-wider text-neutral-800 mb-1">
              Permanent URL Slug *
            </label>
            <div className="relative">
              <input
                id="clone-input-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                placeholder="e.g. software-engineer-stripe"
                className="w-full bg-white border-2 border-black rounded-lg pl-3.5 pr-20 py-2 text-sm font-mono font-bold text-black focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-[2px_2px_0px_0px_#000]"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                safe
              </span>
            </div>
            <p className="text-[11px] font-mono text-neutral-600 mt-1 truncate">
              Preview: <span className="font-bold text-black">trackd.app/@{username}/{previewSlug}</span>
            </p>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-neutral-800 mb-1.5">
              Document Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['resume', 'cv', 'portfolio', 'proposal', 'report', 'other'] as DocumentCategory[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-1.5 rounded-lg border-2 border-black text-xs font-bold capitalize transition-all shadow-[1.5px_1.5px_0px_0px_#000] ${
                    category === cat 
                      ? 'bg-[#FFDE59] text-black font-black translate-x-[0.5px] translate-y-[0.5px]' 
                      : 'bg-white hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Branch History Mode */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-neutral-800 mb-1.5">
              Branch History Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div 
                onClick={() => setBranchMode('all')}
                className={`p-2.5 rounded-xl border-2 border-black cursor-pointer transition-all shadow-[2px_2px_0px_0px_#000] ${
                  branchMode === 'all' 
                    ? 'bg-[#FFF8EE] border-black font-bold ring-2 ring-[#FF7A00]' 
                    : 'bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-[#FF7A00]" />
                  <span className="text-xs font-black text-neutral-900">Full History</span>
                </div>
                <p className="text-[10px] text-neutral-600 leading-tight">
                  Copies all existing commit snapshots so you retain the entire version log.
                </p>
              </div>

              <div 
                onClick={() => setBranchMode('published_only')}
                className={`p-2.5 rounded-xl border-2 border-black cursor-pointer transition-all shadow-[2px_2px_0px_0px_#000] ${
                  branchMode === 'published_only' 
                    ? 'bg-[#FFF8EE] border-black font-bold ring-2 ring-[#FF7A00]' 
                    : 'bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <GitFork className="w-3.5 h-3.5 text-[#FF7A00]" />
                  <span className="text-xs font-black text-neutral-900">Branch Latest Only</span>
                </div>
                <p className="text-[10px] text-neutral-600 leading-tight">
                  Starts with the latest published PDF as v1 with a fresh commit timeline.
                </p>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t-2 border-black/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-neutral-700 hover:text-black border-2 border-black rounded-lg bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-xs sm:text-sm px-5 py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Branching Repository...</span>
                </>
              ) : (
                <>
                  <GitFork className="w-4 h-4" />
                  <span>Clone & Branch Repository</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
