import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (isAuthenticated && currentUser) {
    if (currentUser.role?.toLowerCase() === 'candidate') {
      return <Navigate to="/candidate/profile" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

