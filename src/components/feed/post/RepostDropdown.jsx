// RepostDropdown.jsx — repost/share dropdown menu
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat2, Quote, Send, Link2, Share2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useFeedStore } from '../../../store/feedStore';
import { createPost } from '../../../lib/feedData';
import toast from 'react-hot-toast';

export default function RepostDropdown({ post, repostCount = 0 }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const openDMPanel = useFeedStore((s) => s.openDMPanel);
  const setComposerOpen = useFeedStore((s) => s.setComposerOpen);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isOwnPost = user?.id === post.author_id;

  const handleRepost = async () => {
    if (isOwnPost) {
      toast.error("You can't repost your own post");
      setOpen(false);
      return;
    }
    try {
      const role = user?.role || 'candidate';
      const companyId = post.author_id === user.id ? post.company_id : null; // Keep company_id if reposting own company post
      const newPost = await createPost(
        user.id,
        '', // Empty content for instant repost
        [],
        role === 'employer' ? 'company' : 'candidate',
        companyId,
        null,
        post.id // quotedPostId
      );
      if (!newPost) throw new Error('Failed to create repost');
      // Supabase insert select sometimes fails to fully populate deep nested joins,
      // but we already have the fully populated quoted post!
      newPost.quoted_post = post;
      useFeedStore.getState().prependPosts([newPost]);
      toast.success('Reposted!');
    } catch (err) {
      console.error('Failed to repost:', err);
      toast.error('Failed to repost');
    }
    setOpen(false);
  };

  const handleQuoteRepost = () => {
    // Store quoted post info and open composer
    window.__quotedPost = post;
    setComposerOpen(true);
    setOpen(false);
  };

  const handleShareDM = () => {
    openDMPanel(null, post);
    setOpen(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/feed?post=${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Copied!');
    });
    setOpen(false);
  };

  const handleShareExternal = () => {
    if (navigator.share) {
      navigator.share({
        title: post.author?.full_name || 'Post',
        text: (post.content || '').slice(0, 100),
        url: `${window.location.origin}/feed?post=${post.id}`,
      }).catch(() => {});
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        aria-label="Repost"
      >
        <Repeat2 className="w-[18px] h-[18px]" />
        <span className="hidden sm:inline">Share</span>
        {repostCount > 0 && (
          <span className="text-[10px] text-gray-400 font-medium">{repostCount}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 bottom-full mb-2 z-50 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 overflow-hidden"
          >
            <button
              onClick={handleRepost}
              disabled={isOwnPost}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              <Repeat2 className="w-4 h-4" />
              Repost instantly
            </button>

            <button
              onClick={handleQuoteRepost}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <Quote className="w-4 h-4" />
              Repost with quote
            </button>

            <div className="my-1 border-t border-gray-100" />

            <button
              onClick={handleShareDM}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <Send className="w-4 h-4" />
              Share via DM
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <Link2 className="w-4 h-4" />
              Copy link
            </button>

            {typeof navigator.share === 'function' && (
              <button
                onClick={handleShareExternal}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <Share2 className="w-4 h-4" />
                Share externally
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
