// JobStripCard.jsx — compact horizontal-scroll job card for "Picked for you" strip
import React from 'react';
import { MapPin } from 'lucide-react';

export default function JobStripCard({ job, onClick }) {
  const salaryStr =
    job.salary_min && job.salary_max
      ? `${job.currency || 'MYR'} ${(job.salary_min / 1000).toFixed(0)}k–${(job.salary_max / 1000).toFixed(0)}k`
      : null;

  return (
    <button
      onClick={() => onClick?.(job)}
      className="flex-shrink-0 w-[160px] bg-white rounded-xl border border-slate-100 p-3 text-left hover:shadow-md hover:border-brand-200 transition-all group"
    >
      {/* Company name */}
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 truncate">
        {job.company?.name || 'Company'}
      </p>

      {/* Job title */}
      <h4 className="text-xs font-semibold text-gray-900 leading-tight mb-2 line-clamp-2 min-h-[32px] group-hover:text-brand transition-colors">
        {job.title}
      </h4>

      {/* Salary */}
      {salaryStr && (
        <p className="text-[11px] font-semibold text-emerald-600 mb-1.5">{salaryStr}</p>
      )}

      {/* Work type pill */}
      {job.work_type && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-500 border border-gray-100">
          <MapPin className="w-2.5 h-2.5" />
          {job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1)}
        </span>
      )}
    </button>
  );
}
