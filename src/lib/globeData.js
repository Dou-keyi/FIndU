// globeData.js — fetches and scores globe nodes for candidate and employer views
import { supabase } from './supabase';
import { generateMatchReasons } from './matchReasons';
import { computeMatchScore } from './matchScore';

/**
 * Assign ring and angle positions to a sorted list of nodes
 * Top 4 → ring 1 at 0°, 90°, 180°, 270°
 * Next 4 → ring 2 at 45°, 135°, 225°, 315°
 */
function assignPositions(nodes) {
  return nodes.map((node, i) => {
    if (i < 4) {
      return { ...node, ring: 1, angle: i * 90 };
    }
    return { ...node, ring: 2, angle: 45 + (i - 4) * 90 };
  });
}

/**
 * Get globe nodes for a candidate — shows matching jobs
 */
export async function getCandidateGlobeNodes(profile) {
  try {
    // 1. Fetch all open jobs with company info
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*, companies(name, about, logo_url, industry)')
      .eq('status', 'open');

    if (jobsError) throw jobsError;

    // 2. Fetch jobs the candidate already swiped on
    const { data: swipedActions, error: swipeError } = await supabase
      .from('swipe_actions')
      .select('target_id')
      .eq('actor_id', profile.id)
      .eq('target_type', 'job')
      .neq('direction', 'left');

    if (swipeError) throw swipeError;

    const swipedIds = new Set((swipedActions || []).map((s) => s.target_id));

    // 2.5 Fetch applications to mark has_applied
    const { data: apps } = await supabase
      .from('applications')
      .select('job_id, status')
      .eq('candidate_id', profile.id);
    
    let appliedJobIds = new Set();
    if (apps) {
      apps.forEach(app => {
        if (app.status !== 'rejected') {
          appliedJobIds.add(app.job_id);
        }
      });
    }

    // 3. Score, filter, sort
    const scored = (jobs || [])
      .filter((job) => !swipedIds.has(job.id))
      .map((job) => ({
        id: job.id,
        type: 'job',
        label: job.title,
        sublabel: job.companies?.name || '',
        company_name: job.companies?.name || '',
        company_about: job.companies?.about || '',
        company_logo: job.companies?.logo_url || null,
        company_industry: job.companies?.industry || '',
        title: job.title,
        description: job.description,
        skills_required: job.skills_required || [],
        location: job.location,
        work_type: job.work_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        currency: job.currency || 'MYR',
        experience_level: job.experience_level,
        has_applied: appliedJobIds.has(job.id),
        matchScore: computeMatchScore(
          profile.skills,
          job.skills_required,
          profile.work_type,
          job.work_type
        ),
        matchReason: '', // will be filled by AI
        posted_by: job.posted_by,
        company_id: job.company_id,
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);

    // 4. Assign ring/angle positions
    const positioned = assignPositions(scored);

    // 5. Generate AI match reasons
    const reasons = await generateMatchReasons(
      positioned,
      'candidate_sees_job',
      profile
    );

    // 6. Merge reasons into nodes
    return positioned.map((node) => ({
      ...node,
      matchReason: reasons[node.id] || 'Skills match this role well',
    }));
  } catch (err) {
    console.error('Failed to load candidate globe nodes:', err);
    return [];
  }
}

/**
 * Get globe nodes for an employer — shows matching candidates
 */
export async function getEmployerGlobeNodes(profile) {
  try {
    // 1. Fetch employer's company
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', profile.id);

    if (compError) throw compError;

    const companyId = companies?.[0]?.id;
    if (!companyId) {
      console.warn('No company found for employer');
      return [];
    }

    // 2. Fetch employer's most recent open job
    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1);

    if (jobError) throw jobError;

    const activeJob = jobs?.[0];
    if (!activeJob) {
      console.warn('No open jobs found for employer');
      return [];
    }

    // 3. Fetch all candidate profiles with their portfolio items
    const { data: candidates, error: candError } = await supabase
      .from('profiles')
      .select('*, portfolio_items(*)')
      .eq('role', 'candidate');

    if (candError) throw candError;

    // 4. Fetch candidates already swiped on for this job
    const { data: swipedActions, error: swipeError } = await supabase
      .from('swipe_actions')
      .select('target_id')
      .eq('actor_id', profile.id)
      .eq('target_type', 'candidate')
      .neq('direction', 'left');

    if (swipeError) throw swipeError;

    const swipedIds = new Set((swipedActions || []).map((s) => s.target_id));

    // 5. Score, filter, sort
    const scored = (candidates || [])
      .filter((c) => !swipedIds.has(c.id))
      .map((c) => ({
        id: c.id,
        type: 'candidate',
        label: c.full_name || 'Candidate',
        sublabel: c.headline || '',
        full_name: c.full_name,
        headline: c.headline,
        avatar_url: c.avatar_url,
        location: c.location,
        skills: c.skills || [],
        work_type: c.work_type,
        achievements: (c.portfolio_items || []).filter(item => item.item_type === 'achievement'),
        matchScore: computeMatchScore(
          c.skills,
          activeJob.skills_required,
          c.work_type,
          activeJob.work_type
        ),
        matchReason: '',
        // Attach job info for swipe handling
        _jobId: activeJob.id,
        _jobTitle: activeJob.title,
        _jobSkills: activeJob.skills_required,
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);

    // 6. Assign positions
    const positioned = assignPositions(scored);

    // 7. Generate AI match reasons
    const reasons = await generateMatchReasons(
      positioned,
      'employer_sees_candidate',
      profile,
      activeJob
    );

    // 8. Merge reasons
    return positioned.map((node) => ({
      ...node,
      matchReason: reasons[node.id] || 'Relevant experience for this role',
    }));
  } catch (err) {
    console.error('Failed to load employer globe nodes:', err);
    return [];
  }
}
