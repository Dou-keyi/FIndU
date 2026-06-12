// useFeedRealtime.js — hook for managing realtime feed subscriptions
import { useEffect, useCallback } from 'react';
import { useFeedStore } from '../store/feedStore';
import { useAuth } from './useAuth';
import { subscribeToNewPosts, subscribeToReactions, subscribeToReposts } from '../lib/feedRealtime';
import { supabase } from '../lib/supabase';

export function useFeedRealtime() {
  const { user } = useAuth();
  const pushNewPost = useFeedStore((s) => s.pushNewPost);
  const updatePost = useFeedStore((s) => s.updatePost);

  // Refresh reaction counts for a specific post
  const refreshReactions = useCallback(async (postId) => {
    const { data, error } = await supabase
      .from('post_reactions')
      .select('type')
      .eq('post_id', postId);

    if (!error && data) {
      const counts = {};
      data.forEach((r) => {
        counts[r.type] = (counts[r.type] || 0) + 1;
      });
      updatePost(postId, () => ({
        _reactionCounts: counts,
        _reactionTotal: data.length,
      }));
    }
  }, [updatePost]);

  // Refresh repost count
  const refreshReposts = useCallback(async (postId) => {
    const { count } = await supabase
      .from('reposts')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    updatePost(postId, () => ({ _repostCount: count || 0 }));
  }, [updatePost]);

  // Refresh comment count
  const refreshCommentCount = useCallback(async (postId) => {
    const { count } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    updatePost(postId, () => ({ _commentCount: count || 0 }));
  }, [updatePost]);

  useEffect(() => {
    if (!user) return;

    const unsubs = [
      subscribeToNewPosts((post) => {
        // Don't buffer own posts (they're already optimistically added)
        if (post.author_id !== user.id) {
          pushNewPost(post);
        }
      }),
      subscribeToReactions(refreshReactions),
      subscribeToReposts(refreshReposts),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [user, pushNewPost, refreshReactions, refreshReposts]);

  return { refreshReactions, refreshReposts, refreshCommentCount };
}
