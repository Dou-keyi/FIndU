// SwipeStack.jsx — gesture-driven swipe card stack with directional actions
import React, { useState, useCallback, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Check, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SwipeCard from './SwipeCard';
import EmployerMessageModal from './EmployerMessageModal';
import { toast } from '../ui/use-toast';

/**
 * Directional overlay badge shown during drag
 */
function DirectionOverlay({ dragX, dragY, role }) {
  const showSkip = dragX < -30;
  const showApply = dragX > 30;
  const showSave = dragY < -30;

  return (
    <>
      {showSkip && (
        <div className="absolute top-5 left-5 z-20 px-4 py-2 rounded-xl border-2 border-red-400 bg-red-50/90 backdrop-blur-sm">
          <span className="text-red-500 font-bold text-sm tracking-wider uppercase">Skip</span>
        </div>
      )}
      {showApply && (
        <div className="absolute top-5 right-5 z-20 px-4 py-2 rounded-xl border-2 border-emerald-400 bg-emerald-50/90 backdrop-blur-sm">
          <span className="text-emerald-600 font-bold text-sm tracking-wider uppercase">
            {/* eslint-disable-next-line react/prop-types */}
            {role === 'candidate' ? 'Apply' : 'Connect'}
          </span>
        </div>
      )}
      {showSave && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl border-2 border-brand-300 bg-brand-50/90 backdrop-blur-sm">
          <span className="text-brand font-bold text-sm tracking-wider uppercase">Save</span>
        </div>
      )}
    </>
  );
}

