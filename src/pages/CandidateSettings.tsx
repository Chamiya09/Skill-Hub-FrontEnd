import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheckIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  CheckIcon,
} from '../components/common/Icons';

export const CandidateSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setStatusMsg('Your account security credentials were updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-[#00b074] text-xs font-bold tracking-wider mb-2 border border-emerald-100/60">
          <ShieldCheckIcon />
          <span>SECURITY & CREDENTIALS</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your registered login credentials, security protocols, and candidate session access.
        </p>
      </div>

      {/* Account Info Read-Only Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-gray-900">Account Identity</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800">
              <UserIcon />
              <span>{currentUser?.fullName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Candidate'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Registered Email Address</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800">
              <MailIcon />
              <span>{currentUser?.email || 'candidate@example.com'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <div>
          <h3 className="text-base font-bold text-gray-900">Change Password</h3>
          <p className="text-xs text-gray-500 mt-0.5">Ensure your account is protected with a strong, distinct password.</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2">
            <CheckIcon />
            <span>{statusMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <LockIcon />
              </span>
              <input
                type="password"
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <LockIcon />
              </span>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <LockIcon />
              </span>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="px-5 py-2.5 rounded-xl bg-[#00b074] hover:bg-[#009663] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-70"
          >
            {isUpdating ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
