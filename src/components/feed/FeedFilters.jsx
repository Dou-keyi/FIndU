// FeedFilters.jsx — sub-feed toggle, filter pills, and sort dropdown
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useFeedStore } from '../../store/feedStore';
import { FEED_FILTER_PILLS, FEED_SORT_OPTIONS, SUB_FEED_MODES } from '../../lib/feedConstants';

export default function FeedFilters() {
  const subFeedMode = useFeedStore((s) => s.subFeedMode);
  const setSubFeedMode = useFeedStore((s) => s.setSubFeedMode);
  const activeFilters = useFeedStore((s) => s.activeFilters);
  const toggleFilter = useFeedStore((s) => s.toggleFilter);
  const sortBy = useFeedStore((s) => s.sortBy);
  const setSortBy = useFeedStore((s) => s.setSortBy);

  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen]);

  return (
    <div className="flex items-center gap-3 py-2 px-4 lg:px-0">
      {/* Sub-feed toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
        <button
          onClick={() => setSubFeedMode(SUB_FEED_MODES.FOR_YOU)}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
            subFeedMode === SUB_FEED_MODES.FOR_YOU
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          For You
        </button>
        <button
          onClick={() => setSubFeedMode(SUB_FEED_MODES.FOLLOWING)}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
            subFeedMode === SUB_FEED_MODES.FOLLOWING
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Following
        </button>
      </div>

      {/* Filter pills — horizontal scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-1">
        {FEED_FILTER_PILLS.map((pill) => {
          const isActive = activeFilters.includes(pill.key);
          return (
            <button
              key={pill.key}
              onClick={() => toggleFilter(pill.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>{pill.emoji}</span>
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sort dropdown */}
      <div className="relative flex-shrink-0" ref={sortRef}>
        <button
          onClick={() => setSortOpen((v) => !v)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors border border-gray-200"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {FEED_SORT_OPTIONS.find((o) => o.key === sortBy)?.label || 'Latest'}
          <ChevronDown className="w-3 h-3" />
        </button>

        {sortOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
            {FEED_SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setSortBy(opt.key); setSortOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                  sortBy === opt.key
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
