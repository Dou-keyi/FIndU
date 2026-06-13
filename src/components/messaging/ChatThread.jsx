// ChatThread.jsx — real-time chat view with Supabase Realtime subscription
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getThreadMessages, sendMessage, markThreadSeen } from '../../lib/messagingData';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import { formatRelativeTime } from '../../lib/relativeTime';

function MessageBubble({ message, isMine, isLast, companyContext }) {
  const navigate = useNavigate();
  const time = new Date(message.sent_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}
    >
      <div className={`max-w-[75%] ${isMine ? 'order-1' : 'order-0'}`}>
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed ${
            isMine
              ? 'bg-brand-600 text-white rounded-2xl rounded-br-md shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-bl-md shadow-sm'
          }`}
        >
          {message.content}
          
          {message.includes_portfolio_card && companyContext && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/company/${companyContext.id}`);
              }}
              className={`mt-3 p-3 rounded-xl cursor-pointer transition-colors flex items-center gap-3 border ${
                isMine 
                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-bold ${
                isMine ? 'bg-white text-brand-600' : 'bg-slate-200 text-slate-500'
              }`}>
                {companyContext.logo_url ? (
                  <img src={companyContext.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{companyContext.name}</p>
                <p className={`text-[10px] truncate ${isMine ? 'text-brand-100' : 'text-slate-500'}`}>
                  View Company Portfolio
                </p>
              </div>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-slate-400">{time}</span>
          {isMine && isLast && (
            <span className={`text-[10px] ${message.seen ? 'text-brand' : 'text-slate-300'}`}>
              {message.seen ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatThread({ threadId, isRequest, isDraft, initialMessages, otherParty, jobContext, companyContext, userId, onBack, onThreadUpdate, onSendDraft, requestId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages and subscribe to Realtime
  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      setInitialLoading(true);
      if (isRequest || isDraft) {
        if (mounted) {
          const msgs = initialMessages ? initialMessages.flatMap(m => m.content.split('\n\n').map((c, i) => ({
            ...m,
            id: `${m.id}-${i}`,
            content: c
          }))) : [];
          setMessages(msgs);
          setInitialLoading(false);
        }
        return;
      }

      const data = await getThreadMessages(threadId);
      if (mounted) {
        setMessages(data);
        setInitialLoading(false);
      }
      // Mark as seen
      await markThreadSeen(threadId, userId);
      onThreadUpdate?.();
    }

    loadMessages();

    if (isRequest || isDraft) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          if (mounted) {
            setMessages((prev) => {
              // Dedupe by id
              if (prev.find((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            // Mark incoming messages as seen
            if (payload.new.sender_id !== userId) {
              markThreadSeen(threadId, userId);
              onThreadUpdate?.();
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, userId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || sending) return;

    setSending(true);
    setInputValue('');

    // Optimistic append
    const optimisticMsg = {
      id: `optimistic-${Date.now()}`,
      content,
      sender_id: userId,
      seen: false,
      sent_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      if (isDraft) {
        await onSendDraft?.(content);
        return;
      }

      if (isRequest && requestId) {
        const { supabase } = await import('../../lib/supabase');
        const { data: reqData, error: fetchErr } = await supabase.from('message_requests').select('intro_message').eq('id', requestId).single();
        if (fetchErr) throw fetchErr;
        
        if (reqData) {
          const updated = reqData.intro_message + '\n\n' + content;
          const { error: updateErr } = await supabase.from('message_requests').update({ intro_message: updated }).eq('id', requestId);
          if (updateErr) throw updateErr;

          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticMsg.id ? { ...m, id: `req-msg-${Date.now()}` } : m))
          );
          onThreadUpdate?.();
        }
        return;
      }

      const { data, error } = await sendMessage(threadId, userId, content);
      if (error) throw error;

      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? data : m))
      );
      onThreadUpdate?.();
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInputValue(content); // Restore input
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherColors = getAvatarColor(otherParty?.full_name);
  const otherInitials = getInitials(otherParty?.full_name);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 z-10">
        <button
          onClick={onBack}
          className="p-1 -ml-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold"
          style={{ backgroundColor: otherColors.bg, color: otherColors.text }}
        >
          {otherParty?.avatar_url ? (
            <img src={otherParty.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            otherInitials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {otherParty?.full_name || 'Unknown'}
          </p>
          <p className="text-[11px] text-slate-400 truncate">{otherParty?.headline}</p>
        </div>

        {/* Job context pill */}
        {jobContext && (
          <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand text-[10px] font-semibold flex-shrink-0 border border-brand-100">
            {jobContext}
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 messaging-scroll">
        {initialLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-slate-400">No messages yet</p>
            <p className="text-xs text-slate-300 mt-1">Say hello to start the conversation!</p>
          </div>
        ) : (
          <>
            {/* Date grouping could go here in future */}
            {messages.map((msg, idx) => {
              const isMine = msg.sender_id === userId;
              const isLast = isMine && idx === messages.length - 1;
              return (
                <MessageBubble key={msg.id} message={msg} isMine={isMine} isLast={isLast} companyContext={companyContext} />
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3">
        {isRequest && !isDraft && (
          <div className="flex items-center justify-center p-2 mb-3 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200">
            Waiting for {otherParty?.full_name || 'candidate'} to accept your request. You can still send messages.
          </div>
        )}
        <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all bg-slate-50"
              style={{ maxHeight: 120 }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all flex-shrink-0 ${
                inputValue.trim()
                  ? 'bg-brand text-white shadow-sm hover:bg-brand-dark active:scale-95'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
      </div>
    </div>
  );
}
