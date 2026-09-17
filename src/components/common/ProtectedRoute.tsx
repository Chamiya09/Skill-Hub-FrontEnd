import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SleekSpinner } from './SkeletonCard';

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
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
        }}
      >
        <SleekSpinner size="lg" text="Verifying session credentials..." />
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    const isCandidatePath = location.pathname.startsWith('/candidate');
    const loginTarget = isCandidatePath ? '/candidate-login' : '/company-login';
    return <Navigate to={loginTarget} state={{ from: location }} replace />;
  }

  // Strict Role Check & Redirection
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (currentUser.role || '').toLowerCase();
    const isAuthorized = allowedRoles.some((role) => {
      const targetRole = role.toLowerCase();
      if (targetRole === 'employer' || targetRole === 'company') {
        return userRole === 'employer' || userRole === 'company' || userRole === 'admin';
      }
      return userRole === targetRole;
    });

    if (!isAuthorized) {
      // If Employer/Company attempts to access Candidate profile/routes -> redirect to Employer Dashboard
      if (userRole === 'company' || userRole === 'employer' || userRole === 'admin') {
        return <Navigate to={redirectPath || '/dashboard'} replace />;
      }
      // If Candidate attempts to access Employer ATS routes -> redirect to Candidate Portal
      if (userRole === 'candidate') {
        return <Navigate to={redirectPath || '/candidate/profile'} replace />;
      }
      return <Navigate to={redirectPath || '/'} replace />;
    }
  }

  return <>{children}</>;
};
