// CandidateWizard — 3-step onboarding wizard for candidates (role/work type → skills → location)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, MapPin, Briefcase, Sparkles, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { toast } from '../ui/use-toast';
import StepIndicator from './StepIndicator';
import SkillSelector from './SkillSelector';

const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];
const STEP_LABELS = ['Role & Work', 'Skills', 'Location'];

export default function CandidateWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1 data
  const [headline, setHeadline] = useState('');
  const [workType, setWorkType] = useState([]);

  // Step 2 data
  const [skills, setSkills] = useState([]);

  // Step 3 data
  const [location, setLocation] = useState('');

  function validateStep() {
    const newErrors = {};

    if (step === 1) {
      if (!headline.trim()) newErrors.headline = 'Job title or target role is required';
      if (workType.length === 0) newErrors.workType = 'Select at least one work type';
    }

    if (step === 2) {
      if (skills.length < 2) newErrors.skills = 'Select at least 2 skills';
    }

    if (step === 3) {
      if (!location.trim()) newErrors.location = 'Location is required';
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

  function toggleWorkType(type) {
    setWorkType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleFinish() {
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      // UPSERT profile
      const workTypeValues = workType.map((w) => w.toLowerCase());
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          headline,
          work_type: workTypeValues,
          skills,
          location,
          onboarding_complete: true,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // INSERT portfolio item
      const { error: portfolioError } = await supabase
        .from('portfolio_items')
        .insert({
          candidate_id: user.id,
          item_type: 'headline',
          title: headline,
          tags: skills,
          source: 'onboarding',
        });

      if (portfolioError) {
        console.warn('Portfolio insert failed (table may not exist yet):', portfolioError.message);
      }

      // Update local profile state
      useAuthStore.getState().setProfile({
        ...useAuthStore.getState().profile,
        headline,
        work_type: workTypeValues,
        skills,
        location,
        onboarding_complete: true,
      });

      toast({ title: 'Profile complete! 🎉', description: 'Welcome to Career OS.', variant: 'success' });
      navigate('/globe', { replace: true });
    } catch (err) {
      console.error('Onboarding error:', err);
      toast({
        title: 'Something went wrong',
        description: err.message || 'Could not save your profile',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <StepIndicator currentStep={step} totalSteps={3} stepLabels={STEP_LABELS} />

      {/* Step 1 — Role & Work Type */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center mb-2">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                <Briefcase className="h-5 w-5 text-brand" />
              </div>
              <h2 className="text-lg font-semibold">What do you do?</h2>
              <p className="text-sm text-muted-foreground">Tell us about your role and preferences</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="candidate-headline">Current job title or target role</Label>
              <Input
                id="candidate-headline"
                placeholder="e.g. Frontend Engineer, Product Designer"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className={errors.headline ? 'border-red-500' : ''}
              />
              {errors.headline && <p className="text-xs text-red-500">{errors.headline}</p>}
            </div>

            <div className="space-y-2">
              <Label>Preferred work type</Label>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleWorkType(type)}
                    className={`skill-chip ${
                      workType.includes(type) ? 'skill-chip--selected' : 'skill-chip--unselected'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {errors.workType && <p className="text-xs text-red-500">{errors.workType}</p>}
            </div>

            <Button onClick={handleNext} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Skills */}
      {step === 2 && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center mb-2">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                <Sparkles className="h-5 w-5 text-brand" />
              </div>
              <h2 className="text-lg font-semibold">Your skills</h2>
              <p className="text-sm text-muted-foreground">Select skills to help us match you with jobs</p>
            </div>

            <SkillSelector
              selected={skills}
              onChange={setSkills}
              minRequired={2}
              error={errors.skills}
            />

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

      {/* Step 3 — Location & Summary */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center mb-2">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                <MapPin className="h-5 w-5 text-brand" />
              </div>
              <h2 className="text-lg font-semibold">Where are you based?</h2>
              <p className="text-sm text-muted-foreground">Help employers find talent in their region</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="candidate-location">City / Region</Label>
              <Input
                id="candidate-location"
                placeholder="e.g. Kuala Lumpur, Malaysia"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
            </div>

            {/* Summary card */}
            <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Profile summary
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Role:</span>{' '}
                  <span className="font-medium">{headline}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Work type:</span>{' '}
                  <span className="font-medium">{workType.join(', ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Skills:</span>{' '}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skills.map((s) => (
                      <span key={s} className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>{' '}
                  <span className="font-medium">{location || '—'}</span>
                </div>
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
