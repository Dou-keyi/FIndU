// LogoutConfirmModal.jsx — confirmation dialog before signing out
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            aria-hidden="true"
          />

          {/* Modal content */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm pointer-events-auto relative"
            >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <LogOut className="w-6 h-6 text-red-500" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to leave?
                </h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to log out? You'll need to sign back in to access your account.
                </p>
              </div>

              <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors"
                >
                  Log out
                </button>
              </div>
              
              {/* Close button in corner */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
