import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await authApi.login({
        email: email.trim(),
        password: password,
      });

      setSuccessMessage(`Welcome back, ${response.user.fullName}!`);
      setTimeout(() => {
        navigate('/users');
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate. Please check your corporate credentials.');
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
            <span>ENTERPRISE PORTAL</span>
          </div>
          <h1 className="auth-title">Sign in to Skill Hub</h1>
          <p className="auth-subtitle">
            Access your AI talent pipelines, candidate graphs, and vacancy manager.
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
              Corporate Email Address
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <MailIcon />
              </span>
              <input
                id="loginEmail"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field-standard"
                style={{ paddingLeft: '42px' }}
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
                  alert('Password reset link will be dispatched to your registered administrator email.');
                }}
                style={{ fontSize: '12px', color: '#00b074', fontWeight: 600, textDecoration: 'none' }}
              >
                Forgot Password?
              </a>
            </div>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <LockIcon />
              </span>
              <input
                id="loginPassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field-standard"
                style={{ paddingLeft: '42px', paddingRight: '40px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px',
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
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        {/* Card Footer */}
        <div className="auth-card-footer">
          <p>
            Don't have an enterprise account?{' '}
            <Link to="/register" className="auth-footer-link">
              Register Company
            </Link>
          </p>
          <div className="auth-security-badge">
            <ShieldCheckIcon />
            <span>SOC-2 Type II Certified • 256-Bit SSL Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};
