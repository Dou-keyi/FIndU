// EmployerWizard — 3-step onboarding wizard for employers (company details → first job → verification)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Building2, FileText, ShieldCheck, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from '../ui/use-toast';
import StepIndicator from './StepIndicator';
import SkillSelector from './SkillSelector';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Logistics', 'Consulting', 'Education', 'Other'];
const HEADCOUNT_RANGES = ['1–10', '11–50', '51–200', '201–1000', '1000+'];
const EXPERIENCE_LEVELS = ['Junior', 'Mid', 'Senior'];
const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];
const STEP_LABELS = ['Company', 'First Job', 'Verify'];

export default function EmployerWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1 — Company
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [ssmNumber, setSsmNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [headcountRange, setHeadcountRange] = useState('');

  // Step 2 — First Job
  const [jobTitle, setJobTitle] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [workType, setWorkType] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  function validateStep() {
    const newErrors = {};

    if (step === 1) {
      if (!companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!domain.trim()) newErrors.domain = 'Company domain is required';
      if (!industry) newErrors.industry = 'Please select an industry';
      if (!headcountRange) newErrors.headcountRange = 'Please select headcount range';
    }

    if (step === 2) {
      if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
      if (requiredSkills.length < 1) newErrors.requiredSkills = 'Select at least 1 required skill';
      if (!experienceLevel) newErrors.experienceLevel = 'Experience level is required';
      if (!workType) newErrors.workType = 'Work type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep()) return;
    setStep((s) => s + 1);
    setErrors({});
  }

  function handleBack() {
    setStep((s) => s - 1);
    setErrors({});
  }

  async function handleFinish() {
    setSubmitting(true);
    try {
      // 1. INSERT company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          owner_id: user.id,
          name: companyName,
          domain,
          ssm_number: ssmNumber || null,
          industry,
          headcount_range: headcountRange,
          verified: false,
        })
        .select('id')
        .single();

      if (companyError) throw companyError;

      // 2. INSERT first job
      const { error: jobError } = await supabase
        .from('jobs')
        .insert({
          company_id: companyData.id,
          posted_by: user.id,
          title: jobTitle,
          skills_required: requiredSkills,
          experience_level: experienceLevel.toLowerCase(),
          work_type: workType.toLowerCase(),
          salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
          salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
          currency: 'MYR',
          status: 'open',
        });

      if (jobError) throw jobError;

      // 3. UPSERT profile → onboarding_complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local state
      useAuthStore.getState().setProfile({
        ...useAuthStore.getState().profile,
        onboarding_complete: true,
      });

      toast({ title: 'Company registered! 🎉', description: 'Your first job listing is live.', variant: 'success' });
      navigate('/globe', { replace: true });
    } catch (err) {
      console.error('Employer onboarding error:', err);
      toast({
        title: 'Something went wrong',
        description: err.message || 'Could not save company data',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <StepIndicator currentStep={step} totalSteps={3} stepLabels={STEP_LABELS} />

      {/* Step 1 — Company Details */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="text-center mb-2">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                <Building2 className="h-5 w-5 text-brand" />
              </div>
              <h2 className="text-lg font-semibold">Company details</h2>
              <p className="text-sm text-muted-foreground">Tell us about your organisation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-name">Company name</Label>
              <Input
                id="company-name"
                placeholder="e.g. Grab Malaysia"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && <p className="text-xs text-red-500">{errors.companyName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-domain">Company email domain</Label>
              <Input
                id="company-domain"
                placeholder="e.g. grab.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={errors.domain ? 'border-red-500' : ''}
              />
              {errors.domain && <p className="text-xs text-red-500">{errors.domain}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="ssm-number">SSM registration number</Label>
                <span className="text-xs text-muted-foreground">(optional)</span>
                <div className="group relative">
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 text-xs bg-gray-900 text-white rounded-md shadow-lg z-10">
                    Malaysia-specific — helps verify your company
                  </div>
                </div>
              </div>
              <Input
                id="ssm-number"
                placeholder="e.g. 201501025187"
                value={ssmNumber}
                onChange={(e) => setSsmNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={errors.industry ? 'border-red-500' : ''}
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </Select>
              {errors.industry && <p className="text-xs text-red-500">{errors.industry}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headcount">Headcount range</Label>
              <Select
                id="headcount"
                value={headcountRange}
                onChange={(e) => setHeadcountRange(e.target.value)}
                className={errors.headcountRange ? 'border-red-500' : ''}
              >
                <option value="">Select range…</option>
                {HEADCOUNT_RANGES.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </Select>
              {errors.headcountRange && <p className="text-xs text-red-500">{errors.headcountRange}</p>}
            </div>

            <Button onClick={handleNext} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — First Job Listing */}
      {step === 2 && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="text-center mb-2">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                <FileText className="h-5 w-5 text-brand" />
              </div>
              <h2 className="text-lg font-semibold">Your first job listing</h2>
              <p className="text-sm text-muted-foreground">Describe the role you're hiring for</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-title">Job title</Label>
              <Input
                id="job-title"
                placeholder="e.g. Senior Frontend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={errors.jobTitle ? 'border-red-500' : ''}
              />
              {errors.jobTitle && <p className="text-xs text-red-500">{errors.jobTitle}</p>}
            </div>

            <div className="space-y-2">
              <Label>Required skills</Label>
              <SkillSelector
                selected={requiredSkills}
                onChange={setRequiredSkills}
                minRequired={1}
                error={errors.requiredSkills}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience-level">Experience level</Label>
                <Select
                  id="experience-level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className={errors.experienceLevel ? 'border-red-500' : ''}
                >
                  <option value="">Select…</option>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </Select>
                {errors.experienceLevel && <p className="text-xs text-red-500">{errors.experienceLevel}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-work-type">Work type</Label>
                <Select
                  id="job-work-type"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className={errors.workType ? 'border-red-500' : ''}
                >
                  <option value="">Select…</option>
                  {WORK_TYPES.map((wt) => (
                    <option key={wt} value={wt}>{wt}</option>
                  ))}
                </Select>
                {errors.workType && <p className="text-xs text-red-500">{errors.workType}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Salary range (MYR / month)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Min"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  min="0"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Verification & Summary */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center mb-2">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                <ShieldCheck className="h-5 w-5 text-brand" />
              </div>
              <h2 className="text-lg font-semibold">Review & verify</h2>
              <p className="text-sm text-muted-foreground">Confirm your details before going live</p>
            </div>

            {/* Domain ownership note */}
            <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Domain: {domain}</p>
              <p className="text-xs text-blue-600">
                The first person to register with this domain becomes the account owner.
                You can invite HR team members later.
              </p>
            </div>

            {/* SSM badge */}
            {ssmNumber ? (
              <Badge variant="success" className="text-sm py-1 px-3">
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                SSM number recorded — verification pending
              </Badge>
            ) : (
              <Badge variant="muted" className="text-sm py-1 px-3">
                Skip — verify later
              </Badge>
            )}

            {/* Summary */}
            <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Company:</span>{' '}
                  <span className="font-medium">{companyName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry:</span>{' '}
                  <span className="font-medium">{industry}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Headcount:</span>{' '}
                  <span className="font-medium">{headcountRange}</span>
                </div>
                {ssmNumber && (
                  <div>
                    <span className="text-muted-foreground">SSM:</span>{' '}
                    <span className="font-medium">{ssmNumber}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div>
                  <span className="text-muted-foreground">Job listing:</span>{' '}
                  <span className="font-medium">{jobTitle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Required skills:</span>{' '}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {requiredSkills.map((s) => (
                      <span key={s} className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Level:</span>{' '}
                  <span className="font-medium">{experienceLevel}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <span className="font-medium">{workType}</span>
                </div>
                {(salaryMin || salaryMax) && (
                  <div>
                    <span className="text-muted-foreground">Salary:</span>{' '}
                    <span className="font-medium">
                      MYR {salaryMin || '—'} – {salaryMax || '—'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleFinish} disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
