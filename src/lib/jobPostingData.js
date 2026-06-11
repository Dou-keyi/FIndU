import { supabase } from './supabase';

/**
 * Creates a new job listing
 * @param {Object} jobData Job data to insert
 * @returns {Object} The inserted job
 */
export async function createJob(jobData) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create job:', err);
    throw err;
  }
}

/**
 * Fetches a job by ID
 * @param {string} jobId 
 * @returns {Object} The job data
 */
export async function getJobById(jobId) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to get job:', err);
    throw err;
  }
}

/**
 * Updates an existing job listing
 * @param {string} jobId 
 * @param {Object} jobData 
 * @returns {Object} The updated job
 */
export async function updateJob(jobId, jobData) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update(jobData)
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to update job:', err);
    throw err;
  }
}

/**
 * Deletes a job listing
 * @param {string} jobId 
 */
export async function deleteJob(jobId) {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete job:', err);
    throw err;
  }
}
