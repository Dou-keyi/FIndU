// PostCard.jsx — renders candidate or company post cards in the social feed
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import { formatRelativeTime } from '../../lib/relativeTime';

export default function PostCard({ post, viewerRole }) {
  const navigate = useNavigate();
  const isCompanyPost = post.post_type === 'company';
  const author = post.author;
  const company = post.company;

  const displayName = isCompanyPost ? company?.name : author?.full_name;
  const displaySubtext = isCompanyPost ? 'Company' : author?.headline;
  const avatarInitials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  const handleHashtagClick = (tag) => {
    const clean = tag.replace(/^#/, '');
    navigate(`/feed?hashtag=${encodeURIComponent(clean)}`);
  };

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-300 hover:shadow-md hover:border-gray-200 group">
      {/* Author row */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
        >
          {avatarInitials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {displayName || 'Unknown'}
            </h3>
            {isCompanyPost && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                <Building2 className="w-3 h-3" />
                Company
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-gray-500 truncate">{displaySubtext}</p>
            <span className="text-gray-300">·</span>
            <time className="text-xs text-gray-400 flex-shrink-0">
              {formatRelativeTime(post.created_at)}
            </time>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap text-pretty">
        {post.content}
      </p>

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {post.hashtags.map((tag) => {
            const display = tag.startsWith('#') ? tag : `#${tag}`;
            return (
              <button
                key={tag}
                onClick={() => handleHashtagClick(tag)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {display}
              </button>
            );
          })}
        </div>
      )}

      {/* Employer view: link to candidate portfolio */}
      {viewerRole === 'employer' && !isCompanyPost && author?.id && (
        <div className="flex justify-end mt-1">
          <button
            onClick={() => navigate(`/portfolio/${author.id}`)}
            className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md px-1 py-0.5"
            aria-label={`View portfolio for ${displayName}`}
          >
            View Portfolio &rarr;
          </button>
        </div>
      )}
    </article>
  );
}
