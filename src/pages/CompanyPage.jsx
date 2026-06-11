// CompanyPage.jsx — public company profile with open roles, follow, and HR management
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, UserPlus, Trash2, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toggleFollow, checkIsFollowing, getFollowerCount } from '../lib/feedData';
import { getInitials, getAvatarColor, getBrandTint } from '../lib/avatarUtils';
import FeedJobCard from '../components/feed/FeedJobCard';
import JobDetailModal from '../components/swipe/JobDetailModal';
import ApplyConfirmSheet from '../components/swipe/ApplyConfirmSheet';
import { deleteJob } from '../lib/jobPostingData';
import { toast } from '../components/ui/use-toast';

export default function CompanyPage() {
  const { companyId } = useParams();
  const { user, profile } = useAuth();
  const role = profile?.role || 'candidate';

  const [company, setCompany] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [hrSeats, setHrSeats] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Sheet state
  const [jobDetailNode, setJobDetailNode] = useState(null);
  const [applyConfirmNode, setApplyConfirmNode] = useState(null);

  // HR invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const isOwner = company?.owner_id === user?.id;
  const isEmployerForCompany = isOwner || hrSeats.some(s => s.profile_id === user?.id);

  // Load company data
  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // Fetch company
      const { data: compData, error: compErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (compErr) throw compErr;
      setCompany(compData);

      // Fetch open jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, company:companies(id, name, logo_url)')
        .eq('company_id', companyId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      setCompanyJobs(jobsData || []);

      // Follower count
      const count = await getFollowerCount(companyId);
      setFollowerCount(count);

      // Check if current user follows
      if (user && role === 'candidate') {
        const following = await checkIsFollowing(user.id, companyId);
        setIsFollowing(following);
      }

      // HR seats (owner only — RLS will handle access)
      if (user) {
        const { data: seats } = await supabase
          .from('hr_seats')
          .select('*, profile:profiles!profile_id(id, full_name)')
          .eq('company_id', companyId);

        setHrSeats(seats || []);
      }
    } catch (err) {
      console.error('Failed to load company:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, user, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle follow
  const handleFollow = async () => {
    if (!user || role !== 'candidate') return;
    setFollowLoading(true);
    try {
      const newState = await toggleFollow(user.id, companyId, isFollowing);
      setIsFollowing(newState);
      setFollowerCount((prev) => (newState ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setFollowLoading(false);
    }
  };

  // Job apply
  const handleJobApply = async (job) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('applications')
        .insert({ job_id: job.id, candidate_id: user.id });

      if (error && error.code !== '23505') throw error;
      setApplyConfirmNode({
        ...job,
        title: job.title,
        company_name: company?.name,
      });
    } catch (err) {
      console.error('Failed to apply:', err);
    }
  };

  // Open job detail
  const openJobDetail = (job) => {
    setJobDetailNode({
      ...job,
      label: job.title,
      sublabel: company?.name,
      company_name: company?.name,
      company_about: company?.about,
      skills_required: job.skills_required,
    });
  };

  // Remove HR seat
  const handleRemoveSeat = async (seatId) => {
    try {
      const { error } = await supabase
        .from('hr_seats')
        .delete()
        .eq('id', seatId);

      if (error) throw error;
      setHrSeats((prev) => prev.filter((s) => s.id !== seatId));
    } catch (err) {
      console.error('Failed to remove HR seat:', err);
    }
  };

  // Invite HR member (prototype — just show toast)
  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setInviteSent(true);
    setInviteEmail('');
    setTimeout(() => setInviteSent(false), 3000);
  };

  const handleEditJob = (jobId) => {
    navigate(`/edit-job/${jobId}`);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await deleteJob(jobId);
      setCompanyJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast({ title: 'Job Deleted', description: 'The job posting has been removed.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not delete job', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Company not found.</p>
        </div>
      </div>
    );
  }

  const companyInitials = getInitials(company.name);
  const companyColor = getAvatarColor(company.name);
  const heroTint = getBrandTint(company.name);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
      {/* Hero section */}
      <div
        className="relative px-4 pt-8 pb-6"
        style={{ background: `linear-gradient(180deg, ${heroTint}80 0%, #F9FAFB 100%)` }}
      >
        <motion.div
          className="max-w-3xl mx-auto flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mb-3 ring-4 ring-white shadow-md"
            style={{ backgroundColor: companyColor.bg, color: companyColor.text }}
          >
            {companyInitials}
          </div>

          {/* Company name */}
          <h1 className="text-xl font-bold text-gray-900 mb-1">{company.name}</h1>

          {/* Industry + headcount */}
          <p className="text-sm text-gray-500 mb-3">
            {company.industry}
            {company.headcount_range && ` · ${company.headcount_range} employees`}
          </p>

          {/* SSM Badge */}
          {company.ssm_number && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 ${
              company.verified
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {company.verified ? 'SSM Verified ✓' : 'SSM Verified (pending)'}
            </div>
          )}

          {/* Follower count + follow button */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              <span className="font-semibold text-gray-600">{followerCount}</span> follower{followerCount !== 1 ? 's' : ''}
            </span>

            {role === 'candidate' && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isFollowing
                    ? 'bg-brand text-white hover:bg-brand-dark'
                    : 'border border-brand text-brand hover:bg-brand-50'
                }`}
              >
                {followLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                {isFollowing ? 'Following ✓' : 'Follow'}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
          
          {/* Top Section: Info & Roles */}
          <div className="space-y-6">
            {/* About */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-sm font-semibold text-gray-800 mb-2">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {company.about || 'No description yet.'}
              </p>

              {company.culture && (
                <>
                  <h3 className="text-xs font-semibold text-gray-700 mt-4 mb-1.5">Culture</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{company.culture}</p>
                </>
              )}
            </motion.section>

            {/* Open roles */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-sm font-semibold text-gray-800 mb-3">
                Open roles ({companyJobs.length})
              </h2>

              {companyJobs.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No open roles right now.</p>
              ) : (
                <div className="space-y-3">
                  {companyJobs.map((job) => (
                    <FeedJobCard
                      key={job.id}
                      job={job}
                      onViewDetail={openJobDetail}
                      onApply={handleJobApply}
                      isEmployerForCompany={isEmployerForCompany}
                      onEdit={handleEditJob}
                      onDelete={handleDeleteJob}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={() => window.location.href = '/globe'}
                className="mt-3 text-xs font-medium text-brand hover:text-brand-dark transition-colors"
              >
                View all on globe →
              </button>
            </motion.section>
          </div>

          {/* Bottom Section: HR Management */}
          <div className="space-y-6 mt-6">
            {/* HR Management Panel — owner only */}
            {isOwner && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  Team
                </h2>

                {/* HR seats list */}
                {hrSeats.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {hrSeats.map((seat) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between bg-white rounded-lg border border-gray-100 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {seat.profile?.full_name || 'Unknown'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            seat.role === 'owner'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {seat.role}
                          </span>
                        </div>
                        {seat.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveSeat(seat.id)}
                            className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                            aria-label="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-4">No team members added yet.</p>
                )}

                {/* Invite form */}
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <button
                    onClick={handleInvite}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite
                  </button>
                </div>
                {inviteSent && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Invite sent!</p>
                )}
              </motion.section>
            )}
          </div>
        </div>
      </main>

      {/* Job detail sheet */}
      <JobDetailModal
        node={jobDetailNode}
        isOpen={!!jobDetailNode}
        onClose={() => setJobDetailNode(null)}
        onApply={() => {
          if (jobDetailNode) handleJobApply(jobDetailNode);
          setJobDetailNode(null);
        }}
      />

      {/* Apply confirmation */}
      <ApplyConfirmSheet
        node={applyConfirmNode}
        isOpen={!!applyConfirmNode}
        onClose={() => setApplyConfirmNode(null)}
      />
    </div>
  );
}
