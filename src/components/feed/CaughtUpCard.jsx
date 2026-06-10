// CaughtUpCard.jsx — "You're all caught up 🎉" end-of-feed card
import React from 'react';
import { ArrowUp, UserPlus } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function CaughtUpCard() {
  const prefersReduced = useReducedMotion();

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-100 p-6 text-center">
      <div className="text-3xl mb-2">🎉</div>
      <h3 className="text-sm font-bold text-gray-800 mb-1">You're all caught up!</h3>
      <p className="text-xs text-gray-500 mb-4">
        Last refreshed {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleBackToTop}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-violet-600 text-xs font-semibold border border-violet-200 hover:bg-violet-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          Back to top
        </button>
      </div>
    </div>
  );
}
