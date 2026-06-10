// NewPostsPill.jsx — "↑ 3 new posts" animated pill at the top of feed
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useFeedStore } from '../../store/feedStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function NewPostsPill() {
  const newPostsBuffer = useFeedStore((s) => s.newPostsBuffer);
  const flushNewPosts = useFeedStore((s) => s.flushNewPosts);
  const prefersReduced = useReducedMotion();

  const count = newPostsBuffer.length;

  const handleClick = () => {
    flushNewPosts();
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
          className="sticky top-[112px] lg:top-[56px] z-20 flex justify-center mb-3"
        >
          <button
            onClick={handleClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-lg hover:bg-violet-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            {count} new {count === 1 ? 'post' : 'posts'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
