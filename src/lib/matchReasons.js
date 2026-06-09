// matchReasons.js — generates AI match reasons via Google Gemini API with algorithmic fallback
import { supabase } from './supabase';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// In-memory session cache to avoid repeated API calls on page revisits
const reasonsCache = new Map();
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1500;

/**
 * Build prompt for candidate seeing jobs
 */
function buildCandidatePrompt(items, profile) {
  const jobLines = items
    .map(
      (j) =>
        `[${j.id}] ${j.title} at ${j.company_name} — requires: ${(j.skills_required || []).join(', ')}`
    )
    .join('\n');

  return `You are generating short, plain-language match reasons for a job discovery app.
For each job below, write ONE sentence (max 12 words) explaining why this candidate is a good match.
Be specific — mention 1–2 actual skills. Never say "you are a great fit" generically.
Start each reason with "Based on your" or "Your experience in".

Candidate skills: ${(profile.skills || []).join(', ')}
Candidate role target: ${profile.headline || 'Software Engineer'}

Jobs:
${jobLines}

Respond ONLY with a JSON object: { "job_id": "reason", ... }
No markdown, no preamble, no explanation. Just the raw JSON object.`;
}

/**
 * Build prompt for employer seeing candidates
 */
function buildEmployerPrompt(items, job) {
  const candidateLines = items
    .map(
      (c) =>
        `[${c.id}] ${c.full_name} — skills: ${(c.skills || []).join(', ')}`
    )
    .join('\n');

  return `You are generating short, plain-language match reasons for a talent discovery app.
For each candidate below, write ONE sentence (max 12 words) explaining why they match this role.
Be specific — mention skill overlap count or a standout skill.
Start each reason with "Strong match —" or "Relevant experience in".

Job: ${job.title} — requires: ${(job.skills_required || []).join(', ')}

Candidates:
${candidateLines}

Respond ONLY with a JSON object: { "candidate_id": "reason", ... }
No markdown, no preamble, no explanation. Just the raw JSON object.`;
}

/**
 * Generate a static fallback reason based on skill overlap
 */
function generateFallbackReason(item, profile, contextType) {
  if (contextType === 'candidate_sees_job') {
    const profileSkills = (profile.skills || []).map((s) => s.toLowerCase());
    const jobSkills = (item.skills_required || []).map((s) => s.toLowerCase());
    const overlap = profileSkills.filter((s) => jobSkills.includes(s));

    if (overlap.length > 0) {
      const displaySkills = overlap.slice(0, 2).map((s) =>
        // Re-capitalise
        (item.skills_required || []).find((sk) => sk.toLowerCase() === s) || s
      );
      return `Your ${displaySkills.join(' & ')} skills match this role well`;
    }
    return 'Skills align with this role';
  } else {
    const jobSkills = (profile._job?.skills_required || []).map((s) => s.toLowerCase());
    const candidateSkills = (item.skills || []).map((s) => s.toLowerCase());
    const overlap = candidateSkills.filter((s) => jobSkills.includes(s));

    if (overlap.length > 0) {
      return `Strong match — ${overlap.length} overlapping skill${overlap.length > 1 ? 's' : ''}`;
    }
    return 'Relevant experience for this role';
  }
}

/**
 * Call Gemini API to generate match reasons with retry on 429
 */
async function callGemini(prompt) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.status === 429 || response.status === 503) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.info(`Gemini API ${response.status}. Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        console.warn(`Gemini API ${response.status} after retries, using fallback reasons.`);
        return null;
      }

      if (!response.ok) {
        console.warn('Gemini API returned status:', response.status);
        return null;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.warn('Gemini API returned empty text');
        return null;
      }

      // Try to extract JSON from response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (err) {
      console.warn('Gemini API call failed:', err.message);
      return null;
    }
  }
  return null;
}

/**
 * Generate match reasons for a list of items
 * @param {Array} items - jobs or candidates with id, skills, etc.
 * @param {string} contextType - 'candidate_sees_job' or 'employer_sees_candidate'
 * @param {Object} profile - the current user's profile
 * @param {Object} job - (for employer context) the job being matched against
 * @returns {Object} Map of id → reason string
 */
export async function generateMatchReasons(items, contextType, profile, job) {
  if (!items || items.length === 0) return {};

  // Build a cache key from the item IDs + context type
  const cacheKey = contextType + ':' + items.map((i) => i.id).sort().join(',');
  if (reasonsCache.has(cacheKey)) {
    return reasonsCache.get(cacheKey);
  }

  // If no API key, use fallback
  if (!GEMINI_API_KEY) {
    console.info('No VITE_GEMINI_API_KEY set — using algorithmic match reasons');
    const reasons = {};
    for (const item of items) {
      reasons[item.id] = generateFallbackReason(
        item,
        contextType === 'employer_sees_candidate' ? { ...profile, _job: job } : profile,
        contextType
      );
    }
    reasonsCache.set(cacheKey, reasons);
    return reasons;
  }

  // Build prompt based on context
  const prompt =
    contextType === 'candidate_sees_job'
      ? buildCandidatePrompt(items, profile)
      : buildEmployerPrompt(items, job);

  // Call Gemini
  const result = await callGemini(prompt);

  // If API call succeeded and returned valid JSON
  if (result && typeof result === 'object') {
    // Fill in any missing items with fallback
    const reasons = {};
    for (const item of items) {
      reasons[item.id] = result[item.id] || generateFallbackReason(
        item,
        contextType === 'employer_sees_candidate' ? { ...profile, _job: job } : profile,
        contextType
      );
    }
    reasonsCache.set(cacheKey, reasons);
    return reasons;
  }

  // Fallback for all items
  const reasons = {};
  for (const item of items) {
    reasons[item.id] = generateFallbackReason(
      item,
      contextType === 'employer_sees_candidate' ? { ...profile, _job: job } : profile,
      contextType
    );
  }
  reasonsCache.set(cacheKey, reasons);
  return reasons;
}
