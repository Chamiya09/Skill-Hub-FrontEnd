import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import {
  SparkleIcon,
  MailIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowRightIcon,
} from '../components/common/Icons';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="badge-tag">
            <SparkleIcon />
            <span>ENTERPRISE PORTAL</span>
          </div>
          <h1 className="auth-title">Sign in to Skill Hub</h1>
          <p className="auth-subtitle">
            Access your AI talent pipelines, candidate graphs, and vacancy manager.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-alert-error">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="auth-alert-success">
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group-item">
            <label htmlFor="loginEmail">Corporate Email Address</label>
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
              />
            </div>
          </div>

          <div className="form-group-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="loginPassword">Password</label>
              <a href="#forgot" style={{ fontSize: '12.5px', color: '#00b074', fontWeight: 600, textDecoration: 'none' }}>
                Forgot Password?
              </a>
            </div>
            <input
              id="loginPassword"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field-standard"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', marginTop: '8px' }}
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
