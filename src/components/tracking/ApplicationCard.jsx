// ApplicationCard.jsx — displays an application for either candidate or employer
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Briefcase, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { formatRelativeTime } from '../../lib/relativeTime';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';

// Status colors mapping
const statusColors = {
  applied: 'bg-slate-100 text-slate-600 border-slate-200',
  viewed: 'bg-blue-50 text-blue-600 border-blue-200',
  shortlisted: 'bg-violet-50 text-violet-600 border-violet-200',
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

  if (isEmployer) {
    // Employer view
    const candidate = app.candidate;
    const colors = getAvatarColor(candidate?.full_name);
    const initials = getInitials(candidate?.full_name);

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
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
                  <p className="text-[14px] font-bold text-slate-900 truncate">
                    {candidate?.full_name || 'Unknown Candidate'}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{candidate?.headline}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs font-semibold text-brand truncate">
                {app.job?.title}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Applied {formatRelativeTime(app.applied_at)}
              </span>
            </div>

            {/* Status Select */}
            <div className="relative flex-shrink-0">
              <select
                value={app.status}
                onChange={(e) => onStatusChange?.(app.id, e.target.value)}
                className={`appearance-none pl-2.5 pr-6 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors cursor-pointer ${statusColors[app.status]}`}
              >
                <option value="applied">Applied</option>
                <option value="viewed">Viewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className={`absolute right-1.5 top-1.5 w-3 h-3 pointer-events-none ${statusColors[app.status].split(' ')[1]}`} />
            </div>
          </div>

            {/* AI Context */}
            {app.ai_context && (
              <div className="mt-3 px-3 py-2 bg-brand-50 rounded-lg border border-brand-100/50">
                <p className="text-[11px] text-brand/80 font-medium mb-1">AI Match Insight</p>
                <p className="text-xs italic text-brand leading-relaxed">
                  {app.ai_context}
                </p>
              </div>
            )}

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onViewPortfolio?.(candidate?.id)}
              className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              View Profile
            </button>
            <button
              onClick={() => onMessage?.(candidate?.id, app.job?.id, app.job?.title)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-brand text-white text-[11px] font-semibold hover:bg-brand-dark transition-colors shadow-sm"
            >
              Message
            </button>
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
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-slate-900 line-clamp-2">
                {job?.title || 'Unknown Role'}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{company?.name}</p>
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

          <div className="flex items-center justify-between mt-3">
            <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${statusColors[app.status]}`}>
              {statusLabels[app.status]}
            </div>
            <p className="text-[10px] font-medium text-slate-400">
              {formatRelativeTime(app.applied_at)}
            </p>
          </div>

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
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onViewPortfolio?.(company?.id)}
              className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              Company
            </button>
            <button
              onClick={() => onMessage?.(job?.posted_by, job?.id, job?.title)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-brand text-white text-[11px] font-semibold hover:bg-brand-dark transition-colors shadow-sm"
            >
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
