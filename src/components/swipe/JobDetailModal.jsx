import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Briefcase, Clock, Building2, Star, ChevronLeft, CheckCircle2, LayoutGrid, Sparkles, CircleDollarSign, FileText } from 'lucide-react';
import { getAvatarColor } from '../../lib/avatarUtils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../ui/use-toast';

// Pastel colors for skill tags
const SKILL_COLORS = [
  'bg-emerald-100 text-emerald-800',
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-rose-100 text-rose-800',
  'bg-amber-100 text-amber-800',
  'bg-cyan-100 text-cyan-800'
];

export default function JobDetailModal({ node, isOpen, onClose, onApply, onSkip }) {
  if (!node) return null;

  const salaryStr =
    node.salary_min && node.salary_max
      ? `${node.currency || '$'}${node.salary_min.toLocaleString()} – ${node.salary_max.toLocaleString()}`
      : 'Not specified';

  const positionType = node.position_type || 'Full-time';
  const workType = node.work_type ? node.work_type.charAt(0).toUpperCase() + node.work_type.slice(1) : 'Remote';
  const expLevel = node.experience_level ? node.experience_level.charAt(0).toUpperCase() + node.experience_level.slice(1) : 'Any Level';


  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Reset saved state when node changes
    setIsSaved(false);
    
    // Check if job is already saved
    async function checkSaved() {
      if (!user || !node) return;
      try {
        const { data } = await supabase
          .from('saved_jobs')
          .select('id')
          .eq('candidate_id', user.id)
          .eq('job_id', node.id)
          .maybeSingle();
        if (data) setIsSaved(true);
      } catch (err) {
        console.error('Failed to check saved status:', err);
      }
    }
    
    if (isOpen) {
      checkSaved();
    }
  }, [node, user, isOpen]);

  const handleSave = async () => {
    if (!user || !node || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('candidate_id', user.id)
          .eq('job_id', node.id);
          
        if (error) throw error;
        
        setIsSaved(false);
        toast({
          title: 'Job Removed',
          description: 'Job removed from your Tracked Jobs.',
        });
      } else {
        // Save
        const { error } = await supabase.from('saved_jobs').insert({
          candidate_id: user.id,
          job_id: node.id,
        });
        
        // If error is unique constraint, it means it's already saved
        if (error && error.code !== '23505') throw error;
        
        setIsSaved(true);
        toast({
          title: 'Job Saved',
          description: 'You can find this in your Tracked Jobs.',
          variant: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to toggle save job:', err);
      toast({
        title: 'Error',
        description: 'Failed to update job status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Modal Container */}
            <motion.div
              className="relative w-full max-w-xl bg-gray-50 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              {/* Card Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50 pt-4 px-6 pb-24 relative z-20">
                {/* Top Action Bar */}
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center transition-colors shadow-sm ${
                      isSaved 
                        ? 'text-yellow-500 bg-yellow-50 border-yellow-200' 
                        : 'text-gray-400 hover:bg-gray-50 hover:text-yellow-500'
                    }`}
                  >
                    <Star className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
                  </button>
                </div>

                {/* Title & Core Info */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm mb-4 border border-gray-100">
                  <h2 className="text-[22px] font-bold text-gray-900 leading-tight mb-1">
                    {node.title || node.label}
                  </h2>
                  <p className="text-[14px] text-gray-500 mb-4 font-medium flex items-center gap-1.5">
                    {node.company_name || node.sublabel} <span className="text-gray-300">•</span> {node.location || 'Remote'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-[13px] font-medium tracking-wide">
                      {positionType}
                    </span>
                    <span className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-full text-[13px] font-medium tracking-wide">
                      {workType}
                    </span>
                  </div>

                  <div className="w-full bg-brand-50 text-brand-700 border border-brand-100 text-center py-2.5 rounded-2xl font-bold text-sm tracking-wide shadow-sm">
                    {expLevel} Level
                  </div>
                </div>

                {/* Salary Section */}
                <div className="mb-6 bg-brand-50 border border-brand-100 rounded-[20px] p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600">
                    <CircleDollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[13px] text-brand-700 font-medium mb-0.5">Offered Salary</p>
                    <p className="text-[16px] font-bold text-gray-900">{salaryStr}</p>
                  </div>
                </div>

                {/* Job Description */}
                {node.description && (
                  <div className="bg-white rounded-[24px] p-6 shadow-sm mb-4 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl opacity-60 pointer-events-none -translate-y-1/2 translate-x-1/4" />
                    
                    <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                      <FileText className="w-5 h-5 text-gray-400" />
                      Job Description
                    </h3>
                    <div className="relative z-10">
                      <p className="text-[14px] text-gray-600 leading-[1.7] whitespace-pre-wrap">
                        {node.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Responsibilities */}
                {node.responsibilities && node.responsibilities.length > 0 && (
                  <div className="bg-white rounded-[24px] p-6 shadow-sm mb-4 border border-gray-100">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      Responsibilities
                    </h3>
                    <ul className="space-y-3">
                      {node.responsibilities.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="mt-1.5 min-w-[6px] w-[6px] h-[6px] rounded-full bg-brand-400" />
                          <span className="text-[14px] text-gray-500 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits & Perks */}
                {node.benefits && node.benefits.length > 0 && (
                  <div className="bg-white rounded-[24px] p-6 shadow-sm mb-4 border border-gray-100">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-gray-400" />
                      Benefits & Perks
                    </h3>
                    <ul className="space-y-3">
                      {node.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-gray-400" />
                          <span className="text-[14px] font-medium text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Skills */}
                {node.skills_required && node.skills_required.length > 0 && (
                  <div className="bg-white rounded-[24px] p-6 shadow-sm mb-4 border border-gray-100">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-gray-400" />
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {node.skills_required.map((skill, i) => (
                        <span
                          key={skill}
                          className={`px-4 py-1.5 rounded-full text-[13px] font-semibold ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Bottom Apply Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent z-30">
                <button
                  onClick={() => {
                    if (onApply) onApply(node);
                    if (onClose) onClose();
                  }}
                  disabled={node.has_applied}
                  className={`w-full py-4 rounded-2xl text-[16px] font-bold transition-all shadow-lg ${
                    node.has_applied
                      ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                      : 'bg-brand text-white hover:bg-brand-600 hover:shadow-brand/20 active:scale-[0.98]'
                  }`}
                >
                  {node.has_applied ? 'Applied' : 'Apply Now'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
