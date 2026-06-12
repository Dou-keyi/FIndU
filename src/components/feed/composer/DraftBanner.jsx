// DraftBanner.jsx — "Continue your draft?" banner for saved drafts
import React from 'react';
import { FileEdit, X } from 'lucide-react';

export default function DraftBanner({ onResume, onDiscard }) {
  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-3">
      <FileEdit className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <p className="text-sm text-amber-800 font-medium flex-1">
        You have an unsaved draft. Continue?
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onResume}
          className="px-3 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors"
        >
          Resume
        </button>
        <button
          onClick={onDiscard}
          className="p-1 rounded text-amber-400 hover:text-amber-600 transition-colors"
          aria-label="Discard draft"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
