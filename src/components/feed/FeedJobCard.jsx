// FeedJobCard.jsx — full-width job card for Jobs tab and Company page open roles
import React, { useState, useEffect } from 'react';
import { MapPin, Briefcase, Building2, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { MapPin, Briefcase, Building2, Loader2, Edit2, Trash2 } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function FeedJobCard({ job, onViewDetail, onApply, isEmployerForCompany, onEdit, onDelete }) {
  const [applying, setApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(job.has_applied || false);
  const [checking, setChecking] = useState(!job.has_applied);

  useEffect(() => {
    if (!user || job.has_applied) {
      setChecking(false);
      return;
    }
    const checkStatus = async () => {
      try {
        const { data } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', job.id)
          .eq('candidate_id', user.id)
          .maybeSingle();
        if (data) setIsApplied(true);
      } catch (err) {
        console.error('Failed to check application status', err);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, [user, job.id, job.has_applied]);

  const companyName = job.company?.name || 'Company';
  const logoColor = getAvatarColor(companyName);
  const initials = getInitials(companyName);

  const salaryStr =
    job.salary_min && job.salary_max
      ? `${job.currency || 'MYR'} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
      : null;

  const skills = job.skills_required || [];
  const displaySkills = skills.slice(0, 3);
  const extraCount = skills.length - 3;

  const handleApply = async (e) => {
    e.stopPropagation();
    setApplying(true);
    try {
      await onApply?.(job);
      setIsApplied(true);
    } finally {
      setApplying(false);
    }
  };

  return (
    <article 
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-300 hover:shadow-md hover:border-gray-200 group cursor-pointer relative"
      onClick={() => onViewDetail?.(job)}
    >
      {isEmployerForCompany && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(job.id);
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors focus-visible:outline-none"
          aria-label="Delete job"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-start gap-4">
        {/* Company logo / initials */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ backgroundColor: logoColor.bg, color: logoColor.text }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight text-balance group-hover:text-brand transition-colors">
              {job.title}
            </h3>
            <p className="text-sm font-medium text-gray-600 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              {companyName}
              {job.location && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-0.5 text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Salary */}
          {salaryStr && (
            <p className="text-sm font-semibold text-emerald-600 mt-2">{salaryStr}</p>
          )}

          {/* Metadata pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {job.work_type && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                {job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1)}
              </span>
            )}
            {job.experience_level && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                <Briefcase className="w-3 h-3 inline mr-1" />
                {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
              </span>
            )}
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {displaySkills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100"
              >
                {skill}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="px-2 py-1 rounded-md text-xs font-medium text-gray-400">
                +{extraCount} more
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail?.(job);
              }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              Details
            </button>
            <button
              onClick={handleApply}
              disabled={applying || isApplied || checking}
              className={`flex-[2] py-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand flex items-center justify-center gap-2 ${
                isApplied || checking
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-brand text-white hover:bg-brand-dark shadow-sm'
              }`}
            >
              {(applying || checking) && <Loader2 className="w-4 h-4 animate-spin" />}
              {checking ? 'Checking…' : isApplied ? 'Applied' : applying ? 'Applying…' : 'Apply'}
            </button>
            
            {isEmployerForCompany ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(job.id);
                }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Job
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying || job.has_applied}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand flex items-center justify-center gap-2 ${
                  job.has_applied
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-brand text-white hover:bg-brand-dark shadow-sm'
                }`}
              >
                {applying && <Loader2 className="w-4 h-4 animate-spin" />}
                {job.has_applied ? 'Applied' : applying ? 'Applying…' : 'Apply'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
