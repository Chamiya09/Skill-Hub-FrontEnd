import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  FileText,
  Briefcase,
  Bookmark,
  ClipboardCheck,
  CalendarDays,
  Compass,
  BookOpen,
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { XIcon } from '../common/Icons';

interface CandidateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CandidateSidebar: React.FC<CandidateSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const handleSignOut = () => {
    logout();
  };

  const candidateDisplayName =
    currentUser?.fullName ||
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
    'Candidate Account';

  const candidateEmail = currentUser?.email || 'candidate@example.com';

  const candidateInitials =
    candidateDisplayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CA';

  const headline = currentUser?.headline || 'Active Candidate';

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Creative Edge Dock Toggle Handle */}
      {onToggleCollapse && (
        <button
          type="button"
          className="sidebar-edge-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={13} strokeWidth={2.6} />
          ) : (
            <ChevronLeft size={13} strokeWidth={2.6} />
          )}
        </button>
      )}

      {/* 1. Sidebar Brand Header */}
      <div className="dashboard-sidebar-header">
        <Link to="/" className="dashboard-brand-link" onClick={onClose} title="Skill Hub Home">
          <div className="logo-icon-wrap">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <div className="dashboard-brand-text">
              <div className="dashboard-brand-row">
                <span className="dashboard-brand-title">Skill Hub</span>
                <span className="dashboard-brand-badge" style={{ color: '#00b074', background: '#e6f9f2' }}>
                  CANDIDATE PRO
                </span>
              </div>
              <span className="dashboard-brand-subtitle">Career & Assessment Hub</span>
            </div>
          )}
        </Link>

        {!isCollapsed && onToggleCollapse && (
          <button
            type="button"
            className="sidebar-collapse-header-btn"
            onClick={onToggleCollapse}
            title="Collapse Sidebar (Ctrl+B)"
            aria-label="Collapse Sidebar"
          >
            <PanelLeftClose size={16} strokeWidth={2.2} />
          </button>
        )}

        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close Sidebar"
        >
          <XIcon />
        </button>
      </div>

      {/* 2. Candidate Identity Profile Card */}
      <div
        className="dashboard-company-pill"
        title={isCollapsed ? `${candidateDisplayName} • ${headline}` : undefined}
      >
        <div className="company-avatar-box">
          {candidateInitials}
          <span className="company-status-dot" title="Active Candidate" />
        </div>
        {!isCollapsed && (
          <div className="company-pill-details">
            <span className="company-pill-name" title={candidateDisplayName}>
              {candidateDisplayName}
            </span>
            <div className="company-pill-meta">
              <span className="company-pill-tag">Candidate</span>
              <span className="company-pill-divider">•</span>
              <span className="company-pill-status" title={headline}>
                {headline.length > 20 ? `${headline.slice(0, 18)}...` : headline}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Sidebar Navigation Links */}
      <nav className="dashboard-nav-list">
        {/* Group 1: CAREER PLATFORM */}
        <div className="nav-group-header">
          <span className="nav-group-label">CAREER PLATFORM</span>
        </div>

        <NavLink
          to="/candidate/profile"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon-wrap">
            <FileText size={17} />
          </span>
          {!isCollapsed && <span className="nav-item-label">My Digital CV</span>}
          {isCollapsed && <span className="nav-collapsed-tooltip">My Digital CV</span>}
        </NavLink>

        <NavLink
          to="/candidate/applications"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon-wrap">
            <Briefcase size={17} />
          </span>
          {!isCollapsed && <span className="nav-item-label">Applied Jobs</span>}
          {isCollapsed && <span className="nav-collapsed-tooltip">Applied Jobs</span>}
        </NavLink>

        <NavLink
          to="/candidate/saved"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon-wrap">
            <Bookmark size={17} />
          </span>
          {!isCollapsed && <span className="nav-item-label">Saved Jobs</span>}
          {isCollapsed && <span className="nav-collapsed-tooltip">Saved Jobs</span>}
        </NavLink>

        {/* Group 2: ASSESSMENTS & INTERVIEWS */}
        <div className="nav-group-header" style={{ marginTop: '14px' }}>
          <span className="nav-group-label">INTERVIEWS & PREP</span>
        </div>

        <NavLink
          to="/candidate/assessments"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon-wrap">
            <ClipboardCheck size={17} />
          </span>
          {!isCollapsed && <span className="nav-item-label">Technical Assessments</span>}
          {isCollapsed && <span className="nav-collapsed-tooltip">Technical Assessments</span>}
        </NavLink>

        <NavLink
          to="/candidate/dashboard"
          onClick={onClose}
          className={({ isActive }) =>
            `dashboard-nav-item ${
              isActive || location.pathname === '/candidate' || location.pathname === '/candidate/interviews'
                ? 'active'
                : ''
            }`
          }
        >
          <span className="nav-icon-wrap">
            <CalendarDays size={17} />
          </span>
          {!isCollapsed && <span className="nav-item-label">My Interviews</span>}
          {isCollapsed && <span className="nav-collapsed-tooltip">My Interviews</span>}
        </NavLink>

        <NavLink
          to="/candidate/interview-prep"
          onClick={onClose}
          className={({ isActive }) =>
            `dashboard-nav-item ${isActive && !location.pathname.includes('/guide') ? 'active' : ''}`
          }
        >
          <span className="nav-icon-wrap">
            <Compass size={17} />
            {isCollapsed && <span className="nav-collapsed-badge-dot nav-badge-dot--ai" />}
          </span>
          {!isCollapsed && (
            <>
              <span className="nav-item-label">Interview Prep Hub</span>
              <span className="nav-badge-pill nav-badge-ai">AI</span>
            </>
          )}
          {isCollapsed && <span className="nav-collapsed-tooltip">Interview Prep Hub (AI)</span>}
        </NavLink>

        <NavLink
          to="/candidate/study-dashboard"
          onClick={onClose}
          className={() =>
            `dashboard-nav-item ${
              location.pathname.startsWith('/candidate/study-dashboard') ||
              location.pathname.includes('/interview-prep/guide')
                ? 'active'
                : ''
            }`
          }
        >
          <span className="nav-icon-wrap">
            <BookOpen size={17} />
          </span>
          {!isCollapsed && <span className="nav-item-label">Study Dashboard</span>}
          {isCollapsed && <span className="nav-collapsed-tooltip">Study Dashboard</span>}
        </NavLink>

        {/* Group 3: SYSTEM & SECURITY */}
        <div className="nav-group-header" style={{ marginTop: '14px' }}>
          <span className="nav-group-label">SYSTEM</span>
        </div>

        <NavLink
          to="/candidate/settings"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon-wrap">
            <ShieldCheck size={17} />
          </span>
          {!isCollapsed && <span className="nav-item-label">Account & Security</span>}
          {isCollapsed && <span className="nav-collapsed-tooltip">Account & Security</span>}
        </NavLink>
      </nav>

      {/* 4. Sidebar Footer with User Info & Sign Out */}
      <div className="dashboard-sidebar-footer">
        <div
          className="sidebar-user-card"
          title={isCollapsed ? `${candidateDisplayName} • Click to Sign Out` : undefined}
          onClick={isCollapsed ? handleSignOut : undefined}
          style={isCollapsed ? { cursor: 'pointer' } : undefined}
        >
          <div className="user-avatar-initials">{candidateInitials}</div>
          {!isCollapsed ? (
            <>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name" title={candidateDisplayName}>
                  {candidateDisplayName}
                </span>
                <span className="sidebar-user-email" title={candidateEmail}>
                  {candidateEmail}
                </span>
              </div>
              <button
                type="button"
                className="sidebar-user-logout-icon"
                onClick={handleSignOut}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <span className="nav-collapsed-tooltip">Sign Out ({candidateDisplayName})</span>
          )}
        </div>
      </div>
    </aside>
  );
};
