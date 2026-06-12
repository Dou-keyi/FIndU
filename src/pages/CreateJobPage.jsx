// CreateJobPage.jsx — Beautiful 2-column layout for creating jobs
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Briefcase, MapPin, DollarSign, Sparkles, Plus, X, Loader2, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const WORK_TYPES = [
  { key: 'remote', label: 'Remote', icon: '🌍' },
  { key: 'hybrid', label: 'Hybrid', icon: '🏠' },
  { key: 'onsite', label: 'On-site', icon: '🏢' },
];

const EXPERIENCE_LEVELS = [
  { key: 'intern', label: 'Intern' },
  { key: 'junior', label: 'Junior' },
  { key: 'mid', label: 'Mid' },
  { key: 'senior', label: 'Senior' },
  { key: 'lead', label: 'Lead' },
  { key: 'director', label: 'Director' },
];

export default function CreateJobPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role || 'candidate';
  const isEmployer = role === 'employer';

  const [company, setCompany] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // 'form', 'ask_feed', 'done'
  const [createdJobId, setCreatedJobId] = useState(null);

  // Job Specific State
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [currency, setCurrency] = useState('MYR');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (!isEmployer) {
      toast.error("Only employers can post jobs.");
      navigate('/globe');
      return;
    }
    
    if (user) {
      const fetchCompany = async () => {
        const { data } = await supabase
          .from('companies')
          .select('id, name, logo_url')
          .eq('owner_id', user.id)
          .maybeSingle();
        setCompany(data);
      };
      fetchCompany();
    }
  }, [isEmployer, user, navigate]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };
  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleCreateJob = async () => {
    if (!title.trim() || !company) return toast.error('Job Title and Company are required.');
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('jobs').insert({
        company_id: company.id,
        title: title.trim(),
        location: location.trim() || null,
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
        currency,
        work_type: workType || null,
        experience_level: experienceLevel || null,
        skills_required: skills.length > 0 ? skills : null,
        description: description.trim() || null,
      }).select().single();
      if (error) throw error;
      setCreatedJobId(data.id);
      setStep('ask_feed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create job.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareJobToFeed = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        company_id: company?.id,
        content: `We're hiring! Check out our new opening: ${title}`,
        type: 'job',
        intent: 'hiring',
        job_id: createdJobId,
      });
      if (error) throw error;
      toast.success('Shared to feed!');
      setStep('done');
      setTimeout(() => navigate('/feed'), 1500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to share.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipFeed = () => {
    toast.success('Job is live on the Globe!');
    setStep('done');
    setTimeout(() => navigate('/globe'), 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-8 pb-16 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Post Job to Globe</h1>
          <p className="text-sm text-gray-500 font-medium">Add your job to the discoverable Globe</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full flex-1">
        {step === 'form' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              
              {/* LEFT COLUMN: Title & Description */}
              <div className="lg:col-span-3 p-8 lg:p-10 flex flex-col bg-gray-50/30">
                <div className="mb-6">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Job Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full text-3xl font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0 placeholder-gray-300"
                    autoFocus
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the role, responsibilities, and why candidates should join your team..."
                    className="w-full flex-1 min-h-[300px] resize-none text-base text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent leading-relaxed"
                  />
                </div>

                <div className="mt-8">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Required Skills</label>
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        placeholder="e.g. React, UI/UX..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-3 rounded-xl bg-violet-50 text-violet-600 font-bold hover:bg-violet-100 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span key={skill} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-900 text-white flex items-center gap-1.5">
                          {skill}
                          <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="text-gray-400 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Metadata */}
              <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-between bg-white">
                <div className="space-y-8">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand transition-colors bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Work Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {WORK_TYPES.map((wt) => (
                        <button
                          key={wt.key}
                          type="button"
                          onClick={() => setWorkType(wt.key)}
                          className={`py-3 rounded-xl font-bold text-xs border-2 transition-all flex flex-col items-center gap-1 ${
                            workType === wt.key ? 'border-brand bg-brand/5 text-brand' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-lg">{wt.icon}</span>
                          {wt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Experience Level</label>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCE_LEVELS.map((el) => (
                        <button
                          key={el.key}
                          type="button"
                          onClick={() => setExperienceLevel(el.key)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                            experienceLevel === el.key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {el.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Monthly Salary Range</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="px-3 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 bg-gray-50 focus:outline-none"
                      >
                        <option value="MYR">MYR</option>
                        <option value="USD">USD</option>
                        <option value="SGD">SGD</option>
                      </select>
                      <input
                        type="number"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        placeholder="Min"
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand transition-colors bg-gray-50"
                      />
                      <span className="text-gray-300 font-bold">-</span>
                      <input
                        type="number"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        placeholder="Max"
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand transition-colors bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-100">
                  <button
                    onClick={handleCreateJob}
                    disabled={submitting || !title.trim()}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-gray-900/20"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Job to Globe'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Ask Feed Step */}
        {step === 'ask_feed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-emerald-100 shadow-xl p-10 flex flex-col items-center text-center max-w-2xl mx-auto mt-10"
          >
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-2">Job Posted to Globe!</h3>
            <p className="text-lg text-gray-500 mb-10 max-w-md font-medium">
              Candidates can now discover <span className="font-bold text-gray-800">"{title}"</span> by swiping.
            </p>
            <div className="w-full bg-gray-50/50 rounded-2xl p-6 border border-gray-100 mb-8">
              <p className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2">
                Also share to Feed?
              </p>
              <p className="text-sm text-gray-500 mb-6 font-medium">
                This creates an interactive feed post with "Apply" and "Details" buttons so followers can apply directly.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleSkipFeed}
                  disabled={submitting}
                  className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-white hover:border-gray-300 transition-colors bg-transparent"
                >
                  Skip
                </button>
                <button
                  onClick={handleShareJobToFeed}
                  disabled={submitting}
                  className="flex-[2] py-3.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Sharing...' : 'Share to Feed'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Done Step */}
        {step === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 rounded-full bg-brand/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-brand" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-2">All Done!</h3>
            <p className="text-gray-500 font-medium">Redirecting you...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
