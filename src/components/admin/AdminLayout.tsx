import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Terminal,
  ShieldCheck,
  LogOut,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authStorage } from '../../services/api';
import '../../pages/admin/AdminDashboard.css';

interface AdminLayoutProps {
  children?: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab = 'dashboard',
  onTabChange,
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'jobs', label: 'Manage Jobs', icon: Briefcase },
    { id: 'logs', label: 'System Logs', icon: Terminal },
  ];

  const handleLogout = () => {
    authStorage.clearAuth();
    if (logout) logout();
    navigate('/skillhub-secure-admin', { replace: true });
  };

  return (
    <div className="admin-root-layout">
      {/* 1. Dedicated Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon-box">
            <ShieldCheck size={20} color="#00b074" />
          </div>
          <div className="admin-brand-text">
            <span className="admin-brand-title">SkillHub</span>
            <span className="admin-brand-badge">Super Admin</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-label">PLATFORM GOVERNANCE</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-nav-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => onTabChange && onTabChange(item.id)}
              >
                <div className="admin-nav-icon-wrapper">
                  <Icon size={18} />
                </div>
                <span className="admin-nav-label">{item.label}</span>
                {isActive && <ChevronRight size={14} className="admin-nav-arrow" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer System Info */}
        <div className="admin-sidebar-footer">
          <div className="admin-node-status-card">
            <div className="admin-node-status-row">
              <span className="admin-pulse-dot" />
              <span className="admin-node-status-text">Production Node</span>
            </div>
            <span className="admin-node-version">.NET 8 WebAPI • PostgreSQL</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-sidebar-logout-btn"
            title="Terminate Super Admin Session"
          >
            <LogOut size={16} />
            <span>Secure Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Administration Area */}
      <div className="admin-main-viewport">
        {/* Topbar Header */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="admin-topbar-breadcrumbs">
              <span className="crumb-root">Platform Admin</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">
                {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* Live Health Status Pill */}
            <div className="admin-system-health-pill">
              <span className="health-dot" />
              <span>System: <strong>99.98% Healthy</strong></span>
            </div>

            {/* AI Agent Engine Status */}
            <div className="admin-ai-engine-pill">
              <Cpu size={14} color="#00b074" />
              <span>Groq LLaMA-3.3</span>
            </div>

            {/* Admin Profile Pill */}
            <div className="admin-profile-pill">
              <div className="admin-avatar-circle">
                <span>SA</span>
              </div>
              <div className="admin-profile-meta">
                <span className="admin-profile-name">{currentUser?.fullName || 'Super Administrator'}</span>
                <span className="admin-profile-role">Root Authority</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="admin-content-area">
          {children}
        </main>
      </div>
    </div>
  );
};
