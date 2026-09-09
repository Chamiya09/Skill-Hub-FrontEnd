import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import {
  SparkleIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BuildingIcon,
  UsersIcon,
  LockIcon,
  MailIcon,
  GlobeIcon,
} from '../components/common/Icons';

export const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    industry: 'Software & Technology',
    website: '',
    adminFullName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Per-step Validation
  const validateStep1 = () => {
    if (!formData.companyName.trim()) {
      setStepError('Please enter your Company Name.');
      return false;
    }
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
      setStepError('Please enter a valid Company Contact Email address.');
      return false;
    }
    setStepError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.adminFullName.trim()) {
      setStepError('Please enter the Admin Full Name.');
      return false;
    }
    if (!formData.adminEmail.trim() || !formData.adminEmail.includes('@')) {
      setStepError('Please enter a valid Admin Corporate Email address.');
      return false;
    }
    setStepError(null);
    return true;
  };

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
      const response = await authApi.register({
        companyName: formData.companyName.trim(),
        contactEmail: formData.contactEmail.trim(),
        industry: formData.industry,
        website: formData.website.trim(),
        adminFullName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim(),
        password: formData.password,
      });

      setSuccessMessage(`Enterprise account for "${response.user.companyName}" provisioned! Redirecting...`);
      setTimeout(() => {
        navigate('/users');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register company. Please verify all details.');
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
            <span>ENTERPRISE ONBOARDING</span>
          </div>
          <h1 className="auth-title">Register Your Company</h1>
          <p className="auth-subtitle">
            Deploy Skill Hub's AI talent matching engine in 3 simple steps.
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
            <span className="wizard-step-label">Admin</span>
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

        {/* Form Form Container */}
        <form onSubmit={handleSubmit}>
          {/* STEP 1: Company Profile */}
          {currentStep === 1 && (
            <div className="wizard-step-body" key="step1">
              <div className="wizard-step-header">
                <div className="wizard-step-icon">
                  <BuildingIcon />
                </div>
                <div>
                  <h3 className="wizard-step-title">Company Profile</h3>
                  <p className="wizard-step-desc">Enter your organization details</p>
                </div>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Company Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
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
                    className="input-field-standard"
                    style={{ paddingLeft: '42px' }}
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Company Contact Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="contact@acmetech.com"
                    value={formData.contactEmail}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, contactEmail: e.target.value });
                    }}
                    className="input-field-standard"
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>

              <div className="form-field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group-item">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="input-field-standard"
                    style={{ cursor: 'pointer', height: '42px' }}
                  >
                    <option value="Software & Technology">Software & Tech</option>
                    <option value="Artificial Intelligence">AI & Data</option>
                    <option value="Fintech & Banking">Fintech</option>
                    <option value="Healthcare & Biotech">Healthcare</option>
                    <option value="E-Commerce & Retail">E-Commerce</option>
                  </select>
                </div>
                <div className="form-group-item">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Website (Optional)
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <GlobeIcon />
                    </span>
                    <input
                      type="url"
                      placeholder="https://acme.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="input-field-standard"
                      style={{ paddingLeft: '42px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="wizard-action-row">
                <div />
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-wizard-next"
                >
                  <span>Continue to Admin Details</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Admin User Details */}
          {currentStep === 2 && (
            <div className="wizard-step-body" key="step2">
              <div className="wizard-step-header">
                <div className="wizard-step-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <UsersIcon />
                </div>
                <div>
                  <h3 className="wizard-step-title">HR Administrator</h3>
                  <p className="wizard-step-desc">First administrator account for your company</p>
                </div>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Admin Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <UsersIcon />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.adminFullName}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, adminFullName: e.target.value });
                    }}
                    className="input-field-standard"
                    style={{ paddingLeft: '42px' }}
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Admin Corporate Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="sarah@acmetech.com"
                    value={formData.adminEmail}
                    onChange={(e) => {
                      setStepError(null);
                      setFormData({ ...formData, adminEmail: e.target.value });
                    }}
                    className="input-field-standard"
                    style={{ paddingLeft: '42px' }}
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
                <span>This user will be assigned the <strong>HR Admin</strong> role with full governance permissions.</span>
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

          {/* STEP 3: Security & Submit */}
          {currentStep === 3 && (
            <div className="wizard-step-body" key="step3">
              <div className="wizard-step-header">
                <div className="wizard-step-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <LockIcon />
                </div>
                <div>
                  <h3 className="wizard-step-title">Account Security</h3>
                  <p className="wizard-step-desc">Set your master password to secure your portal</p>
                </div>
              </div>

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Create Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
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
                    className="input-field-standard"
                    style={{ paddingLeft: '42px', paddingRight: '40px' }}
                    autoFocus
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

              <div className="form-group-item">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
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
                    className="input-field-standard"
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>

              {/* Password indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: formData.password.length >= 6 ? '#00b074' : '#94a3b8' }}>
                <CheckIcon />
                <span>Minimum 6 characters required for enterprise security.</span>
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
                    <span>Provisioning Enterprise Account...</span>
                  ) : (
                    <>
                      <span>Complete Registration</span>
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
            <Link to="/login" className="auth-footer-link">
              Sign In Here
            </Link>
          </p>
          <div className="auth-security-badge">
            <ShieldCheckIcon />
            <span>SOC-2 Type II Certified • Automatic HR Admin Provisioning</span>
          </div>
        </div>
      </div>
    </div>
  );
};
