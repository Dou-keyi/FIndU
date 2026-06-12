// CharacterRing.jsx — circular SVG progress ring for character count
import React from 'react';

const RADIUS = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CharacterRing({ current, max }) {
  const ratio = current / max;
  const remaining = max - current;
  const offset = CIRCUMFERENCE * (1 - Math.min(ratio, 1));

  // Color logic: default → amber at 80% → red at 95%
  let strokeColor = '#94a3b8'; // slate-400
  let textColor = 'text-gray-400';
  if (ratio >= 0.95) {
    strokeColor = '#ef4444'; // red-500
    textColor = 'text-red-500';
  } else if (ratio >= 0.8) {
    strokeColor = '#f59e0b'; // amber-500
    textColor = 'text-amber-500';
  }

  const showCount = ratio >= 0.8;

  return (
    <div className="relative inline-flex items-center justify-center w-8 h-8">
      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 24 24">
        {/* Background track */}
        <circle
          cx="12"
          cy="12"
          r={RADIUS}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        {/* Progress arc */}
        <circle
          cx="12"
          cy="12"
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-200"
        />
      </svg>
      {showCount && (
        <span className={`absolute text-[9px] font-bold ${textColor}`}>
          {remaining}
        </span>
      )}
    </div>
  );
}