export default function SwipeStack({
  queue,
  setQueue,
  role,
  user,
  profile,
  activeJobId,
  employerJobs,
  onShowJobDetail,
  onShowCandidateDetail,
  onApplyConfirm,
  onSaveConfirm,
  onMutualMatch,
  onAllCaughtUp,
}) {
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState(null); // 'left' | 'right' | 'up'
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingEmployerMessageNode, setPendingEmployerMessageNode] = useState(null);
  const [pendingEmployerMessageJobId, setPendingEmployerMessageJobId] = useState(null);

  useEffect(() => {
    if (queue.length === 0 && onAllCaughtUp) {
      const timer = setTimeout(() => {
        onAllCaughtUp();
      }, 1500); // 1.5s delay to let user read the message
      return () => clearTimeout(timer);
    }
  }, [queue.length, onAllCaughtUp]);

  /**
   * Handle swipe action — write to Supabase and advance queue
   */
  const handleSwipe = useCallback(
    async (direction, overrideJobId = activeJobId, customMessage = '', includePortfolio = false) => {
      if (isProcessing || queue.length === 0) return;
      setIsProcessing(true);

      const node = queue[0];
      const targetJobId = overrideJobId;

      try {
        // 1. Animate card off screen
        setExitDirection(direction);

        // 2. Write swipe_action to Supabase
        const { error: swipeError } = await supabase.from('swipe_actions').insert({
          actor_id: user.id,
          target_type: role === 'candidate' ? 'job' : 'candidate',
          target_id: node.id,
          direction,
        });

        if (swipeError && swipeError.code !== '23505') throw swipeError;

        let isAlreadyApplied = false;

        // 3. If candidate swiped right → create application
        if (role === 'candidate' && direction === 'right') {
          const { error: appError } = await supabase.from('applications').insert({
            job_id: node.id,
            candidate_id: user.id,
            status: 'applied',
            ai_context: node.matchReason,
          });

          if (appError) {
            if (appError.code === '23505') {
              isAlreadyApplied = true;
            } else {
              throw appError;
            }
          }

          // Check if employer already sent a request message
          const { data: request } = await supabase
            .from('message_requests')
            .select('id, sender_id, intro_message')
            .eq('recipient_id', user.id)
            .eq('job_id', node.id)
            .eq('status', 'pending')
            .maybeSingle();

          if (request && !isAlreadyApplied) {
            // Mutual Match via existing request
            const { data: match } = await supabase.from('matches').insert({
              candidate_id: user.id,
              job_id: node.id,
              employer_id: request.sender_id,
            }).select().single();

            if (match) {
              const { data: thread } = await supabase.from('message_threads').insert({
                match_id: match.id,
              }).select().single();

              if (thread) {
                await supabase.from('messages').insert({
                  thread_id: thread.id,
                  sender_id: request.sender_id,
                  content: request.intro_message,
                });
              }
            }
            
            await supabase.from('message_requests').update({ status: 'accepted' }).eq('id', request.id);
            
            setTimeout(() => {
              onMutualMatch?.(node);
            }, 400);
          } else {
            // Show confirmation after a brief delay for animation
            setTimeout(() => {
              onApplyConfirm?.({ ...node, already_applied: isAlreadyApplied });
            }, 400);
          }
        }

        // 4. If employer swiped right → check for mutual match
        if (role === 'employer' && direction === 'right') {
          // Check if candidate has swiped right on this employer's job
          const { data: candidateSwipe } = await supabase
            .from('swipe_actions')
            .select('id')
            .eq('actor_id', node.id)
            .eq('target_type', 'job')
            .eq('target_id', targetJobId)
            .eq('direction', 'right')
            .maybeSingle();

          // ALSO check if candidate has sent a message request
          const { data: candidateRequests } = await supabase
            .from('message_requests')
            .select('id, intro_message')
            .eq('sender_id', node.id)
            .eq('recipient_id', user.id)
            .eq('status', 'pending')
            .limit(1);
          
          const candidateRequest = candidateRequests?.[0];

          if (candidateSwipe || candidateRequest) {
            // Mutual match!
            const { data: match } = await supabase.from('matches').insert({
              candidate_id: node.id,
              job_id: targetJobId,
              employer_id: user.id,
            }).select().single();

            if (match) {
              const { data: thread } = await supabase.from('message_threads').insert({
                match_id: match.id,
              }).select().single();

              if (thread) {
                // If candidate had a pending request, insert their original message into the thread and accept it
                if (candidateRequest && candidateRequest.intro_message) {
                  await supabase.from('messages').insert({
                    thread_id: thread.id,
                    sender_id: node.id, // Candidate is sender
                    content: candidateRequest.intro_message,
                  });
                  // Mark the request as accepted
                  await supabase.from('message_requests').update({ status: 'accepted' }).eq('id', candidateRequest.id);
                }

                const { data: job } = await supabase.from('jobs').select('title, company:companies(name)').eq('id', targetJobId).maybeSingle();
                const companyName = job?.company?.name || 'our company';
                const jobTitle = job?.title || 'the role';
                const introMessage = customMessage.trim() || `Hi, we are ${companyName} and we are interested in hiring you for the ${jobTitle} role. Are you available for an interview anytime soon?`;

                await supabase.from('messages').insert({
                  thread_id: thread.id,
                  sender_id: user.id,
                  content: introMessage,
                  includes_portfolio_card: includePortfolio
                });
              }
            }

            setTimeout(() => {
              onMutualMatch?.(node);
            }, 400);
          } else {
            // No mutual match yet, send a message request
            const { data: job } = await supabase.from('jobs').select('title, company:companies(name)').eq('id', targetJobId).maybeSingle();
            const companyName = job?.company?.name || 'our company';
            const jobTitle = job?.title || 'the role';
            const introMessage = customMessage.trim() || `Hi, we are '${companyName}' and we are interested in hiring you for '${jobTitle}'. Are you available for an interview anytime soon?`;

            const { data: existingReq } = await supabase.from('message_requests')
              .select('id')
              .eq('sender_id', user.id)
              .eq('recipient_id', node.id)
              .eq('job_id', targetJobId)
              .maybeSingle();
              
            if (!existingReq) {
              await supabase.from('message_requests').insert({
                sender_id: user.id,
                recipient_id: node.id,
                job_id: targetJobId,
                intro_message: introMessage,
                includes_portfolio_card: includePortfolio
              });

              toast({
                title: 'Message sent',
                description: `Request sent to ${node.full_name || 'candidate'}`,
                variant: 'success',
              });
            }
          }
        }

        // 5. If swiped up → save job (candidate only)
        if (role === 'candidate' && direction === 'up') {
          const { error: saveError } = await supabase.from('saved_jobs').insert({
            candidate_id: user.id,
            job_id: node.id,
          });

          // Ignore duplicate save error (23505) but still show the popup
          if (saveError && saveError.code !== '23505') {
            throw saveError;
          }

          setTimeout(() => {
            onSaveConfirm?.(node);
          }, 400);
        }

        // 6. Advance queue after animation
        setTimeout(() => {
          setQueue((prev) => prev.slice(1));
          setExitDirection(null);
          setIsProcessing(false);
        }, 350);
      } catch (err) {
        console.error('Swipe action failed:', err);
        setExitDirection(null);
        setIsProcessing(false);
      }
    },
    [queue, user, role, activeJobId, isProcessing, setQueue, onApplyConfirm, onMutualMatch]
  );

  /**
   * Drag gesture binding
   */
  const bind = useDrag(
    ({ movement: [mx, my], last, active }) => {
      if (isProcessing) return;

      if (active) {
        setIsDragging(true);
        setDragX(mx);
        setDragY(my);
      }

      if (last) {
        setIsDragging(false);
        if (mx < -80) {
          handleSwipe('left');
        } else if (mx > 80) {
          if (role === 'employer') {
            setPendingEmployerMessageNode(queue[0]);
            setPendingEmployerMessageJobId(activeJobId || (employerJobs && employerJobs.length > 0 ? employerJobs[0].id : null)); // Use active context or first available job
          } else {
            handleSwipe('right', activeJobId);
          }
        } else if (my < -80) {
          handleSwipe('up');
        } else {
          // Reset
          setDragX(0);
          setDragY(0);
        }
      }
    },
    { filterTaps: true }
  );

  // Exit animation variants
  const getExitAnimation = (dir) => {
    switch (dir) {
      case 'left':
        return { x: -400, rotate: -15, opacity: 0 };
      case 'right':
        return { x: 400, rotate: 15, opacity: 0 };
      case 'up':
        return { y: -400, opacity: 0 };
      default:
        return { opacity: 0 };
    }
  };

  // Empty state
  if (queue.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <Check className="h-8 w-8 text-brand" />
          </div>
          <h2 className="text-xl font-semibold text-white">All caught up!</h2>
          <p className="text-sm text-white/60 max-w-xs mx-auto">
            You've reviewed all current matches. Check back later for new opportunities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-2">
      {/* Card stack */}
      <div className="relative w-full max-w-[340px] h-[420px] mb-6">
        <AnimatePresence mode="popLayout">
          {queue.slice(0, 3).map((node, index) => {
            const isTop = index === 0;
            const scale = 1 - index * 0.04;
            const yOffset = index * 6;

            // Only the top card gets drag
            const dragProps = isTop && !exitDirection ? bind() : {};
            const liveTransform = isTop && isDragging
              ? {
                  x: dragX,
                  y: dragY,
                  rotate: dragX * 0.06,
                }
              : {};

            return (
              <motion.div
                key={node.id}
                className="absolute inset-0"
                style={{
                  zIndex: 3 - index,
                  touchAction: 'none',
                }}
                initial={{
                  scale: scale,
                  y: yOffset,
                  opacity: index === 2 ? 0.6 : 1,
                }}
                animate={
                  exitDirection && isTop
                    ? getExitAnimation(exitDirection)
                    : {
                        scale: scale,
                        y: yOffset,
                        opacity: index === 2 ? 0.6 : 1,
                        ...liveTransform,
                      }
                }
                exit={getExitAnimation(exitDirection || 'left')}
                transition={{
                  type: 'spring',
                  stiffness: isDragging ? 800 : 300,
                  damping: isDragging ? 60 : 30,
                }}
                {...dragProps}
              >
                <div className="w-full h-full bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] border border-gray-100/80 p-5 overflow-hidden">
                  {/* Directional overlay — only on top card */}
                  {isTop && isDragging && (
                    <DirectionOverlay dragX={dragX} dragY={dragY} role={role} />
                  )}

                  {/* Card content */}
                  <SwipeCard
                    node={node}
                    role={role}
                    onShowMore={() => {
                      if (role === 'candidate') {
                        onShowJobDetail?.(node);
                      } else {
                        onShowCandidateDetail?.(node);
                      }
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-5">
        {/* Skip — red */}
        <button
          onClick={() => handleSwipe('left')}
          disabled={isProcessing}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-red-200 text-red-400 shadow-lg hover:bg-red-50 hover:border-red-300 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50"
          aria-label="Skip"
        >
          <X className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* Save — purple (smaller) */}
        <button
          onClick={() => handleSwipe('up')}
          disabled={isProcessing}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white border-2 border-brand-200 text-brand shadow-lg hover:bg-brand-50 hover:border-brand-300 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50"
          aria-label="Save"
        >
          <Star className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Apply / Connect — green */}
        <button
          onClick={() => {
            if (role === 'employer') {
              setPendingEmployerMessageNode(queue[0]);
              setPendingEmployerMessageJobId(activeJobId || (employerJobs && employerJobs.length > 0 ? employerJobs[0].id : null)); // Use active context or first available job
            } else {
              handleSwipe('right', activeJobId);
            }
          }}
          disabled={isProcessing}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-emerald-200 text-emerald-500 shadow-lg hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50"
          aria-label={role === 'candidate' ? 'Apply' : 'Connect'}
        >
          <Check className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Hint text */}
      <p className="text-[11px] text-white/40 mt-3 text-center">
        Swipe or tap buttons · {queue.length} remaining
      </p>

      {/* Custom Message Modal for Employers */}
      <EmployerMessageModal
        isOpen={!!pendingEmployerMessageNode}
        onClose={() => {
          setPendingEmployerMessageNode(null);
          setPendingEmployerMessageJobId(null);
        }}
        candidateName={pendingEmployerMessageNode?.full_name || 'candidate'}
        onConfirm={(customMessage, includePortfolioCard) => {
          setPendingEmployerMessageNode(null);
          handleSwipe('right', pendingEmployerMessageJobId, customMessage, includePortfolioCard);
        }}
      />
    </div>
  );
}
