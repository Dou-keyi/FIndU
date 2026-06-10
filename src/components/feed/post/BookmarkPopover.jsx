// BookmarkPopover.jsx — save to collection popover
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookmarkCheck, Plus, FolderOpen } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function BookmarkPopover({ postId, isBookmarked, onToggle }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Fetch collections when popover opens
  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from('bookmark_collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCollections(data);
      });
  }, [open, user]);

  const handleQuickToggle = async () => {
    if (isBookmarked) {
      // Remove bookmark
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', postId);
      onToggle?.(false);
      toast.success('Bookmark removed');
    } else {
      setOpen(true);
    }
  };

  const handleSaveToCollection = async (collectionId = null) => {
    try {
      const { error } = await supabase.from('bookmarks').insert({
        user_id: user.id,
        post_id: postId,
        collection_id: collectionId,
      });
      if (error && error.code !== '23505') throw error;
      onToggle?.(true);
      setOpen(false);
      toast.success('Saved!');
    } catch (err) {
      console.error('Failed to bookmark:', err);
    }
  };

  const handleCreateCollection = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('bookmark_collections')
        .insert({ user_id: user.id, name: newName.trim() })
        .select()
        .single();

      if (error) throw error;
      setCollections((prev) => [data, ...prev]);
      await handleSaveToCollection(data.id);
      setNewName('');
    } catch (err) {
      console.error('Failed to create collection:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleQuickToggle}
        className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
          isBookmarked
            ? 'text-violet-600 hover:bg-violet-50'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
      >
        {isBookmarked
          ? <BookmarkCheck className="w-[18px] h-[18px]" />
          : <Bookmark className="w-[18px] h-[18px]" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 bottom-full mb-2 z-50 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden"
          >
            <p className="px-3 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Save to…
            </p>

            {/* Default save (no collection) */}
            <button
              onClick={() => handleSaveToCollection(null)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <Bookmark className="w-4 h-4 text-gray-400" />
              Unsorted
            </button>

            {/* Existing collections */}
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSaveToCollection(c.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <FolderOpen className="w-4 h-4 text-violet-500" />
                {c.name}
              </button>
            ))}

            {/* New collection input */}
            <div className="border-t border-gray-100 mt-1 pt-1 px-3 py-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New collection…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  onClick={handleCreateCollection}
                  disabled={!newName.trim() || creating}
                  className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors disabled:opacity-50 focus-visible:outline-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
