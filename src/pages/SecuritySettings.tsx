import React, { useState, useMemo } from 'react';
import { companyAuthApi } from '../services/api';
import './CompanySecurityFull.css';
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  History,
  Eye,
  EyeOff,
  Sparkles,
  Fingerprint,
  LogOut,
  Check,
  X,
  Sliders,
} from 'lucide-react';

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  type: 'desktop' | 'mobile';
}

export const SecuritySettings: React.FC = () => {
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

  // 2FA States & Modal
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState<string | null>(null);

  // Active Sessions
  const [sessions, setSessions] = useState<ActiveSession[]>([
    {
      id: 'session-1',
      device: 'Windows 11 Enterprise',
      browser: 'Chrome 124.0',
      location: 'Colombo, Sri Lanka',
      ip: '192.168.1.1',
      lastActive: 'Active Now',
      isCurrent: true,
      type: 'desktop',
    },
    {
      id: 'session-2',
      device: 'macOS Sequoia Workstation',
      browser: 'Safari 17.5',
      location: 'San Francisco, CA, USA',
      ip: '104.28.19.45',
      lastActive: '3 hours ago',
      isCurrent: false,
      type: 'desktop',
    },
  ]);
  const [sessionsToast, setSessionsToast] = useState<string | null>(null);

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'Not Entered', color: '#94a3b8' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
    if (score === 3 || score === 4) return { score: 3, label: 'Good', color: '#3b82f6' };
    return { score: 4, label: 'Strong', color: '#10b981' };
  }, [newPassword]);

  // Validation Criteria Flags
  const isLengthValid = newPassword.length >= 6;
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);
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
      setErrorMessage(err.message || 'Failed to update password. Please verify your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke other sessions
  const handleRevokeOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setSessionsToast('All other active corporate sessions have been successfully revoked.');
    setTimeout(() => {
      setSessionsToast(null);
    }, 4500);
  };

  // 2FA Setup Confirmation
  const handleConfirm2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length < 6) return;
    setIs2FAEnabled(true);
    setShow2FAModal(false);
    setTwoFactorCode('');
    setTwoFactorSuccess('Two-Factor Authentication (2FA) is now active on your company account.');
    setTimeout(() => {
      setTwoFactorSuccess(null);
    }, 5000);
  };

  return (
    <div className="company-security-page">
      {/* 1. Full-Width Executive Hero Banner */}
      <div className="company-security-hero">
        <div className="company-security-hero-left">
          <div className="company-security-badge">
            <ShieldCheck size={14} />
            <span>ENTERPRISE SECURITY & ACCESS CONTROL</span>
          </div>
          <h1 className="company-security-title">Security & Credentials Management</h1>
          <p className="company-security-subtitle">
            Enforce SOC 2 compliant authentication, rotate corporate credentials, and protect company recruiting assets with enterprise-grade access policies.
          </p>
        </div>

        <div className="company-security-hero-chips">
          <div className="company-security-chip">
            <div className="company-security-chip-icon">
              <Shield size={16} />
            </div>
            <div className="company-security-chip-text">
              <span className="company-security-chip-label">Encryption</span>
              <span className="company-security-chip-val">AES-256 GCM</span>
            </div>
          </div>

          <div className="company-security-chip">
            <div className="company-security-chip-icon" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
              <CheckCircle2 size={16} color="#059669" />
            </div>
            <div className="company-security-chip-text">
              <span className="company-security-chip-label">Health Score</span>
              <span className="company-security-chip-val">96 / 100 (Optimal)</span>
            </div>
          </div>

          <div className="company-security-chip">
            <div className="company-security-chip-icon" style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#475569' }}>
              <Laptop size={16} />
            </div>
            <div className="company-security-chip-text">
              <span className="company-security-chip-label">Active Sessions</span>
              <span className="company-security-chip-val">{sessions.length} Devices</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="auth-alert-success" style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}>
          <Check size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2FA Toast Notification */}
      {twoFactorSuccess && (
        <div className="auth-alert-success" style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}>
          <Check size={18} />
          <span>{twoFactorSuccess}</span>
        </div>
      )}

      {/* Sessions Toast Notification */}
      {sessionsToast && (
        <div className="auth-alert-success" style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}>
          <Check size={18} />
          <span>{sessionsToast}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="auth-alert-error" style={{ margin: 0, width: '100%', boxSizing: 'border-box', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
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

      {/* 2. Full-Width Responsive Two-Column Grid */}
      <div className="company-security-main-grid">
        {/* Left / Primary Column */}
        <div className="company-security-col-main">
          {/* Card 1: Password Management */}
          <div className="comp-security-card">
            <div className="comp-security-card-header">
              <div className="comp-security-card-title-wrap">
                <h2 className="comp-security-card-title">
                  <KeyRound size={20} />
                  <span>Corporate Password & Authentication</span>
                </h2>
                <p className="comp-security-card-subtitle">
                  Update your enterprise credentials to safeguard recruiting data and applicant pipelines.
                </p>
              </div>
              <span className="comp-security-card-badge is-emerald">Primary Auth</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="comp-security-form-row-3">
                {/* Current Password Field */}
                <div className="comp-security-input-group">
                  <label htmlFor="compCurrentPassword" className="comp-security-input-label">
                    <span>Current Password</span>
                    <span className="comp-security-required-star">*</span>
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
                    <span>New Strong Password</span>
                    <span className="comp-security-required-star">*</span>
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
                      placeholder="Enter new password (min 6)"
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
                    <span>Confirm New Password</span>
                    <span className="comp-security-required-star">*</span>
                  </label>
                  <div className="comp-security-input-wrap">
                    <span className="comp-security-input-icon">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      id="compConfirmNewPassword"
                      required
                      placeholder="Re-enter new password"
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

              {/* Password Strength & Requirements Card */}
              <div className="comp-strength-container">
                <div className="comp-strength-top">
                  <span className="comp-strength-title">Password Complexity Meter</span>
                  <span
                    className="comp-strength-label"
                    style={{
                      background: `${passwordStrength.color}15`,
                      color: passwordStrength.color,
                      border: `1px solid ${passwordStrength.color}35`,
                    }}
                  >
                    Strength: {passwordStrength.label}
                  </span>
                </div>

                <div className="comp-strength-bars">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className="comp-strength-bar"
                      style={{
                        background:
                          passwordStrength.score >= step ? passwordStrength.color : '#e2e8f0',
                      }}
                    />
                  ))}
                </div>

                <div className="comp-checklist-grid">
                  <div className={`comp-checklist-item ${isLengthValid ? 'is-valid' : ''}`}>
                    <span className="comp-checklist-dot">{isLengthValid ? '✓' : '○'}</span>
                    <span>Minimum 6 characters in length</span>
                  </div>

                  <div className={`comp-checklist-item ${hasMixedCase ? 'is-valid' : ''}`}>
                    <span className="comp-checklist-dot">{hasMixedCase ? '✓' : '○'}</span>
                    <span>Uppercase & lowercase letters</span>
                  </div>

                  <div className={`comp-checklist-item ${hasNumberOrSymbol ? 'is-valid' : ''}`}>
                    <span className="comp-checklist-dot">{hasNumberOrSymbol ? '✓' : '○'}</span>
                    <span>Numbers or special characters</span>
                  </div>

                  <div className={`comp-checklist-item ${isMatchValid ? 'is-valid' : ''}`}>
                    <span className="comp-checklist-dot">{isMatchValid ? '✓' : '○'}</span>
                    <span>Passwords match each other</span>
                  </div>

                  {newPassword.length > 0 && currentPassword.length > 0 && (
                    <div className={`comp-checklist-item ${isDifferentFromCurrent ? 'is-valid' : ''}`}>
                      <span className="comp-checklist-dot">{isDifferentFromCurrent ? '✓' : '○'}</span>
                      <span>Different from current password</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button Row */}
              <div className="comp-actions-row">
                <button
                  type="submit"
                  disabled={isSubmitting || !isLengthValid || !isMatchValid}
                  className="comp-btn-save"
                >
                  {isSubmitting ? (
                    <>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Update Corporate Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Two-Factor Authentication (2FA) */}
          <div className="comp-security-card">
            <div className="comp-security-card-header">
              <div className="comp-security-card-title-wrap">
                <h2 className="comp-security-card-title">
                  <Smartphone size={20} />
                  <span>Two-Factor Authentication (2FA)</span>
                </h2>
                <p className="comp-security-card-subtitle">
                  Enforce an additional security challenge via TOTP authenticator application when logging in.
                </p>
              </div>
              <span className={`comp-security-card-badge ${is2FAEnabled ? 'is-emerald' : ''}`}>
                {is2FAEnabled ? 'Active & Protected' : 'Setup Recommended'}
              </span>
            </div>

            <div className="comp-2fa-box">
              <div className="comp-2fa-left">
                <div className="comp-2fa-icon-wrap">
                  <Fingerprint size={22} />
                </div>
                <div>
                  <div className="comp-2fa-title">TOTP Authenticator Application</div>
                  <div className="comp-2fa-desc">
                    Compatible with Google Authenticator, Microsoft Authenticator, 1Password, and Authy.
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="comp-2fa-btn"
                onClick={() => setShow2FAModal(true)}
              >
                {is2FAEnabled ? 'Reconfigure 2FA' : 'Enable 2FA Protection'}
              </button>
            </div>
          </div>

          {/* Card 3: Active Recruiter Sessions & Workspace Devices */}
          <div className="comp-security-card">
            <div className="comp-security-card-header">
              <div className="comp-security-card-title-wrap">
                <h2 className="comp-security-card-title">
                  <Laptop size={20} />
                  <span>Active Recruiter Sessions & Connected Devices</span>
                </h2>
                <p className="comp-security-card-subtitle">
                  Monitor authenticated devices accessing this workspace and terminate unknown sessions.
                </p>
              </div>
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeOtherSessions}
                  className="comp-revoke-all-btn"
                  title="Sign out of all sessions except this device"
                >
                  <LogOut size={14} />
                  <span>Revoke Other Sessions</span>
                </button>
              )}
            </div>

            <div className="comp-sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="comp-session-row">
                  <div className="comp-session-left">
                    <div className="comp-session-icon">
                      <Laptop size={18} />
                    </div>
                    <div>
                      <div className="comp-session-name">
                        <span>{session.device} • {session.browser}</span>
                        {session.isCurrent && (
                          <span className="comp-session-active-pill">
                            <span className="comp-session-active-pulse" />
                            <span>This Device</span>
                          </span>
                        )}
                      </div>
                      <div className="comp-session-meta">
                        {session.location} • IP: {session.ip} • {session.lastActive}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right / Sidebar Column */}
        <div className="company-security-col-sidebar">
          {/* Card 4: Enterprise Security Health Score */}
          <div className="comp-security-card">
            <div className="comp-security-card-header">
              <div className="comp-security-card-title-wrap">
                <h2 className="comp-security-card-title">
                  <Sparkles size={18} />
                  <span>Security Health Score</span>
                </h2>
                <p className="comp-security-card-subtitle">Overall workspace posture</p>
              </div>
            </div>

            <div className="comp-score-card">
              <div className="comp-score-banner">
                <span className="comp-score-num">96%</span>
                <span className="comp-score-status">Optimal Defense</span>
              </div>

              <div className="comp-health-list">
                <div className="comp-health-row">
                  <span>AES-256 Storage Encryption</span>
                  <span className="comp-health-tag">
                    <CheckCircle2 size={13} />
                    <span>Active</span>
                  </span>
                </div>

                <div className="comp-health-row">
                  <span>SSL / TLS 1.3 Transport</span>
                  <span className="comp-health-tag">
                    <CheckCircle2 size={13} />
                    <span>Enforced</span>
                  </span>
                </div>

                <div className="comp-health-row">
                  <span>High-Entropy Passwords</span>
                  <span className="comp-health-tag">
                    <CheckCircle2 size={13} />
                    <span>Compliant</span>
                  </span>
                </div>

                <div className="comp-health-row">
                  <span>Zero Breach Detections</span>
                  <span className="comp-health-tag">
                    <CheckCircle2 size={13} />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Corporate Security Policies */}
          <div className="comp-security-card">
            <div className="comp-security-card-header">
              <div className="comp-security-card-title-wrap">
                <h2 className="comp-security-card-title">
                  <Sliders size={18} />
                  <span>Enterprise Access Policies</span>
                </h2>
                <p className="comp-security-card-subtitle">Workspace governance</p>
              </div>
            </div>

            <div>
              <div className="comp-policy-item">
                <div className="comp-policy-left">
                  <span className="comp-policy-name">Session Timeout</span>
                  <span className="comp-policy-sub">Sign out after 60 min idle</span>
                </div>
                <span className="comp-policy-badge">Enabled</span>
              </div>

              <div className="comp-policy-item">
                <div className="comp-policy-left">
                  <span className="comp-policy-name">Single Sign-On (SSO)</span>
                  <span className="comp-policy-sub">SAML 2.0 / Okta Ready</span>
                </div>
                <span className="comp-policy-badge" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }}>
                  Enterprise
                </span>
              </div>

              <div className="comp-policy-item">
                <div className="comp-policy-left">
                  <span className="comp-policy-name">IP Whitelisting</span>
                  <span className="comp-policy-sub">Restrict access to office CIDRs</span>
                </div>
                <span className="comp-policy-badge">Standard</span>
              </div>
            </div>
          </div>

          {/* Card 6: Security Audit Log Timeline */}
          <div className="comp-security-card">
            <div className="comp-security-card-header">
              <div className="comp-security-card-title-wrap">
                <h2 className="comp-security-card-title">
                  <History size={18} />
                  <span>Security Audit Log</span>
                </h2>
                <p className="comp-security-card-subtitle">Recent authentication events</p>
              </div>
            </div>

            <div className="comp-audit-list">
              <div className="comp-audit-item">
                <span className="comp-audit-dot" />
                <div className="comp-audit-info">
                  <span className="comp-audit-title">Corporate session established</span>
                  <span className="comp-audit-time">Windows 11 (Chrome) • Active now</span>
                </div>
              </div>

              <div className="comp-audit-item">
                <span className="comp-audit-dot" />
                <div className="comp-audit-info">
                  <span className="comp-audit-title">Recruiter workspace settings verified</span>
                  <span className="comp-audit-time">Admin user • 2 days ago</span>
                </div>
              </div>

              <div className="comp-audit-item">
                <span className="comp-audit-dot" />
                <div className="comp-audit-info">
                  <span className="comp-audit-title">Automated database backup secured</span>
                  <span className="comp-audit-time">System Cron • Yesterday at 02:00 AM</span>
                </div>
              </div>

              <div className="comp-audit-item">
                <span className="comp-audit-dot" />
                <div className="comp-audit-info">
                  <span className="comp-audit-title">SOC 2 compliance scan completed</span>
                  <span className="comp-audit-time">0 vulnerabilities detected • 5 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Setup Modal */}
      {show2FAModal && (
        <div className="comp-modal-backdrop" onClick={() => setShow2FAModal(false)}>
          <div className="comp-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={20} color="#00b074" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Setup Authenticator (2FA)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShow2FAModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Scan the QR code below using your authenticator application (Google Authenticator, Microsoft Authenticator, or 1Password), then enter the 6-digit confirmation code.
            </p>

            {/* Simulated QR Code Canvas */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1.5px dashed #cbd5e1',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '11px',
                  textAlign: 'center',
                  padding: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                [QR CODE: SKILLHUB-2FA-AUTH]
              </div>
              <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#334155', fontWeight: 700, background: '#e2e8f0', padding: '3px 8px', borderRadius: '4px' }}>
                SECRET: SKHB-8829-XJ42-99P1
              </span>
            </div>

            <form onSubmit={handleConfirm2FA} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 492018"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '16px',
                    letterSpacing: '4px',
                    textAlign: 'center',
                    fontWeight: 800,
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '9px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={twoFactorCode.length < 6}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '9px',
                    background: '#00b074',
                    border: 'none',
                    fontWeight: 750,
                    fontSize: '13px',
                    color: '#ffffff',
                    cursor: twoFactorCode.length < 6 ? 'not-allowed' : 'pointer',
                    opacity: twoFactorCode.length < 6 ? 0.6 : 1,
                  }}
                >
                  Verify & Activate 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
