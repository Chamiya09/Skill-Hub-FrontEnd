import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SparkleIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
} from '../components/common/Icons';

export const CandidateRegister: React.FC = () => {
  const navigate = useNavigate();
  const { candidateRegister, isAuthenticated, currentUser, isLoading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

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

    // Client-side validations
    if (!firstName.trim()) {
      setErrorMessage('Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      setErrorMessage('Please enter your last name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your confirmation password.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const user = await candidateRegister({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccessMessage(`Welcome to Skill Hub, ${user.fullName || user.firstName}! Redirecting to your candidate profile...`);
      setTimeout(() => {
        navigate('/candidate/profile', { replace: true });
      }, 500);
    } catch (err: any) {
      console.error('Candidate registration error:', err);
      setErrorMessage(
        err.message || 'Unable to register candidate account. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-card-premium" style={{ maxWidth: '520px' }}>
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

        {/* Header Title Section */}
        <div className="auth-header">
          <div className="badge-tag" style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <BriefcaseIcon />
            <span>JOB SEEKER PORTAL</span>
          </div>
          <h1 className="auth-title">Create Candidate Account</h1>
          <p className="auth-subtitle">
            Find and apply to premier technology roles with AI-powered resume matching and verified employers.
          </p>
        </div>

        {/* Feedback Alerts */}
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* First Name & Last Name in 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group-item">
              <label
                htmlFor="candidateFirstName"
                style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}
              >
                First Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="relative w-full auth-input-wrapper">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                  <UserIcon />
                </span>
                <input
                  id="candidateFirstName"
                  type="text"
                  required
                  placeholder="e.g. John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field-standard pl-11 w-full"
                  autoComplete="given-name"
                />
              </div>
            </div>

            <div className="form-group-item">
              <label
                htmlFor="candidateLastName"
                style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}
              >
                Last Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="relative w-full auth-input-wrapper">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                  <UserIcon />
                </span>
                <input
                  id="candidateLastName"
                  type="text"
                  required
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field-standard pl-11 w-full"
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group-item">
            <label
              htmlFor="candidateEmail"
              style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}
            >
              Personal Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="relative w-full auth-input-wrapper">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                <MailIcon />
              </span>
              <input
                id="candidateEmail"
                type="email"
                required
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field-standard pl-11 w-full"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group-item">
            <label
              htmlFor="candidatePassword"
              style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}
            >
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="relative w-full auth-input-wrapper">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                <LockIcon />
              </span>
              <input
                id="candidatePassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field-standard pl-11 pr-12 w-full"
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="form-group-item">
            <label
              htmlFor="candidateConfirmPassword"
              style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}
            >
              Confirm Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="relative w-full auth-input-wrapper">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                <LockIcon />
              </span>
              <input
                id="candidateConfirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field-standard pl-11 pr-12 w-full"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Terms checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '2px' }}>
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ marginTop: '3px', accentColor: '#00b074', cursor: 'pointer' }}
            />
            <label htmlFor="agreeTerms" style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.4, cursor: 'pointer' }}>
              I agree to the{' '}
              <span style={{ color: '#00b074', fontWeight: 600 }}>Skill Hub Terms of Service</span> and{' '}
              <span style={{ color: '#00b074', fontWeight: 600 }}>Privacy Policy</span>.
            </label>
          </div>

          {/* Submit Button */}
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
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <span>Creating Candidate Account...</span>
            ) : (
              <>
                <span>Create Free Candidate Account</span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        {/* Card Footer with Switch Options */}
        <div className="auth-card-footer">
          <p>
            Already have a candidate account?{' '}
            <Link to="/candidate-login" className="auth-footer-link">
              Candidate Sign In
            </Link>
          </p>
          <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12.5px', color: '#64748b' }}>
            Looking to hire talent?{' '}
            <Link to="/company-register" style={{ color: '#00b074', fontWeight: 600, textDecoration: 'none' }}>
              Register Employer Company
            </Link>
          </div>
          <div className="auth-security-badge" style={{ marginTop: '12px' }}>
            <ShieldCheckIcon />
            <span>Encrypted Credentials • 256-Bit SSL Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
