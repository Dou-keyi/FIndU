// RoleRedirect — redirects authenticated users to the correct page based on profile state
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RoleRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Onboarding not yet complete → send to wizard
  if (!profile || !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  // Onboarding complete → go to globe (both roles land here)
  return <Navigate to="/globe" replace />;
}
