import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthSplitLayout } from '../components/common/AuthSplitLayout';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated, redirect to appropriate role dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && !loading && !successMessage) {
      const role = currentUser?.role?.toLowerCase();
      if (role === 'admin' || role === 'super_admin') {
        navigate('/skillhub-secure-admin/dashboard', { replace: true });
      } else if (role === 'candidate') {
        navigate('/candidate/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, currentUser, loading, successMessage, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      setSuccessMessage(`Welcome back, ${user.fullName || user.companyName}!`);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 900));
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to authenticate company user. Please verify your credentials.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      portalType="company"
      eyebrow="FOR TEAMS THAT BUILD WHAT'S NEXT"
      quote="Great teams aren't found. They're built with intention."
      description="Bring your hiring into focus, connect with verified software engineers, and give every great hire a place to begin."
      transitioning={Boolean(successMessage)}
    >
      <div className="auth-form-card animate-in fade-in duration-300">
        {/* Header Branding */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3 shadow-2xs">
            <Building2 size={13} className="text-emerald-600" />
            <span>EMPLOYER ATS PORTAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Company Sign In
          </h1>
          <p className="text-[13.5px] text-slate-500 font-medium mt-1">
            Access your talent pipelines, automated technical assessments, and active requisitions.
          </p>
        </div>

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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="loginEmail"
              className="block text-[12.5px] font-bold text-slate-700 mb-1.5"
            >
              Company / Business Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail size={16} />
              </span>
              <input
                id="loginEmail"
                type="email"
                required
                placeholder="contact@company.com"
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
                htmlFor="loginPassword"
                className="text-[12.5px] font-bold text-slate-700"
              >
                Account Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert(
                    'Password reset instructions have been dispatched to your corporate administrator email.'
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
                id="loginPassword"
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
              <span>Authenticating Company Account...</span>
            ) : (
              <>
                <span>Sign In to Company Portal</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Card Footer Links */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-center text-[13px] text-slate-500 font-medium">
          <p>
            New to our hiring network?{' '}
            <Link
              to="/company-register"
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
            >
              Register Your Company
            </Link>
          </p>

          <div className="auth-role-switcher w-full flex items-center justify-center gap-1.5 flex-wrap text-[12.5px] text-slate-500">
            <span>Are you a job seeker?</span>
            <Link
              to="/candidate-login"
              className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 whitespace-nowrap hover:underline"
            >
              <span>Candidate Sign In</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
