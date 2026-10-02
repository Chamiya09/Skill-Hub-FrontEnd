import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && currentUser) {
    const role = (currentUser.role || '').toLowerCase();
    if (role === 'admin' || role === 'super_admin') {
      return <Navigate to="/skillhub-secure-admin/dashboard" replace />;
    }
    if (role === 'candidate') {
      return <Navigate to="/candidate/profile" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

