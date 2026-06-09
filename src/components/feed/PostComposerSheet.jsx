// PostComposerSheet.jsx — bottom sheet for creating new social feed posts
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createPost } from '../../lib/feedData';
import { generatePortfolioSuggestion } from '../../lib/portfolioSuggestion';
import { usePortfolioSuggestion } from '../../context/PortfolioSuggestionContext';
import { supabase } from '../../lib/supabase';

const MAX_CHARS = 500;

export default function PostComposerSheet({ isOpen, onClose, onPostCreated }) {
  const { user, profile } = useAuth();
  const { setSuggestion } = usePortfolioSuggestion();

  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [posting, setPosting] = useState(false);

  const role = profile?.role || 'candidate';
  const charCount = content.length;
  const canPost = content.trim().length > 0 && !posting;

  const addTag = useCallback(() => {
    const clean = tagInput.replace(/^#/, '').trim().toLowerCase();
    if (clean && !hashtags.includes(clean)) {
      setHashtags((prev) => [...prev, clean]);
    }
    setTagInput('');
  }, [tagInput, hashtags]);

  const removeTag = useCallback((tag) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && tagInput === '' && hashtags.length > 0) {
      setHashtags((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (!canPost || !user) return;
    setPosting(true);

    try {
      // Determine company_id for employer posts
      let companyId = null;
      if (role === 'employer') {
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);
        companyId = companies?.[0]?.id || null;
      }

      const newPost = await createPost(
        user.id,
        content.trim(),
        hashtags,
        role === 'employer' ? 'company' : 'candidate',
        companyId
      );

      if (newPost) {
        onPostCreated?.(newPost);

        // Candidate only: trigger AI portfolio suggestion
        if (role === 'candidate') {
          // Fetch existing portfolio items
          const { data: items } = await supabase
            .from('portfolio_items')
            .select('item_type, title')
            .eq('candidate_id', user.id);

          generatePortfolioSuggestion(content.trim(), items || []).then((result) => {
            if (result?.suggest) {
              setSuggestion(result);
            }
          });
        }

        // Reset form
        setContent('');
        setHashtags([]);
        setTagInput('');
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit post:', err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[65] bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-base font-semibold text-gray-900">New Post</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 pb-6">
              {/* Textarea */}
              <textarea
                className="w-full min-h-[120px] resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setContent(e.target.value);
                  }
                }}
                rows={3}
              />

              {/* Char count */}
              <div className="flex justify-end mt-1 mb-3">
                <span
                  className={`text-xs font-medium ${
                    charCount > MAX_CHARS * 0.9
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                >
                  {charCount}/{MAX_CHARS}
                </span>
              </div>

              {/* Hashtag pills */}
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500 transition-colors"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Hashtag input */}
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="flex-1 text-sm border-b border-gray-200 py-1.5 px-0 focus:outline-none focus:border-brand placeholder-gray-400 transition-colors"
                  placeholder="Add hashtags…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canPost}
                className="w-full py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {posting && <Loader2 className="w-4 h-4 animate-spin" />}
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
