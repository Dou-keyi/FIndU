// TrackingPage.jsx — application tracking dashboard for candidates and employers
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import StatusPipeline from '../components/tracking/StatusPipeline';
import ApplicationCard from '../components/tracking/ApplicationCard';
import SavedJobCard from '../components/tracking/SavedJobCard';
import ApplyConfirmSheet from '../components/swipe/ApplyConfirmSheet';
import EmployerPipelineView from '../components/tracking/EmployerPipelineView';
import { formatRelativeTime } from '../lib/relativeTime';
import { ChevronLeft } from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied', statuses: ['applied'] },
  { id: 'viewed', label: 'Viewed', statuses: ['viewed'] },
  { id: 'shortlisted', label: 'Shortlisted', statuses: ['shortlisted'] },
  { id: 'final', label: 'Final Stage', statuses: ['pending', 'accepted', 'rejected'] },
];

export default function TrackingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isEmployer = profile?.role === 'employer';

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'saved'
  const [activeStatus, setActiveStatus] = useState(null);
  
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState(new Set());
  
  // Employer state
  const [employerJobs, setEmployerJobs] = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);
  
  // Sheet state for applying from saved jobs
  const [applyConfirmNode, setApplyConfirmNode] = useState(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    if (isEmployer) {
      const jobs = await getEmployerJobs(user.id);
      setEmployerJobs(jobs);
      
      if (activeJobId) {
        const apps = await getEmployerApplications([activeJobId]);
        setApplications(apps);
      } else {
        setApplications([]);
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
  }, [user, isEmployer, activeJobId]);

  // Calculate pipeline counts
  const pipelineCounts = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = applications.filter(a => stage.statuses.includes(a.status)).length;
    return acc;
  }, {});

  // Filtered applications
  const activeStageObj = PIPELINE_STAGES.find(s => s.id === activeStatus);
  const filteredApplications = activeStageObj
    ? applications.filter(app => activeStageObj.statuses.includes(app.status))
    : applications;

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
        <div className="flex items-center mb-4 px-2">
          {isEmployer && activeJobId && (
            <button 
              onClick={() => setActiveJobId(null)}
              className="mr-3 p-1.5 -ml-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
          )}
          <h1 className="text-xl font-bold text-slate-900">Tracker</h1>
        </div>
        
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

        {/* Pipeline (Applications tab only, for candidates) */}
        {!isEmployer && (
          <AnimatePresence mode="popLayout">
            {activeTab === 'applications' && !loading && applications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <StatusPipeline 
                  counts={pipelineCounts} 
                  activeStatus={activeStatus} 
                  onSelectStatus={setActiveStatus} 
                  stages={PIPELINE_STAGES.map(s => s.id)}
                  stageLabels={PIPELINE_STAGES.reduce((acc, s) => { acc[s.id] = s.label; return acc; }, {})}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto px-4 py-6 ${isEmployer && activeJobId ? 'bg-slate-50' : ''}`}>
        <div className={`mx-auto space-y-4 ${isEmployer && activeJobId ? 'max-w-7xl h-full' : 'max-w-2xl'}`}>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : isEmployer ? (
            /* Employer View */
            !activeJobId ? (
              // Job Selection Grid
              employerJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employerJobs.map(job => (
                    <button
                      key={job.id}
                      onClick={() => setActiveJobId(job.id)}
                      className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-brand/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 group-hover:text-brand transition-colors text-lg">{job.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          job.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span>{job.location || 'Remote'}</span>
                        <span>•</span>
                        <span className="capitalize">{job.work_type || 'Full-time'}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Posted {formatRelativeTime(job.created_at)}</span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {job.applicationCount || 0} Candidates
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-6">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <h3 className="text-slate-900 font-bold mb-2">No active jobs</h3>
                  <p className="text-sm text-slate-500 mb-6">Create a job post to start receiving applications.</p>
                  <button onClick={() => navigate('/jobs/new')} className="bg-brand text-white font-bold py-2 px-6 rounded-full hover:bg-brand-dark transition-colors shadow-sm">
                    Post a Job
                  </button>
                </div>
              )
            ) : (
              // Pipeline View for selected job
              <EmployerPipelineView
                applications={applications}
                onStatusChange={handleStatusChange}
                onViewPortfolio={(id) => navigate(`/portfolio/${id}`)}
                onMessage={(targetUserId, jobId, jobTitle) => {
                  const targetProfile = applications.find(a => a.candidate?.id === targetUserId)?.candidate;
                  navigate('/messaging', { 
                    state: { 
                      newConversation: { targetProfile, jobId, jobTitle } 
                    } 
                  });
                }}
              />
            )
          ) : activeTab === 'applications' ? (
            /* Applications List */
            filteredApplications.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filteredApplications.map((app, i) => (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <ApplicationCard 
                      app={app} 
                      isEmployer={isEmployer}
                      onStatusChange={handleStatusChange}
                      onViewPortfolio={(id) => navigate(isEmployer ? `/portfolio/${id}` : `/company/${id}`)}
                      onMessage={(targetUserId, jobId, jobTitle) => {
                        const targetProfile = isEmployer 
                          ? app.candidate 
                          : {
                              id: targetUserId,
                              full_name: app.job?.company?.name || 'Company',
                              avatar_url: app.job?.company?.logo_url,
                              headline: 'Employer',
                            };
                        navigate('/messaging', { 
                          state: { 
                            newConversation: { targetProfile, jobId, jobTitle } 
                          } 
                        });
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-16 px-6">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-slate-900 font-bold mb-2">No applications found</h3>
                <p className="text-sm text-slate-500">
                  {isEmployer 
                    ? "You don't have any applications for your jobs yet."
                    : activeStatus 
                      ? `No applications with status '${activeStatus}'.` 
                      : "Head to the Globe to find your first match."}
                </p>
              </div>
            )
          ) : (
            /* Saved Jobs List */
            savedJobs.length > 0 ? (
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
            )
          )}
          
        </div>
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
