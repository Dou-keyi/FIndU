// ReportSheet.jsx — multi-step report drawer
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { REPORT_REASONS } from '../../../lib/feedConstants';

export default function ReportSheet({ target, isOpen, onClose }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !user) return;
    setSubmitting(true);

    try {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        post_id: target?.postId || null,
        comment_id: target?.commentId || null,
        user_id: target?.userId || null,
        reason,
        details: details.trim() || null,
      });
      setStep(3);
    } catch (err) {
      console.error('Report failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setReason('');
    setDetails('');
    onClose();
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
            onClick={handleClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[75] bg-white rounded-t-3xl max-h-[60vh] overflow-y-auto shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pb-8">
              {/* Step 1: Choose reason */}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Flag className="w-4 h-4 text-red-500" />
                    <h3 className="text-base font-semibold text-gray-900">Report</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Why are you reporting this?</p>
                  <div className="space-y-1">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => { setReason(r.key); setStep(2); }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-gray-700">{r.label}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Add details (optional)</h3>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Tell us more…"
                    className="w-full min-h-[100px] text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-300 mb-4 resize-none"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit Report'}
                  </button>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Thanks for reporting</h3>
                  <p className="text-sm text-gray-500 mb-6">We'll review this and take appropriate action.</p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
