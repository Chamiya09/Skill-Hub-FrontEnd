import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SparkleIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UserIcon,
  LockIcon,
  MailIcon,
  BriefcaseIcon,
  PhoneIcon,
} from '../components/common/Icons';

/**
 * =========================================================================================
 * BACKEND READINESS & CONTROLLER INSTRUCTIONS FOR HEADLINE & PHONE:
 * =========================================================================================
 * To persist 'headline' and 'phone' in the candidate database record:
 *
 * 1. DTO Update (RegisterCandidateDto.cs):
 *    public class RegisterCandidateDto
 *    {
 *        [Required] public string FirstName { get; set; } = string.Empty;
 *        [Required] public string LastName { get; set; } = string.Empty;
 *        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
 *        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
 *        [MaxLength(150)] public string? Headline { get; set; }
 *        [MaxLength(30)] public string? Phone { get; set; }
 *    }
 *
 * 2. Service / Controller Implementation (AuthService.cs / CandidateAuthController.cs):
 *    var user = new User
 *    {
 *        FirstName = dto.FirstName.Trim(),
 *        LastName = dto.LastName.Trim(),
 *        Email = dto.Email.Trim().ToLowerInvariant(),
 *        Headline = dto.Headline?.Trim(),
 *        Phone = dto.Phone?.Trim(),
 *        Role = "CANDIDATE",
 *        CreatedAt = DateTime.UtcNow
 *    };
 *    user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
 *    await _context.Users.AddAsync(user);
 *    await _context.SaveChangesAsync();
 * =========================================================================================
 */

