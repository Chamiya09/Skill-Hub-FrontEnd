import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CandidateSidebar } from './CandidateSidebar';
import { ClockIcon, MenuIcon } from '../common/Icons';

export const CandidateLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading } = useAuth();

  // Role Protection: Redirect Employers away from Candidate Portal
  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      const role = (currentUser.role || '').toLowerCase();
      if (role === 'company' || role === 'employer' || role === 'admin') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, currentUser, navigate]);

  // Real-time Live Clock (matching Company Dashboard)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = (() => {
    const dateStr = currentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = currentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} | ${timeStr}`;
  })();

  const getPageTitle = () => {
    if (location.pathname.startsWith('/candidate/recommended') || location.pathname.startsWith('/candidate/dashboard')) return 'AI Job Recommendations';
    if (location.pathname.startsWith('/candidate/applications')) return 'Applied Jobs';
    if (location.pathname.startsWith('/candidate/saved')) return 'Saved Jobs';
    if (location.pathname.startsWith('/candidate/settings') || location.pathname.startsWith('/candidate/security')) return 'Account & Security';
    return 'My Digital CV';
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="dashboard-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Candidate Sidebar */}
      <CandidateSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="dashboard-main-area">
        {/* Dashboard Topbar */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <MenuIcon />
            </button>
            <div className="topbar-breadcrumb">
              <span className="breadcrumb-root">Candidate Portal</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{getPageTitle()}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-live-clock">
              <span className="topbar-clock-icon">
                <ClockIcon />
              </span>
              <span>{formattedDateTime}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Scrollable Viewport */}
        <main className="dashboard-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
