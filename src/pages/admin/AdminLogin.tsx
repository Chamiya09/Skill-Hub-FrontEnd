import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi, authStorage } from '../../services/api';
import { AuthSplitLayout } from '../../components/common/AuthSplitLayout';
import './AdminDashboard.css';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthData, currentUser, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in as Admin, redirect immediately
  React.useEffect(() => {
    if (!authLoading && currentUser && currentUser.role?.toLowerCase() === 'admin') {
      navigate('/skillhub-secure-admin/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  if (authLoading) {
    return (
      <AuthSplitLayout
        portalType="admin"
        eyebrow="PLATFORM OPERATIONS & GOVERNANCE"
        quote="Clarity is the beginning of better decisions."
        description="A considered view of the platform helps protect the people and opportunities within it."
      >
        <div className="auth-form-card text-center p-8 text-emerald-700 font-bold text-sm">
          Verifying security authorization...
        </div>
      </AuthSplitLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await adminApi.adminLogin({
        email: email.trim(),
        password: password,
      });

      // Synchronize through auth storage and context
      authStorage.setAuth(response);
      setAuthData(response.user, response.token);

      navigate('/skillhub-secure-admin/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      portalType="admin"
      eyebrow="RESTRICTED MASTER CONTROL GATEWAY"
      quote="Securing the platform with zero-trust integrity."
      description="Real-time infrastructure monitoring, candidate proctoring audit streams, and corporate directory governance."
    >
      <div className="auth-form-card animate-in fade-in duration-300">
        {/* Top Header Badge */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-emerald-400 border border-slate-700 mb-3 shadow-2xs">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>RESTRICTED ACCESS • SUPER ADMIN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Skill Hub Master Console
          </h1>
          <p className="text-[13.5px] text-slate-500 font-medium mt-1">
            Enterprise system monitoring, platform audit logs & global user governance.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[12.5px] font-bold text-slate-700 mb-1.5"
            >
              Admin Identity / Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail size={16} />
              </span>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                placeholder="admin@skillhub.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-[12.5px] font-bold text-slate-700 mb-1.5"
            >
              Master Security Key / Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
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
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Access Master Console</span>
                <ArrowRight size={15} className="text-emerald-400" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center text-center text-[12px] text-slate-400 font-medium">
          <span>Encrypted Session • IP & Device Telemetry Logged</span>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
