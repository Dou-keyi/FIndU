// App — root component with React Router v6 route definitions and auth-aware routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/use-toast';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';
import GlobePage from './pages/GlobePage';
import FeedPage from './pages/FeedPage';
import PortfolioPage from './pages/PortfolioPage';
import MessagingPage from './pages/MessagingPage';
import TrackingPage from './pages/TrackingPage';
import OnboardingPage from './pages/OnboardingPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Root — redirect based on role + onboarding state */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Onboarding — requires auth but NOT completed onboarding */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireOnboarding={false}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected routes — require auth + completed onboarding */}
        <Route
          path="/globe"
          element={
            <ProtectedRoute>
              <GlobePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <PortfolioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messaging"
          element={
            <ProtectedRoute>
              <MessagingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking"
          element={
            <ProtectedRoute>
              <TrackingPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
