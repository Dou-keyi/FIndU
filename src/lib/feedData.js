// feedData.js — data fetching for the social feed, job listings, posts, and follows
import { supabase } from './supabase';
import { computeMatchScore } from './matchScore';

/**
 * Normalise a hashtag — strip leading # and lowercase
 */
function normalizeHashtag(tag) {
  return (tag || '').replace(/^#/, '').toLowerCase();
}

/**
 * Fetch feed posts filtered by tab and optional hashtag
 */
export async function getFeedPosts(tab, hashtag) {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(id, full_name, headline, avatar_url, skills, role),
        company:companies!company_id(id, name, logo_url)
      `)
      .order('created_at', { ascending: false });

    if (tab === 'candidates') query = query.eq('post_type', 'candidate');
    if (tab === 'companies') query = query.eq('post_type', 'company');

    const { data, error } = await query.limit(30);
    if (error) throw error;

    let posts = data || [];

    // Filter by hashtag if present
    if (hashtag) {
      const normalised = normalizeHashtag(hashtag);
      posts = posts.filter((p) =>
        (p.hashtags || []).some((h) => normalizeHashtag(h) === normalised)
      );
    }

    return posts;
  } catch (err) {
    console.error('Failed to fetch feed posts:', err);
    return [];
  }
}

/**
 * Fetch open jobs for the feed, scored against user profile
 */
export async function getFeedJobs(userProfile) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, company:companies(id, name, logo_url)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const jobs = (data || []).map((job) => ({
      ...job,
      matchScore: userProfile
        ? computeMatchScore(
            userProfile.skills,
            job.skills_required,
            userProfile.work_type,
            job.work_type
          )
        : 0,
    }));

    // Sort by match score descending
    jobs.sort((a, b) => b.matchScore - a.matchScore);
    return jobs;
  } catch (err) {
    console.error('Failed to fetch feed jobs:', err);
    return [];
  }
}

/**
 * Create a new post
 */
export async function createPost(userId, content, hashtags, postType, companyId = null) {
  try {
    // Normalise hashtags — strip # prefix for storage
    const cleanTags = (hashtags || []).map((t) => t.replace(/^#/, '').trim()).filter(Boolean);

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: userId,
        company_id: companyId,
        content,
        hashtags: cleanTags,
        post_type: postType,
      })
      .select(`
        *,
        author:profiles!author_id(id, full_name, headline, avatar_url, skills, role),
        company:companies!company_id(id, name, logo_url)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create post:', err);
    return null;
  }
}

/**
 * Toggle follow / unfollow a company
 */
export async function toggleFollow(candidateId, companyId, isCurrentlyFollowed) {
  try {
    if (isCurrentlyFollowed) {
      const { error } = await supabase
        .from('company_follows')
        .delete()
        .eq('candidate_id', candidateId)
        .eq('company_id', companyId);
      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from('company_follows')
        .insert({ candidate_id: candidateId, company_id: companyId });
      if (error) throw error;
      return true;
    }
  } catch (err) {
    console.error('Failed to toggle follow:', err);
    return isCurrentlyFollowed; // revert
  }
}

/**
 * Check if a candidate follows a company
 */
export async function checkIsFollowing(candidateId, companyId) {
  try {
    const { data, error } = await supabase
      .from('company_follows')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (err) {
    console.error('Failed to check follow status:', err);
    return false;
  }
}

/**
 * Get follower count for a company
 */
export async function getFollowerCount(companyId) {
  try {
    const { count, error } = await supabase
      .from('company_follows')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Failed to get follower count:', err);
    return 0;
  }
}

/**
 * Search open jobs with advanced filters
 */
export async function searchJobs(userProfile, filters = {}) {
  try {
    let query = supabase
      .from('jobs')
      .select('*, company:companies(id, name, logo_url)')
      .eq('status', 'open');

    if (filters.title) {
      query = query.ilike('title', `%${filters.title}%`);
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters.minSalary) {
      query = query.gte('salary_min', Number(filters.minSalary));
    }
    if (filters.workType && filters.workType !== 'all') {
      query = query.eq('work_type', filters.workType);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

    if (error) throw error;

    const jobs = (data || []).map((job) => ({
      ...job,
      matchScore: userProfile
        ? computeMatchScore(
            userProfile.skills,
            job.skills_required,
            userProfile.work_type,
            job.work_type
          )
        : 0,
    }));

    // Sort by match score descending
    jobs.sort((a, b) => b.matchScore - a.matchScore);
    return jobs;
  } catch (err) {
    console.error('Failed to search jobs:', err);
    return [];
  }
}

