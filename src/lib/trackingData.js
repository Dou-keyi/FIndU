// trackingData.js — data fetching helpers for application tracking and saved jobs
import { supabase } from './supabase';

export async function getCandidateApplications(userId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at, ai_context,
      job:jobs!job_id(
        id, title, salary_min, salary_max, currency, work_type, experience_level,
        company:companies(id, name, logo_url)
      )
    `)
    .eq('candidate_id', userId)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch applications:', error);
    return [];
  }
  return data || [];
}

export async function getEmployerJobIds(userId) {
  const { data, error } = await supabase
    .from('jobs')
    .select('id')
    .eq('posted_by', userId);

  if (error) {
    console.error('Failed to fetch employer jobs:', error);
    return [];
  }
  return (data || []).map((j) => j.id);
}

export async function getEmployerApplications(jobIds) {
  if (!jobIds || jobIds.length === 0) return [];

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at, ai_context,
      candidate:profiles!candidate_id(id, full_name, headline, avatar_url, skills),
      job:jobs!job_id(id, title)
    `)
    .in('job_id', jobIds)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch employer applications:', error);
    return [];
  }
  return data || [];
}

export async function updateApplicationStatus(appId, status) {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', appId);

  if (error) {
    console.error('Failed to update application status:', error);
  }
  return { error };
}

export async function getSavedJobs(userId) {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(`
      id, saved_at,
      job:jobs!job_id(
        id, title, salary_min, salary_max, currency, work_type,
        experience_level, skills_required,
        company:companies(id, name, logo_url)
      )
    `)
    .eq('candidate_id', userId)
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch saved jobs:', error);
    return [];
  }

  const { data: apps } = await supabase
    .from('applications')
    .select('job_id, status')
    .eq('candidate_id', userId);
  
  let appliedJobIds = new Set();
  if (apps) {
    apps.forEach(app => {
      if (app.status !== 'rejected') {
        appliedJobIds.add(app.job_id);
      }
    });
  }

  return (data || []).map(savedJob => {
    if (savedJob.job) {
      savedJob.job.has_applied = appliedJobIds.has(savedJob.job.id);
    }
    return savedJob;
  });
}

export async function removeSavedJob(savedJobId) {
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('id', savedJobId);

  if (error) {
    console.error('Failed to remove saved job:', error);
  }
  return { error };
}

export async function applyToJob(userId, jobId, aiContext) {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      candidate_id: userId,
      job_id: jobId,
      status: 'applied',
      ai_context: aiContext || null,
    })
    .select()
    .single();

  return { data, error };
}
