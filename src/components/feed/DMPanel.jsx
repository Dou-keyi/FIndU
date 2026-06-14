// DMPanel.jsx — slide-over messaging interface
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image as ImageIcon, MessageCircle, Search, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useFeedStore } from '../../store/feedStore';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import { createMessageRequest } from '../../lib/messagingData';
import { toast } from '../ui/use-toast';

export default function DMPanel() {
  const { user } = useAuth();
  const isOpen = useFeedStore((s) => s.dmPanelOpen);
  const closeDMPanel = useFeedStore((s) => s.closeDMPanel);
  const storeRecipient = useFeedStore((s) => s.dmRecipient);
  const sharedPost = useFeedStore((s) => s.dmAttachedPost);

  const [localRecipient, setLocalRecipient] = useState(null);
  const targetUser = storeRecipient || localRecipient;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, headline, avatar_url, role')
        .ilike('full_name', `%${searchQuery.trim()}%`)
        .neq('id', user?.id)
        .limit(10);
      
      setSearchResults(data || []);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  // If we had a real chat system we'd load conversation history here.
  // For this mockup, we'll just handle optimistic sends to the UI.

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // No pre-fill message needed
    } else {
      document.body.style.overflow = '';
      setMessage('');
      setMessages([]);
      setLocalRecipient(null);
      setSearchQuery('');
      setSearchResults([]);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, sharedPost]);

  const handleSend = async () => {
    if (!message.trim() || !targetUser) return;
    setLoading(true);

    const { error } = await createMessageRequest(user.id, targetUser.id, message.trim());
    setLoading(false);

    if (error) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Message sent',
      description: `Your message request has been sent to ${targetUser.full_name}.`,
      variant: 'success',
    });

    closeDMPanel();
  };

  const targetName = targetUser?.full_name || 'Message';
  const color = getAvatarColor(targetName);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDMPanel}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[400px] bg-white shadow-2xl border-l border-gray-100 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {targetUser ? (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {getInitials(targetName)}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-violet-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{targetName}</h3>
                  {targetUser && <p className="text-[10px] text-emerald-500 font-medium">Online</p>}
                </div>
              </div>
              <button
                onClick={closeDMPanel}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col">
              {!targetUser ? (
                <div className="flex-1 flex flex-col">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for someone to message..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-all shadow-sm"
                      autoFocus
                    />
                  </div>

                  {isSearching ? (
                    <div className="flex justify-center py-10">
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-violet-600 rounded-full animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((result) => {
                        const colors = getAvatarColor(result.full_name);
                        return (
                          <button
                            key={result.id}
                            onClick={() => setLocalRecipient(result)}
                            className="w-full flex items-center gap-3 p-3 bg-white hover:bg-violet-50 rounded-xl border border-transparent hover:border-violet-100 transition-all text-left"
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
                              <p className="text-sm font-bold text-gray-900 truncate">{result.full_name}</p>
                              <p className="text-xs text-gray-500 truncate">{result.headline || result.role}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : searchQuery.trim() ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      No users found matching "{searchQuery}"
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16 opacity-50">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Share with someone</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                        Search for a name to send them this post via DM.
                      </p>
                    </div>
                  )}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 flex-1">
                  <MessageCircle className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No messages yet.</p>
                  <p className="text-xs text-gray-400">Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        isMine 
                          ? 'bg-violet-600 text-white rounded-tr-sm' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                      }`}>
                        {msg.body}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 p-1 pl-3 focus-within:border-violet-300 focus-within:ring-1 focus-within:ring-violet-300 transition-all">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 max-h-32 min-h-[36px] bg-transparent resize-none outline-none py-2 text-sm text-gray-700"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="flex items-center gap-1 pb-1 pr-1">
                  <button className="p-2 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || loading}
                    className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
