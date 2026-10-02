import React, { useEffect, useState } from 'react';
import { LogOut, Mail, ShieldAlert, Copy, Check, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SuspendedAccountModal: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [copied, setCopied] = useState(false);

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
    window.location.href = '/';
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText('support@skillhub.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const userDisplayName = currentUser.fullName || currentUser.companyName || currentUser.email;
  const userRole = (currentUser.role || 'User').toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[99999] backdrop-blur-md bg-slate-900/65 flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="suspended-modal-title"
      aria-describedby="suspended-modal-description"
      style={{ fontFamily: "var(--font-family, 'Plus Jakarta Sans', sans-serif)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-[460px] bg-white rounded-3xl p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_0_0_1px_rgba(226,232,240,0.8)] text-center flex flex-col items-center gap-6 relative animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Decorative Ambient Background Glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Security Warning Badge & Icon */}
        <div className="relative mt-1">
          {/* Subtle Outer Container */}
          <div className="w-20 h-20 rounded-2xl bg-rose-50/80 border border-rose-100 flex items-center justify-center shadow-inner relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-rose-100/90 to-rose-50 border border-rose-200/90 flex items-center justify-center text-rose-600 shadow-xs">
              <ShieldAlert size={30} strokeWidth={2.2} />
            </div>
            
            {/* Live Status Pulse Dot */}
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 ring-2 ring-white" />
            </span>
          </div>
        </div>

        {/* Header & Description */}
        <div className="space-y-2.5 max-w-sm mx-auto">
          <h2
            id="suspended-modal-title"
            className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight"
          >
            Account Suspended
          </h2>

          <p
            id="suspended-modal-description"
            className="text-[13.5px] sm:text-14 text-slate-500 leading-relaxed font-medium"
          >
            Your account has been suspended due to suspicious activities. Please contact our support team to resolve this issue.
          </p>
        </div>

        {/* Suspended User Context Chip */}
        {userDisplayName && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/70 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="max-w-[240px] truncate">{currentUser.email || userDisplayName}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 text-slate-700 tracking-wide uppercase">
              {userRole}
            </span>
          </div>
        )}

        {/* Support Contact Pill Card (Skill Hub Brand Green Theme) */}
        <div className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-xs hover:border-[#00b074]/40 transition-colors">
          <div className="flex items-center gap-2.5 text-slate-700 text-left min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#e6f9f2] border border-[#b7eedc] flex items-center justify-center text-[#00b074] shrink-0">
              <Mail size={14} strokeWidth={2.4} />
            </div>
            <div className="truncate">
              <span className="text-slate-500 block text-[11px] font-semibold uppercase tracking-wider">
                Support Contact
              </span>
              <a
                href="mailto:support@skillhub.com?subject=Account%20Suspension%20Inquiry%20-%20Skill%20Hub"
                className="font-bold text-[#00b074] hover:text-[#009663] transition-colors truncate block text-[13px]"
              >
                support@skillhub.com
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyEmail}
            title="Copy support email address"
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={12} className="text-[#00b074]" strokeWidth={2.6} />
                <span className="text-[#00b074]">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} strokeWidth={2.2} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Sign Out Action Button */}
        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm bg-[#0f172a] hover:bg-[#1e293b] active:bg-[#020617] text-white shadow-[0_4px_14px_rgba(15,23,42,0.18)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.25)] transition-all active:scale-[0.99] cursor-pointer"
          >
            <LogOut size={16} strokeWidth={2.4} />
            <span>Sign Out</span>
          </button>

          {/* Secure Platform Watermark */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Lock size={11} strokeWidth={2} />
            <span>Skill Hub Identity & Access Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
