// SavedJobCard.jsx — displays a saved job with apply and remove actions
import React from 'react';
import { MapPin, Briefcase, Trash2, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '../../lib/relativeTime';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';

export default function SavedJobCard({ savedJob, onApply, onRemove, isRemoving }) {
  const job = savedJob.job;
  const company = job?.company;
  const colors = getAvatarColor(company?.name);
  const initials = getInitials(company?.name);

  const salaryStr = job?.salary_min && job?.salary_max
    ? `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
    : null;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm transition-opacity ${isRemoving ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex gap-3 mb-3">
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
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
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
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
        <p className="text-[10px] text-slate-400">
          Saved {formatRelativeTime(savedJob.saved_at)}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onRemove(savedJob)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Remove saved job"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onApply(savedJob)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            Apply now
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
