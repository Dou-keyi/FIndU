// KeyboardShortcuts.jsx — modal showing available keyboard shortcuts
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../../lib/feedConstants';
import { useFeedStore } from '../../store/feedStore';

export default function KeyboardShortcutsModal() {
  const isOpen = useFeedStore((s) => s.shortcutsModalOpen);
  const setOpen = useFeedStore((s) => s.setShortcutsModalOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[85] w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-gray-900">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-2">
              {KEYBOARD_SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-mono font-bold text-gray-700 border border-gray-200">
                    {s.key === '?' ? 'Shift + ?' : s.key.toUpperCase()}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
