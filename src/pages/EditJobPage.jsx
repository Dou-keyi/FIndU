import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, DollarSign, ListChecks, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getJobById, updateJob } from '../lib/jobPostingData';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import { toast } from '../components/ui/use-toast';
import SkillSelector from '../components/onboarding/SkillSelector';

const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];
const EXPERIENCE_LEVELS = ['Junior', 'Mid', 'Senior'];
const POSITION_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

const STEPS = [
  { id: 'basics', title: 'Role Basics', icon: Briefcase },
  { id: 'details', title: 'Location & Comp', icon: DollarSign },
  { id: 'requirements', title: 'Requirements', icon: ListChecks },
  { id: 'review', title: 'Review', icon: CheckCircle }
];

export default function EditJobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Form State
  const [jobTitle, setJobTitle] = useState('');
  const [workType, setWorkType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [positionType, setPositionType] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [benefits, setBenefits] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);

  useEffect(() => {
    async function loadJob() {
      try {
        const job = await getJobById(jobId);
        if (!job) throw new Error("Job not found");

        setJobTitle(job.title || '');
        // Match casing from DB to Dropdown options
        setWorkType(WORK_TYPES.find(wt => wt.toLowerCase() === job.work_type) || '');
        setExperienceLevel(EXPERIENCE_LEVELS.find(el => el.toLowerCase() === job.experience_level) || '');
        setPositionType(job.position_type || '');
        setLocation(job.location || '');
        setSalaryMin(job.salary_min || '');
        setSalaryMax(job.salary_max || '');
        setDescription(job.description || '');
        setResponsibilities(job.responsibilities ? job.responsibilities.join('\n') : '');
        setBenefits(job.benefits ? job.benefits.join('\n') : '');
        setRequiredSkills(job.skills_required || []);
        
      } catch (err) {
        console.error("Failed to load job:", err);
        toast({ title: 'Error', description: 'Could not load job details.', variant: 'destructive' });
        navigate(-1);
      } finally {
        setLoading(false);
      }
    }
    
    if (jobId) {
      loadJob();
    }
  }, [jobId, navigate]);

  function validateStep(currentStep) {
    const newErrors = {};
    if (currentStep === 0) {
      if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
      if (!workType) newErrors.workType = 'Work type is required';
      if (!experienceLevel) newErrors.experienceLevel = 'Experience level is required';
      if (!positionType) newErrors.positionType = 'Position type is required';
    } else if (currentStep === 1) {
      if (workType !== 'Remote' && !location.trim()) newErrors.location = 'Location is required';
    } else if (currentStep === 2) {
      if (!description.trim()) newErrors.description = 'Job description is required';
      if (!responsibilities.trim()) newErrors.responsibilities = 'Responsibilities are required';
      if (!benefits.trim()) newErrors.benefits = 'Benefits are required';
      if (requiredSkills.length === 0) newErrors.requiredSkills = 'Select at least 1 required skill';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    }
  }

  function prevStep() {
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleUpdateJob() {
    if (!validateStep(3)) return;
    setSubmitting(true);
    
    try {
      const jobData = {
        title: jobTitle,
        description: description,
        responsibilities: responsibilities.split('\n').map(s => s.trim()).filter(Boolean),
        benefits: benefits.split('\n').map(s => s.trim()).filter(Boolean),
        skills_required: requiredSkills,
        location: workType === 'Remote' ? 'Remote' : location,
        work_type: workType.toLowerCase(),
        experience_level: experienceLevel.toLowerCase(),
        position_type: positionType,
        salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
        salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
      };

      await updateJob(jobId, jobData);
      
      toast({
        title: 'Job Updated Successfully! 🎉',
        description: 'Your job details have been saved.',
        variant: 'success'
      });
      
      navigate(-1); // Go back to where they came from (Company page)
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error updating job',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-slate-50 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 relative overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 pt-12 md:pt-6 pb-4 flex-shrink-0 z-10 sticky top-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit Job</h1>
          <p className="text-sm text-gray-500 mt-1">Update details for this opportunity</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
        <div className="mb-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-0 h-0.5 bg-brand transition-all duration-500 ease-in-out z-0" 
               style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          
          <div className="relative z-10 flex justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isPast = i < step;
              
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                    isActive ? 'border-brand bg-white text-brand shadow-sm scale-110' :
                    isPast ? 'border-brand bg-brand text-white' :
                    'border-gray-200 bg-white text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`mt-2 text-xs font-medium transition-colors ${
                    isActive ? 'text-brand' : isPast ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Step 0: Basics */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">Role Basics</h2>
                      <p className="text-sm text-gray-500">Let's start with the fundamental details.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input 
                        id="jobTitle" 
                        placeholder="e.g. Senior Frontend Engineer" 
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className={errors.jobTitle ? 'border-red-500' : ''}
                      />
                      {errors.jobTitle && <p className="text-xs text-red-500">{errors.jobTitle}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Work Type</Label>
                        <Select 
                          value={workType} 
                          onChange={(e) => setWorkType(e.target.value)}
                          className={errors.workType ? 'border-red-500' : ''}
                        >
                          <option value="">Select...</option>
                          {WORK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </Select>
                        {errors.workType && <p className="text-xs text-red-500">{errors.workType}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Experience Level</Label>
                        <Select 
                          value={experienceLevel} 
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className={errors.experienceLevel ? 'border-red-500' : ''}
                        >
                          <option value="">Select...</option>
                          {EXPERIENCE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                        </Select>
                        {errors.experienceLevel && <p className="text-xs text-red-500">{errors.experienceLevel}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Position Type</Label>
                      <Select 
                        value={positionType} 
                        onChange={(e) => setPositionType(e.target.value)}
                        className={errors.positionType ? 'border-red-500' : ''}
                      >
                        <option value="">Select...</option>
                        {POSITION_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                      </Select>
                      {errors.positionType && <p className="text-xs text-red-500">{errors.positionType}</p>}
                    </div>
                  </div>
                )}

                {/* Step 1: Details */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">Location & Compensation</h2>
                      <p className="text-sm text-gray-500">Where is the role based and what's the budget?</p>
                    </div>

                    {workType !== 'Remote' && (
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          placeholder="e.g. Kuala Lumpur, Malaysia" 
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className={errors.location ? 'border-red-500' : ''}
                        />
                        {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Salary Range (MYR / Month) <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input 
                            type="number" 
                            placeholder="Min" 
                            className="pl-9"
                            value={salaryMin}
                            onChange={(e) => setSalaryMin(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input 
                            type="number" 
                            placeholder="Max" 
                            className="pl-9"
                            value={salaryMax}
                            onChange={(e) => setSalaryMax(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Requirements */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">Requirements</h2>
                      <p className="text-sm text-gray-500">What makes a great candidate for this role?</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Job Description</Label>
                      <Textarea 
                        placeholder="Overview of the role..." 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
                      />
                      {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Responsibilities (one per line)</Label>
                      <Textarea 
                        placeholder="- Build amazing features&#10;- Mentor junior devs" 
                        value={responsibilities}
                        onChange={(e) => setResponsibilities(e.target.value)}
                        className={`min-h-[100px] ${errors.responsibilities ? 'border-red-500' : ''}`}
                      />
                      {errors.responsibilities && <p className="text-xs text-red-500">{errors.responsibilities}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Benefits & Perks (one per line)</Label>
                      <Textarea 
                        placeholder="- Health Insurance&#10;- Remote Work" 
                        value={benefits}
                        onChange={(e) => setBenefits(e.target.value)}
                        className={`min-h-[80px] ${errors.benefits ? 'border-red-500' : ''}`}
                      />
                      {errors.benefits && <p className="text-xs text-red-500">{errors.benefits}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Required Skills</Label>
                      <SkillSelector
                        selected={requiredSkills}
                        onChange={setRequiredSkills}
                        minRequired={1}
                        error={errors.requiredSkills}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & Save</h2>
                      <p className="text-sm text-gray-500">Review the updated details before saving.</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{jobTitle}</h3>
                        <p className="text-sm text-gray-500">{workType} • {positionType} • {experienceLevel}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-3 text-sm">
                        <div>
                          <span className="text-gray-500 block text-xs uppercase tracking-wider mb-0.5">Location</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{workType === 'Remote' ? 'Remote' : location}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs uppercase tracking-wider mb-0.5">Salary</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {salaryMin || salaryMax ? `MYR ${salaryMin || '0'} - ${salaryMax || '+'}` : 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <span className="text-gray-900 font-bold block mb-2">Job Description</span>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <span className="text-gray-900 font-bold block mb-2">Responsibilities</span>
                        <ul className="list-disc pl-5 space-y-1">
                          {responsibilities.split('\n').filter(Boolean).map((req, i) => (
                            <li key={i} className="text-sm text-gray-700">{req.replace(/^-/, '').trim()}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <span className="text-gray-900 font-bold block mb-2">Benefits & Perks</span>
                        <ul className="list-disc pl-5 space-y-1">
                          {benefits.split('\n').filter(Boolean).map((ben, i) => (
                            <li key={i} className="text-sm text-gray-700">{ben.replace(/^-/, '').trim()}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <span className="text-gray-900 font-bold block mb-2">Required Skills</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {requiredSkills.map(s => (
                            <span key={s} className="px-2.5 py-1 bg-brand/10 text-brand rounded-lg text-xs font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="outline" onClick={prevStep} disabled={submitting}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            {step < STEPS.length - 1 ? (
              <Button onClick={nextStep} className="bg-brand text-white hover:bg-brand/90">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleUpdateJob} disabled={submitting} className="bg-brand text-white hover:bg-brand/90 min-w-[120px]">
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Save Changes
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