export const CandidateRegister: React.FC = () => {
  const navigate = useNavigate();
  const { candidateRegister, isAuthenticated, currentUser, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Candidate Registration Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    headline: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
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

  // Step 1: Candidate Identity Validation
  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setStepError('Please enter your First Name.');
      return false;
    }
    if (!formData.lastName.trim()) {
      setStepError('Please enter your Last Name.');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setStepError('Please provide a valid personal email address.');
      return false;
    }
    setStepError(null);
    return true;
  };

  // Step 2: Professional Profile Validation
  const validateStep2 = () => {
    if (!formData.headline.trim()) {
      setStepError('Please provide your Professional Headline / Target Job Title.');
      return false;
    }
    setStepError(null);
    return true;
  };

  // Step 3: Security & Credentials Validation
  const validateStep3 = () => {
    if (!formData.password || formData.password.length < 6) {
      setStepError('Password must be at least 6 characters long.');
      return false;
    }
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setStepError('Passwords do not match. Please re-enter.');
      return false;
    }
    if (!agreeTerms) {
      setStepError('You must agree to the Terms of Service and Privacy Policy.');
      return false;
    }
    setStepError(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    setStepError(null);
    setErrorMessage(null);
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const user = await candidateRegister({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        headline: formData.headline.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
      });

      setSuccessMessage(`Welcome to Skill Hub, ${user.fullName || user.firstName}! Redirecting to your candidate profile...`);
      setTimeout(() => {
        navigate('/candidate/profile', { replace: true });
      }, 500);
    } catch (err: any) {
      console.error('Candidate registration error:', err);
      setErrorMessage(
        err.message || 'Failed to register candidate account. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-card-premium auth-card-wizard">
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
          <div className="badge-tag" style={{ display: 'inline-flex', marginBottom: '8px' }}>
            <BriefcaseIcon />
            <span>CANDIDATE REGISTRATION</span>
          </div>
          <h1 className="auth-title">Create Candidate Account</h1>
          <p className="auth-subtitle">
            Join premier technology talent with AI-powered resume matching and verified employer connections.
          </p>
        </div>

        {/* Multi-Step Stepper Progress Bar */}
        <div className="wizard-stepper">
          <div className="wizard-progress-track">
            <div
              className="wizard-progress-fill"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              }}
            />
          </div>

          {/* Step 1 Node */}
          <div
            className={`wizard-step-node ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            style={{ cursor: currentStep > 1 ? 'pointer' : 'default' }}
          >
            <div className="wizard-step-circle">
              {currentStep > 1 ? <CheckIcon /> : '1'}
            </div>
            <span className="wizard-step-label">Identity</span>
          </div>

          {/* Step 2 Node */}
          <div
            className={`wizard-step-node ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
            onClick={() => {
              if (currentStep === 3) setCurrentStep(2);
            }}
            style={{ cursor: currentStep === 3 ? 'pointer' : 'default' }}
          >
            <div className="wizard-step-circle">
              {currentStep > 2 ? <CheckIcon /> : '2'}
            </div>
            <span className="wizard-step-label">Profile</span>
          </div>

          {/* Step 3 Node */}
          <div className={`wizard-step-node ${currentStep === 3 ? 'active' : ''}`}>
            <div className="wizard-step-circle">3</div>
            <span className="wizard-step-label">Security</span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {(stepError || errorMessage) && (
          <div className="auth-alert-error" role="alert">
            <span>⚠️</span>
            <span>{stepError || errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert-success" role="status">
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* STEP 1: Candidate Identity */}
          {currentStep === 1 && (
            <div className="wizard-step-body" key="step1">
              <div className="wizard-step-header">
                <div className="wizard-step-icon">
                  <UserIcon />
                </div>
                <div>
                  <h3 className="wizard-step-title">Personal Identity</h3>
                  <p className="wizard-step-desc">Enter your legal full name and personal contact email</p>
                </div>
              </div>

              {/* First Name & Last Name (2-Column Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group-item">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    First Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="relative w-full auth-input-wrapper">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                      <UserIcon />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex"
                      value={formData.firstName}
                      onChange={(e) => {
                        setStepError(null);
                        setFormData({ ...formData, firstName: e.target.value });
                      }}
                      className="input-field-standard pl-11 w-full"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group-item">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Last Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="relative w-full auth-input-wrapper">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                      <UserIcon />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rivera"
                      value={formData.lastName}
                      onChange={(e) => {
                        setStepError(null);
                        setFormData({ ...formData, lastName: e.target.value });
                      }}
                      className="input-field-standard pl-11 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Email Address */}
              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Personal Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="alex.rivera@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, email: e.target.value });
                    }}
                    className="input-field-standard pl-11 w-full"
                  />
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Used for job notifications, interview invites, and sign-in credentials.
                </span>
              </div>

              <div className="wizard-action-row">
                <div />
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-wizard-next"
                >
                  <span>Continue to Professional Profile</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Professional Profile & Contact */}
          {currentStep === 2 && (
            <div className="wizard-step-body" key="step2">
              <div className="wizard-step-header">
                <div className="wizard-step-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <BriefcaseIcon />
                </div>
                <div>
                  <h3 className="wizard-step-title">Professional Profile</h3>
                  <p className="wizard-step-desc">Specify your target job title and direct contact number</p>
                </div>
              </div>

              {/* Professional Headline */}
              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Professional Headline / Target Job Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                    <BriefcaseIcon />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Full-Stack Engineer / UX Designer"
                    value={formData.headline}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, headline: e.target.value });
                    }}
                    className="input-field-standard pl-11 w-full"
                    autoFocus
                  />
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  This is prominently showcased to recruiters and matches you to active vacancies.
                </span>
              </div>

              {/* Phone Number */}
              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Phone Number (Optional)
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                    <PhoneIcon />
                  </span>
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2834"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field-standard pl-11 w-full"
                  />
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12.5px',
                  color: '#475569',
                }}
              >
                <ShieldCheckIcon />
                <span>Your contact details are encrypted and only shared with companies you apply to.</span>
              </div>

              <div className="wizard-action-row">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-wizard-back"
                >
                  <ArrowLeftIcon />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-wizard-next"
                >
                  <span>Continue to Security</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Security & Credentials */}
          {currentStep === 3 && (
            <div className="wizard-step-body" key="step3">
              <div className="wizard-step-header">
                <div className="wizard-step-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <LockIcon />
                </div>
                <div>
                  <h3 className="wizard-step-title">Account Security</h3>
                  <p className="wizard-step-desc">Create a secure password for your candidate account</p>
                </div>
              </div>

              {/* Password */}
              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, password: e.target.value });
                    }}
                    className="input-field-standard pl-11 pr-12 w-full"
                    autoFocus
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
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                    <LockIcon />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, confirmPassword: e.target.value });
                    }}
                    className="input-field-standard pl-11 pr-12 w-full"
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
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Terms Agreement Checkbox */}
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

              <div className="wizard-action-row">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-wizard-back"
                  disabled={loading}
                >
                  <ArrowLeftIcon />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-wizard-next"
                >
                  {loading ? (
                    <span>Creating Candidate Account...</span>
                  ) : (
                    <>
                      <span>Complete Candidate Registration</span>
                      <ArrowRightIcon />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Card Footer */}
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
