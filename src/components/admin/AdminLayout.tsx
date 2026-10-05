import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Inbox,
  Sparkles,
  LogOut,
  Activity,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authStorage } from '../../services/api';
import '../../pages/admin/AdminDashboard.css';

export type AdminTab = 'overview' | 'candidates' | 'companies' | 'inquiries' | 'security';

interface AdminLayoutProps {
  children?: React.ReactNode;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab = 'overview',
  onTabChange,
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Collapsible & responsive drawer state matching Company Dashboard
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('skillhub_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('skillhub_admin_sidebar_collapsed', String(next));
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

  interface NavItem {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }

  // 4 navigation menu items
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: Users,
    },
    {
      id: 'companies',
      label: 'Companies',
      icon: Building2,
    },
    {
      id: 'inquiries',
      label: 'Inquiries',
      icon: Inbox,
    },
  ];

  const handleLogout = () => {
    authStorage.clearAuth();
    if (logout) logout();
    navigate('/skillhub-secure-admin', { replace: true });
  };

  const adminName = currentUser?.fullName || 'Super Administrator';
  const adminEmail = currentUser?.email || 'admin@skillhub.internal';
  const adminInitials =
    adminName
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SA';

  return (
    <div className={`dashboard-container ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="dashboard-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =========================================================
          1. SKILL HUB DASHBOARD SIDEBAR (Matching Company Side Design)
          ========================================================= */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Creative Edge Dock Toggle Handle */}
        <button
          type="button"
          className="sidebar-edge-toggle"
          onClick={toggleSidebarCollapsed}
          title={sidebarCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
          aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={13} strokeWidth={2.6} />
          ) : (
            <ChevronLeft size={13} strokeWidth={2.6} />
          )}
        </button>

        <div>
          {/* 1.1 Brand Header */}
          <div className="dashboard-sidebar-header">
            <div
              className="dashboard-brand-link"
              style={{ cursor: 'pointer' }}
              onClick={() => onTabChange && onTabChange('overview')}
              title="Skill Hub Admin"
            >
              <div className="logo-icon-wrap">
                <Sparkles size={18} strokeWidth={2.5} />
              </div>
              {!sidebarCollapsed && (
                <div className="dashboard-brand-text">
                  <div className="dashboard-brand-row">
                    <span className="dashboard-brand-title">Skill Hub</span>
                    <span
                      className="dashboard-brand-badge"
                      style={{ color: '#00b074', background: '#e6f9f2' }}
                    >
                      SUPER ADMIN
                    </span>
                  </div>
                  <span className="dashboard-brand-subtitle">Platform Governance</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close Sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* 1.2 Company-Style Workspace Switcher / Identity Card */}
          <div
            className="dashboard-company-pill"
            title={sidebarCollapsed ? `${adminName} • Active Workspace` : undefined}
          >
            <div className="company-avatar-box">
              <ShieldCheck size={18} strokeWidth={2.2} />
              <span className="company-status-dot" title="Active Workspace" />
            </div>
            {!sidebarCollapsed && (
              <div className="company-pill-details">
                <span className="company-pill-name" title={adminName}>
                  {adminName}
                </span>
                <div className="company-pill-meta">
                  <span className="company-pill-tag">
                    Root Access
                  </span>
                  <span className="company-pill-divider">•</span>
                  <span className="company-pill-status">Active Workspace</span>
                </div>
              </div>
            )}
          </div>

          {/* 1.3 Navigation Menu */}
          <nav className="dashboard-nav-list">
            <div className="nav-group-header">
              <span className="nav-group-label">PLATFORM GOVERNANCE</span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (onTabChange) onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon-wrap">
                    <Icon size={17} />
                  </span>
                  {!sidebarCollapsed && <span className="nav-item-label">{item.label}</span>}
                  {sidebarCollapsed && (
                    <span className="nav-collapsed-tooltip">{item.label}</span>
                  )}
                </button>
              );
            })}

            <div className="nav-group-header" style={{ marginTop: '14px' }}>
              <span className="nav-group-label">ROOT SECURITY</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onTabChange) onTabChange('security');
                setSidebarOpen(false);
              }}
              className={`dashboard-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            >
              <span className="nav-icon-wrap">
                <ShieldCheck size={17} />
              </span>
              {!sidebarCollapsed && <span className="nav-item-label">Account Security</span>}
              {sidebarCollapsed && (
                <span className="nav-collapsed-tooltip">Account Security</span>
              )}
            </button>
          </nav>
        </div>

        {/* 1.4 Sidebar Footer: Profile Card & Logout */}
        <div className="dashboard-sidebar-footer">
          <div
            className="sidebar-user-card"
            title={sidebarCollapsed ? `${adminName} • Click to Sign Out` : undefined}
            onClick={sidebarCollapsed ? handleLogout : undefined}
            style={sidebarCollapsed ? { cursor: 'pointer' } : undefined}
          >
            <div className="user-avatar-initials">
              {adminInitials}
            </div>
            {!sidebarCollapsed ? (
              <>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name" title={adminName}>
                    {adminName}
                  </span>
                  <span className="sidebar-user-email" title={adminEmail}>
                    {adminEmail}
                  </span>
                </div>
                <button
                  type="button"
                  className="sidebar-user-logout-icon"
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <span className="nav-collapsed-tooltip">Sign Out ({adminName})</span>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================
          2. MAIN CONTENT AREA (Matches Company Dashboard Area)
          ========================================================= */}
      <div className="dashboard-main-area">
        {/* Topbar Header */}
        <header className="dashboard-topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="topbar-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Platform Governance</span>
              <span style={{ color: '#cbd5e1' }}>/</span>
              <span style={{ color: '#0f172a', fontWeight: 800, textTransform: 'capitalize' }}>
                {activeTab}
              </span>
            </div>
          </div>

          {/* Right Header Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 9999,
                background: '#e6f9f2',
                border: '1px solid #a7f3d0',
                color: '#009e67',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <Activity size={13} color="#00b074" />
              <span>Production Live</span>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <main
          style={{
            flex: 1,
            padding: '24px clamp(20px, 2.5vw, 40px)',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <div style={{ width: '100%', maxWidth: 'none', margin: 0 }}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
