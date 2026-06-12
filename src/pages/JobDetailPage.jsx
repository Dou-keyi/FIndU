// JobDetailPage.jsx — full-page job detail view with apply/save/share actions
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Briefcase, Building2, Clock, Globe2, Users,
  Bookmark, BookmarkCheck, Share2, Loader2, CheckCircle2, ExternalLink, Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getInitials, getAvatarColor, getBrandTint } from '../lib/avatarUtils';
import { formatRelativeTime } from '../lib/relativeTime';
import FeedJobCard from '../components/feed/FeedJobCard';
import toast from 'react-hot-toast';

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);

  // ── Fetch job data ──
  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, company:companies!company_id(id, name, logo_url, about, culture, industry, headcount_range, domain, verified)')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
      setCompany(data.company);

      // Check application status
      if (user) {
        const { data: appData } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('candidate_id', user.id)
          .maybeSingle();
        if (appData) setIsApplied(true);

        // Check saved status
        const { data: savedData } = await supabase
          .from('saved_jobs')
          .select('id')
          .eq('job_id', jobId)
          .eq('candidate_id', user.id)
          .maybeSingle();
        if (savedData) setIsSaved(true);
      }

      // Fetch similar jobs (same company, excluding current)
      if (data.company_id) {
        const { data: similar } = await supabase
          .from('jobs')
          .select('*, company:companies!company_id(id, name, logo_url)')
          .eq('company_id', data.company_id)
          .neq('id', jobId)
          .limit(3);
        setSimilarJobs(similar || []);
      }
    } catch (err) {
      console.error('Failed to load job:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // ── Apply ──
  const handleApply = async () => {
    if (!user || isApplied) return;
    setApplying(true);
    try {
      const { error } = await supabase.from('applications').insert({
        candidate_id: user.id,
        job_id: jobId,
        status: 'applied',
        ai_context: 'Applied via Job Detail Page',
      });
      if (error && error.code !== '23505') throw error;
      setIsApplied(true);
      toast.success(`Applied for ${job.title}!`);
    } catch (err) {
      console.error('Apply failed:', err);
      toast.error('Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  // ── Save / Bookmark ──
  const handleSave = async () => {
    if (!user) return;
    setSavingBookmark(true);
    try {
      if (isSaved) {
        await supabase.from('saved_jobs').delete().eq('job_id', jobId).eq('candidate_id', user.id);
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        const { error } = await supabase.from('saved_jobs').insert({
          candidate_id: user.id,
          job_id: jobId,
        });
        if (error && error.code !== '23505') throw error;
        setIsSaved(true);
        toast.success('Job saved!');
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSavingBookmark(false);
    }
  };

  // ── Share ──
  const handleShare = () => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <p className="text-sm text-gray-400 font-medium">Loading job details…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (!job) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Job not found</h2>
            <p className="text-sm text-gray-500 mb-6">This listing may have been removed or is no longer available.</p>
            <button
              onClick={() => navigate('/feed')}
              className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values ──
  const companyName = company?.name || 'Company';
  const companyInitials = getInitials(companyName);
  const companyColor = getAvatarColor(companyName);
  const heroTint = getBrandTint(companyName);
  const skills = job.skills_required || [];

  const salaryStr =
    job.salary_min && job.salary_max
      ? `${job.currency || 'MYR'} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
      : null;

  const postedAgo = job.created_at ? formatRelativeTime(job.created_at) : null;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">

      {/* ── HERO ── */}
      <div
        className="relative"
        style={{ background: `linear-gradient(180deg, ${heroTint}80 0%, ${heroTint}30 50%, #F9FAFB 100%)` }}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-gray-900 hover:bg-white transition-all shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={savingBookmark}
              className={`p-2 rounded-xl border transition-all shadow-sm ${
                isSaved
                  ? 'bg-violet-50 border-violet-200 text-violet-600'
                  : 'bg-white/80 backdrop-blur-sm border-gray-200/50 text-gray-500 hover:text-gray-700 hover:bg-white'
              }`}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-500 hover:text-gray-700 hover:bg-white transition-all shadow-sm"
              aria-label="Share job"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <motion.div
          className="px-4 pt-4 pb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Company logo */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ring-4 ring-white/80 shadow-lg flex-shrink-0"
              style={{ backgroundColor: companyColor.bg, color: companyColor.text }}
            >
              {companyInitials}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-gray-900 leading-tight tracking-tight mb-1">
                {job.title}
              </h1>
              <button
                onClick={() => company?.id && navigate(`/company/${company.id}`)}
                className="text-sm font-semibold text-gray-600 hover:text-violet-700 transition-colors flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                {companyName}
                {company?.verified && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Verified
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Meta pills row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {job.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 text-gray-600 border border-gray-200/50 backdrop-blur-sm shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {job.location}
              </span>
            )}
            {job.work_type && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50/80 text-violet-700 border border-violet-200/50 backdrop-blur-sm shadow-sm">
                <Globe2 className="w-3.5 h-3.5" />
                {job.work_type.charAt(0).toUpperCase() + job.work_type.slice(1)}
              </span>
            )}
            {job.experience_level && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 text-gray-600 border border-gray-200/50 backdrop-blur-sm shadow-sm">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
              </span>
            )}
            {postedAgo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 text-gray-400 border border-gray-200/50 backdrop-blur-sm shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                {postedAgo}
              </span>
            )}
          </div>

          {/* Salary highlight */}
          {salaryStr && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50 p-4 shadow-sm">
              <p className="text-xs font-semibold text-emerald-600 mb-0.5 uppercase tracking-wider">Monthly Salary</p>
              <p className="text-lg font-black text-emerald-700">{salaryStr}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">

          {/* About the Role */}
          <motion.section
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-500" />
              About the Role
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {job.description || 'No description provided yet. Contact the hiring team for more details.'}
            </p>
          </motion.section>

          {/* Skills Required */}
          {skills.length > 0 && (
            <motion.section
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Skills Required
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 transition-colors hover:bg-violet-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.section>
          )}

          {/* About the Company */}
          {company && (
            <motion.section
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                About {companyName}
              </h2>

              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {company.about || 'No company description available.'}
              </p>

              {/* Company meta */}
              <div className="flex flex-wrap gap-2 mb-4">
                {company.industry && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                    {company.industry}
                  </span>
                )}
                {company.headcount_range && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {company.headcount_range}
                  </span>
                )}
                {company.domain && (
                  <a
                    href={`https://${company.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1 hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {company.domain}
                  </a>
                )}
              </div>

              {company.culture && (
                <>
                  <h3 className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Culture</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{company.culture}</p>
                </>
              )}

              <button
                onClick={() => navigate(`/company/${company.id}`)}
                className="mt-4 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
              >
                View full company profile →
              </button>
            </motion.section>
          )}

          {/* Similar Jobs */}
          {similarJobs.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                More from {companyName}
              </h2>
              <div className="space-y-3">
                {similarJobs.map((sJob) => (
                  <FeedJobCard
                    key={sJob.id}
                    job={sJob}
                    onViewDetail={(j) => navigate(`/jobs/${j.id}`)}
                    onApply={async (j) => {
                      const { applyToJob } = await import('../lib/trackingData');
                      const { error } = await applyToJob(user.id, j.id, 'Applied via Related Jobs');
                      if (error) {
                        toast.error('Failed to apply');
                        throw error;
                      }
                      toast.success(`Applied for ${j.title}!`);
                    }}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* Bottom spacer for sticky CTA */}
          <div className="h-24" />
        </div>
      </main>

      {/* ── STICKY BOTTOM CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleApply}
            disabled={applying || isApplied}
            className={`flex-[2] py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
              isApplied
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-brand text-white hover:bg-brand-dark active:scale-[0.98]'
            }`}
          >
            {applying && <Loader2 className="w-4 h-4 animate-spin" />}
            {isApplied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Applied
              </>
            ) : applying ? (
              'Applying…'
            ) : (
              'Apply Now →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
