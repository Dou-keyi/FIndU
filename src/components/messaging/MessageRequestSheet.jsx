// MessageRequestSheet.jsx — bottom sheet for sending message requests to unmatched candidates
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/use-toast';

export default function MessageRequestSheet({ isOpen, onClose, candidateId, candidateName, employerJobId, employerJobTitle, userId }) {
  const [introText, setIntroText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!introText.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from('message_requests').insert({
        sender_id: userId,
        recipient_id: candidateId,
        job_id: employerJobId || null,
        intro_message: introText.trim(),
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Request sent',
        description: `Your message request has been sent to ${candidateName}`,
        variant: 'success',
      });
      setIntroText('');
      onClose();
    } catch (err) {
      console.error('Failed to send request:', err);
      toast({
        title: 'Failed to send',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[65] bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="px-6 pb-8 pt-2">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Send a message request</h3>
              <p className="text-sm text-slate-500 mb-4">
                {candidateName} will see your request and can choose to accept or decline.
              </p>

              {/* Job context */}
              {employerJobTitle && (
                <div className="px-3 py-2 bg-brand-50 rounded-lg border border-brand-100 mb-4">
                  <p className="text-xs text-brand font-medium">
                    Re: {employerJobTitle}
                  </p>
                </div>
              )}

              {/* Textarea */}
              <div className="mb-4">
                <textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value.slice(0, 200))}
                  placeholder="Write a brief intro message…"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none bg-slate-50"
                />
                <p className="text-right text-[10px] text-slate-400 mt-1">
                  {introText.length}/200
                </p>
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!introText.trim() || sending}
                className="w-full py-3 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send request
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
