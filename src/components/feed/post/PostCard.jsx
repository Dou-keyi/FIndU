// PostCard.jsx — fully rebuilt social post card with all features
import React, { useState, forwardRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Repeat2, Award, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useFeedStore } from '../../../store/feedStore';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { POST_TYPES } from '../../../lib/feedConstants';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMediaGrid from './PostMediaGrid';
import PostVideoPlayer from './PostVideoPlayer';
import PostDocumentCard from './PostDocumentCard';
import PostLinkPreview from './PostLinkPreview';
import PostPollDisplay from './PostPollDisplay';
import PostActionBar from './PostActionBar';
import toast from 'react-hot-toast';

// Lazy import for CommentThread to avoid large initial bundle
const CommentThread = lazy(() => import('../comments/CommentThread'));

const PostCard = forwardRef(function PostCard({ post, index, isNested = false }, ref) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const focusedIndex = useFeedStore((s) => s.focusedIndex);
  const openComments = useFeedStore((s) => s.openComments);
  const removePost = useFeedStore((s) => s.removePost);
  const setInsightsPostId = useFeedStore((s) => s.setInsightsPostId);
  const setReportTarget = useFeedStore((s) => s.setReportTarget);
  const setWhyTarget = useFeedStore((s) => s.setWhyTarget);

  const [isFollowing, setIsFollowing] = useState(false);

  const isOwner = user?.id === post.author_id;
  const isFocused = index === focusedIndex && !isNested;
  const isCommentsOpen = openComments[post.id];

  // Determine post variant styling
  const postType = post.type || POST_TYPES.DEFAULT;
  const isMilestone = postType === POST_TYPES.MILESTONE;
  const isEvent = postType === POST_TYPES.EVENT;
  const isQuoteRepost = postType === POST_TYPES.QUOTE_REPOST;
  const isCandidateSpotlight = postType === POST_TYPES.CANDIDATE_SPOTLIGHT;

  // Repost header (if this is a reposted card)
  const repostedBy = post._repostedBy;

  // Media detection
  const mediaUrls = post.media_urls || [];
  const mediaTypes = post.media_types || [];
  const imageUrls = mediaUrls.filter((_, i) => (mediaTypes[i] || '').startsWith('image'));
  const videoUrl = mediaUrls.find((_, i) => (mediaTypes[i] || '').startsWith('video'));
  const docUrl = mediaUrls.find((_, i) => (mediaTypes[i] || '') === 'application/pdf');

  // Border styles per variant
  let borderClass = 'border-gray-100 hover:border-gray-200';
  if (isMilestone) borderClass = 'border-amber-200 hover:border-amber-300';
  if (isCandidateSpotlight) borderClass = 'border-violet-200 hover:border-violet-300 bg-gradient-to-br from-violet-50/30 to-white';
  if (isFocused) borderClass += ' ring-2 ring-violet-200 ring-offset-1';

  // --- Action handlers ---
  const handleFollow = async () => {
    if (!user || !post.author?.id) return;
    try {
      const { error } = await supabase.from('user_follows').insert({
        follower_id: user.id,
        following_id: post.author.id,
      });
      if (error && error.code !== '23505') throw error;
      setIsFollowing(true);
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await supabase.from('posts').delete().eq('id', post.id);
      removePost(post.id);
      toast.success('Post deleted');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/feed?post=${post.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Copied!'));
  };

  const handleNotInterested = async () => {
    try {
      await supabase.from('not_interested').insert({ user_id: user.id, post_id: post.id });
      removePost(post.id);
      toast.success('Removed from feed');
    } catch (err) {
      console.error('Not interested failed:', err);
    }
  };

  const handleMuteUser = () => {
    setReportTarget({ type: 'mute', userId: post.author?.id, name: post.author?.full_name });
  };

  const handleBlockUser = async () => {
    if (!window.confirm(`Block ${post.author?.full_name || 'this user'}?`)) return;
    try {
      await supabase.from('user_blocks').insert({
        blocker_id: user.id,
        blocked_id: post.author?.id,
      });
      toast.success('User blocked');
    } catch (err) {
      console.error('Block failed:', err);
    }
  };

  // Hashtags section
  const hashtags = post.hashtags || [];

  return (
    <motion.article
      ref={ref}
      layout={!prefersReduced}
      initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: isNested ? 0 : Math.min((index || 0) * 0.03, 0.15) }}
      className={`bg-white rounded-2xl border shadow-sm p-5 transition-all duration-200 hover:shadow-md ${borderClass} ${
        isNested ? 'pointer-events-none opacity-90' : ''
      }`}
      data-post-id={post.id}
      id={`post-${post.id}`}
    >
      {/* Repost indicator */}
      {repostedBy && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-2 -mt-1">
          <Repeat2 className="w-3.5 h-3.5" />
          <span>{repostedBy} reposted</span>
        </div>
      )}

      {/* Milestone badge */}
      {isMilestone && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mb-3 -mt-1">
          <Award className="w-4 h-4" />
          Milestone
        </div>
      )}

      {/* Candidate Spotlight badge */}
      {isCandidateSpotlight && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 rounded-lg px-2.5 py-1.5 mb-3 -mt-1">
          <Sparkles className="w-4 h-4" />
          Spotlight
        </div>
      )}

      {/* Header */}
      <PostHeader
        post={post}
        isOwner={isOwner}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onEdit={() => {}}
        onDelete={handleDelete}
        onViewInsights={() => setInsightsPostId(post.id)}
        onCopyLink={handleCopyLink}
        onReport={() => setReportTarget({ type: 'report', postId: post.id })}
        onNotInterested={handleNotInterested}
        onMuteUser={handleMuteUser}
        onBlockUser={handleBlockUser}
        onWhyShowing={() => setWhyTarget(post)}
      />

      {/* Content body */}
      <PostContent content={post.content} />

      {/* Hashtag pills */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {hashtags.map((tag) => {
            const display = tag.startsWith('#') ? tag : `#${tag}`;
            return (
              <button
                key={tag}
                onClick={() => navigate(`/feed?hashtag=${encodeURIComponent(tag.replace('#', ''))}`)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {display}
              </button>
            );
          })}
        </div>
      )}

      {/* Media: images */}
      {imageUrls.length > 0 && <PostMediaGrid urls={imageUrls} />}

      {/* Media: video */}
      {videoUrl && <PostVideoPlayer url={videoUrl} />}

      {/* Media: document */}
      {docUrl && (
        <PostDocumentCard
          url={docUrl}
          filename={post.doc_filename || 'Document.pdf'}
          pageCount={post.doc_page_count}
        />
      )}

      {/* Link preview */}
      {post.link_preview && <PostLinkPreview linkData={post.link_preview} />}

      {/* Poll */}
      {post.poll && Array.isArray(post.poll) && post.poll.length > 0 && (
        <PostPollDisplay
          poll={post.poll[0]}
          options={post.poll[0].options || []}
          votes={post.poll[0].votes || []}
          userVote={post.poll[0].votes?.find(v => v.user_id === user?.id)}
        />
      )}

      {/* Event card */}
      {isEvent && post.event_data && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 mb-3">
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex flex-col items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">{post.event_data.title || 'Event'}</p>
            <p className="text-xs text-gray-500">
              {post.event_data.date} • {post.event_data.location}
            </p>
          </div>
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors">
            RSVP
          </button>
        </div>
      )}

      {/* Quoted post (for quote reposts) */}
      {isQuoteRepost && post.quoted_post && (
        <div className="border border-gray-100 rounded-xl mt-1 mb-3 overflow-hidden">
          <PostCard post={post.quoted_post} isNested />
        </div>
      )}

      {/* Action bar */}
      {!isNested && <PostActionBar post={post} />}

      {/* Comments thread — lazy loaded when toggled */}
      {!isNested && isCommentsOpen && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <Suspense fallback={<div className="text-center py-4"><div className="spinner mx-auto" /></div>}>
            <CommentThread postId={post.id} postAuthorId={post.author_id} />
          </Suspense>
        </div>
      )}
    </motion.article>
  );
});

export default PostCard;
