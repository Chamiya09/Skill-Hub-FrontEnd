import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import '../../pages/TechnicalAssessmentsFull.css';
import '../../pages/CompanySecurityFull.css';
import './AdminDashboard.css';

export const AdminSecurityView: React.FC = () => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%' }}>
      {/* =========================================================
          1. TOP COMPONENT: ADMIN DETAILS BOX & ACCOUNT METRICS
          ========================================================= */}
      <section className="pipeline-dashboard-card" aria-labelledby="security-dashboard-title" style={{ width: '100%' }}>
        <div className="pipeline-dashboard-header">
          <div>
            <span className="pipeline-dashboard-eyebrow">ACCOUNT GOVERNANCE &amp; ACCESS CONTROL</span>
            <h2 id="security-dashboard-title">Account Security</h2>
            <p>
              Manage your Super Administrator credentials, password encryption, and account access protection.
            </p>
          </div>

          <div className="pipeline-dashboard-header-actions">
            <span className="pipeline-dashboard-live">
              <span /> Security Active
            </span>
          </div>
        </div>

        <div className="pipeline-summary-grid">
          <article className="pipeline-summary-card summary-total">
            <div className="summary-icon"><Lock size={20} /></div>
            <div>
              <span>Master Password</span>
              <strong>Protected</strong>
              <small>BCrypt salted hash encryption</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-ready">
            <div className="summary-icon"><ShieldCheck size={20} /></div>
            <div>
              <span>Account Role</span>
              <strong>Super Admin</strong>
              <small>Full platform governance</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-active">
            <div className="summary-icon"><CheckCircle2 size={20} /></div>
            <div>
              <span>Account Status</span>
              <strong>Active</strong>
              <small>Operational root node</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-applicants">
            <div className="summary-icon"><UserCheck size={20} /></div>
            <div>
              <span>Admin Authority</span>
              <strong>Verified</strong>
              <small>Master access authorized</small>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          2. FEEDBACK ALERTS
          ========================================================= */}
      {successMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 18px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 12,
            color: '#065f46',
            fontSize: 13.5,
            fontWeight: 650,
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 18px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            color: '#991b1b',
            fontSize: 13.5,
            fontWeight: 650,
          }}
        >
          <AlertCircle size={18} color="#dc2626" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* =========================================================
          3. MAIN WORKSPACE: PASSWORD MANAGEMENT CARD
          ========================================================= */}
      <div className="comp-security-card" style={{ maxWidth: 860, width: '100%', margin: '0 auto' }}>
        <div className="comp-security-card-header">
          <div className="comp-security-card-title-wrap">
            <h3 className="comp-security-card-title">
              <KeyRound size={18} />
              <span>Change Administrator Password</span>
            </h3>
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
              <label className="comp-security-input-label">
                <span>Current Password <strong className="comp-security-required-star">*</strong></span>
              </label>
              <div className="comp-security-input-wrap">
                <span className="comp-security-input-icon"><Lock size={15} /></span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="comp-security-input-field"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="comp-security-eye-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div className="comp-security-input-group">
              <label className="comp-security-input-label">
                <span>New Password <strong className="comp-security-required-star">*</strong></span>
              </label>
              <div className="comp-security-input-wrap">
                <span className="comp-security-input-icon"><Lock size={15} /></span>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="comp-security-input-field"
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="comp-security-eye-btn"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div className="comp-security-input-group">
              <label className="comp-security-input-label">
                <span>Confirm New Password <strong className="comp-security-required-star">*</strong></span>
              </label>
              <div className="comp-security-input-wrap">
                <span className="comp-security-input-icon"><Lock size={15} /></span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="comp-security-input-field"
                  placeholder="Repeat your new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="comp-security-eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
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
              }}
            >
              PASSWORD REQUIREMENTS:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
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
              className="comp-btn-save"
              disabled={isSubmitting || !isLengthValid || !isMatchValid || !isDifferentFromCurrent}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={15} className="spinner" />
                  <span>Saving Password...</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSecurityView;
