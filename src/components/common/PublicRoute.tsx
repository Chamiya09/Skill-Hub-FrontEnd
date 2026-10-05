import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
  deferAuthenticatedRedirect?: boolean;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children, deferAuthenticatedRedirect = false }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = React.useState(!isLoading);

  React.useEffect(() => {
    if (!isLoading) setHasCompletedInitialLoad(true);
  }, [isLoading]);

  if (isLoading && (!deferAuthenticatedRedirect || !hasCompletedInitialLoad)) {
    return null;
  }

  if (isAuthenticated && currentUser) {
    const role = (currentUser.role || '').toLowerCase();
    // Super Admin must ALWAYS be redirected to the Admin Dashboard and never allowed on public auth routes
    if (role === 'admin' || role === 'super_admin') {
      return <Navigate to="/skillhub-secure-admin/dashboard" replace />;
    }

    if (!deferAuthenticatedRedirect) {
      if (role === 'candidate') {
        return <Navigate to="/candidate/dashboard" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

