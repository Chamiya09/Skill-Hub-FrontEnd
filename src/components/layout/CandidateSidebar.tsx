import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  SparkleIcon,
  LogOutIcon,
  SearchIcon,
  XIcon,
} from '../common/Icons';

interface CandidateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Crisp Lucide-style SVG Icons
const FileTextIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const BriefcaseCheckIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <polyline points="9 13 11 15 15 11" />
  </svg>
);

const BookmarkIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

const ShieldLockIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="11" r="1.5" />
    <path d="M12 12.5V15" />
  </svg>
);

export const CandidateSidebar: React.FC<CandidateSidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/candidate-login');
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

  const headline = currentUser?.headline || 'Candidate Portal';

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* 1. Sidebar Brand Header */}
      <div className="dashboard-sidebar-header">
        <Link to="/" className="dashboard-brand-link" onClick={onClose}>
          <div className="logo-icon-wrap">
            <SparkleIcon />
          </div>
          <div className="dashboard-brand-text">
            <span className="dashboard-brand-title">Skill Hub</span>
            <span className="dashboard-brand-badge">CANDIDATE PORTAL</span>
          </div>
        </Link>
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
      <div className="dashboard-company-pill">
        <div className="company-avatar-box">
          {candidateInitials}
        </div>
        <div className="company-pill-details">
          <span className="company-pill-name" title={candidateDisplayName}>
            {candidateDisplayName}
          </span>
          <span className="company-pill-role" title={headline}>
            <span className="company-pill-role-dot"></span>
            <span>{headline}</span>
          </span>
        </div>
      </div>

      {/* 3. Sidebar Navigation Links */}
      <nav className="dashboard-nav-list">
        <div className="nav-group-label">CAREER PLATFORM</div>

        <NavLink
          to="/jobs"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <SparkleIcon />
          <span>Explore Jobs</span>
        </NavLink>

        <NavLink
          to="/candidate/profile"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <FileTextIcon />
          <span>My Digital CV</span>
        </NavLink>

        <NavLink
          to="/candidate/applications"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <BriefcaseCheckIcon />
          <span>Applied Jobs</span>
        </NavLink>

        <NavLink
          to="/candidate/saved"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <BookmarkIcon />
          <span>Saved Jobs</span>
        </NavLink>

        <div className="nav-group-label" style={{ marginTop: '16px' }}>SYSTEM & SECURITY</div>

        <NavLink
          to="/candidate/settings"
          onClick={onClose}
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          <ShieldLockIcon />
          <span>Account & Security</span>
        </NavLink>

        <Link
          to="/jobs"
          onClick={onClose}
          className="dashboard-nav-item"
        >
          <SearchIcon />
          <span>Find New Jobs</span>
        </Link>
      </nav>

      {/* 4. Sidebar Footer with User Info & Sign Out */}
      <div className="dashboard-sidebar-footer">
        <div className="sidebar-user-card">
          <div className="user-avatar-initials">
            {candidateInitials}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{candidateDisplayName}</span>
            <span className="sidebar-user-email">{candidateEmail}</span>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleSignOut}
          title="Sign Out"
        >
          <LogOutIcon />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
