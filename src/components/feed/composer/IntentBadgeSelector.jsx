// IntentBadgeSelector.jsx — post intent pill buttons
import React from 'react';
import { POST_INTENTS } from '../../../lib/feedConstants';

export default function IntentBadgeSelector({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {POST_INTENTS.map((intent) => {
        const isActive = selected === intent.key;
        return (
          <button
            key={intent.key}
            onClick={() => onSelect(isActive ? null : intent.key)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              isActive
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>{intent.emoji}</span>
            <span>{intent.label}</span>
          </button>
        );
      })}
    </div>
  );
}
