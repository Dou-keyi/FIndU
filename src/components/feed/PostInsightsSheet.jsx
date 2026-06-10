// PostInsightsSheet.jsx — analytics drawer for own posts
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, MessageCircle, Repeat2, Quote, Bookmark, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { REACTION_TYPES } from '../../lib/feedConstants';

export default function PostInsightsSheet({ postId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !postId) return;
    setLoading(true);

    async function fetchInsights() {
      try {
        // Fetch post view_count
        const { data: post } = await supabase
          .from('posts')
          .select('view_count')
          .eq('id', postId)
          .single();

        // Fetch reactions breakdown
        const { data: reactions } = await supabase
          .from('post_reactions')
          .select('type')
          .eq('post_id', postId);

        // Count each reaction type
        const reactionBreakdown = {};
        REACTION_TYPES.forEach((r) => { reactionBreakdown[r.key] = 0; });
        (reactions || []).forEach((r) => {
          if (reactionBreakdown[r.type] !== undefined) reactionBreakdown[r.type]++;
        });

        // Fetch comment count
        const { count: commentCount } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId);

        // Fetch repost count
        const { count: repostCount } = await supabase
          .from('reposts')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId);

        // Fetch bookmark count
        const { count: bookmarkCount } = await supabase
          .from('bookmarks')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId);

        setData({
          views: post?.view_count || 0,
          reactionBreakdown,
          totalReactions: (reactions || []).length,
          comments: commentCount || 0,
          reposts: repostCount || 0,
          bookmarks: bookmarkCount || 0,
        });
      } catch (err) {
        console.error('Failed to fetch insights:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [postId, isOpen]);

  const maxReactionCount = data
    ? Math.max(1, ...Object.values(data.reactionBreakdown))
    : 1;

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
            className="fixed bottom-0 left-0 right-0 z-[75] bg-white rounded-t-3xl max-h-[70vh] overflow-y-auto shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-600" />
                <h3 className="text-base font-semibold text-gray-900">Post Insights</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 pb-8">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="spinner" />
                </div>
              ) : data ? (
                <div className="space-y-6">
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatBox icon={Eye} label="Views" value={data.views} />
                    <StatBox icon={MessageCircle} label="Comments" value={data.comments} />
                    <StatBox icon={Repeat2} label="Reposts" value={data.reposts} />
                    <StatBox icon={Bookmark} label="Bookmarks" value={data.bookmarks} />
                  </div>

                  {/* Reactions breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Reactions ({data.totalReactions})
                    </h4>
                    <div className="space-y-2">
                      {REACTION_TYPES.map((r) => {
                        const count = data.reactionBreakdown[r.key] || 0;
                        const pct = (count / maxReactionCount) * 100;
                        return (
                          <div key={r.key} className="flex items-center gap-3">
                            <span className="text-lg w-7 text-center">{r.emoji}</span>
                            <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden relative">
                              <div
                                className="h-full bg-violet-100 rounded-lg transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-semibold text-gray-600">
                                {count}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
      <p className="text-lg font-bold text-gray-800">{value.toLocaleString()}</p>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}
