// PostActionBar.jsx — footer action bar with reactions, comments, repost, DM, bookmark, views
import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useFeedStore } from '../../../store/feedStore';
import ReactionStrip from './ReactionStrip';
import RepostDropdown from './RepostDropdown';
import BookmarkPopover from './BookmarkPopover';

export default function PostActionBar({ post }) {
  const { user } = useAuth();
  const toggleComments = useFeedStore((s) => s.toggleComments);
  const openComments = useFeedStore((s) => s.openComments);
  const openDMPanel = useFeedStore((s) => s.openDMPanel);

  // Local state for reactions
  const [userReaction, setUserReaction] = useState(null);
  const [reactionTotal, setReactionTotal] = useState(post._reactionTotal || 0);
  const [topReactors, setTopReactors] = useState([]);

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Counts
  const commentCount = post._commentCount || 0;
  const repostCount = post._repostCount || 0;
  const viewCount = post.view_count || 0;

  // Fetch initial user reaction + bookmark state
  useEffect(() => {
    if (!user) return;

    supabase
      .from('post_reactions')
      .select('type')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserReaction(data.type);
      });

    supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsBookmarked(!!data);
      });
  }, [post.id, user]);

  // Handle reaction
  const handleReact = useCallback(async (type) => {
    if (!user) return;
    const prevReaction = userReaction;
    const prevTotal = reactionTotal;

    // Optimistic update
    setUserReaction(type);
    setReactionTotal((prev) => {
      if (type === null) return Math.max(0, prev - 1);
      if (prevReaction) return prev; // switching reaction, count stays same
      return prev + 1;
    });

    try {
      if (type === null) {
        // Remove reaction
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      } else if (prevReaction) {
        // Update existing reaction
        await supabase
          .from('post_reactions')
          .update({ type })
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      } else {
        // Insert new reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({ post_id: post.id, user_id: user.id, type });
        if (error && error.code === '23505') {
          // Duplicate — update instead
          await supabase
            .from('post_reactions')
            .update({ type })
            .eq('post_id', post.id)
            .eq('user_id', user.id);
        }
      }
    } catch (err) {
      console.error('Reaction failed:', err);
      setUserReaction(prevReaction);
      setReactionTotal(prevTotal);
    }
  }, [user, userReaction, reactionTotal, post.id]);

  // Listen for keyboard shortcut events
  useEffect(() => {
    const handleKeyReact = (e) => {
      if (e.detail?.postId === post.id) {
        handleReact(userReaction ? null : 'like');
      }
    };
    const handleKeyBookmark = (e) => {
      if (e.detail?.postId === post.id) {
        setIsBookmarked((v) => !v);
      }
    };
    window.addEventListener('feed:react', handleKeyReact);
    window.addEventListener('feed:bookmark', handleKeyBookmark);
    return () => {
      window.removeEventListener('feed:react', handleKeyReact);
      window.removeEventListener('feed:bookmark', handleKeyBookmark);
    };
  }, [post.id, userReaction, handleReact]);

  // Increment view count on mount (once)
  useEffect(() => {
    if (!post.id) return;
    async function increment() {
      const { error } = await supabase.rpc('increment_view_count', { p_post_id: post.id });
      if (error) console.error('Failed to increment view count:', error);
    }
    increment();
  }, [post.id]);

  const isCommentsOpen = openComments[post.id];

  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
      <div className="flex items-center gap-1">
        {/* Reactions */}
        <ReactionStrip
          postId={post.id}
          userReaction={userReaction}
          onReact={handleReact}
          totalCount={reactionTotal}
          topReactors={topReactors}
        />

        {/* Comments */}
        <button
          onClick={() => toggleComments(post.id)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            isCommentsOpen
              ? 'text-violet-700 bg-violet-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          aria-label={`${commentCount} comments`}
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          <span className="hidden sm:inline">Comment</span>
          {commentCount > 0 && (
            <span className="text-[10px] text-gray-400 font-medium">{commentCount}</span>
          )}
        </button>

        {/* Repost / Share */}
        <RepostDropdown post={post} repostCount={repostCount} />
      </div>

      <div className="flex items-center gap-1">
        {/* DM Send */}
        <button
          onClick={() => openDMPanel(null, post)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label="Send via DM"
        >
          <Send className="w-[18px] h-[18px]" />
        </button>

        {/* Bookmark */}
        <BookmarkPopover
          postId={post.id}
          isBookmarked={isBookmarked}
          onToggle={setIsBookmarked}
        />

        {/* View count */}
        {viewCount >= 10 && (
          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5 ml-1">
            <Eye className="w-3 h-3" />
            {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
          </span>
        )}
      </div>
    </div>
  );
}
