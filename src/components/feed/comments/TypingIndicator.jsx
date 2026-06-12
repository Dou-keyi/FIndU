// TypingIndicator.jsx — "X is replying…" indicator with animated dots
import React from 'react';

export default function TypingIndicator({ typers = [] }) {
  if (typers.length === 0) return null;

  const names = typers.map((t) => t.display_name || 'Someone');
  let text = '';
  if (names.length === 1) {
    text = `${names[0]} is replying`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are replying`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are replying`;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="font-medium">{text}…</span>
    </div>
  );
}
