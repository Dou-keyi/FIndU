// BookmarksSheet.jsx — collections drawer for saved posts
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, FolderOpen, ChevronRight, FileEdit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function BookmarksSheet({ isOpen, onClose }) {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);

    async function fetchCollections() {
      try {
        const { data } = await supabase
          .from('bookmark_collections')
          .select('id, name, created_at, bookmarks(count)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Also get unsorted count
        const { count: unsortedCount } = await supabase
          .from('bookmarks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('collection_id', null);

        setCollections([
          { id: 'unsorted', name: 'All Saved Items', count: unsortedCount || 0, isDefault: true },
          ...(data || []).map(c => ({ ...c, count: c.bookmarks[0]?.count || 0 }))
        ]);
      } catch (err) {
        console.error('Failed to fetch collections:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCollections();
  }, [isOpen, user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this collection? The saved items will be moved to All Saved Items.')) return;
    try {
      await supabase.from('bookmark_collections').delete().eq('id', id);
      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete collection failed:', err);
    }
  };

  const handleUpdateName = async (id) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await supabase.from('bookmark_collections').update({ name: editName.trim() }).eq('id', id);
      setCollections(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
    } catch (err) {
      console.error('Rename collection failed:', err);
    }
    setEditingId(null);
  };

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
            className="fixed bottom-0 left-0 right-0 z-[75] bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-violet-600" />
                <h3 className="text-base font-semibold text-gray-900">Saved Items</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-4 min-h-[300px]">
              {loading ? (
                <div className="flex justify-center py-12"><div className="spinner" /></div>
              ) : collections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">You haven't saved any items yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collections.map(c => (
                    <div
                      key={c.id}
                      className="group flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {c.isDefault ? (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Bookmark className="w-5 h-5 text-gray-500" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-violet-600" />
                          </div>
                        )}
                        <div>
                          {editingId === c.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => handleUpdateName(c.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(c.id)}
                              className="text-sm font-semibold text-gray-900 border-b border-violet-500 focus:outline-none bg-transparent"
                            />
                          ) : (
                            <h4 className="text-sm font-semibold text-gray-900">{c.name}</h4>
                          )}
                          <p className="text-xs text-gray-400">{c.count} items</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!c.isDefault && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditName(c.name); setEditingId(c.id); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
