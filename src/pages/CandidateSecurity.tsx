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
  const isDifferentFromCurrent = newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword;

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
    <div className="space-y-6 max-w-4xl pb-12">
      {/* 1. Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-none">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-[#00b074] text-xs font-bold tracking-wider mb-2 border border-emerald-100/60">
          <ShieldCheckIcon />
          <span>SECURITY & CREDENTIALS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Account & Security</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-2xl">
          Manage your candidate access credentials, password encryption, and irreversible account termination settings.
        </p>
      </div>

      {/* 2. Password Management Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <LockIcon />
              <span>Password Management</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Ensure your candidate portal is safeguarded with a secure, distinct password.
            </p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">
            Authentication
          </span>
        </div>

        {/* Success Alert */}
        {passwordSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-100 rounded-full text-[#00b074]">
                <CheckIcon />
              </span>
              <span>{passwordSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setPasswordSuccess(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {passwordError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{passwordError}</span>
            </div>
            <button
              type="button"
              onClick={() => setPasswordError(null)}
              className="text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-xl">
          {/* Current Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <LockIcon />
              </span>
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <LockIcon />
              </span>
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <LockIcon />
              </span>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Password Strength / Verification Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-gray-700 tracking-wider">PASSWORD REQUIREMENTS</span>
            <ul className="space-y-1.5 text-xs">
              <li className={`flex items-center gap-2 ${isLengthValid ? 'text-emerald-600 font-semibold' : 'text-gray-500'}`}>
                <span className="font-bold">{isLengthValid ? '✓' : '○'}</span>
                <span>Minimum 6 characters in length</span>
              </li>
              <li className={`flex items-center gap-2 ${isMatchValid ? 'text-emerald-600 font-semibold' : 'text-gray-500'}`}>
                <span className="font-bold">{isMatchValid ? '✓' : '○'}</span>
                <span>New password and confirmation match</span>
              </li>
              {newPassword.length > 0 && currentPassword.length > 0 && (
                <li className={`flex items-center gap-2 ${isDifferentFromCurrent ? 'text-emerald-600 font-semibold' : 'text-gray-500'}`}>
                  <span className="font-bold">{isDifferentFromCurrent ? '✓' : '○'}</span>
                  <span>Different from your current password</span>
                </li>
              )}
            </ul>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-6 py-2.5 rounded-xl bg-[#00b074] hover:bg-[#009663] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 shadow-none"
            >
              {isUpdatingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

      {/* 3. Card 2: Danger Zone Card */}
      <div className="bg-white border border-red-200 rounded-2xl p-6 sm:p-8 shadow-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-100 text-red-700 text-[11px] font-bold tracking-wider mb-1.5">
              <span>DANGER ZONE</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-red-600"><TrashIcon /></span>
              <span>Account Termination</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Permanently remove your candidate profile and all associated data from the Skill Hub platform.
            </p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full">
            Irreversible
          </span>
        </div>

        {/* Warning Callout Box */}
        <div className="p-4 rounded-xl bg-red-50/50 border border-red-200/80 text-xs sm:text-sm text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-700">
            <span>⚠️</span>
            <span>Warning: Deleting your account is permanent</span>
          </div>
          <p className="text-red-700/90 leading-relaxed text-xs">
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
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-none flex items-center gap-2"
          >
            <TrashIcon />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* 4. Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 sm:p-7 shadow-none space-y-5 animate-scaleUp"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-delete-title"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <TrashIcon />
                </div>
                <div>
                  <h3 id="modal-delete-title" className="text-lg font-bold text-gray-900">
                    Delete Candidate Account?
                  </h3>
                  <p className="text-xs text-red-600 font-medium">This action cannot be undone.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            {/* Modal Body */}
            <div className="text-xs sm:text-sm text-gray-600 space-y-3">
              <p>
                Are you absolutely sure you want to delete your Skill Hub candidate account? All submitted applications and resume details will be instantly removed.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  To confirm, type <span className="text-red-600 uppercase font-mono">DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => {
                    setDeleteConfirmationText(e.target.value);
                    setDeleteError(null);
                  }}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                  autoFocus
                />
              </div>

              {deleteError && (
                <p className="text-xs font-semibold text-red-600">{deleteError}</p>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAccount || deleteConfirmationText.trim().toUpperCase() !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-none"
              >
                {isDeletingAccount ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
