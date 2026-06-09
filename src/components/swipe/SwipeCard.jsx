// SwipeCard.jsx — renders a single swipe card for job (candidate view) or candidate (employer view)
import React from 'react';
import { Badge } from '../ui/badge';
import { MapPin, Briefcase, Clock, ChevronDown } from 'lucide-react';

/**
 * Get initials from a name string
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Work type colour mapping
 */
function getWorkTypeBadge(workType) {
  const styles = {
    remote: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    hybrid: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    onsite: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  };
  const s = styles[workType] || styles.onsite;
  const label = workType ? workType.charAt(0).toUpperCase() + workType.slice(1) : 'On-site';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <MapPin className="w-3 h-3" />
      {label}
    </span>
  );
}

/**
 * JobCard — shown to candidates
 */
function JobCard({ node, onShowMore }) {
  const salaryStr =
    node.salary_min && node.salary_max
      ? `${node.currency} ${node.salary_min.toLocaleString()} – ${node.salary_max.toLocaleString()} / month`
      : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header: company icon + info */}
      <div className="flex items-start gap-3.5 mb-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
          style={{
            background: `linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)`,
          }}
        >
          {getInitials(node.company_name || node.sublabel)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight truncate">
            {node.title || node.label}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {node.company_name || node.sublabel}
          </p>
        </div>
      </div>

      {/* Salary + badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {salaryStr && (
          <span className="text-sm font-semibold text-gray-800">
            {salaryStr}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {getWorkTypeBadge(node.work_type)}
        {node.experience_level && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-600 border-gray-200">
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

      {/* Skills pills */}
      {node.skills_required && node.skills_required.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {node.skills_required.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand border border-brand-200"
            >
              {skill}
            </span>
          ))}
          {node.skills_required.length > 5 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              +{node.skills_required.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Divider + AI match reason */}
      <div className="border-t border-gray-100 pt-3 mt-auto">
        <p className="text-[13px] italic text-brand font-medium leading-relaxed">
          ✦ {node.matchReason}
        </p>
      </div>

      {/* Show more */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShowMore?.();
        }}
        className="flex items-center justify-center gap-1 mt-3 py-2 text-xs font-medium text-gray-400 hover:text-brand transition-colors"
      >
        Show more <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * CandidateCard — shown to employers
 */
function CandidateCard({ node, onShowMore }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header: avatar + info */}
      <div className="flex items-start gap-3.5 mb-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
          style={{
            background: `linear-gradient(135deg, #1D9E75 0%, #15B886 100%)`,
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
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight truncate">
            {node.full_name || node.label}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {node.headline || node.sublabel}
          </p>
        </div>
      </div>

      {/* Location */}
      {node.location && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3 h-3" />
          {node.location}
        </div>
      )}

      {/* Skills pills */}
      {node.skills && node.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {node.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              {skill}
            </span>
          ))}
          {node.skills.length > 4 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              +{node.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Divider + AI match reason */}
      <div className="border-t border-gray-100 pt-3 mt-auto">
        <p className="text-[13px] italic font-medium leading-relaxed" style={{ color: '#085041' }}>
          ✦ {node.matchReason}
        </p>
      </div>

      {/* Show more */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShowMore?.();
        }}
        className="flex items-center justify-center gap-1 mt-3 py-2 text-xs font-medium text-gray-400 hover:text-emerald-600 transition-colors"
      >
        Show more <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * SwipeCard — renders the appropriate card type based on the node type
 */
export default function SwipeCard({ node, role, onShowMore }) {
  if (role === 'candidate') {
    return <JobCard node={node} onShowMore={onShowMore} />;
  }
  return <CandidateCard node={node} onShowMore={onShowMore} />;
}
