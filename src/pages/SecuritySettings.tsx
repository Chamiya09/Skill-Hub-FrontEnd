import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { companyAuthApi } from '../services/api';
import './CompanySecurityFull.css';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Mail,
  RefreshCw,
  Info,
} from 'lucide-react';

export const SecuritySettings: React.FC = () => {
  const { currentUser } = useAuth();

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation Criteria Flags
  const isLengthValid = newPassword.length >= 6;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmNewPassword;
  const isDifferentFromCurrent =
    newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword;

  // Real Backend Password Update Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Please enter your current account password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('New password must be different from your current password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await companyAuthApi.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setSuccessMessage(res.message || 'Corporate account password successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setErrorMessage(
        err.message || 'Failed to update password. Please verify your current password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyName = currentUser?.companyName || currentUser?.fullName || 'Company Workspace';
  const companyEmail = currentUser?.contactEmail || currentUser?.email || 'hr@company.com';
  const isSuspended = currentUser?.isSuspended === true;

  return (
    <div className="company-security-page" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Full-Width Executive Hero Banner */}
      <div className="company-security-hero">
        <div className="company-security-hero-left">
          <div className="company-security-badge">
            <ShieldCheck size={14} />
            <span>COMPANY WORKSPACE SECURITY</span>
          </div>
          <h1 className="company-security-title">Account Security</h1>
          <p className="company-security-subtitle">
            Manage your company authentication credentials, master password encryption, and account access protection.
          </p>
        </div>

        <div className="company-security-hero-chips">
          <div className="company-security-chip">
            <div className="company-security-chip-icon">
              <Lock size={16} />
            </div>
            <div className="company-security-chip-text">
              <span className="company-security-chip-label">Master Password</span>
              <span className="company-security-chip-val">Protected (BCrypt)</span>
            </div>
          </div>

          <div className="company-security-chip">
            <div className="company-security-chip-icon" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
              <CheckCircle2 size={16} color="#059669" />
            </div>
            <div className="company-security-chip-text">
              <span className="company-security-chip-label">Account Status</span>
              <span className="company-security-chip-val">{isSuspended ? 'Suspended' : 'Active & Verified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Metric Tiles */}
      <div className="pipeline-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <article className="pipeline-summary-card summary-total" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', display: 'grid', placeItems: 'center', color: '#334155' }}>
            <Lock size={20} />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Authentication</span>
            <strong style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>BCrypt Hash</strong>
            <small style={{ fontSize: 12, color: '#059669', display: 'block', fontWeight: 600 }}>Salted 12-round encryption</small>
          </div>
        </article>

        <article className="pipeline-summary-card summary-ready" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e6f9f2', display: 'grid', placeItems: 'center', color: '#00b074' }}>
            <Building2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Organization</span>
            <strong style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={companyName}>
              {companyName}
            </strong>
            <small style={{ fontSize: 12, color: '#64748b', display: 'block', fontWeight: 600 }}>Company Employer</small>
          </div>
        </article>

        <article className="pipeline-summary-card summary-active" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'grid', placeItems: 'center', color: '#3b82f6' }}>
            <Mail size={20} />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Contact Email</span>
            <strong style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={companyEmail}>
              {companyEmail}
            </strong>
            <small style={{ fontSize: 12, color: '#059669', display: 'block', fontWeight: 600 }}>HR Recovery Target</small>
          </div>
        </article>

        <article className="pipeline-summary-card summary-applicants" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: isSuspended ? '#fef2f2' : '#ecfdf5', display: 'grid', placeItems: 'center', color: isSuspended ? '#dc2626' : '#059669' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Account Status</span>
            <strong style={{ fontSize: 16, fontWeight: 800, color: isSuspended ? '#dc2626' : '#059669' }}>
              {isSuspended ? 'Suspended' : 'Active'}
            </strong>
            <small style={{ fontSize: 12, color: '#64748b', display: 'block', fontWeight: 600 }}>
              {isSuspended ? 'Account restricted' : 'Operational workspace'}
            </small>
          </div>
        </article>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="auth-alert-success" style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="auth-alert-error" style={{ margin: 0, width: '100%', boxSizing: 'border-box', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#dc2626" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#b91c1c', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Main Workspace: Two-Column Layout (Form + Security Best Practices) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Change Password Card */}
        <div className="comp-security-card" style={{ width: '100%' }}>
          <div className="comp-security-card-header">
            <div className="comp-security-card-title-wrap">
              <h2 className="comp-security-card-title">
                <KeyRound size={20} />
                <span>Change Corporate Password</span>
              </h2>
              <p className="comp-security-card-subtitle">
                Update your enterprise credentials to safeguard recruiting data and candidate hiring pipelines.
              </p>
            </div>
            <span className="comp-security-card-badge is-emerald">PRIMARY AUTH</span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Current Password Field */}
              <div className="comp-security-input-group">
                <label htmlFor="compCurrentPassword" className="comp-security-input-label">
                  <span>Current Password <strong className="comp-security-required-star">*</strong></span>
                </label>
                <div className="comp-security-input-wrap">
                  <span className="comp-security-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    id="compCurrentPassword"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="comp-security-input-field"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="comp-security-eye-btn"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="comp-security-input-group">
                <label htmlFor="compNewPassword" className="comp-security-input-label">
                  <span>New Password <strong className="comp-security-required-star">*</strong></span>
                </label>
                <div className="comp-security-input-wrap">
                  <span className="comp-security-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showNew ? 'text' : 'password'}
                    id="compNewPassword"
                    required
                    minLength={6}
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="comp-security-input-field"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="comp-security-eye-btn"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div className="comp-security-input-group">
                <label htmlFor="compConfirmNewPassword" className="comp-security-input-label">
                  <span>Confirm New Password <strong className="comp-security-required-star">*</strong></span>
                </label>
                <div className="comp-security-input-wrap">
                  <span className="comp-security-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="compConfirmNewPassword"
                    required
                    placeholder="Repeat your new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="comp-security-input-field"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="comp-security-eye-btn"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div
              style={{
                marginTop: 18,
                padding: '14px 18px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                }}
              >
                Password Requirements:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isLengthValid ? '#047857' : '#94a3b8',
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: isLengthValid ? '#00b074' : '#e2e8f0',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    {isLengthValid ? '✓' : '•'}
                  </span>
                  <span>Minimum 6 characters</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isMatchValid ? '#047857' : '#94a3b8',
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: isMatchValid ? '#00b074' : '#e2e8f0',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    {isMatchValid ? '✓' : '•'}
                  </span>
                  <span>New passwords match</span>
                </div>

                {newPassword.length > 0 && currentPassword.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: isDifferentFromCurrent ? '#047857' : '#94a3b8',
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: isDifferentFromCurrent ? '#00b074' : '#e2e8f0',
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 9,
                        fontWeight: 900,
                      }}
                    >
                      {isDifferentFromCurrent ? '✓' : '•'}
                    </span>
                    <span>Different from current</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button Row */}
            <div className="comp-actions-row" style={{ marginTop: 20 }}>
              <button
                type="submit"
                disabled={isSubmitting || !isLengthValid || !isMatchValid || !isDifferentFromCurrent}
                className="comp-btn-save"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spinner" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Update Corporate Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Security Best Practices & Support Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="comp-security-card" style={{ width: '100%' }}>
            <div className="comp-security-card-header">
              <div className="comp-security-card-title-wrap">
                <h3 className="comp-security-card-title">
                  <ShieldCheck size={18} />
                  <span>Workspace Security Guidelines</span>
                </h3>
                <p className="comp-security-card-subtitle">
                  Recommendations to keep your hiring pipelines and candidate data secure.
                </p>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e6f9f2', display: 'grid', placeItems: 'center', color: '#00b074', flexShrink: 0, marginTop: 2 }}>
                  <Lock size={14} />
                </div>
                <div>
                  <strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 2 }}>Credential Privacy</strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                    Never share corporate access passwords across external messaging tools. Each recruiter should use their designated credentials.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eff6ff', display: 'grid', placeItems: 'center', color: '#3b82f6', flexShrink: 0, marginTop: 2 }}>
                  <KeyRound size={14} />
                </div>
                <div>
                  <strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 2 }}>Regular Password Rotation</strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                    We recommend rotating your company master password every 90 days to maintain high security standards across hiring teams.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fef3c7', display: 'grid', placeItems: 'center', color: '#d97706', flexShrink: 0, marginTop: 2 }}>
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 2 }}>Encryption & Data Protection</strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                    All applicant resumes, interview ratings, and job vacancy details are encrypted in transit via TLS 1.3 and at rest with BCrypt salted hashing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Need Security Help Card */}
          <div
            style={{
              padding: '18px 22px',
              borderRadius: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e6f9f2', display: 'grid', placeItems: 'center', color: '#00b074', flexShrink: 0 }}>
              <Info size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 2 }}>Need Security Support?</strong>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                If you suspect unauthorized access to your company account, contact{' '}
                <a href="mailto:support@skillhub.com" style={{ color: '#00b074', fontWeight: 700, textDecoration: 'none' }}>
                  support@skillhub.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
