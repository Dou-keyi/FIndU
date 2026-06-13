// GlobePage.jsx — orchestrates Globe view and Swipe card flow for job/candidate discovery
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getCandidateGlobeNodes, getEmployerGlobeNodes } from '../lib/globeData';
import { UniverseBackground } from '../components/UniverseBackground';
import Globe from '../components/globe/Globe';
import SwipeStack from '../components/swipe/SwipeStack';
import JobDetailModal from '../components/swipe/JobDetailModal';
import CandidatePortfolioSheet from '../components/swipe/CandidatePortfolioSheet';
import ApplyConfirmSheet from '../components/swipe/ApplyConfirmSheet';
import SaveConfirmModal from '../components/swipe/SaveConfirmModal';
import MutualMatchModal from '../components/swipe/MutualMatchModal';
import JobsListSection from '../components/globe/JobsListSection';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGlobeStore } from '../store/globeStore';

export default function GlobePage() {
  const { user, profile, signOut } = useAuth();
  const role = profile?.role || 'candidate';

  // Login transition state
  const justLoggedIn = useAuthStore((s) => s.justLoggedIn);
  const setJustLoggedIn = useAuthStore((s) => s.setJustLoggedIn);
  const [showContent, setShowContent] = useState(!justLoggedIn);

  const navigate = useNavigate();

  // Core state from store
  const {
    mode, setMode,
    nodes, setNodes,
    employerJobs, setEmployerJobs,
    swipeQueue, setSwipeQueue,
    activeNode, setActiveNode,
    hasFetched, setHasFetched
  } = useGlobeStore();

  const [loading, setLoading] = useState(!hasFetched);

  // Sheet/modal state
  const [applyConfirmNode, setApplyConfirmNode] = useState(null);
  const [saveConfirmNode, setSaveConfirmNode] = useState(null);
  const [mutualMatchNode, setMutualMatchNode] = useState(null);

  // Active job ID for employer match checking
  const activeJobId = nodes[0]?._jobId || null;

  // Load globe data on mount
  useEffect(() => {
    async function loadNodes() {
      if (hasFetched) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (role === 'candidate') {
          const data = await getCandidateGlobeNodes(profile);
          setNodes(data);
        } else {
          const data = await getEmployerGlobeNodes(profile);
          setNodes(data);
          
          if (profile?.id) {
            const { data: comp } = await supabase.from('companies').select('id').eq('owner_id', profile.id).limit(1).maybeSingle();
            if (comp) {
              const { data: eJobs } = await supabase.from('jobs').select('id, title, company_id, company:companies(name)').eq('company_id', comp.id).eq('status', 'open');
              setEmployerJobs(eJobs || []);
            }
          }
        }
        setHasFetched(true);
      } catch (err) {
        console.error('Failed to load globe data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile?.id) {
      loadNodes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, role, hasFetched]);

  // Handle post-login entrance animation
  useEffect(() => {
    if (justLoggedIn) {
      // Small delay to let the page mount, then reveal content with animation
      const timer = setTimeout(() => {
        setShowContent(true);
        setJustLoggedIn(false);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [justLoggedIn, setJustLoggedIn]);

  // Handle node click — enter swipe mode
  const handleNodeClick = useCallback(
    (node) => {
      setActiveNode(node);
      // Place the clicked node at the front of the queue
      const reorderedNodes = [node, ...nodes.filter((n) => n.id !== node.id)];
      setSwipeQueue(reorderedNodes);
      setMode('swipe');
    },
    [nodes]
  );

  // Handle back to globe
  const handleBackToGlobe = useCallback(() => {
    setMode('globe');
    setActiveNode(null);
    setSwipeQueue([]);
  }, []);

  // Sheet/modal handlers
  const handleShowJobDetail = useCallback((node) => {
    navigate(`/jobs/${node.id || node._jobId}`);
  }, [navigate]);

  const handleShowCandidateDetail = useCallback((node) => {
    navigate(`/portfolio/${node.id}`);
  }, [navigate]);

  const handleApplyConfirm = useCallback((node) => {
    setApplyConfirmNode(node);
  }, []);

  const handleSaveConfirm = useCallback((node) => {
    setSaveConfirmNode(node);
  }, []);

  const handleMutualMatch = useCallback((node) => {
    setMutualMatchNode(node);
  }, []);

  const handleJobApply = async (job) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('applications')
        .insert({ job_id: job.id, candidate_id: user.id });

      if (error && error.code !== '23505') throw error;
      setApplyConfirmNode({ ...job, title: job.title, company_name: job.company?.name });
      setNodes(prev => prev.map(n => n.id === job.id ? { ...n, has_applied: true } : n));
    } catch (err) {
      console.error('Failed to apply:', err);
    }
  };

  // Get user initials for avatar
  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className={`relative min-h-screen min-h-[100dvh] flex flex-col overflow-x-hidden ${mode === 'swipe' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      {/* Deep-space background */}
      <UniverseBackground showConstellation={false} skipEntranceAnimation={justLoggedIn} />
      
      {/* Extra ambient light for the globe section sky */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-blue-500/15 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-screen" />


      {/* Main content area */}
      <main className="relative z-20 flex-1 flex flex-col">
        {/* Globe View (Kept mounted to preserve heavy WebGL context and avoid lag) */}
        <motion.div
          className={`w-full flex-col ${mode === 'globe' ? 'relative flex' : 'absolute inset-0 flex pointer-events-none'}`}
          initial={justLoggedIn ? { opacity: 0, scale: 0.9, y: 30 } : { opacity: 0, scale: 0.95 }}
          animate={
            mode === 'globe' && showContent 
              ? { opacity: 1, scale: 1, y: 0 } 
              : { opacity: 0, scale: 0.95, y: 0 }
          }
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Globe Container */}
          <div className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-16 lg:pt-0 pb-24">
            <Globe
              nodes={nodes}
              profile={profile}
              role={role}
              onNodeClick={handleNodeClick}
              loading={loading}
            />

            {/* Bottom Overlay: Info Bar & Scroll Tip */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center pointer-events-none">
              {!loading && nodes.length > 0 && (
                <motion.div
                  className="text-center mb-6 pointer-events-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm text-white/50">
                    <span className="text-white/70 font-semibold">{nodes.length}</span>{' '}
                    matches found · Tap a node to review
                  </p>
                </motion.div>
              )}

              {!loading && nodes.length === 0 && (
                <div className="text-center mb-6 pointer-events-auto">
                  <p className="text-sm text-white/50">
                    No new matches right now. Check back later!
                  </p>
                </div>
              )}

              {/* Scroll down tip */}
              {!loading && (
                <motion.div
                  className="flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer pointer-events-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                  onClick={() => window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' })}
                >
                  <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase mb-2">
                    Scroll for Listings
                  </span>
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Jobs List Section */}
          <JobsListSection 
            profile={profile} 
            onJobClick={handleShowJobDetail} 
            onJobApply={handleJobApply} 
            onCandidateClick={handleShowCandidateDetail}
          />
        </motion.div>

        {/* Swipe View */}
        <AnimatePresence>
          {mode === 'swipe' && (
            <motion.div
              key="swipe"
              className="absolute inset-0 flex flex-col z-10"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Back to Globe Header */}
              <div className="flex items-center p-4 md:p-6">
                <button
                  onClick={handleBackToGlobe}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back to Globe</span>
                </button>
              </div>

              <SwipeStack
                queue={swipeQueue}
                setQueue={setSwipeQueue}
                role={role}
                user={user}
                profile={profile}
                activeJobId={activeJobId}
                employerJobs={employerJobs}
                onShowJobDetail={handleShowJobDetail}
                onShowCandidateDetail={handleShowCandidateDetail}
                onApplyConfirm={handleApplyConfirm}
                onSaveConfirm={handleSaveConfirm}
                onMutualMatch={handleMutualMatch}
                onAllCaughtUp={handleBackToGlobe}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sheets & Modals */}
      <ApplyConfirmSheet
        node={applyConfirmNode}
        isOpen={!!applyConfirmNode}
        onClose={() => setApplyConfirmNode(null)}
      />

      <SaveConfirmModal
        node={saveConfirmNode}
        isOpen={!!saveConfirmNode}
        onClose={() => setSaveConfirmNode(null)}
      />

      <MutualMatchModal
        matchedNode={mutualMatchNode}
        role={role}
        isOpen={!!mutualMatchNode}
        onClose={() => setMutualMatchNode(null)}
      />
    </div>
  );
}
