// TrackingPage.jsx — application tracking dashboard for candidates and employers
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  getCandidateApplications, 
  getEmployerJobIds, 
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
  
  // Sheet state for applying from saved jobs
  const [applyConfirmNode, setApplyConfirmNode] = useState(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    if (isEmployer) {
      const jobIds = await getEmployerJobIds(user.id);
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

  // Calculate pipeline counts
  const pipelineCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  // Filtered applications
  const filteredApplications = activeStatus
    ? applications.filter(app => app.status === activeStatus)
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

        {/* Pipeline (Applications tab only) */}
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
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
