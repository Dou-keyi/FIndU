// CandidatePortfolioSheet.jsx — bottom sheet showing full candidate profile for employers
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, User } from 'lucide-react';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function CandidatePortfolioSheet({
  node,
  isOpen,
  onClose,
  onReject,
  onShortlist,
}) {
  if (!node) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[65] bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="px-6 pb-8">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 mb-5 pt-2">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #1D9E75 0%, #15B886 100%)',
                  }}
                >
                  {node.avatar_url ? (
                    <img
                      src={node.avatar_url}
                      alt={node.full_name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    getInitials(node.full_name || node.label)
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {node.full_name || node.label}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {node.headline || node.sublabel}
                  </p>
                </div>
              </div>

              {/* Location */}
              {node.location && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
                  <MapPin className="w-3.5 h-3.5" />
                  {node.location}
                </div>
              )}

              {/* All skills */}
              {node.skills && node.skills.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {node.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work type */}
              {node.work_type && node.work_type.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Work preferences</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(node.work_type) ? node.work_type : [node.work_type]).map((wt) => (
                      <span
                        key={wt}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200"
                      >
                        {wt.charAt(0).toUpperCase() + wt.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI match reason */}
              {node.matchReason && (
                <div className="mb-6 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[13px] italic font-medium" style={{ color: '#085041' }}>
                    ✦ {node.matchReason}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onReject?.();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Not a fit
                </button>
                <button
                  onClick={() => {
                    onShortlist?.();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl text-white text-sm font-semibold shadow-md transition-colors"
                  style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #15B886 100%)' }}
                >
                  Shortlist →
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
