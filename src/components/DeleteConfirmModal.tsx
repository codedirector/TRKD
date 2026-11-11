import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import type { Resume } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  resume: Resume;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  resume,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-white border-3 border-black rounded-2xl shadow-[8px_8px_0px_0px_#000] p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration bar */}
        <div className="h-2 w-full bg-[#FF6B6B] border-b-2 border-black -mt-6 -mx-6 mb-5" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          title="Cancel"
        >
          <X className="w-4 h-4 text-black stroke-[3]" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000] shrink-0">
            <Trash2 className="w-6 h-6 text-red-600 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-black">Delete Repository</h3>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mt-0.5">
              Permanent Deletion
            </p>
          </div>
        </div>

        <div className="bg-[#FFF5F5] border-2 border-red-200 rounded-xl p-3.5 mb-5 text-sm text-neutral-800 space-y-2">
          <p className="font-medium text-xs leading-relaxed text-red-950">
            Are you sure you want to permanently delete <strong className="font-black text-black">"{resume.name}"</strong>?
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-600 bg-white/80 px-2 py-1 rounded border border-red-200">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>Slug: /{resume.slug}</span>
          </div>
          <p className="text-[11px] text-neutral-600 leading-normal">
            All historical version commits, viewer analytics, access tokens, and telemetry will be erased immediately. This action cannot be reversed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-black bg-white hover:bg-neutral-100 text-black border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            id={`btn-confirm-delete-${resume._id}`}
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black bg-[#FF6B6B] hover:bg-red-500 text-black border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
