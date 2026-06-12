// DMPanel.jsx — slide-over messaging interface
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useFeedStore } from '../../store/feedStore';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';

export default function DMPanel() {
  const { user } = useAuth();
  const isOpen = useFeedStore((s) => s.dmPanelOpen);
  const closeDMPanel = useFeedStore((s) => s.closeDMPanel);
  const targetUser = useFeedStore((s) => s.dmTargetUser);
  const sharedPost = useFeedStore((s) => s.dmSharedPost);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // If we had a real chat system we'd load conversation history here.
  // For this mockup, we'll just handle optimistic sends to the UI.

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Pre-fill if sharing a post
      if (sharedPost) {
        setMessage(`Check out this post: ${window.location.origin}/feed?post=${sharedPost.id}`);
      }
    } else {
      document.body.style.overflow = '';
      setMessage('');
      setMessages([]);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, sharedPost]);

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages(prev => [...prev, {
      id: Date.now(),
      sender_id: user?.id,
      body: message.trim(),
      created_at: new Date().toISOString()
    }]);
    setMessage('');
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // In a real app, send to Supabase `messages` table
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
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
                    disabled={!message.trim()}
                    className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
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
