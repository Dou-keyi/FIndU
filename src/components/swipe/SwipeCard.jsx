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
    remote: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60' },
    hybrid: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200/60' },
    onsite: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60' },
  };
  const s = styles[workType] || styles.onsite;
  const label = workType ? workType.charAt(0).toUpperCase() + workType.slice(1) : 'On-site';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
      <MapPin className="w-3.5 h-3.5" />
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
      ? `${node.currency || '$'} ${node.salary_min.toLocaleString()} – ${node.salary_max.toLocaleString()} / mo`
      : null;

  return (
    <div className="flex flex-col h-full relative -m-5 p-5">
      {/* Decorative Background Blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-100/50 to-transparent rounded-bl-full pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 relative z-10">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_20px_rgba(30,64,175,0.25)] border border-white/20"
          style={{
            background: `linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)`,
          }}
        >
          {getInitials(node.company_name || node.sublabel)}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-[19px] font-bold text-slate-900 leading-tight tracking-tight truncate">
            {node.title || node.label}
          </h3>
          <p className="text-[14px] font-medium text-brand mt-1 truncate">
            {node.company_name || node.sublabel}
          </p>
        </div>
      </div>

      {/* Salary & Primary Badges */}
      <div className="flex flex-col gap-3 mb-5">
        {salaryStr && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[15px] font-bold text-slate-800 tracking-tight">
              {salaryStr}
            </span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {getWorkTypeBadge(node.work_type)}
          {node.experience_level && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100/80 text-slate-600 border border-slate-200/50">
              <Briefcase className="w-3.5 h-3.5" />
              {node.experience_level.charAt(0).toUpperCase() + node.experience_level.slice(1)}
            </span>
          )}
          {node.location && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100/80 text-slate-600 border border-slate-200/50">
              <MapPin className="w-3.5 h-3.5" />
              {node.location}
            </span>
          )}
        </div>
      </div>

      {/* Skills */}
      {node.skills_required && node.skills_required.length > 0 && (
        <div className="mb-5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Required Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {node.skills_required.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white text-slate-600 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                {skill}
              </span>
            ))}
            {node.skills_required.length > 5 && (
              <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-400 border border-dashed border-slate-200">
                +{node.skills_required.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* AI Match Reason Box */}
      <div className="mt-auto relative z-10">
        <div className="bg-gradient-to-br from-brand-50 to-[#EEF2FF] border border-brand-100/60 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-brand text-[10px] font-extrabold tracking-widest uppercase">✦ AI Analysis</span>
          </div>
          <p className="text-[13px] text-slate-700 font-medium leading-relaxed">
            {node.matchReason}
          </p>
        </div>
      </div>

      {/* Show more */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShowMore?.();
        }}
        className="flex items-center justify-center gap-1.5 mt-4 py-2.5 text-xs font-bold text-slate-400 hover:text-brand hover:bg-brand-50 rounded-xl transition-all"
      >
        View full description <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * CandidateCard — shown to employers
 */
function CandidateCard({ node, onShowMore }) {
  return (
    <div className="flex flex-col h-full relative -m-5 p-5">
      {/* Decorative Background Blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/50 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-start gap-4 mb-5 relative z-10">
        <div
          className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-[0_4px_20px_rgba(21,184,134,0.25)] border border-white/20"
          style={{
            background: `linear-gradient(135deg, #1D9E75 0%, #15B886 100%)`,
          }}
        >
          {node.avatar_url ? (
            <img
              src={node.avatar_url}
              alt={node.full_name}
              className="w-full h-full rounded-2xl object-cover"
            />
          ) : (
            getInitials(node.full_name || node.label)
          )}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-[20px] font-bold text-slate-900 leading-tight tracking-tight truncate">
            {node.full_name || node.label}
          </h3>
          <p className="text-[14px] font-medium text-emerald-700 mt-1 line-clamp-2 leading-snug">
            {node.headline || node.sublabel}
          </p>
        </div>
      </div>

      {/* Location */}
      {node.location && (
        <div className="flex items-center gap-1.5 mb-5 px-3 py-1.5 rounded-lg bg-slate-50 w-fit border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{node.location}</span>
        </div>
      )}

      {/* Skills */}
      {node.skills && node.skills.length > 0 && (
        <div className="mb-5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Top Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {node.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                {skill}
              </span>
            ))}
            {node.skills.length > 4 && (
              <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-400 border border-dashed border-slate-200">
                +{node.skills.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* AI Match Reason Box */}
      <div className="mt-auto relative z-10">
        <div className="bg-gradient-to-br from-emerald-50 to-[#ECFDF5] border border-emerald-100/60 rounded-xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-700 text-[10px] font-extrabold tracking-widest uppercase">✦ AI Analysis</span>
          </div>
          <p className="text-[13px] text-slate-700 font-medium leading-relaxed">
            {node.matchReason}
          </p>
        </div>
      </div>

      {/* Show more */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShowMore?.();
        }}
        className="flex items-center justify-center gap-1.5 mt-4 py-2.5 text-xs font-bold text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
      >
        View full profile <ChevronDown className="w-4 h-4" />
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
