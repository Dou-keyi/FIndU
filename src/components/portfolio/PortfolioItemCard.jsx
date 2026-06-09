// PortfolioItemCard.jsx — displays a single portfolio item with type badge, tags, and edit controls
import React from 'react';
import { Pencil, Trash2, Sparkles } from 'lucide-react';

const TYPE_STYLES = {
  project: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  achievement: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  experience: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' },
  certification: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  headline: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' },
};

export default function PortfolioItemCard({ item, isOwn, onEdit, onDelete }) {
  const typeStyle = TYPE_STYLES[item.item_type] || TYPE_STYLES.headline;
  const isAISuggested = item.source === 'ai_suggestion';

  return (
    <div className="group relative bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-all">
      {/* Top row: type badge + actions */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border}`}
          >
            {item.item_type}
          </span>

          {isAISuggested && (
            <span className="inline-flex items-center gap-0.5 text-[10px] italic text-gray-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              AI suggested
            </span>
          )}
        </div>

        {/* Edit + delete — own portfolio only */}
        {isOwn && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit?.(item)}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Edit item"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              onClick={() => onDelete?.(item)}
              className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
              aria-label="Delete item"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h4>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.description}</p>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
