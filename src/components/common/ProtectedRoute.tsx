import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SparkleIcon } from './Icons';
import { SuspendedAccountModal } from './SuspendedAccountModal';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Candidate' | 'Employer' | 'Company' | 'Admin' | string)[];
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectPath,
}) => {
  const { currentUser, isAuthenticated, isLoading, refreshProfile } = useAuth();
  const location = useLocation();
  const lastVerifiedRoute = useRef<string>('');

  // 2. State Verification: re-verify account suspension & identity via background API on route change
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const role = (currentUser.role || '').toLowerCase();
      if (role !== 'admin' && role !== 'super_admin') {
        if (lastVerifiedRoute.current !== location.pathname) {
          lastVerifiedRoute.current = location.pathname;
          refreshProfile().catch(() => {});
        }
      }
    }
  }, [location.pathname, isAuthenticated, currentUser?.id]);

  if (isLoading) {
    return (
      <div className="session-loading-screen" role="status" aria-live="polite">
        <div className="session-loading-mark" aria-hidden="true">
          <span className="session-loading-ring" />
          <span className="session-loading-sparkle"><SparkleIcon /></span>
        </div>
        <span className="session-loading-message">Loading your applications...</span>
      </div>
    );
  }

  // If unauthenticated: ALWAYS redirect to the correct login page.
  // NEVER redirect an unauthenticated user to a protected dashboard route (e.g. redirectPath="/dashboard"),
  // as this creates an infinite redirect ping-pong loop.
  if (!isAuthenticated || !currentUser) {
    const isAdminPath = location.pathname.startsWith('/skillhub-secure-admin');
    if (isAdminPath) {
      return <Navigate to="/skillhub-secure-admin" state={{ from: location }} replace />;
    }
    const isCandidatePath =
      location.pathname.startsWith('/candidate') ||
      location.pathname.startsWith('/candidate-profile') ||
      location.pathname.startsWith('/digital-cv');
    const loginTarget = isCandidatePath ? '/candidate-login' : '/company-login';
    return <Navigate to={loginTarget} state={{ from: location }} replace />;
  }

  // Strict Role Check & Redirection for authenticated users
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (currentUser.role || '').toLowerCase();
    const isAdminUser = userRole === 'admin' || userRole === 'super_admin';
    const isAdminPath = location.pathname.startsWith('/skillhub-secure-admin') || location.pathname.startsWith('/admin');

    // Super Admin must NEVER be loaded into company ATS or candidate workspaces
    if (isAdminUser && !isAdminPath) {
      return <Navigate to="/skillhub-secure-admin/dashboard" replace />;
    }

    const isAuthorized = allowedRoles.some((role) => {
      const targetRole = role.toLowerCase();
      if (targetRole === 'employer' || targetRole === 'company') {
        return userRole === 'employer' || userRole === 'company';
      }
      return userRole === targetRole;
    });

    if (!isAuthorized) {
      if (isAdminUser) {
        return <Navigate to="/skillhub-secure-admin/dashboard" replace />;
      }
      if (userRole === 'company' || userRole === 'employer') {
        return <Navigate to="/dashboard" replace />;
      }
      if (userRole === 'candidate') {
        return <Navigate to="/candidate/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  const isSuspended = Boolean(
    currentUser && (
      currentUser.isSuspended === true ||
      (currentUser.isSuspended as unknown) === 'true' ||
      (currentUser as any).status === 'Suspended'
    )
  );

  return (
    <>
      {/* 1. Global Placement: SuspendedAccountModal included on all protected routes */}
      <SuspendedAccountModal />

      {/* If suspended, blur and block all interactions with the underlying dashboard content */}
      {isSuspended ? (
        <div
          style={{
            filter: 'blur(8px)',
            pointerEvents: 'none',
            userSelect: 'none',
            minHeight: '100vh',
            width: '100%',
          }}
          aria-hidden="true"
        >
          {children}
        </div>
      ) : (
        children
      )}
    </>
  );
};
