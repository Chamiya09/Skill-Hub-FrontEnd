import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SparkleIcon,
  MailIcon,
  LockIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '../components/common/Icons';

export const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      setSuccessMessage(`Welcome back, ${user.fullName || user.companyName}!`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate company user. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-card-premium">
        {/* Top Navigation & Brand */}
        <div className="auth-top-nav">
          <Link to="/" className="auth-back-link">
            <ArrowLeftIcon />
            <span>Back to Home</span>
          </Link>
          <Link to="/" className="auth-brand-mark">
            <div className="logo-icon-wrap" style={{ width: '30px', height: '30px', borderRadius: '8px' }}>
              <SparkleIcon />
            </div>
            <span className="brand-name">
              Skill<span>Hub</span>
            </span>
          </Link>
        </div>

        {/* Header Branding */}
        <div className="auth-header">
          <div className="badge-tag" style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <SparkleIcon />
            <span>EMPLOYER PORTAL</span>
          </div>
          <h1 className="auth-title">Company Login</h1>
          <p className="auth-subtitle">
            Access your employer ATS portal, candidate pipelines, and vacancy manager.
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="auth-alert-error">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert-success">
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group-item">
            <label htmlFor="loginEmail" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Company / Business Email Address
            </label>
            <div className="relative w-full auth-input-wrapper">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                <MailIcon />
              </span>
              <input
                id="loginEmail"
                type="email"
                required
                placeholder="contact@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field-standard pl-11 w-full"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="loginPassword" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset instructions will be dispatched to your registered administrator email.');
                }}
                style={{ fontSize: '12px', color: '#00b074', fontWeight: 600, textDecoration: 'none' }}
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative w-full auth-input-wrapper">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                <LockIcon />
              </span>
              <input
                id="loginPassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field-standard pl-11 pr-12 w-full"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px',
                  zIndex: 3,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              fontSize: '14.5px',
              fontWeight: 700,
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <span>Authenticating Company Account...</span>
            ) : (
              <>
                <span>Sign In to Company Portal</span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        {/* Card Footer with Clean Minimal Links */}
        <div className="auth-card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
            New to our platform?{' '}
            <Link
              to="/company-register"
              className="hover:text-primary-600 transition-colors"
              style={{ color: '#00b074', fontWeight: 600, textDecoration: 'none' }}
            >
              Create Company Account
            </Link>
          </p>

          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Are you a job seeker?{' '}
            <Link
              to="/candidate-login"
              className="hover:text-primary-600 transition-colors"
              style={{ color: '#00b074', fontWeight: 600, textDecoration: 'none' }}
            >
              Candidate Login
            </Link>
          </p>

          <div className="auth-security-badge" style={{ marginTop: '8px' }}>
            <ShieldCheckIcon />
            <span>SOC-2 Type II Certified • 256-Bit Enterprise SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
