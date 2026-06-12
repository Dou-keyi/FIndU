// ReactionStrip.jsx — floating 6-reaction picker strip
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REACTION_TYPES } from '../../../lib/feedConstants';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export default function ReactionStrip({
  postId,
  userReaction,
  onReact,
  totalCount = 0,
  topReactors = [],
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const stripRef = useRef(null);
  const timerRef = useRef(null);
  const prefersReduced = useReducedMotion();

  // Close strip on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (stripRef.current && !stripRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Long press for mobile
  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => setOpen(true), 500);
  };

  const handlePointerUp = () => {
    clearTimeout(timerRef.current);
  };

  const handleClick = () => {
    if (userReaction) {
      // Remove reaction
      onReact(null);
    } else {
      setOpen((v) => !v);
    }
  };

  const handleSelectReaction = (type) => {
    if (userReaction === type) {
      onReact(null);
    } else {
      onReact(type);
    }
    setOpen(false);
  };

  const activeReaction = userReaction
    ? REACTION_TYPES.find((r) => r.key === userReaction)
    : null;

  return (
    <div className="relative" ref={stripRef}>
      {/* Main reaction button */}
      <button
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
          activeReaction
            ? 'text-violet-700 bg-violet-50 hover:bg-violet-100'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
        aria-label={activeReaction ? `${activeReaction.label} (click to change)` : 'React'}
      >
        <span className="text-base leading-none">
          {activeReaction ? activeReaction.emoji : '👍'}
        </span>
        {!compact && (
          <span>{activeReaction ? activeReaction.label : 'React'}</span>
        )}
        {totalCount > 0 && (
          <span className="text-[10px] text-gray-400 font-medium ml-0.5">
            {totalCount}
          </span>
        )}
      </button>

      {/* Floating reaction strip */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 z-50 flex items-center gap-0.5 bg-white rounded-full shadow-lg border border-gray-100 px-2 py-1.5"
          >
            {REACTION_TYPES.map((r) => (
              <button
                key={r.key}
                onClick={() => handleSelectReaction(r.key)}
                className={`text-xl p-1.5 rounded-full transition-transform duration-100 hover:scale-125 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  userReaction === r.key ? 'bg-violet-50 scale-110' : ''
                }`}
                aria-label={r.label}
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reactor avatar stack + tooltip (shown when totalCount > 0) */}
      {!compact && totalCount > 0 && topReactors.length > 0 && (
        <div className="flex items-center -space-x-1.5 ml-1" title={
          topReactors.length <= 3
            ? topReactors.map((r) => r.full_name).join(', ')
            : `${topReactors.slice(0, 2).map((r) => r.full_name).join(', ')}, and ${totalCount - 2} others`
        }>
          {topReactors.slice(0, 3).map((reactor) => (
            <div
              key={reactor.id}
              className="w-5 h-5 rounded-full border-2 border-white bg-gray-200 text-[8px] font-bold flex items-center justify-center"
              style={{ backgroundColor: '#EDE9FE', color: '#5B21B6' }}
            >
              {(reactor.full_name || '?')[0]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
