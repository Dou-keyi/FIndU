// GlobePage.jsx — orchestrates Globe view and Swipe card flow for job/candidate discovery
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getCandidateGlobeNodes, getEmployerGlobeNodes } from '../lib/globeData';
import { UniverseBackground } from '../components/UniverseBackground';
import Globe from '../components/globe/Globe';
import SwipeStack from '../components/swipe/SwipeStack';
import JobDetailSheet from '../components/swipe/JobDetailSheet';
import CandidatePortfolioSheet from '../components/swipe/CandidatePortfolioSheet';
import ApplyConfirmSheet from '../components/swipe/ApplyConfirmSheet';
import MutualMatchModal from '../components/swipe/MutualMatchModal';
import { useAuthStore } from '../store/authStore';

export default function GlobePage() {
  const { user, profile, signOut } = useAuth();
  const role = profile?.role || 'candidate';

  // Login transition state
  const justLoggedIn = useAuthStore((s) => s.justLoggedIn);
  const setJustLoggedIn = useAuthStore((s) => s.setJustLoggedIn);
  const [showContent, setShowContent] = useState(!justLoggedIn);

  // Core state
  const [mode, setMode] = useState('globe'); // 'globe' | 'swipe'
  const [nodes, setNodes] = useState([]);
  const [swipeQueue, setSwipeQueue] = useState([]);
  const [activeNode, setActiveNode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sheet/modal state
  const [jobDetailNode, setJobDetailNode] = useState(null);
  const [candidateDetailNode, setCandidateDetailNode] = useState(null);
  const [applyConfirmNode, setApplyConfirmNode] = useState(null);
  const [mutualMatchNode, setMutualMatchNode] = useState(null);

  // Active job ID for employer match checking
  const activeJobId = nodes[0]?._jobId || null;

  // Load globe data on mount
  useEffect(() => {
    async function loadNodes() {
      setLoading(true);
      try {
        const data =
          role === 'candidate'
            ? await getCandidateGlobeNodes(profile)
            : await getEmployerGlobeNodes(profile);
        setNodes(data);
      } catch (err) {
        console.error('Failed to load globe data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      loadNodes();
    }
  }, [profile, role]);

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
      setSwipeQueue([...nodes]); // Start swiping from all nodes
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

  // Sheet handlers
  const handleShowJobDetail = useCallback((node) => {
    setJobDetailNode(node);
  }, []);

  const handleShowCandidateDetail = useCallback((node) => {
    setCandidateDetailNode(node);
  }, []);

  const handleApplyConfirm = useCallback((node) => {
    setApplyConfirmNode(node);
  }, []);

  const handleMutualMatch = useCallback((node) => {
    setMutualMatchNode(node);
  }, []);

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
    <div className="relative min-h-screen min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Deep-space background */}
      <UniverseBackground showConstellation={false} />


      {/* Main content area */}
      <main className="relative z-20 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {mode === 'globe' ? (
            <motion.div
              key="globe"
              className="flex-1 flex flex-col"
              initial={justLoggedIn ? { opacity: 0, scale: 0.9, y: 30 } : { opacity: 0, scale: 0.95 }}
              animate={showContent ? { opacity: 1, scale: 1, y: 0 } : {}}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Globe */}
              <div className="flex-1 flex items-center justify-center">
                <Globe
                  nodes={nodes}
                  profile={profile}
                  role={role}
                  onNodeClick={handleNodeClick}
                  loading={loading}
                />
              </div>

              {/* Bottom info bar */}
              {!loading && nodes.length > 0 && (
                <motion.div
                  className="text-center pb-4"
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
                <div className="text-center pb-4">
                  <p className="text-sm text-white/50">
                    No new matches right now. Check back later!
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="swipe"
              className="flex-1 flex flex-col"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
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
                onShowJobDetail={handleShowJobDetail}
                onShowCandidateDetail={handleShowCandidateDetail}
                onApplyConfirm={handleApplyConfirm}
                onMutualMatch={handleMutualMatch}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sheets & Modals */}
      <JobDetailSheet
        node={jobDetailNode}
        isOpen={!!jobDetailNode}
        onClose={() => setJobDetailNode(null)}
        onApply={() => {
          // Trigger a right swipe from the detail sheet
          if (swipeQueue.length > 0) {
            // We'll handle this by simulating a right swipe
            setJobDetailNode(null);
          }
        }}
        onSkip={() => {
          setJobDetailNode(null);
        }}
      />

      <CandidatePortfolioSheet
        node={candidateDetailNode}
        isOpen={!!candidateDetailNode}
        onClose={() => setCandidateDetailNode(null)}
        onReject={() => {
          setCandidateDetailNode(null);
        }}
        onShortlist={() => {
          setCandidateDetailNode(null);
        }}
      />

      <ApplyConfirmSheet
        node={applyConfirmNode}
        isOpen={!!applyConfirmNode}
        onClose={() => setApplyConfirmNode(null)}
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
