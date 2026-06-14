// SaveConfirmModal.jsx — centered popup card confirming job was saved
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

export default function SaveConfirmModal({ node, isOpen, onClose }) {
  if (!node) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={onClose}
          />

          {/* Centered Popup Card */}
          <motion.div
            className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <div className="p-8 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, stiffness: 300, damping: 20 }}
                className="mx-auto mb-5"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-4 border-amber-100 shadow-sm">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                </div>
              </motion.div>

              {/* Title & Message */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Job Saved!
              </h3>
              
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                You have successfully saved the job at{' '}
                <span className="font-semibold text-gray-800">
                  {node.company_name || node.sublabel}
                </span>. You can review it later in your saved list.
              </p>

              {/* Action Button */}
              <button
                onClick={onClose}
                className="w-full py-3.5 px-4 rounded-xl text-white text-sm font-bold shadow-md transition-all active:scale-[0.98] bg-brand hover:bg-brand-dark"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
