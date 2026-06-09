// ApplyConfirmSheet.jsx — small bottom sheet confirming application was sent
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function ApplyConfirmSheet({ node, isOpen, onClose }) {
  if (!node) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[65] bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-6 pb-8 pt-2 text-center">
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, stiffness: 300, damping: 20 }}
                className="mx-auto mb-4"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-100">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
              </motion.div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Application sent!
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Your application has been sent to{' '}
                <span className="font-semibold text-gray-700">
                  {node.company_name || node.sublabel}
                </span>
              </p>

              {/* AI match reason */}
              {node.matchReason && (
                <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 mb-5 text-left">
                  <p className="text-[12px] text-gray-400 mb-1 font-medium">Match insight sent with application</p>
                  <p className="text-[13px] italic text-brand font-medium">
                    ✦ {node.matchReason}
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors shadow-md"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
