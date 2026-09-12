import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SparkleIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BuildingIcon,
  LockIcon,
  MailIcon,
  GlobeIcon,
  BriefcaseIcon,
} from '../components/common/Icons';

export const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Strictly Company Registration Form State
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    industry: 'Software & Technology',
    website: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Step 1: Company Identity Validation
  const validateStep1 = () => {
    if (!formData.companyName.trim()) {
      setStepError('Please enter your Company Name.');
      return false;
    }
    if (!formData.companyEmail.trim() || !formData.companyEmail.includes('@')) {
      setStepError('Please enter a valid Company / Business Email address.');
      return false;
    }
    setStepError(null);
    return true;
  };

  // Step 2: Company Profile Validation
  const validateStep2 = () => {
    if (!formData.industry.trim()) {
      setStepError('Please select a primary industry for your company.');
      return false;
    }
    setStepError(null);
    return true;
  };

  // Step 3: Security & Password Validation
  const validateStep3 = () => {
    if (!formData.password || formData.password.length < 6) {
      setStepError('Password must be at least 6 characters long.');
      return false;
    }
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setStepError('Passwords do not match. Please re-enter.');
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
      const user = await register({
        companyName: formData.companyName.trim(),
        companyEmail: formData.companyEmail.trim(),
        industry: formData.industry,
        website: formData.website.trim(),
        password: formData.password,
      });

      setSuccessMessage(`Enterprise account for "${user.companyName}" successfully created! Redirecting...`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register company. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-card-premium auth-card-wizard">
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
          <div className="badge-tag" style={{ display: 'inline-flex', marginBottom: '8px' }}>
            <SparkleIcon />
            <span>EMPLOYER REGISTRATION</span>
          </div>
          <h1 className="auth-title">Register Your Company</h1>
          <p className="auth-subtitle">
            Deploy Skill Hub's AI talent pipeline and vacancy manager for your organization.
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
          >
            <div className="wizard-step-circle">
              {currentStep > 1 ? <CheckIcon /> : '1'}
            </div>
            <span className="wizard-step-label">Company</span>
          </div>

          {/* Step 2 Node */}
          <div
            className={`wizard-step-node ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
            onClick={() => {
              if (currentStep === 3) setCurrentStep(2);
            }}
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

        {/* Validation / Error Alerts */}
        {(stepError || errorMessage) && (
          <div className="auth-alert-error">
            <span>⚠️</span>
            <span>{stepError || errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="auth-alert-success">
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit}>
          {/* STEP 1: Company Core Details */}
          {currentStep === 1 && (
            <div className="wizard-step-body" key="step1">
              <div className="wizard-step-header">
                <div className="wizard-step-icon">
                  <BuildingIcon />
                </div>
                <div>
                  <h3 className="wizard-step-title">Company Identity</h3>
                  <p className="wizard-step-desc">Enter your organization's legal name and business email</p>
                </div>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Company Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                    <BuildingIcon />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Technologies Inc."
                    value={formData.companyName}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, companyName: e.target.value });
                    }}
                    className="input-field-standard pl-11 w-full"
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Company / Business Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="contact@acmetech.com"
                    value={formData.companyEmail}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, companyEmail: e.target.value });
                    }}
                    className="input-field-standard pl-11 w-full"
                  />
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  This email will be used as the primary root login for your company portal.
                </span>
              </div>

              <div className="wizard-action-row">
                <div />
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-wizard-next"
                >
                  <span>Continue to Company Profile</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Company Profile & Industry */}
          {currentStep === 2 && (
            <div className="wizard-step-body" key="step2">
              <div className="wizard-step-header">
                <div className="wizard-step-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <BriefcaseIcon />
                </div>
                <div>
                  <h3 className="wizard-step-title">Organization Profile</h3>
                  <p className="wizard-step-desc">Configure your domain and hiring sector</p>
                </div>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Primary Industry <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => {
                    setStepError(null);
                    setFormData({ ...formData, industry: e.target.value });
                  }}
                  className="input-field-standard w-full"
                  style={{ cursor: 'pointer', height: '42px' }}
                  autoFocus
                >
                  <option value="Software & Technology">Software & Technology</option>
                  <option value="Artificial Intelligence">Artificial Intelligence & Data</option>
                  <option value="Fintech & Banking">Fintech & Banking</option>
                  <option value="Healthcare & Biotech">Healthcare & Biotech</option>
                  <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                  <option value="Cybersecurity">Cybersecurity & Cloud</option>
                  <option value="Manufacturing & Hardware">Manufacturing & Hardware</option>
                  <option value="Other">Other Enterprise Sector</option>
                </select>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Company Website (Optional)
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                    <GlobeIcon />
                  </span>
                  <input
                    type="url"
                    placeholder="https://acmetech.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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
                <span>Industry classification helps calibrate our AI candidate matching algorithms.</span>
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

          {/* STEP 3: Security & Password */}
          {currentStep === 3 && (
            <div className="wizard-step-body" key="step3">
              <div className="wizard-step-header">
                <div className="wizard-step-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <LockIcon />
                </div>
                <div>
                  <h3 className="wizard-step-title">Master Credentials</h3>
                  <p className="wizard-step-desc">Set your company portal master password</p>
                </div>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Create Password <span style={{ color: '#ef4444' }}>*</span>
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

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, confirmPassword: e.target.value });
                    }}
                    className="input-field-standard pl-11 w-full"
                  />
                </div>
              </div>

              {/* Password Requirements */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: formData.password.length >= 6 ? '#00b074' : '#94a3b8' }}>
                <CheckIcon />
                <span>Minimum 6 characters required for corporate enterprise security.</span>
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
                    <span>Registering Company...</span>
                  ) : (
                    <>
                      <span>Complete Company Registration</span>
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
            Already have a corporate account?{' '}
            <Link to="/company-login" className="auth-footer-link">
              Company Login
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
