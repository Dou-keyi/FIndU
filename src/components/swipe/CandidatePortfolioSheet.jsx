// CandidatePortfolioSheet.jsx — bottom sheet showing full candidate profile for employers
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Briefcase, Globe2, Sparkles, User, FileText, CheckCircle2 } from 'lucide-react';
import { getInitials } from '../../lib/avatarUtils';

export default function CandidatePortfolioSheet({
  node,
  isOpen,
  onClose,
  onReject,
  onShortlist,
}) {
  if (!node) return null;

  const candidateName = node.full_name || node.label || 'Candidate';
  const initials = getInitials(candidateName);
  const heroTint = '#10b981'; // Emerald 500 for candidate hero tint

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
                style={{ background: `linear-gradient(180deg, ${heroTint}20 0%, ${heroTint}05 50%, #F9FAFB 100%)` }}
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
                  {/* Avatar + Name */}
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 ring-4 ring-white/80 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #15B886 100%)' }}
                    >
                      {node.avatar_url ? (
                        <img
                          src={node.avatar_url}
                          alt={candidateName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h1 className="text-xl font-black text-gray-900 leading-tight tracking-tight mb-1">
                        {candidateName}
                      </h1>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700 leading-snug">
                          {node.headline || node.sublabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meta pills row */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {node.location && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 text-gray-600 border border-gray-200/50 backdrop-blur-sm shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {node.location}
                      </span>
                    )}
                    {node.work_type && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50/80 text-emerald-700 border border-emerald-200/50 backdrop-blur-sm shadow-sm">
                        <Globe2 className="w-3.5 h-3.5" />
                        {(Array.isArray(node.work_type) ? node.work_type : [node.work_type]).map(wt => wt.charAt(0).toUpperCase() + wt.slice(1)).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT */}
              <div className="px-4 pb-8 space-y-4">
                {/* AI Match Reason */}
                {node.matchReason && (
                  <div className="bg-gradient-to-br from-emerald-50 to-[#ECFDF5] border border-emerald-100/60 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> AI Analysis
                    </p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {node.matchReason}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {node.skills && node.skills.length > 0 && (
                  <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Top Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {node.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 transition-colors hover:bg-emerald-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Resume / Portfolio snippet (mock for now since we don't have description in node usually) */}
                {(node.about || node.bio) && (
                  <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      About
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {node.about || node.bio}
                    </p>
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
                  onReject?.();
                  onClose();
                }}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Not a fit
              </button>
              <button
                onClick={() => {
                  onShortlist?.();
                  onClose();
                }}
                className="flex-[2] py-3.5 rounded-xl text-white text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #15B886 100%)' }}
              >
                Shortlist →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
