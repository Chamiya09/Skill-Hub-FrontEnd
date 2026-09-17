import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheckIcon,
  LockIcon,
  CheckIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
} from '../components/common/Icons';

export const CandidateSecurity: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Danger Zone States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Validation Flags
  const isLengthValid = newPassword.length >= 6;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmNewPassword;
  const isDifferentFromCurrent =
    newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword;

  // Handle Password Update Submission
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please provide your current account password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      // Simulate API request latency
      await new Promise((resolve) => setTimeout(resolve, 800));

      setPasswordSuccess('Your account password has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        setPasswordSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setPasswordError(err.message || 'Failed to update password. Please check your credentials.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type "DELETE" into the confirmation field to proceed.');
      return;
    }

    try {
      setIsDeletingAccount(true);
      setDeleteError(null);

      // Simulate API call for deletion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Clear authentication & redirect
      logout();
      navigate('/candidate-register', { replace: true });
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setDeleteError(err.message || 'Failed to delete account. Please try again later.');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="candidate-security-container">
      {/* 1. Header Card (System UI Theme) */}
      <div className="settings-header-card">
        <div>
          <div className="settings-badge">
            <ShieldCheckIcon />
            <span>Account Security</span>
          </div>
          <h1 className="settings-title">Account & Security</h1>
          <p className="settings-subtitle">
            Manage your authentication credentials, password encryption, and account status for your candidate portal.
          </p>
        </div>
      </div>

      {/* Success Notification Alert */}
      {passwordSuccess && (
        <div className="auth-alert-success" style={{ marginBottom: '8px' }}>
          <CheckIcon />
          <span>{passwordSuccess}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {passwordError && (
        <div
          className="auth-alert-error"
          style={{ justifyContent: 'space-between', marginBottom: '8px' }}
        >
          <span>{passwordError}</span>
          <button
            type="button"
            onClick={() => setPasswordError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b91c1c',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Password Management Card (System UI Theme) */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-title-box">
            <h2>Password Management</h2>
            <p>Ensure your candidate account is safeguarded with a secure, distinct password</p>
          </div>
          <span className="settings-step-badge">Authentication</span>
        </div>

        <form onSubmit={handlePasswordUpdate}>
          <div className="settings-form-grid" style={{ maxWidth: '640px' }}>
            {/* Current Password Field */}
            <div className="settings-form-group settings-col-full">
              <label htmlFor="currentPassword" className="settings-label">
                <span>Current Password</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <LockIcon />
                </span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  id="currentPassword"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="settings-input-field"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="settings-eye-toggle-btn"
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div className="settings-form-group settings-col-full">
              <label htmlFor="newPassword" className="settings-label">
                <span>New Password</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <LockIcon />
                </span>
                <input
                  type={showNew ? 'text' : 'password'}
                  id="newPassword"
                  required
                  minLength={6}
                  placeholder="Enter new strong password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="settings-input-field"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="settings-eye-toggle-btn"
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                >
                  {showNew ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div className="settings-form-group settings-col-full">
              <label htmlFor="confirmNewPassword" className="settings-label">
                <span>Confirm New Password</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <LockIcon />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmNewPassword"
                  required
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="settings-input-field"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="settings-eye-toggle-btn"
                  aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Requirements Checklist */}
          <div className="password-requirements-card">
            <div className="password-requirements-title">PASSWORD REQUIREMENTS:</div>
            <ul className="password-req-list">
              <li className={`password-req-item ${isLengthValid ? 'valid' : ''}`}>
                <span className="password-req-icon">{isLengthValid ? '✓' : '○'}</span>
                <span>Minimum 6 characters in length</span>
              </li>
              <li className={`password-req-item ${isMatchValid ? 'valid' : ''}`}>
                <span className="password-req-icon">{isMatchValid ? '✓' : '○'}</span>
                <span>New password and confirmation match</span>
              </li>
              {newPassword.length > 0 && currentPassword.length > 0 && (
                <li className={`password-req-item ${isDifferentFromCurrent ? 'valid' : ''}`}>
                  <span className="password-req-icon">{isDifferentFromCurrent ? '✓' : '○'}</span>
                  <span>Different from your current password</span>
                </li>
              )}
            </ul>
          </div>

          {/* Action Row */}
          <div
            className="settings-actions-footer"
            style={{
              maxWidth: '640px',
              marginTop: '24px',
              padding: '16px 0 0 0',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="settings-btn-save"
              style={{ width: 'auto', minWidth: '180px' }}
            >
              {isUpdatingPassword ? (
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
                  <ShieldCheckIcon />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Danger Zone Card (System UI Theme) */}
      <div className="danger-zone-card">
        <div className="danger-zone-header">
          <div>
            <div className="danger-badge">
              <span>DANGER ZONE</span>
            </div>
            <h2
              style={{
                fontSize: '16.5px',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
              }}
            >
              <span style={{ color: '#dc2626', display: 'flex' }}>
                <TrashIcon />
              </span>
              <span>Account Termination</span>
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Permanently remove your candidate profile and all associated application data.
            </p>
          </div>
          <span className="danger-step-badge">Irreversible</span>
        </div>

        {/* Warning Callout Box */}
        <div className="danger-warning-box">
          <div className="danger-warning-title">
            <span>⚠️</span>
            <span>Warning: Deleting your account is permanent</span>
          </div>
          <p className="danger-warning-desc">
            Once confirmed, your Digital CV, job applications, interview history, verified skills, and saved jobs will be completely erased. You cannot recover this account or any linked data afterwards.
          </p>
        </div>

        {/* Delete Trigger Button */}
        <div>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmationText('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="danger-btn-delete"
          >
            <TrashIcon />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* 4. Delete Account Confirmation Modal (System UI Theme) */}
      {showDeleteModal && (
        <div className="candidate-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div
            className="candidate-modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-delete-title"
          >
            {/* Modal Header */}
            <div className="candidate-modal-header" style={{ borderBottomColor: '#fee2e2' }}>
              <div className="candidate-modal-title-box">
                <div
                  className="candidate-icon-box"
                  style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                >
                  <TrashIcon />
                </div>
                <div className="candidate-modal-title-text">
                  <h2 id="modal-delete-title" style={{ color: '#991b1b' }}>
                    Delete Candidate Account?
                  </h2>
                  <p style={{ color: '#dc2626' }}>This action cannot be undone.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="candidate-modal-close-btn"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.55, margin: 0 }}>
                Are you absolutely sure you want to delete your Skill Hub candidate account? All submitted applications, resume details, and history will be permanently erased.
              </p>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                  }}
                >
                  To confirm, type <span style={{ color: '#dc2626', fontFamily: 'monospace', fontWeight: 800 }}>DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => {
                    setDeleteConfirmationText(e.target.value);
                    setDeleteError(null);
                  }}
                  placeholder="Type DELETE to confirm"
                  className="danger-modal-input"
                  autoFocus
                />
              </div>

              {deleteError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {deleteError}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="candidate-modal-footer">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteModal(false)}
                className="settings-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAccount || deleteConfirmationText.trim().toUpperCase() !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="danger-btn-delete"
              >
                {isDeletingAccount ? (
                  <>
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateSecurity;
