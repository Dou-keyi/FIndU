// PostHeader.jsx — post card header with avatar, name, intent badge, timestamp, follow, menu
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, Building2 } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../../lib/avatarUtils';
import { formatRelativeTime } from '../../../lib/relativeTime';
import { POST_INTENTS, ONLINE_THRESHOLD_MS } from '../../../lib/feedConstants';
import PostMoreMenu from './PostMoreMenu';

export default function PostHeader({
  post,
  isOwner,
  isFollowing,
  onFollow,
  onEdit,
  onDelete,
  onViewInsights,
  onCopyLink,
  onReport,
  onNotInterested,
  onMuteUser,
  onBlockUser,
  onWhyShowing,
}) {
  const navigate = useNavigate();
  const [followLoading, setFollowLoading] = useState(false);

  const isCompanyPost = post.post_type === 'company';
  const author = post.author;
  const company = post.company;

  const displayName = isCompanyPost ? company?.name : author?.full_name;
  const displaySubtext = isCompanyPost ? author?.full_name : author?.headline; // Company posts show the poster's name here
  const displayAvatar = isCompanyPost ? company?.logo_url : author?.avatar_url;

  const avatarInitials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  // Check if user is "online" (last_seen within 5 min)
  const isOnline = author?.last_seen
    ? Date.now() - new Date(author.last_seen).getTime() < ONLINE_THRESHOLD_MS
    : false;

  // Intent badge
  const intentData = post.intent
    ? POST_INTENTS.find((i) => i.key === post.intent)
    : null;

  const handleProfileClick = () => {
    if (isCompanyPost && company?.id) {
      navigate(`/company/${company.id}`);
    } else if (author?.id) {
      navigate(`/portfolio/${author.id}`);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      await onFollow?.();
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-3 mb-3">
      {/* Avatar with online indicator */}
      <button
        onClick={handleProfileClick}
        className="relative flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-full"
        aria-label={`View ${displayName}'s profile`}
      >
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt={displayName || 'Avatar'}
            className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-black/5"
            loading="lazy"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
          >
            {avatarInitials}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
        )}
      </button>

      {/* Name, headline, timestamp */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleProfileClick}
            className="text-sm font-bold text-gray-900 hover:text-violet-700 transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
          >
            {displayName || 'Unknown'}
          </button>

          {isCompanyPost && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
              <Building2 className="w-3 h-3" />
              Company Update
            </span>
          )}

          {intentData && !isCompanyPost && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
              {intentData.emoji} {intentData.label}
            </span>
          )}

          {/* Follow button — only for non-owners */}
          {!isOwner && !isCompanyPost && (
            <button
              onClick={!isFollowing ? handleFollow : undefined}
              disabled={followLoading || isFollowing}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                isFollowing 
                  ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-default' 
                  : 'text-violet-600 hover:bg-violet-50 border-violet-200 cursor-pointer'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3 h-3" />
                  Followed
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3" />
                  Follow
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5 flex-wrap">
          {isCompanyPost ? (
            <span className="font-medium text-gray-600 flex items-center gap-1">
              <span className="text-gray-400">Posted by</span>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/portfolio/${author?.id}`); }}
                className="text-gray-700 hover:text-violet-600 transition-colors hover:underline"
              >
                {displaySubtext || 'Unknown'}
              </button>
            </span>
          ) : (
            <span className="truncate max-w-[200px]">{displaySubtext || 'FIndU Member'}</span>
          )}
          
          <span className="text-gray-300">•</span>
          <span>{formatRelativeTime(post.created_at)}</span>
          {post.location && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                📍 {post.location}
              </span>
            </>
          )}
        </div>
      </div>

      {/* More menu */}
      <PostMoreMenu
        isOwner={isOwner}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewInsights={onViewInsights}
        onCopyLink={onCopyLink}
        onReport={onReport}
        onNotInterested={onNotInterested}
        onMuteUser={onMuteUser}
        onBlockUser={onBlockUser}
        onWhyShowing={onWhyShowing}
      />
    </div>
  );
}
