// WhyShowingSheet.jsx — "Why am I seeing this?" transparency modal
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Users, Hash, Eye } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function WhyShowingSheet({ targetPost, isOpen, onClose }) {
  const { user } = useAuth();

  if (!targetPost) return null;

  const isFollowing = false; // We would ideally know this from state, but simulating for now
  const isConnection = false;
  const isPopular = targetPost.view_count > 1000;
  const hasMatchingTags = targetPost.hashtags?.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[75] bg-white rounded-t-3xl max-h-[60vh] overflow-y-auto shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pb-8">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-violet-600" />
                <h3 className="text-base font-semibold text-gray-900">Why you're seeing this post</h3>
              </div>

              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Your feed is personalized based on who you follow, your connections, and your activity on FIndU. This post is in your feed because:
              </p>

              <div className="space-y-4">
                {isFollowing && (
                  <div className="flex gap-3">
                    <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">You follow the author</h4>
                      <p className="text-xs text-gray-500">You choose to follow {targetPost.author?.full_name}'s updates.</p>
                    </div>
                  </div>
                )}
                
                {isPopular && (
                  <div className="flex gap-3">
                    <Eye className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">It's popular in your network</h4>
                      <p className="text-xs text-gray-500">This post has received a lot of engagement recently.</p>
                    </div>
                  </div>
                )}

                {hasMatchingTags && (
                  <div className="flex gap-3">
                    <Hash className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">Topics you're interested in</h4>
                      <p className="text-xs text-gray-500">This post includes tags ({targetPost.hashtags?.slice(0, 2).join(', ')}) related to your industry or past activity.</p>
                    </div>
                  </div>
                )}

                {!isFollowing && !isPopular && !hasMatchingTags && (
                  <div className="flex gap-3">
                    <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">It's a public post</h4>
                      <p className="text-xs text-gray-500">The author shared this publicly with the community.</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full mt-8 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
