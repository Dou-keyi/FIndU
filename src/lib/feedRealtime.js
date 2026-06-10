// feedRealtime.js — Supabase Realtime subscription helpers for the feed
import { supabase } from './supabase';

/**
 * Subscribe to new posts in realtime
 * Returns an unsubscribe function
 */
export function subscribeToNewPosts(onNewPost) {
  const channel = supabase
    .channel('feed-new-posts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts' },
      async (payload) => {
        // Fetch full post with author/company joins
        const { data } = await supabase
          .from('posts')
          .select(`
            *,
            author:profiles!author_id(id, full_name, headline, avatar_url, skills, role),
            company:companies!company_id(id, name, logo_url),
            poll:polls(*, options:poll_options(*), votes:poll_votes(*))
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) onNewPost(data);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Subscribe to reaction count changes on posts
 */
export function subscribeToReactions(onReactionChange) {
  const channel = supabase
    .channel('feed-reactions')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'post_reactions' },
      (payload) => {
        const postId = payload.new?.post_id || payload.old?.post_id;
        if (postId) onReactionChange(postId);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Subscribe to comment changes for a specific post
 */
export function subscribeToComments(postId, onCommentChange) {
  const channel = supabase
    .channel(`comments-${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      },
      (payload) => onCommentChange(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Subscribe to repost changes
 */
export function subscribeToReposts(onRepostChange) {
  const channel = supabase
    .channel('feed-reposts')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reposts' },
      (payload) => {
        const postId = payload.new?.post_id || payload.old?.post_id;
        if (postId) onRepostChange(postId);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Typing presence for comments — broadcasts typing state
 */
export function createTypingPresence(postId, userId, displayName, onPresenceChange) {
  const channel = supabase.channel(`typing-${postId}`, {
    config: { presence: { key: userId } },
  });

  if (onPresenceChange) {
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typers = Object.values(state)
        .flat()
        .filter((p) => p.typing && p.user_id !== userId);
      onPresenceChange(typers);
    });
  }

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: userId, display_name: displayName });
    }
  });

  return {
    startTyping: () => channel.track({ user_id: userId, display_name: displayName, typing: true }),
    stopTyping: () => channel.track({ user_id: userId, display_name: displayName, typing: false }),
    unsubscribe: () => supabase.removeChannel(channel),
  };
}
