// ThreadList.jsx — renders chat thread list with unseen indicators and latest message preview
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Filter } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import { formatRelativeTime } from '../../lib/relativeTime';

export default function ThreadList({ threads, userId, userRole, onSelectThread, loading }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'pending'
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400 text-center">No conversations yet</p>
        <p className="text-xs text-slate-300 mt-1 text-center max-w-[240px]">
          Match with someone on the Globe to start chatting.
        </p>
      </div>
    );
  }

  const filteredThreads = threads?.filter(thread => {
    if (filter === 'active') return !thread.isRequest;
    if (filter === 'pending') return thread.isRequest;
    return true;
  }) || [];

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Filter Bar */}
      {threads && threads.length > 0 && (
        <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 bg-white sticky top-0 z-10 flex-shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                filter === 'active' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                filter === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pending
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 opacity-50">
            <MessageSquare className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No {filter !== 'all' ? filter : ''} chats found</p>
          </div>
        ) : (
          filteredThreads.map((thread, i) => {
            const match = thread.match;
        if (!match) return null;

        const otherParty = userRole === 'candidate' ? match.employer : match.candidate;
        const job = match.job;

        // Get latest message
        const messages = thread.messages || [];
        const latestMsg = messages.length > 0
          ? messages.reduce((a, b) => (new Date(a.sent_at) > new Date(b.sent_at) ? a : b))
          : null;

        // Check for unseen messages from other party
        const hasUnseen = messages.some(
          (m) => !m.seen && m.sender_id !== userId
        );

        const colors = getAvatarColor(otherParty?.full_name);
        const initials = getInitials(otherParty?.full_name);

        return (
          <motion.button
            key={thread.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            onClick={() => onSelectThread(thread)}
            className={`w-full text-left px-4 py-3.5 border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50 active:bg-slate-100 flex gap-3 items-start relative ${
              hasUnseen ? 'bg-brand-50/40' : ''
            }`}
          >
            {/* Unseen dot */}
            {hasUnseen && (
              <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand" />
            )}

            {/* Avatar */}
            <div
              className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {otherParty?.avatar_url ? (
                <img src={otherParty.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${hasUnseen ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                {otherParty?.full_name || 'Unknown'}
              </p>

              {/* Job context */}
              {job && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {job.title}{job.company?.name ? ` · ${job.company.name}` : ''}
                </p>
              )}

              {/* Latest message preview */}
              {latestMsg && (
                <p className={`text-xs mt-1 truncate ${hasUnseen ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  {latestMsg.sender_id === userId ? 'You: ' : ''}
                  {latestMsg.content}
                </p>
              )}
            </div>

            {/* Right Column */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
              <span className={`text-[10px] mt-0.5 ${hasUnseen ? 'text-brand font-semibold' : 'text-slate-400'}`}>
                {latestMsg ? formatRelativeTime(latestMsg.sent_at) : ''}
              </span>
              {thread.isRequest && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200/60 shadow-sm">
                  Pending
                </span>
              )}
            </div>
            </motion.button>
          );
          })
        )}
      </div>
    </div>
  );
}
