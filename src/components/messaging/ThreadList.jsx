// ThreadList.jsx — renders chat thread list with unseen indicators and latest message preview
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import { formatRelativeTime } from '../../lib/relativeTime';

export default function ThreadList({ threads, userId, userRole, onSelectThread, loading }) {
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

  return (
    <div className="flex-1 overflow-y-auto">
      {threads.map((thread, i) => {
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
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${hasUnseen ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                  {otherParty?.full_name || 'Unknown'}
                </p>
                <span className={`text-[10px] flex-shrink-0 ${hasUnseen ? 'text-brand font-semibold' : 'text-slate-400'}`}>
                  {latestMsg ? formatRelativeTime(latestMsg.sent_at) : ''}
                </span>
              </div>

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
          </motion.button>
        );
      })}
    </div>
  );
}
