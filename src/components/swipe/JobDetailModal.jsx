import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Briefcase, Clock, Building2, Star, ChevronLeft, CheckCircle2, LayoutGrid, Sparkles, CircleDollarSign, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { getAvatarColor } from '../../lib/avatarUtils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../ui/use-toast';
import { useNavigate } from 'react-router-dom';

const SKILL_COLORS = [
  'bg-emerald-50 text-emerald-700 border border-emerald-100',
  'bg-blue-50 text-blue-700 border border-blue-100',
  'bg-purple-50 text-purple-700 border border-purple-100',
  'bg-rose-50 text-rose-700 border border-rose-100',
  'bg-amber-50 text-amber-700 border border-amber-100',
  'bg-cyan-50 text-cyan-700 border border-cyan-100'
];

export default function JobDetailModal({ node, isOpen, onClose, onApply, onSkip }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsSaved(false);
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
    if (isOpen) checkSaved();
  }, [node, user, isOpen]);

  const handleSave = async () => {
    if (!user || !node || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        const { error } = await supabase.from('saved_jobs').delete().eq('candidate_id', user.id).eq('job_id', node.id);
        if (error) throw error;
        setIsSaved(false);
        toast({ title: 'Job Removed', description: 'Job removed from your Tracked Jobs.' });
      } else {
        const { error } = await supabase.from('saved_jobs').insert({ candidate_id: user.id, job_id: node.id });
        if (error && error.code !== '23505') throw error;
        setIsSaved(true);
        toast({ title: 'Job Saved', description: 'You can find this in your Tracked Jobs.', variant: 'success' });
      }
    } catch (err) {
      console.error('Failed to toggle save job:', err);
      toast({ title: 'Error', description: 'Failed to update job status. Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!node) return null;

  const salaryStr =
    node.salary_min && node.salary_max
      ? `${node.currency || '$'}${node.salary_min.toLocaleString()} – ${node.salary_max.toLocaleString()}`
      : 'Competitive';

  const positionType = node.position_type || 'Full-time';
  const workType = node.work_type ? node.work_type.charAt(0).toUpperCase() + node.work_type.slice(1) : 'Remote';
  const expLevel = node.experience_level ? node.experience_level.charAt(0).toUpperCase() + node.experience_level.slice(1) : 'Any Level';
  const handleViewCompany = (e) => {
    e.stopPropagation();
    if (node.company_id) {
      navigate(`/company/${node.company_id}`);
      if (onClose) onClose();
    } else {
      toast({ title: 'Notice', description: 'Company profile not available.', variant: 'default' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Background */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-brand-50 via-white to-brand-50/50 opacity-80 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-100 rounded-full blur-[80px] opacity-40 pointer-events-none -translate-y-1/2 translate-x-1/4" />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 relative z-20 custom-scrollbar">
              
              {/* Nav Actions */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`w-11 h-11 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all hover:scale-105 ${
                    isSaved 
                      ? 'bg-yellow-50/80 border-yellow-200 text-yellow-500' 
                      : 'bg-white/80 border-gray-200 text-gray-400 hover:text-yellow-500'
                  }`}
                >
                  <Star className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Title & Core Details */}
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
                  {node.title || node.label}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 text-gray-700 font-medium bg-gray-100/50 px-3 py-1.5 rounded-xl border border-gray-200/60">
                    <Building2 className="w-4 h-4 text-brand-500" />
                    <span>{node.company_name || node.sublabel}</span>
                  </div>
                  
                  {node.company_id && (
                    <button 
                      onClick={handleViewCompany}
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-semibold rounded-xl transition-colors border border-brand-100"
                    >
                      View Company
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                  
                  <span className="text-gray-300 px-1">•</span>
                  
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium text-sm">{node.location || 'Remote'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <span className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold shadow-sm">
                    {positionType}
                  </span>
                  <span className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold shadow-sm">
                    {workType}
                  </span>
                  <span className="px-4 py-2 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl text-sm font-semibold shadow-sm">
                    {expLevel}
                  </span>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="space-y-6">
                
                {/* Salary Card */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 flex items-center justify-between text-white shadow-lg shadow-gray-900/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <CircleDollarSign className="w-6 h-6 text-brand-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-300 font-medium mb-0.5">Salary Range</p>
                      <p className="text-xl font-bold tracking-tight">{salaryStr}</p>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                {node.description && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand-500" />
                      About the role
                    </h3>
                    <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                      {node.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Responsibilities */}
                  {node.responsibilities && node.responsibilities.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-brand-500" />
                        Responsibilities
                      </h3>
                      <ul className="space-y-3.5">
                        {node.responsibilities.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="mt-2 min-w-[5px] w-[5px] h-[5px] rounded-full bg-brand-500" />
                            <span className="text-[14.5px] text-gray-700 leading-relaxed font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Benefits & Perks */}
                  {node.benefits && node.benefits.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-500" />
                        Benefits & Perks
                      </h3>
                      <ul className="space-y-3.5">
                        {node.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="text-[14.5px] text-gray-700 leading-relaxed font-medium">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Required Skills */}
                {node.skills_required && node.skills_required.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-brand-500" />
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {node.skills_required.map((skill, i) => (
                        <span
                          key={skill}
                          className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold tracking-wide ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Bottom Apply Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-white/0 z-30 flex items-end">
              <button
                onClick={() => {
                  if (onApply) onApply(node);
                  if (onClose) onClose();
                }}
                disabled={node.has_applied}
                className={`w-full py-4 rounded-2xl text-lg font-bold transition-all flex justify-center items-center gap-2 ${
                  node.has_applied
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-brand text-white hover:bg-brand-600 shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30 active:scale-[0.98]'
                }`}
              >
                {node.has_applied ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Applied Successfully
                  </>
                ) : (
                  <>
                    Apply Now
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
