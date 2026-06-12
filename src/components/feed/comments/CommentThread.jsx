// CommentThread.jsx — full comment thread with sort, load more, realtime, and typing indicator
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { subscribeToComments, createTypingPresence } from '../../../lib/feedRealtime';
import { COMMENTS_INITIAL, REPLIES_INITIAL, COMMENT_SORT_OPTIONS, TYPING_TIMEOUT_MS } from '../../../lib/feedConstants';
import CommentComposer from './CommentComposer';
import CommentItem from './CommentItem';
import TypingIndicator from './TypingIndicator';

export default function CommentThread({ postId, postAuthorId }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [showAll, setShowAll] = useState(false);
  const [typers, setTypers] = useState([]);
  const [expandedReplies, setExpandedReplies] = useState({});

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          author:profiles!user_id(id, full_name, headline, avatar_url, role)
        `)
        .eq('post_id', postId);

      if (sort === 'newest') query = query.order('created_at', { ascending: false });
      else if (sort === 'oldest') query = query.order('created_at', { ascending: true });
      // 'top' sort will be handled client-side after fetching

      const { data, error } = await query;
      if (error) throw error;

      setComments(data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [postId, sort]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Realtime subscription for new comments
  useEffect(() => {
    const unsubscribe = subscribeToComments(postId, (payload) => {
      if (payload.eventType === 'INSERT') {
        // Fetch the full comment with author join
        supabase
          .from('comments')
          .select('*, author:profiles!user_id(id, full_name, headline, avatar_url, role)')
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if (data && data.user_id !== user?.id) {
              setComments((prev) => {
                // Avoid duplicates
                if (prev.some((c) => c.id === data.id)) return prev;
                return [data, ...prev];
              });
            }
          });
      } else if (payload.eventType === 'DELETE') {
        setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
      }
    });

    return unsubscribe;
  }, [postId, user]);

  // Typing presence
  useEffect(() => {
    if (!user || !profile) return;
    const presence = createTypingPresence(postId, user.id, profile.full_name, setTypers);
    return () => presence.unsubscribe();
  }, [postId, user, profile]);

  // Separate root comments and replies
  const rootComments = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);

  // Pinned comments first
  const pinnedComments = rootComments.filter((c) => c.is_pinned);
  const regularComments = rootComments.filter((c) => !c.is_pinned);

  const displayComments = showAll
    ? [...pinnedComments, ...regularComments]
    : [...pinnedComments, ...regularComments.slice(0, COMMENTS_INITIAL)];

  const remainingCount = regularComments.length - COMMENTS_INITIAL;

  const handleCommentCreated = (newComment) => {
    setComments((prev) => [newComment, ...prev]);
  };

  const getReplies = (commentId) => {
    const commentReplies = replies.filter((r) => r.parent_id === commentId);
    const isExpanded = expandedReplies[commentId];
    const displayReplies = isExpanded
      ? commentReplies
      : commentReplies.slice(0, REPLIES_INITIAL);
    const hiddenCount = commentReplies.length - REPLIES_INITIAL;

    return { displayReplies, hiddenCount, totalReplies: commentReplies.length };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="spinner" style={{ width: 20, height: 20 }} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sort toggle */}
      {rootComments.length > 1 && (
        <div className="flex items-center gap-2 mb-2">
          {COMMENT_SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                sort === opt.key
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Comments */}
      {displayComments.map((comment) => {
        const { displayReplies, hiddenCount } = getReplies(comment.id);

        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            postAuthorId={postAuthorId}
            onReplyCreated={handleCommentCreated}
          >
            {/* Nested replies */}
            {displayReplies.length > 0 && (
              <div className="mt-2 ml-2 pl-3 border-l-2 border-gray-100 space-y-2">
                {displayReplies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    postAuthorId={postAuthorId}
                  />
                ))}

                {hiddenCount > 0 && !expandedReplies[comment.id] && (
                  <button
                    onClick={() => setExpandedReplies((prev) => ({ ...prev, [comment.id]: true }))}
                    className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            )}
          </CommentItem>
        );
      })}

      {/* Load more */}
      {!showAll && remainingCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
        >
          Load {remainingCount} more {remainingCount === 1 ? 'comment' : 'comments'}
        </button>
      )}

      {/* Typing indicator */}
      <TypingIndicator typers={typers} />

      {/* Composer */}
      <CommentComposer postId={postId} onCommentCreated={handleCommentCreated} />
    </div>
  );
}
