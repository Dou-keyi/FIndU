// OnboardingPage — multi-step onboarding flow, dispatches to role-specific wizard
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CandidateWizard from '../components/onboarding/CandidateWizard';
import EmployerWizard from '../components/onboarding/EmployerWizard';

export default function OnboardingPage() {
  const { user, profile, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Already completed onboarding
  if (profile?.onboarding_complete) {
    return <Navigate to="/globe" replace />;
  }

  // No profile yet (race condition — still loading)
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {profile.role === 'candidate' ? 'Set up your profile' : 'Register your company'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {profile.role === 'candidate'
            ? "Let's get you matched with the right opportunities"
            : "Let's get your company and first job listing set up"}
        </p>
      </div>

      {profile.role === 'candidate' ? <CandidateWizard /> : <EmployerWizard />}
    </div>
  );
}
