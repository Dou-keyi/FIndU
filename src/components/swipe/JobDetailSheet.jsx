// JobDetailSheet.jsx — bottom sheet showing full job details with apply/skip actions
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Briefcase, Clock, Building2 } from 'lucide-react';

export default function JobDetailSheet({ node, isOpen, onClose, onApply, onSkip }) {
  if (!node) return null;

  const salaryStr =
    node.salary_min && node.salary_max
      ? `${node.currency} ${node.salary_min.toLocaleString()} – ${node.salary_max.toLocaleString()} / month`
      : null;

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
              {/* Title section */}
              <div className="mb-5 pt-2">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {node.title || node.label}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {node.company_name || node.sublabel}
                  </span>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap gap-2 mb-5">
                {node.work_type && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                    <MapPin className="w-3 h-3" />
                    {node.work_type.charAt(0).toUpperCase() + node.work_type.slice(1)}
                  </span>
                )}
                {node.experience_level && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                    <Briefcase className="w-3 h-3" />
                    {node.experience_level.charAt(0).toUpperCase() + node.experience_level.slice(1)}
                  </span>
                )}
                {node.location && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {node.location}
                  </span>
                )}
              </div>

              {/* Salary */}
              {salaryStr && (
                <div className="mb-5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm font-semibold text-emerald-700">{salaryStr}</p>
                </div>
              )}

              {/* Description */}
              {node.description && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">About the role</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{node.description}</p>
                </div>
              )}

              {/* Skills required */}
              {node.skills_required && node.skills_required.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Skills required</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {node.skills_required.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand border border-brand-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Company about */}
              {node.company_about && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">About the company</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{node.company_about}</p>
                </div>
              )}

              {/* AI match reason */}
              {node.matchReason && (
                <div className="mb-6 p-3 bg-brand-50 rounded-xl border border-brand-100">
                  <p className="text-[13px] italic text-brand font-medium">
                    ✦ {node.matchReason}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onSkip?.();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    onApply?.();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors shadow-md"
                >
                  Apply →
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
