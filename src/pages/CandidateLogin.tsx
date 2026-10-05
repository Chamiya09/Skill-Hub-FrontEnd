import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthSplitLayout } from '../components/common/AuthSplitLayout';

export const CandidateLogin: React.FC = () => {
  const navigate = useNavigate();
  const { candidateLogin, isAuthenticated, currentUser, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser && !loading && !successMessage) {
      if (currentUser.role?.toUpperCase() === 'CANDIDATE') {
        navigate('/candidate/profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, currentUser, loading, successMessage, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your candidate email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const user = await candidateLogin(email.trim().toLowerCase(), password);
      setSuccessMessage(
        `Welcome back, ${user.fullName || user.firstName || 'Candidate'}! Redirecting...`
      );
      await new Promise<void>((resolve) => window.setTimeout(resolve, 900));
      navigate('/candidate/profile', { replace: true });
    } catch (err: any) {
      console.error('Candidate login error:', err);
      setErrorMessage(
        err.message || 'Authentication failed. Please verify your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('sarah.jenkins@gmail.com');
    setPassword('candidate123');
    setErrorMessage(null);
  };

  return (
    <AuthSplitLayout
      portalType="candidate"
      eyebrow="FOR PEOPLE READY TO GROW"
      quote="Your next opportunity starts with the skills you bring."
      description="Make your experience visible, prove your real engineering depth, and step into senior roles with confidence."
      transitioning={Boolean(successMessage)}
    >
      <div className="auth-form-card animate-in fade-in duration-300">
        {/* Header Section */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-3 shadow-2xs">
            <User size={13} className="text-teal-600" />
            <span>VERIFIED TALENT PORTAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Candidate Sign In
          </h1>
          <p className="text-[13.5px] text-slate-500 font-medium mt-1">
            Track applications, take proctored assessments, and accept direct employer invitations.
          </p>
        </div>

        {/* Quick Demo Credentials Autofill Chip */}
        <button
          type="button"
          onClick={handleQuickDemoFill}
          className="demo-autofill-btn"
          title="Click to automatically populate candidate testing credentials"
        >
          <Zap size={13} className="text-emerald-600" />
          <span>Quick Demo: Sarah Jenkins (Staff Candidate)</span>
        </button>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="candidateLoginEmail"
              className="block text-[12.5px] font-bold text-slate-700 mb-1.5"
            >
              Candidate Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail size={16} />
              </span>
              <input
                id="candidateLoginEmail"
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="candidateLoginPassword"
                className="text-[12.5px] font-bold text-slate-700"
              >
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert(
                    'Password reset instructions have been dispatched to your registered candidate email address.'
                  );
                }}
                className="text-[12px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Lock size={16} />
              </span>
              <input
                id="candidateLoginPassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span>Authenticating Profile...</span>
            ) : (
              <>
                <span>Sign In to Candidate Portal</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Card Footer Links */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-center text-[13px] text-slate-500 font-medium">
          <p>
            Looking to register your talent profile?{' '}
            <Link
              to="/candidate-register"
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
            >
              Create Free Account
            </Link>
          </p>

          <div className="auth-role-switcher w-full">
            <span>Hiring software engineering talent?</span>
            <Link to="/company-login" className="inline-flex items-center gap-1 font-bold">
              <span>Employer Sign In</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
