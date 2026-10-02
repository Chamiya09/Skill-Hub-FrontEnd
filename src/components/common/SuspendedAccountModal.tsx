import React, { useEffect } from 'react';
import { LogOut, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SuspendedAccountModal: React.FC = () => {
  const { currentUser, logout } = useAuth();

  // Block ESC key or outside actions while suspended
  useEffect(() => {
    if (currentUser?.isSuspended) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [currentUser?.isSuspended]);

  // If user is not logged in or not suspended, do not render
  if (!currentUser || !currentUser.isSuspended) {
    return null;
  }

  const handleLogout = () => {
    logout();
    // Redirect to public homepage
    window.location.href = '/';
  };

  return (
    <div
      className="fixed inset-0 z-[99999] backdrop-blur-md bg-slate-900/60 flex items-center justify-center p-4 select-none"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="suspended-modal-title"
      aria-describedby="suspended-modal-description"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center gap-5 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Warning Icon Badge */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
            <ShieldAlert size={32} strokeWidth={2.2} />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
          </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h2
            id="suspended-modal-title"
            className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
          >
            Account Suspended
          </h2>
          <p
            id="suspended-modal-description"
            className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto"
          >
            Your account has been suspended due to suspicious activities. Please contact our support team to resolve this issue.
          </p>
        </div>

        {/* Contact Email Support Box */}
        <div className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-700">
          <Mail size={15} className="text-emerald-600 flex-shrink-0" />
          <span>Support Contact:</span>
          <a
            href="mailto:support@skillhub.com"
            className="font-bold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-300 hover:decoration-emerald-500 transition-colors"
          >
            support@skillhub.com
          </a>
        </div>

        {/* Non-dismissible: Logout is the ONLY action allowed */}
        <div className="w-full pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
