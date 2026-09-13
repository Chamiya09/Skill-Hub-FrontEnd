import React, { useState, useEffect } from 'react';
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
  BriefcaseIcon,
} from '../components/common/Icons';

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
    if (!authLoading && isAuthenticated && currentUser) {
      if (currentUser.role?.toUpperCase() === 'CANDIDATE') {
        navigate('/candidate/profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const user = await candidateLogin(email.trim().toLowerCase(), password);
      setSuccessMessage(`Welcome back, ${user.fullName || user.firstName || 'Candidate'}! Redirecting...`);
      setTimeout(() => {
        navigate('/candidate/profile', { replace: true });
      }, 500);
    } catch (err: any) {
      console.error('Candidate login error:', err);
      setErrorMessage(
        err.message || 'Authentication failed. Please verify your candidate credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-card-premium">
        {/* Top Navigation & Brand Header */}
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

        {/* Header Section */}
        <div className="auth-header">
          <div className="badge-tag" style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <BriefcaseIcon />
            <span>CANDIDATE PORTAL</span>
          </div>
          <h1 className="auth-title">Candidate Sign In</h1>
          <p className="auth-subtitle">
            Sign in to track applications, manage your career profile, and explore tailored job requisitions.
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="auth-alert-error" role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert-success" role="status">
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Candidate Login Form */}
        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group-item">
            <label
              htmlFor="candidateLoginEmail"
              style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}
            >
              Email Address
            </label>
            <div className="relative w-full auth-input-wrapper">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                <MailIcon />
              </span>
              <input
                id="candidateLoginEmail"
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field-standard pl-11 w-full"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="candidateLoginPassword"
                style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}
              >
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset instructions will be sent to your registered candidate email address.');
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
                id="candidateLoginPassword"
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
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In as Candidate</span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        {/* Card Footer with Clean Minimal Links */}
        <div className="auth-card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link
              to="/candidate-register"
              className="hover:text-primary-600 transition-colors"
              style={{ color: '#00b074', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign Up
            </Link>
          </p>

          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Are you an employer?{' '}
            <Link
              to="/company-login"
              className="hover:text-primary-600 transition-colors"
              style={{ color: '#00b074', fontWeight: 600, textDecoration: 'none' }}
            >
              Company Login
            </Link>
          </p>

          <div className="auth-security-badge" style={{ marginTop: '8px' }}>
            <ShieldCheckIcon />
            <span>Secure TLS 1.3 • Privacy Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
