// App — root component with React Router v6 route definitions and auth-aware routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/use-toast';
import { PortfolioSuggestionProvider } from './context/PortfolioSuggestionContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';
import AppLayout from './components/layout/AppLayout';
import GlobePage from './pages/GlobePage';
import FeedPage from './pages/FeedPage';
import PortfolioPage from './pages/PortfolioPage';
import CompanyPage from './pages/CompanyPage';
import MessagingPage from './pages/MessagingPage';
import TrackingPage from './pages/TrackingPage';
import OnboardingPage from './pages/OnboardingPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <PortfolioSuggestionProvider>
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
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/globe" element={<GlobePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/portfolio/:candidateId" element={<PortfolioPage />} />
            <Route path="/company/:companyId" element={<CompanyPage />} />
            <Route path="/messaging" element={<MessagingPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
          </Route>
        </Routes>
        <Toaster />
      </PortfolioSuggestionProvider>
    </BrowserRouter>
  );
}
