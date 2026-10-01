import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CandidateSidebar } from './CandidateSidebar';
import { ClockIcon, MenuIcon } from '../common/Icons';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export const CandidateLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading } = useAuth();

  // Collapsible sidebar state synced with localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('skillhub_candidate_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('skillhub_candidate_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapsed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebarCollapsed]);

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
    if (location.pathname.startsWith('/candidate/dashboard') || location.pathname.startsWith('/candidate/interviews') || location.pathname === '/candidate') return 'My Interviews';
    if (location.pathname.startsWith('/candidate/applications')) return 'Applied Jobs';
    if (location.pathname.startsWith('/candidate/saved')) return 'Saved Jobs';
    if (location.pathname.startsWith('/candidate/assessments')) return 'Technical Assessments';
    if (location.pathname.startsWith('/candidate/study-dashboard') || location.pathname.includes('/interview-prep/guide')) return 'Study Dashboard';
    if (location.pathname.startsWith('/candidate/interview-prep')) return 'Interview Preparation';
    if (location.pathname.startsWith('/candidate/settings') || location.pathname.startsWith('/candidate/security')) return 'Account & Security';
    return 'My Digital CV';
  };

  return (
    <div className={`dashboard-container ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
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
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
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

            {/* Desktop Quick Toggle Sidebar Button */}
            <button
              type="button"
              className="topbar-desktop-sidebar-toggle"
              onClick={toggleSidebarCollapsed}
              title={sidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
              aria-label="Toggle Sidebar"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={18} strokeWidth={2} />
              ) : (
                <PanelLeftClose size={18} strokeWidth={2} />
              )}
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
        <main className={`dashboard-viewport ${location.pathname.startsWith('/candidate') ? 'dashboard-viewport--candidate' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
