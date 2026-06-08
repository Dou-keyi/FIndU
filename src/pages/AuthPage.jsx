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

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(''); // 'candidate' | 'employer'
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [forgotMode, setForgotMode] = useState(false);

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
          full_name: '',
          onboarding_complete: false,
        });
        if (profileError) throw profileError;

        toast({ title: 'Account created!', description: 'Let\'s set up your profile.', variant: 'success' });
        navigate('/onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        toast({ title: 'Welcome back!', variant: 'success' });
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
    <div className="relative min-h-screen flex w-full bg-[#020617] overflow-hidden font-sans text-slate-50 selection:bg-blue-500/30">
      {/* Left Panel - Visuals & Messaging */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 xl:p-24 overflow-hidden z-10 border-r border-slate-800/50 shadow-2xl">
        <UniverseBackground />
        
        {/* Brand/Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-20"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 backdrop-blur-md border border-blue-400/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <span className="text-3xl font-bold text-white tracking-tighter">C</span>
          </div>
        </motion.div>

        {/* Hero Copy */}
        <div className="relative z-20 mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover your potential</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.9, ease: "easeOut" }}
            className="text-5xl xl:text-6xl font-extrabold tracking-tight max-w-2xl leading-[1.15] mb-6"
          >
            <span className="text-white">No matter where you are from, you can always find a </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
              career and network
            </span>
            <span className="text-white"> anywhere.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.9, ease: "easeOut" }}
            className="text-xl text-blue-100/70 max-w-xl font-light leading-relaxed"
          >
            Join Career OS, the universe of boundless opportunities. Build your portfolio, explore global roles, and connect beyond borders.
          </motion.p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        {/* Mobile Background */}
        <div className="absolute inset-0 lg:hidden -z-10">
           <UniverseBackground />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.2, delay: 0.2 }}
          className="w-full max-w-[440px]"
        >
          <Card className="w-full bg-slate-900/60 backdrop-blur-2xl border-slate-800/60 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative">
            {/* Subtle top glow */}
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/80 via-cyan-500/80 to-blue-500/80 transform origin-left" 
            />
            
            <CardHeader className="text-center pt-10 pb-6 relative z-10 overflow-hidden">
               <div className="mx-auto mb-6 flex h-14 w-14 lg:hidden items-center justify-center rounded-xl bg-blue-500/20 backdrop-blur-md border border-blue-400/30 shadow-lg">
                  <span className="text-2xl font-bold text-white">C</span>
               </div>
               <CardTitle className="text-2xl font-semibold tracking-tight text-white h-8 flex items-center justify-center">
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
               <CardDescription className="text-slate-400 mt-2 h-5 flex items-center justify-center">
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

            <CardContent className="relative z-10">
              <motion.form layout="position" onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <motion.div layout className="space-y-2">
                  <Label htmlFor="auth-email" className="text-slate-300">Email</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`bg-slate-950/50 border-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all ${errors.email ? 'border-red-500/50 focus-visible:ring-red-500' : ''}`}
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400 pt-1 overflow-hidden">
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Password (hidden in forgot mode) */}
                <AnimatePresence mode="popLayout">
                  {!forgotMode && (
                    <motion.div
                      key="password-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label htmlFor="auth-password" className="text-slate-300">Password</Label>
                      <div className="relative">
                        <Input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                          placeholder={mode === 'signup' ? 'Min 8 characters' : 'Enter password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`bg-slate-950/50 border-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all pr-10 ${errors.password ? 'border-red-500/50 focus-visible:ring-red-500' : ''}`}
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {errors.password && (
                          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400 pt-1 overflow-hidden">
                            {errors.password}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirm Password (signup only) */}
                <AnimatePresence mode="popLayout">
                  {!forgotMode && mode === 'signup' && (
                    <motion.div
                      key="confirm-password-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label htmlFor="auth-confirm-password" className="text-slate-300">Confirm password</Label>
                      <Input
                        id="auth-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`bg-slate-950/50 border-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all ${errors.confirmPassword ? 'border-red-500/50 focus-visible:ring-red-500' : ''}`}
                      />
                      <AnimatePresence>
                        {errors.confirmPassword && (
                          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400 pt-1 overflow-hidden">
                            {errors.confirmPassword}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Role Selector (signup only) */}
                <AnimatePresence mode="popLayout">
                  {!forgotMode && mode === 'signup' && (
                    <motion.div
                      key="role-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div className="pt-2">
                        <Label className="text-slate-300 block mb-3">I am…</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setRole('candidate')}
                            className={`flex flex-col items-center gap-3 rounded-xl border p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              role === 'candidate'
                                ? 'border-blue-500 bg-blue-500/10 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]'
                                : 'border-slate-700/50 bg-slate-950/30 hover:border-slate-600 hover:bg-slate-900/50'
                            }`}
                          >
                            <div className={`rounded-full p-2.5 transition-colors ${
                              role === 'candidate' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-400'
                            }`}>
                              <User className="h-5 w-5" />
                            </div>
                            <span className={`text-sm font-medium ${
                              role === 'candidate' ? 'text-white' : 'text-slate-400'
                            }`}>
                              Looking for work
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRole('employer')}
                            className={`flex flex-col items-center gap-3 rounded-xl border p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              role === 'employer'
                                ? 'border-blue-500 bg-blue-500/10 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]'
                                : 'border-slate-700/50 bg-slate-950/30 hover:border-slate-600 hover:bg-slate-900/50'
                            }`}
                          >
                            <div className={`rounded-full p-2.5 transition-colors ${
                              role === 'employer' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-400'
                            }`}>
                              <Briefcase className="h-5 w-5" />
                            </div>
                            <span className={`text-sm font-medium ${
                              role === 'employer' ? 'text-white' : 'text-slate-400'
                            }`}>
                              I'm hiring
                            </span>
                          </button>
                        </div>
                        <AnimatePresence>
                          {errors.role && (
                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400 pt-1 overflow-hidden">
                              {errors.role}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.div layout>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all h-11 mt-2 flex items-center justify-center overflow-hidden relative" 
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
                </motion.div>

                {/* Forgot password (login only) */}
                <AnimatePresence mode="popLayout">
                  {!forgotMode && mode === 'login' && (
                    <motion.div 
                      key="forgot-password"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-center pt-2 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-sm text-slate-400 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:underline"
                      >
                        Forgot password?
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Back to login (forgot mode only) */}
                <AnimatePresence mode="popLayout">
                  {forgotMode && (
                    <motion.div 
                      key="back-to-login"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-center pt-2 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => { setForgotMode(false); setErrors({}); }}
                        className="text-sm text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                      >
                        ← Back to login
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>

              {/* Mode toggle */}
              <AnimatePresence mode="popLayout">
                {!forgotMode && (
                  <motion.div 
                    key="mode-toggle"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-8 text-center text-sm text-slate-400 overflow-hidden"
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
                              className="font-medium text-blue-400 hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:underline"
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
                              className="font-medium text-blue-400 hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:underline"
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
              <AnimatePresence mode="popLayout">
                {!forgotMode && (
                  <motion.div 
                    key="demo-accounts"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-8 border-t border-slate-800/60 pt-6">
                      <p className="text-xs text-center text-slate-500 mb-4 uppercase tracking-wider font-semibold">Demo accounts</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={submitting}
                          onClick={() => handleDemoLogin('aisha@demo.careeros.my', '12345678')}
                          className="text-xs bg-slate-950/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all group"
                        >
                          <User className="mr-1.5 h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                          Candidate
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={submitting}
                          onClick={() => handleDemoLogin('grab@demo.careeros.my', '12345678')}
                          className="text-xs bg-slate-950/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all group"
                        >
                          <Briefcase className="mr-1.5 h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
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
    </div>
  );
}
