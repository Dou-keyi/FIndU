// AISuggestionBanner.jsx — dismissable banner showing AI-suggested portfolio item
import React from 'react';
import { Sparkles, X, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function AISuggestionBanner({ suggestion, onAccept, onDismiss }) {
  const [accepting, setAccepting] = useState(false);

  if (!suggestion || !suggestion.suggest) return null;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept?.(suggestion);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-violet-50 via-brand-50 to-amber-50 rounded-xl border border-brand-200 p-4 mb-4">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/60 transition-colors"
        aria-label="Dismiss suggestion"
      >
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-semibold text-brand">
          We noticed something worth adding to your portfolio
        </p>
      </div>

      {/* Suggestion preview */}
      <div className="bg-white/60 rounded-lg p-3 mb-3 border border-brand-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-brand-50 text-brand border border-brand-200">
            {suggestion.item_type}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{suggestion.title}</h4>
        {suggestion.description && (
          <p className="text-xs text-gray-500">{suggestion.description}</p>
        )}
        {suggestion.tags && suggestion.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {suggestion.tags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-500">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {accepting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add to portfolio
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
