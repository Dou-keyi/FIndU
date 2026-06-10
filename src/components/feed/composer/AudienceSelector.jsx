// AudienceSelector.jsx — Public / Connections Only dropdown
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Link2 } from 'lucide-react';
import { VISIBILITY_OPTIONS } from '../../../lib/feedConstants';

const ICONS = { public: Globe, connections: Link2 };

export default function AudienceSelector({ value = 'public', onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = VISIBILITY_OPTIONS.find((o) => o.key === value) || VISIBILITY_OPTIONS[0];
  const CurrentIcon = ICONS[current.key] || Globe;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <CurrentIcon className="w-3.5 h-3.5" />
        {current.label}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
          {VISIBILITY_OPTIONS.map((opt) => {
            const Icon = ICONS[opt.key] || Globe;
            return (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${
                  value === opt.key
                    ? 'bg-violet-50 text-violet-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {opt.emoji} {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
