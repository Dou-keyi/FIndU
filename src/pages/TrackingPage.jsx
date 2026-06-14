// TrackingPage.jsx — application tracking dashboard for candidates and employers
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Briefcase } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  getCandidateApplications, 
  getEmployerJobs, 
  getEmployerApplications, 
  updateApplicationStatus,
  getSavedJobs,
  removeSavedJob,
  applyToJob
} from '../lib/trackingData';
import { toast } from '../components/ui/use-toast';
import KanbanBoard from '../components/tracking/KanbanBoard';
import ApplicationCard from '../components/tracking/ApplicationCard';
import SavedJobCard from '../components/tracking/SavedJobCard';
import ApplyConfirmSheet from '../components/swipe/ApplyConfirmSheet';

export default function TrackingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isEmployer = profile?.role === 'employer';

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'saved'
  const [activeStatus, setActiveStatus] = useState(null);
  
  const [applications, setApplications] = useState([]);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState(new Set());
  
  // Sheet state for applying from saved jobs
  const [applyConfirmNode, setApplyConfirmNode] = useState(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    if (isEmployer) {
      const jobs = await getEmployerJobs(user.id);
      setEmployerJobs(jobs);

      const jobIds = jobs.map(j => j.id);
      if (jobIds.length > 0) {
        const apps = await getEmployerApplications(jobIds);
        setApplications(apps);
      }
    } else {
      const apps = await getCandidateApplications(user.id);
      setApplications(apps);
      
      const saved = await getSavedJobs(user.id);
      setSavedJobs(saved);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, isEmployer]);

  // Filtered applications is not used for Kanban since Kanban handles all statuses
  // Keep saved jobs filter logic separate

  // Handlers
  const handleStatusChange = async (appId, newStatus) => {
    // Optimistic update
    setApplications(prev => prev.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    ));

    const { error } = await updateApplicationStatus(appId, newStatus);
    
    if (error) {
      // Revert on error
      toast({ title: 'Update failed', variant: 'destructive' });
      loadData();
    }
  };

  const handleRemoveSavedJob = async (savedJob) => {
    setRemovingIds(prev => new Set(prev).add(savedJob.id));
    
    const { error } = await removeSavedJob(savedJob.id);
    
    if (!error) {
      setSavedJobs(prev => prev.filter(sj => sj.id !== savedJob.id));
    } else {
      toast({ title: 'Failed to remove', variant: 'destructive' });
    }
    
    setRemovingIds(prev => {
      const next = new Set(prev);
      next.delete(savedJob.id);
      return next;
    });
  };

  const handleApplySavedJob = async (savedJob) => {
    setRemovingIds(prev => new Set(prev).add(savedJob.id));
    
    try {
      // 1. Create application
      const { data: newApp, error: applyErr } = await applyToJob(user.id, savedJob.job.id, null);
      if (applyErr) throw applyErr;
      
      // 2. Remove from saved jobs
      await removeSavedJob(savedJob.id);
      
      // 3. Update local state
      setSavedJobs(prev => prev.filter(sj => sj.id !== savedJob.id));
      
      // We need the full job data for the application card, so we just reload all data
      await loadData();
      
      // 4. Show confirm sheet
      setApplyConfirmNode({
        id: savedJob.job.id,
        title: savedJob.job.title,
        company_name: savedJob.job.company?.name,
        matchReason: null
      });
      
    } catch (err) {
      console.error('Apply failed:', err);
      toast({ title: 'Application failed', variant: 'destructive' });
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(savedJob.id);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-12 md:pt-6 pb-4 flex-shrink-0 z-10 sticky top-0">
        <h1 className="text-xl font-bold text-slate-900 mb-4 px-2">Tracker</h1>
        
        {/* Tabs (only for candidates) */}
        {!isEmployer && (
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-2 ml-2">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'applications' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'saved' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Saved Jobs
              {savedJobs.length > 0 && (
                <span className="ml-1.5 text-slate-400">({savedJobs.length})</span>
              )}
            </button>
          </div>
        )}

        {/* Pipeline / Headers omitted for Kanban board since it's full height */}
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${activeTab === 'applications' ? 'overflow-hidden' : 'overflow-y-auto px-4 py-6'}`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : activeTab === 'applications' ? (
          <div className="h-full pt-2">
            {isEmployer && !selectedJobId ? (
              // Job Selection Screen for Employer
              <div className="max-w-4xl mx-auto space-y-4">
                <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Select a Job to Track</h2>
                {employerJobs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {employerJobs.map(job => (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-brand/30 transition-all text-left group flex flex-col justify-between h-32 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div>
                          <h3 className="font-bold text-slate-900 text-[15px] truncate pr-8">{job.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Posted {new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className="flex items-center gap-1.5 bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                            <Users className="w-3.5 h-3.5" />
                            {job.applications?.[0]?.count || job.applications?.length || 0} Applicants
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Briefcase className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-2">No Jobs Posted</h3>
                    <p className="text-sm text-slate-500">
                      You haven't posted any jobs yet. Head to the + menu to create one!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Kanban Board
              <div className="h-full flex flex-col">
                {isEmployer && selectedJobId && (
                  <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                    <button
                      onClick={() => setSelectedJobId(null)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to Jobs
                    </button>
                    <h2 className="text-sm font-bold text-slate-800 truncate pl-4">
                      {employerJobs.find(j => j.id === selectedJobId)?.title}
                    </h2>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <KanbanBoard 
                    applications={isEmployer ? applications.filter(a => a.job?.id === selectedJobId) : applications}
                    isEmployer={isEmployer}
                    onStatusChange={handleStatusChange}
                    onViewPortfolio={(id) => navigate(isEmployer ? `/portfolio/${id}` : `/company/${id}`)}
                    onMessage={(targetUserId, jobId, jobTitle) => {
                      const targetProfile = isEmployer 
                        ? applications.find(a => a.candidate?.id === targetUserId)?.candidate 
                        : {
                            id: targetUserId,
                            full_name: applications.find(a => a.job?.id === jobId)?.job?.company?.name || 'Company',
                            avatar_url: applications.find(a => a.job?.id === jobId)?.job?.company?.logo_url,
                            headline: 'Employer',
                          };
                      navigate('/messaging', { 
                        state: { 
                          newConversation: { targetProfile, jobId, jobTitle } 
                        } 
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Saved Jobs List */}
            {savedJobs.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {savedJobs.map((sj, i) => (
                  <motion.div
                    key={sj.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <SavedJobCard 
                      savedJob={sj}
                      onApply={handleApplySavedJob}
                      onRemove={handleRemoveSavedJob}
                      isRemoving={removingIds.has(sj.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-16 px-6">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <h3 className="text-slate-900 font-bold mb-2">No saved jobs</h3>
                <p className="text-sm text-slate-500">
                  Swipe up ↑ on the Globe to save jobs for later.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Sheet */}
      <ApplyConfirmSheet
        node={applyConfirmNode}
        isOpen={!!applyConfirmNode}
        onClose={() => setApplyConfirmNode(null)}
      />
    </div>
  );
}
