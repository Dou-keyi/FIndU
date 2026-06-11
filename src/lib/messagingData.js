// messagingData.js — data fetching helpers for messaging threads, requests, and messages
import { supabase } from './supabase';

export async function getMyThreads(userId) {
  const { data, error } = await supabase
    .from('message_threads')
    .select(`
      id,
      created_at,
      match:matches!match_id(
        id,
        candidate_id,
        employer_id,
        job:jobs!job_id(id, title, company:companies(id, name, logo_url)),
        candidate:profiles!candidate_id(id, full_name, headline, avatar_url),
        employer:profiles!employer_id(id, full_name, headline, avatar_url)
      ),
      messages(id, content, sender_id, seen, sent_at)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch threads:', error);
    return [];
  }
  return data || [];
}

export async function getThreadMessages(threadId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, content, sender_id, seen, sent_at')
    .eq('thread_id', threadId)
    .order('sent_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }
  return data || [];
}

export async function sendMessage(threadId, senderId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ thread_id: threadId, sender_id: senderId, content })
    .select()
    .single();
  return { data, error };
}

export async function markThreadSeen(threadId, userId) {
  const { error } = await supabase
    .from('messages')
    .update({ seen: true })
    .eq('thread_id', threadId)
    .neq('sender_id', userId)
    .eq('seen', false);

  if (error) console.error('Failed to mark as seen:', error);
}

export async function getMyRequests(userId) {
  const { data, error } = await supabase
    .from('message_requests')
    .select(`
      id, intro_message, status, created_at,
      sender:profiles!sender_id(id, full_name, headline, avatar_url),
      job:jobs!job_id(id, title, company:companies(name))
    `)
    .eq('recipient_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch requests:', error);
    return [];
  }
  return data || [];
}

export async function getMySentRequests(userId) {
  const { data, error } = await supabase
    .from('message_requests')
    .select(`
      id, intro_message, status, created_at, sender_id,
      recipient:profiles!recipient_id(id, full_name, headline, avatar_url),
      job:jobs!job_id(id, title, company:companies(name))
    `)
    .eq('sender_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch sent requests:', error);
    return [];
  }
  return data || [];
}

export async function respondToRequest(requestId, status, matchData) {
  const { error: updateError } = await supabase
    .from('message_requests')
    .update({ status })
    .eq('id', requestId);

  if (updateError) {
    console.error('Failed to update request:', updateError);
    return { error: updateError };
  }

  if (status === 'accepted' && matchData) {
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert(matchData)
      .select()
      .single();

    if (matchError) {
      console.error('Failed to create match:', matchError);
      return { error: matchError };
    }

    if (match) {
      const { error: threadError } = await supabase
        .from('message_threads')
        .insert({ match_id: match.id });

      if (threadError) {
        console.error('Failed to create thread:', threadError);
      }
    }
  }

  return { error: null };
}

export async function getUnreadCounts(userId) {
  const { count: msgCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('seen', false)
    .neq('sender_id', userId);

  const { count: reqCount } = await supabase
    .from('message_requests')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('status', 'pending');

  return (msgCount || 0) + (reqCount || 0);
}
