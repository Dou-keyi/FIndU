// RequestsList.jsx — renders pending message requests with accept/decline actions
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MessageSquare } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import { formatRelativeTime } from '../../lib/relativeTime';

export default function RequestsList({ requests, onAccept, onDecline, loading }) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400 text-center">No pending requests</p>
        <p className="text-xs text-slate-300 mt-1 text-center">
          When employers want to connect, their requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <AnimatePresence mode="popLayout">
        {requests.map((req, i) => {
          const sender = req.sender;
          const colors = getAvatarColor(sender?.full_name);
          const initials = getInitials(sender?.full_name);
          const jobContext = req.job
            ? `Re: ${req.job.title}${req.job.company?.name ? ` at ${req.job.company.name}` : ''}`
            : null;

          return (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -200, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="border-b border-slate-100 last:border-b-0"
            >
              <div className="px-4 py-4">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {sender?.avatar_url ? (
                      <img src={sender.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {sender?.full_name || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{sender?.headline}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
                        {formatRelativeTime(req.created_at)}
                      </span>
                    </div>

                    {/* Job context */}
                    {jobContext && (
                      <p className="text-[11px] text-brand font-medium mt-1 truncate">{jobContext}</p>
                    )}

                    {/* Intro message */}
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      "{req.intro_message}"
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onAccept(req)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => onDecline(req)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
