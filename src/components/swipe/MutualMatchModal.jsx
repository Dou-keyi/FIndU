// MutualMatchModal.jsx — full-screen celebration overlay for mutual matches
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Decorative particles for celebration effect
 */
function CelebrationParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      delay: Math.random() * 0.8,
      duration: Math.random() * 1.5 + 1,
      color: ['#1D9E75', '#3B82F6', '#BFDBFE', '#15B886', '#93C5FD', '#FFD700'][
        Math.floor(Math.random() * 6)
      ],
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.5],
            y: [0, -40, -80, -120],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export default function MutualMatchModal({ matchedNode, role, isOpen, onClose }) {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = React.useState(false);

  if (!matchedNode) return null;

  const displayName =
    role === 'employer'
      ? matchedNode.full_name || matchedNode.label
      : matchedNode.company_name || matchedNode.sublabel;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/95 via-brand-800/95 to-brand-900/95 backdrop-blur-md" />

          {/* Celebration particles */}
          <CelebrationParticles />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-8 text-center"
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          >
            {/* Match icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              className="mb-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(29,158,117,0.4)]">
                  <span className="text-4xl">🎉</span>
                </div>
                {/* Pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
                  animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-3xl font-bold text-white mb-2 tracking-tight"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              It's a match!
            </motion.h2>

            <motion.p
              className="text-base text-brand-200 mb-8 max-w-xs leading-relaxed"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              You and <span className="font-semibold text-white">{displayName}</span> are both
              interested!
            </motion.p>

            {/* Buttons */}
            <motion.div
              className="flex flex-col gap-3 w-full max-w-xs"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={() => {
                  onClose();
                  navigate('/messaging');
                }}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-white text-brand font-semibold text-sm shadow-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Go to Chats
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border border-white/20 text-white/80 font-medium text-sm hover:bg-white/10 transition-colors"
              >
                Keep reviewing
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
