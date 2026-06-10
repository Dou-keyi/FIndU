// PostMoreMenu.jsx — three-dot dropdown menu with context-dependent actions
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, Edit3, Trash2, BarChart3, Link2, Clock,
  Copy, Flag, EyeOff, VolumeX, ShieldOff, HelpCircle,
} from 'lucide-react';

export default function PostMoreMenu({
  isOwner,
  onEdit,
  onDelete,
  onViewInsights,
  onCopyLink,
  onSchedule,
  onReport,
  onNotInterested,
  onMuteUser,
  onBlockUser,
  onWhyShowing,
}) {
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

  const ownerItems = [
    { label: 'Edit', icon: Edit3, action: onEdit },
    { label: 'Delete', icon: Trash2, action: onDelete, danger: true },
    { label: 'View Insights', icon: BarChart3, action: onViewInsights },
    { label: 'Copy Link', icon: Link2, action: onCopyLink },
  ];

  const otherItems = [
    { label: 'Copy Link', icon: Copy, action: onCopyLink },
    { label: 'Report', icon: Flag, action: onReport, danger: true },
    { label: 'Not Interested', icon: EyeOff, action: onNotInterested },
    { divider: true },
    { label: 'Mute User', icon: VolumeX, action: onMuteUser },
    { label: 'Block User', icon: ShieldOff, action: onBlockUser, danger: true },
    { divider: true },
    { label: 'Why am I seeing this?', icon: HelpCircle, action: onWhyShowing },
  ];

  const items = isOwner ? ownerItems : otherItems;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        aria-label="More options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 overflow-hidden"
          >
            {items.map((item, i) => {
              if (item.divider) {
                return <div key={i} className="my-1 border-t border-gray-100" />;
              }
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setOpen(false);
                    item.action?.();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${
                    item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
