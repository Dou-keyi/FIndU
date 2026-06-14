// ApplicationCard.jsx — displays an application for either candidate or employer
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Briefcase, ExternalLink, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { formatRelativeTime } from '../../lib/relativeTime';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';

// Status colors mapping
const statusColors = {
  applied: 'bg-slate-100 text-slate-600 border-slate-200',
  viewed: 'bg-blue-50 text-blue-600 border-blue-200',
  shortlisted: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const statusLabels = {
  applied: 'Applied',
  viewed: 'Viewed',
  shortlisted: 'Shortlisted',
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export default function ApplicationCard({ app, isEmployer, onStatusChange, onViewPortfolio, onMessage }) {
  const [expanded, setExpanded] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState(null);
  const [showStagePrompt, setShowStagePrompt] = React.useState(false);

  if (isEmployer) {
    // Employer view
    const candidate = app.candidate;
    const colors = getAvatarColor(candidate?.full_name);
    const initials = getInitials(candidate?.full_name);

    return (
      <div 
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative group cursor-pointer hover:border-brand/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold mt-1"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {candidate?.avatar_url ? (
              <img src={candidate.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-slate-900 truncate">
                  {candidate?.full_name || 'Unknown Candidate'}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{candidate?.headline}</p>
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap mt-1">
                {formatRelativeTime(app.applied_at)}
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-medium text-brand truncate">
                  {app.job?.title}
                </p>
              </div>

              {/* Status Select or Final Stage */}
              {['pending', 'accepted', 'rejected'].includes(app.status) ? (
                <div className="flex-shrink-0 px-2.5 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full border border-slate-200 uppercase tracking-wide">
                  Final Stage
                </div>
              ) : (
                <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setShowStagePrompt(!showStagePrompt)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 transition-colors cursor-pointer ${statusColors[app.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                  >
                    {statusLabels[app.status] || 'Unknown'}
                    <ChevronDown className={`w-3 h-3 ${(statusColors[app.status] || 'bg-slate-100 text-slate-600').split(' ')[1]}`} />
                  </button>

                  <AnimatePresence>
                    {showStagePrompt && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowStagePrompt(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1 overflow-hidden"
                        >
                          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Move to Stage</span>
                          </div>
                          {['applied', 'viewed', 'shortlisted', 'pending'].map(st => (
                            <button
                              key={st}
                              onClick={() => {
                                onStatusChange?.(app.id, st);
                                setShowStagePrompt(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 ${app.status === st ? 'text-brand bg-brand-50/50' : 'text-slate-600'}`}
                            >
                              {app.status === st && <Check className="w-3 h-3" />}
                              <span className={app.status === st ? '' : 'ml-5'}>
                                {st === 'pending' ? 'Final Stage' : statusLabels[st]}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Expand Toggle */}
            <button 
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 flex items-center justify-center py-1 text-slate-300 hover:text-slate-500 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {/* AI Context */}
                  {app.ai_context && (
                    <div className="mt-2 px-3 py-2 bg-brand-50 rounded-lg border border-brand-100/50">
                      <p className="text-[11px] text-brand/80 font-medium mb-1">AI Match Insight</p>
                      <p className="text-xs italic text-brand leading-relaxed">
                        {app.ai_context}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewPortfolio?.(candidate?.id); }}
                      className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      View Portfolio
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMessage?.(candidate?.id, app.job?.id, app.job?.title); }}
                      className="flex-1 py-2 px-3 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors shadow-sm"
                    >
                      Message
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Final Stage Decisions (Always Visible) */}
            {app.status === 'pending' && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <AnimatePresence mode="popLayout">
                  {confirmAction ? (
                    <motion.div 
                      key="confirm"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 shadow-inner"
                    >
                      <span className="text-xs font-bold text-slate-700 ml-1">
                        Confirm {confirmAction === 'accepted' ? 'Accept' : 'Reject'}?
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setConfirmAction(null)} 
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-md text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            onStatusChange?.(app.id, confirmAction);
                            setConfirmAction(null);
                          }} 
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-md text-white shadow-sm transition-colors ${
                            confirmAction === 'accepted' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          Yes
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="buttons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between border-t border-slate-100 pt-3"
                    >
                      <button
                        onClick={() => onStatusChange?.(app.id, 'shortlisted')}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                      >
                        <span>⟲</span> Revert
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmAction('rejected')}
                          className="w-8 h-8 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                          title="Reject Candidate"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmAction('accepted')}
                          className="w-8 h-8 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center shadow-sm"
                          title="Accept Candidate"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {app.status === 'accepted' && (
              <div className="mt-3 py-2 pl-3 pr-2 rounded-lg bg-emerald-50 border border-emerald-200 shadow-inner flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className="text-emerald-700 text-xs font-bold">Candidate Accepted</span>
                <button 
                  onClick={() => onStatusChange?.(app.id, 'pending')}
                  className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                >
                  Undo
                </button>
              </div>
            )}
            {app.status === 'rejected' && (
              <div className="mt-3 py-2 pl-3 pr-2 rounded-lg bg-red-50 border border-red-200 shadow-inner flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className="text-red-700 text-xs font-bold">Candidate Rejected</span>
                <button 
                  onClick={() => onStatusChange?.(app.id, 'pending')}
                  className="text-[10px] font-bold px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Undo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Candidate view
  const job = app.job;
  const company = job?.company;
  const colors = getAvatarColor(company?.name);
  const initials = getInitials(company?.name);

  const salaryStr = job?.salary_min && job?.salary_max
    ? `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex gap-3">
        {/* Company Logo */}
        <div
          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {company?.logo_url ? (
            <img src={company.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-900 truncate">
                {job?.title || 'Unknown Role'}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{company?.name}</p>
            </div>
            
            {/* Status Pill */}
            <div className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusColors[app.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {statusLabels[app.status] || 'Unknown'}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
            {salaryStr && (
              <span className="text-xs font-semibold text-emerald-600">{salaryStr}</span>
            )}
            {job?.work_type && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3" />
                <span className="capitalize">{job.work_type}</span>
              </span>
            )}
            {job?.experience_level && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Briefcase className="w-3 h-3" />
                <span className="capitalize">{job.experience_level}</span>
              </span>
            )}
          </div>

          <p className="text-[10px] text-slate-400 mt-2.5">
            Applied {formatRelativeTime(app.applied_at)}
          </p>

          {/* Expandable AI Context */}
          {app.ai_context && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                  <span className={`text-[11px] text-brand transition-colors ${expanded ? 'font-semibold' : 'font-medium group-hover:text-brand-dark'} truncate`}>
                    {expanded ? 'Why you were matched' : <span className="italic">Why you were matched ↓</span>}
                  </span>
                </div>
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-brand" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-brand opacity-0 group-hover:opacity-100" />
                )}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 px-3 py-2.5 bg-brand-50 rounded-lg border border-brand-100">
                      <p className="text-xs italic text-brand leading-relaxed">
                        {app.ai_context}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onViewPortfolio?.(company?.id)}
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              View Company
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => onMessage?.(job?.posted_by, job?.id, job?.title)}
              className="flex-1 py-2 px-3 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors shadow-sm"
            >
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
