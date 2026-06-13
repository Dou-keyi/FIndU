// JobDetailSheet.jsx — bottom sheet showing full job details with apply/skip actions
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Briefcase, Clock, Building2, Globe2, Sparkles, ExternalLink, CheckCircle2 } from 'lucide-react';
import { getInitials, getAvatarColor, getBrandTint } from '../../lib/avatarUtils';

export default function JobDetailSheet({ node, isOpen, onClose, onApply, onSkip }) {
  if (!node) return null;

  const salaryStr =
    node.salary_min && node.salary_max
      ? `${node.currency || 'MYR'} ${node.salary_min.toLocaleString()} – ${node.salary_max.toLocaleString()}`
      : null;

  const companyName = node.company_name || node.sublabel || 'Company';
  const companyInitials = getInitials(companyName);
  const companyColor = getAvatarColor(companyName);
  const heroTint = getBrandTint(companyName);
  const skills = node.skills_required || [];

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
            className="fixed bottom-0 left-0 right-0 z-[65] bg-gray-50 rounded-t-3xl max-h-[90vh] overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.15)] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* HERO SECTION */}
              <div
                className="relative pb-6"
                style={{ background: `linear-gradient(180deg, ${heroTint}80 0%, ${heroTint}30 50%, #F9FAFB 100%)` }}
              >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1 relative z-10">
                  <div className="w-10 h-1.5 rounded-full bg-black/20" />
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/50 hover:bg-white/80 transition-colors z-10 shadow-sm backdrop-blur-md"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>

                {/* Hero Content */}
                <div className="px-6 pt-6">
                  {/* Company logo */}
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ring-4 ring-white/80 shadow-lg flex-shrink-0"
                      style={{ backgroundColor: companyColor.bg, color: companyColor.text }}
                    >
                      {companyInitials}
                    </div>

                    <div className="flex-1 min-w-0 pr-8">
                      <h1 className="text-xl font-black text-gray-900 leading-tight tracking-tight mb-1">
                        {node.title || node.label}
                      </h1>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          {companyName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meta pills row */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {node.location && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 text-gray-600 border border-gray-200/50 backdrop-blur-sm shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {node.location}
                      </span>
                    )}
                    {node.work_type && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50/80 text-violet-700 border border-violet-200/50 backdrop-blur-sm shadow-sm">
                        <Globe2 className="w-3.5 h-3.5" />
                        {node.work_type.charAt(0).toUpperCase() + node.work_type.slice(1)}
                      </span>
                    )}
                    {node.experience_level && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 text-gray-600 border border-gray-200/50 backdrop-blur-sm shadow-sm">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                        {node.experience_level.charAt(0).toUpperCase() + node.experience_level.slice(1)}
                      </span>
                    )}
                  </div>

                  {/* Salary highlight */}
                  {salaryStr && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-emerald-600 mb-0.5 uppercase tracking-wider">Monthly Salary</p>
                      <p className="text-lg font-black text-emerald-700">{salaryStr}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* MAIN CONTENT */}
              <div className="px-4 pb-8 space-y-4">
                {/* AI Match Reason */}
                {node.matchReason && (
                  <div className="bg-gradient-to-br from-brand-50 to-[#EEF2FF] border border-brand-100/60 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm font-semibold text-brand mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> AI Analysis
                    </p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {node.matchReason}
                    </p>
                  </div>
                )}

                {/* About the Role */}
                {node.description && (
                  <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-violet-500" />
                      About the Role
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {node.description}
                    </p>
                  </section>
                )}

                {/* Skills Required */}
                {skills.length > 0 && (
                  <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Skills Required
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 transition-colors hover:bg-violet-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* About the Company */}
                {node.company_about && (
                  <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      About {companyName}
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {node.company_about}
                    </p>
                    
                    {node.company_id && (
                      <a
                        href={`/company/${node.company_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors shadow-sm"
                      >
                        View Company Profile <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                  </section>
                )}
                
                {/* Bottom padding for sticky CTA */}
                <div className="h-16" />
              </div>
            </div>

            {/* STICKY BOTTOM CTA */}
            <div className="bg-white border-t border-gray-100 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex gap-3 z-10 shrink-0">
              <button
                onClick={() => {
                  onSkip?.();
                  onClose();
                }}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  onApply?.();
                  onClose();
                }}
                disabled={node.has_applied}
                className={`flex-[2] py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                  node.has_applied
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                    : 'bg-brand text-white hover:bg-brand-dark active:scale-[0.98]'
                }`}
              >
                {node.has_applied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Applied
                  </>
                ) : (
                  'Apply Now →'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
