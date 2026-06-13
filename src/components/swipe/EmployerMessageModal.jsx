import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Building2 } from 'lucide-react';

export default function EmployerMessageModal({ isOpen, onClose, candidateName, onConfirm }) {
  const [message, setMessage] = useState('');
  const [includePortfolio, setIncludePortfolio] = useState(false);

  // If closed, render nothing
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Message {candidateName}
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">
                Custom Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message to start the conversation..."
                className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setIncludePortfolio(!includePortfolio)}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Building2 className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Attach Portfolio Card</h3>
                  <p className="text-xs text-gray-500">Include your company profile</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={includePortfolio}
                  readOnly
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(message, includePortfolio)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-brand rounded-xl hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Connect
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
