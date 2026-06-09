// matchScore.js — shared match scoring function between globe and feed

/**
 * Compute match score between a candidate's skills and a job's required skills
 * @param {string[]} candidateSkills
 * @param {string[]} jobSkills
 * @param {string[]} candidateWorkTypes
 * @param {string} jobWorkType
 * @returns {number} 0–1 score
 */
export function computeMatchScore(candidateSkills, jobSkills, candidateWorkTypes, jobWorkType) {
  const profileSkillsLower = (candidateSkills || []).map((s) => s.toLowerCase());
  const jobSkillsLower = (jobSkills || []).map((s) => s.toLowerCase());

  const overlap = profileSkillsLower.filter((s) => jobSkillsLower.includes(s));
  const skillOverlap =
    jobSkillsLower.length > 0 ? overlap.length / jobSkillsLower.length : 0;

  const workTypeMatch =
    jobWorkType && (candidateWorkTypes || []).includes(jobWorkType) ? 0.2 : 0;

  return Math.min(1, skillOverlap * 0.8 + workTypeMatch);
}
