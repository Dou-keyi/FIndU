import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Send, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createMessageRequest } from '../../lib/messagingData';
import { useAuth } from '../../hooks/useAuth';
import { getAvatarColor, getInitials } from '../../lib/avatarUtils';
import { toast } from '../../components/ui/use-toast';

export default function NewMessageSheet({ isOpen, onClose }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [introMessage, setIntroMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, headline, avatar_url, role')
        .ilike('full_name', `%${searchQuery.trim()}%`)
        .neq('id', user?.id)
        .limit(10);
      
      setSearchResults(data || []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleSend = async () => {
    if (!selectedUser || !introMessage.trim()) return;

    setSending(true);
    const { error } = await createMessageRequest(user.id, selectedUser.id, introMessage.trim());
    setSending(false);

    if (error) {
      toast({
        title: 'Failed to send request',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Request sent',
        description: `Your message request has been sent to ${selectedUser.full_name}.`,
        variant: 'success',
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setIntroMessage('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white z-10 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">New Message</h2>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
              {!selectedUser ? (
                <div className="p-4 flex-1">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search for a user..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all shadow-sm"
                      autoFocus
                    />
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="spinner" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((result) => {
                        const colors = getAvatarColor(result.full_name);
                        return (
                          <button
                            key={result.id}
                            onClick={() => setSelectedUser(result)}
                            className="w-full flex items-center gap-3 p-3 bg-white hover:bg-brand-50 rounded-xl border border-transparent hover:border-brand-100 transition-all text-left"
                          >
                            <div
                              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              {result.avatar_url ? (
                                <img src={result.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                getInitials(result.full_name)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{result.full_name}</p>
                              <p className="text-xs text-slate-500 truncate">{result.headline || result.role}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : searchQuery.trim() ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      No users found matching "{searchQuery}"
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16 opacity-60">
                      <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Find someone to connect with</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                        Search for candidates or employers by name to start a conversation.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 flex-1 flex flex-col">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                        style={{ backgroundColor: getAvatarColor(selectedUser.full_name).bg, color: getAvatarColor(selectedUser.full_name).text }}
                      >
                        {selectedUser.avatar_url ? (
                          <img src={selectedUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(selectedUser.full_name)
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{selectedUser.full_name}</h3>
                        <p className="text-xs text-slate-500">{selectedUser.headline || selectedUser.role}</p>
                      </div>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="ml-auto text-xs font-semibold text-brand hover:text-brand-dark px-2 py-1 rounded-md hover:bg-brand-50 transition-colors"
                      >
                        Change
                      </button>
                    </div>

                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Introductory Message
                    </label>
                    <textarea
                      value={introMessage}
                      onChange={(e) => setIntroMessage(e.target.value)}
                      placeholder={`Write a friendly introduction to ${selectedUser.full_name.split(' ')[0]}...`}
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                      autoFocus
                    />
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      onClick={handleSend}
                      disabled={!introMessage.trim() || sending}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
