import React, { useState } from 'react';
import { companyAuthApi } from '../services/api';
import {
  ShieldCheckIcon,
  CheckIcon,
  SparkleIcon,
  EyeIcon,
  EyeOffIcon,
} from '../components/common/Icons';

export const SecuritySettings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation checks
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

      setSuccessMessage(res.message || 'Password successfully updated.');
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

  const isLengthValid = newPassword.length >= 6;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmNewPassword;

  return (
    <div className="company-settings-container">
      {/* Header Card */}
      <div className="settings-header-card">
        <div>
          <div className="settings-badge">
            <SparkleIcon />
            <span>Account Security</span>
          </div>
          <h1 className="settings-title">Security & Password Settings</h1>
          <p className="settings-subtitle">
            Manage your corporate credentials and maintain enterprise-grade access control for your recruiting portal.
          </p>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="auth-alert-success" style={{ marginBottom: '24px' }}>
          <CheckIcon />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="auth-alert-error" style={{ justifyContent: 'space-between', marginBottom: '24px' }}>
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Password Change Card */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-title-box">
            <h2>Change Password</h2>
            <p>Ensure your account uses a strong, unique password</p>
          </div>
          <span className="settings-step-badge">Authentication</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="settings-form-grid" style={{ maxWidth: '640px' }}>
            {/* Current Password */}
            <div className="settings-form-group settings-col-full">
              <label htmlFor="currentPassword" className="settings-label">
                <span>Current Password</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <ShieldCheckIcon />
                </span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  id="currentPassword"
                  required
                  placeholder="Enter current account password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="settings-input-field"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="settings-form-group settings-col-full">
              <label htmlFor="newPassword" className="settings-label">
                <span>New Password</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <ShieldCheckIcon />
                </span>
                <input
                  type={showNew ? 'text' : 'password'}
                  id="newPassword"
                  required
                  placeholder="Enter new strong password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="settings-input-field"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="settings-form-group settings-col-full">
              <label htmlFor="confirmNewPassword" className="settings-label">
                <span>Confirm New Password</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <ShieldCheckIcon />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmNewPassword"
                  required
                  placeholder="Repeat new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="settings-input-field"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Requirements Checklist */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 20px',
              maxWidth: '640px',
              marginTop: '16px',
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              PASSWORD REQUIREMENTS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLengthValid ? '#059669' : '#64748b' }}>
                <span style={{ fontSize: '14px', fontWeight: 800 }}>{isLengthValid ? '✓' : '○'}</span>
                <span>Minimum 6 characters in length</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMatchValid ? '#059669' : '#64748b' }}>
                <span style={{ fontSize: '14px', fontWeight: 800 }}>{isMatchValid ? '✓' : '○'}</span>
                <span>New passwords must match each other</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="settings-actions-footer" style={{ maxWidth: '640px', marginTop: '24px', padding: '16px 0 0 0', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="settings-btn-save"
              style={{ width: 'auto', minWidth: '170px' }}
            >
              {isSubmitting ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon />
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
