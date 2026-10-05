import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CandidateSidebar } from './CandidateSidebar';
import { MenuIcon } from '../common/Icons';
import { LiveDateTime } from '../common/LiveDateTime';


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
      if (role === 'admin' || role === 'super_admin') {
        navigate('/skillhub-secure-admin/dashboard', { replace: true });
      } else if (role === 'company' || role === 'employer') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, currentUser, navigate]);

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


            <div className="topbar-breadcrumb">
              <span className="breadcrumb-root">Candidate Portal</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{getPageTitle()}</span>
            </div>
          </div>

          <div className="topbar-right">
            <LiveDateTime />
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
