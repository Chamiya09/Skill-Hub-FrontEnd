import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';
import '../../pages/TechnicalAssessmentsFull.css';
import '../../pages/CompanySecurityFull.css';
import './AdminDashboard.css';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Mail,
  RefreshCw,
  Info,
  Shield,
  Server,
} from 'lucide-react';

export const AdminSecurityView: React.FC = () => {
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

  // Validation Flags
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
      setErrorMessage('Please enter your current administrator password.');
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
      setErrorMessage('New password must be different from your current administrator password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adminApi.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setSuccessMessage(res.message || 'Super Administrator password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Admin password update error:', err);
      setErrorMessage(
        err.message || 'Failed to update credentials. Please verify your current administrator password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const adminEmail = currentUser?.email || 'admin@skillhub.internal';
  const adminName = currentUser?.fullName || 'Super Administrator';

  return (
    <div className="company-security-page" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Full-Width Executive Hero Banner (Identical to Company Side Theme) */}
      <div className="company-security-hero">
        <div className="company-security-hero-left">
          <div className="company-security-badge">
            <ShieldCheck size={14} />
            <span>ROOT PLATFORM GOVERNANCE & ACCESS CONTROL</span>
          </div>
          <h1 className="company-security-title">Account Security</h1>
          <p className="company-security-subtitle">
            Manage your Super Administrator credentials, master password encryption, and root platform governance.
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
              <span className="company-security-chip-label">Security Status</span>
              <span className="company-security-chip-val">Active & Enforced</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Metric Tiles (4-Card Grid matching Company Security) */}
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
            <UserCheck size={20} />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Authority Node</span>
            <strong style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={adminName}>
              {adminName}
            </strong>
            <small style={{ fontSize: 12, color: '#64748b', display: 'block', fontWeight: 600 }}>Super Administrator</small>
          </div>
        </article>

        <article className="pipeline-summary-card summary-active" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'grid', placeItems: 'center', color: '#3b82f6' }}>
            <Mail size={20} />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Governance Email</span>
            <strong style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={adminEmail}>
              {adminEmail}
            </strong>
            <small style={{ fontSize: 12, color: '#059669', display: 'block', fontWeight: 600 }}>Internal Root Target</small>
          </div>
        </article>

        <article className="pipeline-summary-card summary-applicants" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', display: 'grid', placeItems: 'center', color: '#059669' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Account Status</span>
            <strong style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>Active</strong>
            <small style={{ fontSize: 12, color: '#64748b', display: 'block', fontWeight: 600 }}>Operational root node</small>
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

      {/* 3. Main Workspace: Two-Column Layout (Form + Governance Guidelines) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Change Administrator Password Card */}
        <div className="comp-security-card" style={{ width: '100%' }}>
          <div className="comp-security-card-header">
            <div className="comp-security-card-title-wrap">
              <h2 className="comp-security-card-title">
                <KeyRound size={20} />
                <span>Change Administrator Password</span>
              </h2>
              <p className="comp-security-card-subtitle">
                Ensure your Super Administrator account is safeguarded with a secure, distinct password.
              </p>
            </div>
            <span className="comp-security-card-badge is-emerald">AUTHENTICATION</span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Current Password Field */}
              <div className="comp-security-input-group">
                <label htmlFor="adminCurrentPassword" className="comp-security-input-label">
                  <span>Current Password <strong className="comp-security-required-star">*</strong></span>
                </label>
                <div className="comp-security-input-wrap">
                  <span className="comp-security-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    id="adminCurrentPassword"
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
                <label htmlFor="adminNewPassword" className="comp-security-input-label">
                  <span>New Password <strong className="comp-security-required-star">*</strong></span>
                </label>
                <div className="comp-security-input-wrap">
                  <span className="comp-security-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showNew ? 'text' : 'password'}
                    id="adminNewPassword"
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
                <label htmlFor="adminConfirmNewPassword" className="comp-security-input-label">
                  <span>Confirm New Password <strong className="comp-security-required-star">*</strong></span>
                </label>
                <div className="comp-security-input-wrap">
                  <span className="comp-security-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="adminConfirmNewPassword"
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
                    <span>Update Administrator Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Super Admin Governance Guidelines & Security Notice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="comp-security-card" style={{ width: '100%' }}>
            <div className="comp-security-card-header">
              <div className="comp-security-card-title-wrap">
                <h3 className="comp-security-card-title">
                  <ShieldCheck size={18} />
                  <span>Platform Governance Policies</span>
                </h3>
                <p className="comp-security-card-subtitle">
                  Strict security protocols enforced for Super Administrator credentials.
                </p>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e6f9f2', display: 'grid', placeItems: 'center', color: '#00b074', flexShrink: 0, marginTop: 2 }}>
                  <Lock size={14} />
                </div>
                <div>
                  <strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 2 }}>Master Key Isolation</strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                    Super Admin credentials have full authority over account suspensions, company registries, and inquiries. Never disclose login tokens.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eff6ff', display: 'grid', placeItems: 'center', color: '#3b82f6', flexShrink: 0, marginTop: 2 }}>
                  <Server size={14} />
                </div>
                <div>
                  <strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 2 }}>Database & API Hardening</strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                    All administrative updates are hashed using BCrypt and checked against PostgreSQL identity tables on every request.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fef3c7', display: 'grid', placeItems: 'center', color: '#d97706', flexShrink: 0, marginTop: 2 }}>
                  <Shield size={14} />
                </div>
                <div>
                  <strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 2 }}>Audit & Session Security</strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                    Admin tokens are isolated in separate client storage keys (`skillhub_admin_token`) to prevent session crossing with candidate or company accounts.
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
              <strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 2 }}>DevOps & Root Access Inquiries</strong>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                For technical incident recovery or infrastructure support, contact internal operations at{' '}
                <a href="mailto:admin@skillhub.internal" style={{ color: '#00b074', fontWeight: 700, textDecoration: 'none' }}>
                  admin@skillhub.internal
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurityView;
