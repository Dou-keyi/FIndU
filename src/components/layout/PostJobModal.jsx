// PostJobModal.jsx — modal form for employers to create a new job listing
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Briefcase, MapPin, DollarSign, Globe2, Sparkles,
  Plus, Trash2, Loader2, CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const WORK_TYPES = [
  { key: 'remote', label: 'Remote', icon: '🌍' },
  { key: 'hybrid', label: 'Hybrid', icon: '🏠' },
  { key: 'onsite', label: 'On-site', icon: '🏢' },
];

const EXPERIENCE_LEVELS = [
  { key: 'intern', label: 'Intern' },
  { key: 'junior', label: 'Junior' },
  { key: 'mid', label: 'Mid-level' },
  { key: 'senior', label: 'Senior' },
  { key: 'lead', label: 'Lead' },
  { key: 'director', label: 'Director' },
];

export default function PostJobModal({ isOpen, onClose }) {
  const { user, profile } = useAuth();
  const titleRef = useRef(null);

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState('MYR');
  const [workType, setWorkType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  // Company
  const [company, setCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'ask_feed' | 'done'
  const [createdJobId, setCreatedJobId] = useState(null);

  // Load employer's company
  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchCompany = async () => {
      setLoadingCompany(true);
      try {
        const { data } = await supabase
          .from('companies')
          .select('id, name, logo_url')
          .eq('owner_id', user.id)
          .maybeSingle();
        setCompany(data);
      } catch (err) {
        console.error('Failed to load company:', err);
      } finally {
        setLoadingCompany(false);
      }
    };
    fetchCompany();
  }, [isOpen, user]);

  // Focus title on open
  useEffect(() => {
    if (isOpen && step === 'form') {
      setTimeout(() => titleRef.current?.focus(), 300);
    }
  }, [isOpen, step]);

  // Reset on close
  const resetForm = () => {
    setTitle('');
    setLocation('');
    setSalaryMin('');
    setSalaryMax('');
    setCurrency('MYR');
    setWorkType('');
    setExperienceLevel('');
    setDescription('');
    setSkills([]);
    setSkillInput('');
    setStep('form');
    setCreatedJobId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Add skill
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  // Submit job
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Job title is required');
      return;
    }
    if (!company) {
      toast.error('No company linked to your account');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          company_id: company.id,
          title: title.trim(),
          location: location.trim() || null,
          salary_min: salaryMin ? Number(salaryMin) : null,
          salary_max: salaryMax ? Number(salaryMax) : null,
          currency: currency || 'MYR',
          work_type: workType || null,
          experience_level: experienceLevel || null,
          skills_required: skills.length > 0 ? skills : null,
          description: description.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setCreatedJobId(data.id);
      setStep('ask_feed');
    } catch (err) {
      console.error('Failed to create job:', err);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Post to feed
  const handlePostToFeed = async () => {
    if (!createdJobId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        company_id: company.id,
        content: `We're hiring! Check out our new opening: ${title}`,
        type: 'job',
        intent: 'hiring',
        job_id: createdJobId,
      });
      if (error) throw error;
      toast.success('Job posted to feed!');
      setStep('done');
      setTimeout(() => handleClose(), 1500);
    } catch (err) {
      console.error('Failed to post to feed:', err);
      toast.error('Failed to share on feed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipFeed = () => {
    toast.success('Job posted to globe!');
    setStep('done');
    setTimeout(() => handleClose(), 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[65] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Briefcase className="w-4.5 h-4.5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Post a Job</h2>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {company ? `Posting as ${company.name}` : 'Loading company…'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <AnimatePresence mode="wait">
                  {step === 'form' && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      className="space-y-5"
                    >
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          Job Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          ref={titleRef}
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Senior Frontend Engineer"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Kuala Lumpur, MY"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                          />
                        </div>
                      </div>

                      {/* Work Type */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          Work Type
                        </label>
                        <div className="flex gap-2">
                          {WORK_TYPES.map((wt) => (
                            <button
                              key={wt.key}
                              type="button"
                              onClick={() => setWorkType(workType === wt.key ? '' : wt.key)}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                workType === wt.key
                                  ? 'bg-violet-50 border-violet-200 text-violet-700 ring-2 ring-violet-200'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <span>{wt.icon}</span>
                              <span>{wt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Experience Level */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          Experience Level
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {EXPERIENCE_LEVELS.map((el) => (
                            <button
                              key={el.key}
                              type="button"
                              onClick={() => setExperienceLevel(experienceLevel === el.key ? '' : el.key)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                experienceLevel === el.key
                                  ? 'bg-violet-50 border-violet-200 text-violet-700'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {el.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Salary Range */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          Salary Range (monthly)
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-gray-50"
                          >
                            <option value="MYR">MYR</option>
                            <option value="USD">USD</option>
                            <option value="SGD">SGD</option>
                          </select>
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="number"
                              value={salaryMin}
                              onChange={(e) => setSalaryMin(e.target.value)}
                              placeholder="Min"
                              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                            />
                          </div>
                          <span className="text-gray-300 text-sm font-bold">–</span>
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="number"
                              value={salaryMax}
                              onChange={(e) => setSalaryMax(e.target.value)}
                              placeholder="Max"
                              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          Skills Required
                        </label>
                        <div className="flex gap-2 mb-2">
                          <div className="relative flex-1">
                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="text"
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              onKeyDown={handleSkillKeyDown}
                              placeholder="e.g. React, TypeScript…"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={addSkill}
                            className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {skills.map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100"
                              >
                                {skill}
                                <button
                                  onClick={() => removeSkill(skill)}
                                  className="text-violet-400 hover:text-violet-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe the role, responsibilities, and what makes this opportunity great…"
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all resize-none"
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 'ask_feed' && (
                    <motion.div
                      key="ask_feed"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center text-center py-8"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Job Posted to Globe!</h3>
                      <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
                        Your job <span className="font-semibold text-gray-700">"{title}"</span> is now live on the globe for candidates to discover.
                      </p>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                        Also share on the Feed?
                      </p>
                      <p className="text-xs text-gray-400 mb-6 max-w-xs">
                        Sharing on the feed helps your job reach followers and increases visibility across the platform.
                      </p>
                      <div className="flex gap-3 w-full max-w-xs">
                        <button
                          onClick={handleSkipFeed}
                          disabled={submitting}
                          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Skip
                        </button>
                        <button
                          onClick={handlePostToFeed}
                          disabled={submitting}
                          className="flex-[2] py-3 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                          {submitting ? 'Posting…' : 'Post to Feed'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 'done' && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center text-center py-12"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5"
                      >
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </motion.div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">All Done!</h3>
                      <p className="text-sm text-gray-500">Your job listing is live.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer (form step only) */}
              {step === 'form' && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !title.trim() || !company}
                      className="flex-[2] py-3 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? 'Posting…' : 'Post Job to Globe'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
