// AuthPage — login and registration page with role selection and demo accounts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Loader2, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from '../components/ui/use-toast';
import { UniverseBackground } from '../components/UniverseBackground';
import { useAuthStore } from '../store/authStore';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState('login'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(''); // 'candidate' | 'employer'
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [forgotMode, setForgotMode] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const setJustLoggedIn = useAuthStore((s) => s.setJustLoggedIn);

  // If already authenticated, redirect
  useEffect(() => {
    if (user && profile?.onboarding_complete) {
      navigate('/globe', { replace: true });
    } else if (user && profile && !profile.onboarding_complete) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, navigate]);

  function validate() {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!forgotMode) {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (mode === 'signup') {
        if (!fullName.trim()) {
          newErrors.fullName = 'Full name is required';
        }
        if (!phone.trim()) {
          newErrors.phone = 'Phone number is required';
        }

        if (!confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!role) {
          newErrors.role = 'Please select a role';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      if (forgotMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast({ title: 'Check your email', description: 'Password reset link sent to ' + email, variant: 'success' });
        setForgotMode(false);
        return;
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Insert profile row
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          role,
          full_name: fullName.trim(),
          phone: phone.trim(),
          onboarding_complete: false,
        });
        if (profileError) throw profileError;

        toast({ title: 'Account created!', description: 'Let\'s set up your profile.', variant: 'success' });
        setJustLoggedIn(true);
        setTransitioning(true);
        // Wait for orbs to fade out before navigating
        await new Promise((r) => setTimeout(r, 1500));
        navigate('/onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        toast({ title: 'Welcome back!', variant: 'success' });
        setJustLoggedIn(true);
        setTransitioning(true);
        await new Promise((r) => setTimeout(r, 1500));
        navigate('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast({
        title: 'Authentication error',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(demoEmail, demoPassword) {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
      if (error) throw error;
      toast({ title: 'Logged in as demo user', variant: 'success' });
      setJustLoggedIn(true);
      setTransitioning(true);
      await new Promise((r) => setTimeout(r, 1500));
      navigate('/');
    } catch (err) {
      console.error('Demo login error:', err);
      toast({
        title: 'Demo login failed',
        description: err.message || 'Could not log in with demo account',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrors({});
    setForgotMode(false);
  };

  return (
    <div className="relative h-[100dvh] flex w-full bg-[#020617] overflow-hidden font-sans text-slate-50 selection:bg-blue-500/30">
      {/* Global Background */}
      <div className="absolute inset-0 z-0">
        <UniverseBackground fadeOut={transitioning} />
      </div>

      {/* Foreground Content Container */}
      <motion.div
        className="relative z-10 flex w-full h-full h-[100dvh]"
        animate={transitioning ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      >
        
        {/* Left Panel - Visuals & Messaging */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-24 overflow-hidden relative">
          
          {/* Brand/Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <span className="text-3xl font-bold text-white tracking-tighter">C</span>
            </div>
          </motion.div>

          {/* Hero Copy */}
          <div className="relative z-20 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-200 text-sm font-medium mb-6 backdrop-blur-xl shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Discover your potential</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9, ease: "easeOut" }}
              className="text-5xl xl:text-6xl font-extrabold tracking-tight max-w-2xl leading-[1.15] mb-6 drop-shadow-2xl"
            >
              <span className="text-white">No matter where you are from, you can always find a </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400">
                career and network
              </span>
              <span className="text-white"> anywhere.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.9, ease: "easeOut" }}
              className="text-xl text-blue-50/80 max-w-xl font-light leading-relaxed drop-shadow-lg"
            >
              Join Career OS, the universe of boundless opportunities. Build your portfolio, explore global roles, and connect beyond borders.
            </motion.p>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="flex-1 flex flex-col p-6 sm:p-12 relative z-10 lg:pl-0 overflow-y-auto hide-scrollbar">
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.2, delay: 0.2 }}
            className="w-full max-w-[520px] relative mx-auto my-auto py-8 sm:py-12"
          >
            {/* The Glassmorphism Card */}
            <Card className="w-full bg-[#020617]/10 backdrop-blur-lg border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] overflow-hidden relative">
              {/* Subtle top glow line */}
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-400/80 via-cyan-300/80 to-blue-400/80 transform origin-left" 
              />
              
              <CardHeader className="text-center pt-10 pb-6 relative z-10 overflow-hidden border-b border-white/5">
                 <div className="mx-auto mb-6 flex h-14 w-14 lg:hidden items-center justify-center rounded-xl bg-blue-500/20 backdrop-blur-xl border border-white/10 shadow-lg">
                    <span className="text-2xl font-bold text-white">C</span>
                 </div>
                 <CardTitle className="text-2xl font-semibold tracking-tight text-white h-8 flex items-center justify-center drop-shadow-md">
                   <AnimatePresence mode="wait">
                     <motion.span
                       key={forgotMode ? 'reset' : mode}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       transition={{ duration: 0.2 }}
                     >
                       {forgotMode ? 'Reset password' : mode === 'signup' ? 'Create your account' : 'Welcome back'}
                     </motion.span>
                   </AnimatePresence>
                 </CardTitle>
                 <CardDescription className="text-slate-300 mt-2 h-5 flex items-center justify-center font-light">
                   <AnimatePresence mode="wait">
                     <motion.span
                       key={forgotMode ? 'reset-desc' : mode + '-desc'}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       transition={{ duration: 0.2 }}
                     >
                       {forgotMode 
                          ? "Enter your email and we'll send a reset link" 
                          : mode === 'signup'
                            ? 'Join Career OS and find your next opportunity'
                            : 'Log in to your Career OS account'}
                     </motion.span>
                   </AnimatePresence>
                 </CardDescription>
              </CardHeader>

              <CardContent className="relative z-10 pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Personal Info Grid (signup only) */}
                  <AnimatePresence>
                    {!forgotMode && mode === 'signup' && (
                      <motion.div
                        key="personal-info-fields"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        {/* Full Name */}
                        <div className="space-y-2">
                          <Label htmlFor="auth-fullname" className="text-slate-200 drop-shadow-sm font-medium">Full Name</Label>
                          <Input
                            id="auth-fullname"
                            type="text"
                            autoComplete="name"
                            placeholder="Your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={submitting}
                            className={`bg-[#020617]/50 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all ${errors.fullName ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                          />
                          <AnimatePresence>
                            {errors.fullName && (
                              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-300 pt-1 overflow-hidden font-medium drop-shadow-sm">
                                {errors.fullName}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Phone */}
                        <div className="space-y-2">
                          <Label htmlFor="auth-phone" className="text-slate-200 drop-shadow-sm font-medium">Phone Number</Label>
                          <Input
                            id="auth-phone"
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            placeholder="Your phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={submitting}
                            className={`bg-[#020617]/50 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all ${errors.phone ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                          />
                          <AnimatePresence>
                            {errors.phone && (
                              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-300 pt-1 overflow-hidden font-medium drop-shadow-sm">
                                {errors.phone}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="auth-email" className="text-slate-200 drop-shadow-sm font-medium">Email</Label>
                    <Input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                      className={`bg-[#020617]/50 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                    />
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-300 pt-1 overflow-hidden font-medium drop-shadow-sm">
                          {errors.email}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Password section */}
                  <AnimatePresence>
                    {!forgotMode && (
                      <motion.div
                        key="password-section"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className={`grid grid-cols-1 ${mode === 'signup' ? 'sm:grid-cols-2 gap-4' : 'gap-4'}`}
                      >
                        {/* Password */}
                        <div className="space-y-2">
                          <Label htmlFor="auth-password" className="text-slate-200 drop-shadow-sm font-medium">Password</Label>
                          <div className="relative">
                            <Input
                              id="auth-password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                              placeholder={mode === 'signup' ? 'Min 8 characters' : 'Enter password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              disabled={submitting}
                              className={`bg-[#020617]/50 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all pr-10 ${errors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                            />
                            <button
                              type="button"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <AnimatePresence>
                            {errors.password && (
                              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-300 pt-1 overflow-hidden font-medium drop-shadow-sm">
                                {errors.password}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Confirm Password (signup only) */}
                        {mode === 'signup' && (
                          <div className="space-y-2">
                            <Label htmlFor="auth-confirm-password" className="text-slate-200 drop-shadow-sm font-medium">Confirm password</Label>
                            <Input
                              id="auth-confirm-password"
                              type="password"
                              autoComplete="new-password"
                              placeholder="Re-enter password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              disabled={submitting}
                              className={`bg-[#020617]/50 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all ${errors.confirmPassword ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                            />
                            <AnimatePresence>
                              {errors.confirmPassword && (
                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-300 pt-1 overflow-hidden font-medium drop-shadow-sm">
                                  {errors.confirmPassword}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Role Selector (signup only) */}
                  <AnimatePresence>
                    {!forgotMode && mode === 'signup' && (
                      <motion.div
                        key="role-field"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3"
                      >
                        <div className="pt-2">
                          <Label className="text-slate-200 block mb-3 drop-shadow-sm font-medium">I am…</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setRole('candidate')}
                              className={`flex flex-col items-center gap-3 rounded-xl border p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                                role === 'candidate'
                                  ? 'border-cyan-400 bg-cyan-400/20 shadow-[inset_0_0_20px_rgba(34,211,238,0.2)]'
                                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                              }`}
                            >
                              <div className={`rounded-full p-2.5 transition-colors ${
                                role === 'candidate' ? 'bg-cyan-400 text-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'bg-slate-800/80 text-slate-300 border border-white/5'
                              }`}>
                                <User className="h-5 w-5" />
                              </div>
                              <span className={`text-sm font-medium ${
                                role === 'candidate' ? 'text-white drop-shadow-sm' : 'text-slate-300'
                              }`}>
                                Looking for work
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRole('employer')}
                              className={`flex flex-col items-center gap-3 rounded-xl border p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                                role === 'employer'
                                  ? 'border-cyan-400 bg-cyan-400/20 shadow-[inset_0_0_20px_rgba(34,211,238,0.2)]'
                                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                              }`}
                            >
                              <div className={`rounded-full p-2.5 transition-colors ${
                                role === 'employer' ? 'bg-cyan-400 text-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'bg-slate-800/80 text-slate-300 border border-white/5'
                              }`}>
                                <Briefcase className="h-5 w-5" />
                              </div>
                              <span className={`text-sm font-medium ${
                                role === 'employer' ? 'text-white drop-shadow-sm' : 'text-slate-300'
                              }`}>
                                I'm hiring
                              </span>
                            </button>
                          </div>
                          <AnimatePresence>
                            {errors.role && (
                              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-300 pt-1 overflow-hidden font-medium drop-shadow-sm">
                                {errors.role}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white border border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all h-12 flex items-center justify-center overflow-hidden relative font-semibold text-base" 
                      disabled={submitting}
                      aria-live="polite"
                    >
                      <AnimatePresence mode="wait">
                        {submitting ? (
                          <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="flex items-center absolute">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Please wait
                          </motion.div>
                        ) : (
                          <motion.div key={forgotMode ? 'reset' : mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="flex items-center absolute">
                            {forgotMode ? 'Send reset link' : mode === 'signup' ? 'Create account' : 'Log in'}
                            {!forgotMode && <ArrowRight className="ml-2 h-4 w-4" />}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </div>

                  {/* Forgot password (login only) */}
                  <AnimatePresence>
                    {!forgotMode && mode === 'login' && (
                      <motion.div 
                        key="forgot-password"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex justify-center pt-1"
                      >
                        <button
                          type="button"
                          onClick={() => setForgotMode(true)}
                          className="text-sm text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                        >
                          Forgot password?
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Back to login (forgot mode only) */}
                  <AnimatePresence>
                    {forgotMode && (
                      <motion.div 
                        key="back-to-login"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex justify-center pt-1"
                      >
                        <button
                          type="button"
                          onClick={() => { setForgotMode(false); setErrors({}); }}
                          className="text-sm text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                        >
                          ← Back to login
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

                {/* Mode toggle */}
                <AnimatePresence>
                  {!forgotMode && (
                    <motion.div 
                      key="mode-toggle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="mt-6 text-center text-sm text-slate-300"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={mode}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {mode === 'signup' ? (
                            <>
                              Already have an account?{' '}
                              <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className="font-semibold text-cyan-300 hover:text-cyan-200 transition-colors focus-visible:outline-none focus-visible:underline drop-shadow-sm"
                              >
                                Log in
                              </button>
                            </>
                          ) : (
                            <>
                              Don&apos;t have an account?{' '}
                              <button
                                type="button"
                                onClick={() => switchMode('signup')}
                                className="font-semibold text-cyan-300 hover:text-cyan-200 transition-colors focus-visible:outline-none focus-visible:underline drop-shadow-sm"
                              >
                                Sign up
                              </button>
                            </>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Demo accounts */}
                <AnimatePresence>
                  {!forgotMode && (
                    <motion.div 
                      key="demo-accounts"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className=""
                    >
                      <div className="mt-6 border-t border-white/10 pt-6">
                        <p className="text-xs text-center text-slate-400 mb-4 uppercase tracking-wider font-semibold drop-shadow-sm">Demo accounts</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={submitting}
                            onClick={() => handleDemoLogin('aisha@demo.careeros.my', '12345678')}
                            className="text-xs bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all group backdrop-blur-md"
                          >
                            <User className="mr-1.5 h-3.5 w-3.5 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
                            Candidate
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={submitting}
                            onClick={() => handleDemoLogin('grab@demo.careeros.my', '12345678')}
                            className="text-xs bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all group backdrop-blur-md"
                          >
                            <Briefcase className="mr-1.5 h-3.5 w-3.5 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
                            Employer
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
