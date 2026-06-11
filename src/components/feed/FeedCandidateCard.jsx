import React from 'react';
import { MapPin, User, ExternalLink } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';

export default function FeedCandidateCard({ candidate, onViewDetail }) {
  const name = candidate.full_name || 'Candidate';
  const logoColor = getAvatarColor(name);
  const initials = getInitials(name);

  const skills = candidate.skills || [];
  const displaySkills = skills.slice(0, 3);
  const extraCount = skills.length - 3;

  return (
    <article 
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-300 hover:shadow-md hover:border-gray-200 group cursor-pointer relative"
      onClick={() => onViewDetail?.(candidate)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {candidate.avatar_url ? (
          <img src={candidate.avatar_url} alt={name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
        ) : (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm"
            style={{ backgroundColor: logoColor.bg, color: logoColor.text }}
          >
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight text-balance group-hover:text-brand transition-colors">
              {name}
            </h3>
            <p className="text-sm font-medium text-gray-600 mt-1 flex items-center gap-1.5">
              {candidate.headline || 'No headline provided'}
              {candidate.location && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-0.5 text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {candidate.location}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Metadata pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {candidate.work_type && candidate.work_type.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                {candidate.work_type[0].charAt(0).toUpperCase() + candidate.work_type[0].slice(1)}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
              <User className="w-3 h-3 inline mr-1" />
              Candidate
            </span>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
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
          )}

          <div className="flex gap-2 mt-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail?.(candidate);
              }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail?.(candidate);
              }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Portfolio
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
