import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Inbox,
  Sparkles,
  LogOut,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authStorage } from '../../services/api';
import '../../pages/admin/AdminDashboard.css';

export type AdminTab = 'candidates' | 'companies' | 'inquiries';

interface AdminLayoutProps {
  children?: React.ReactNode;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab = 'candidates',
  onTabChange,
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // 3 navigation menu items
  const navItems = [
    {
      id: 'candidates' as AdminTab,
      label: 'Candidates',
      icon: Users,
      badge: '4 New',
    },
    {
      id: 'companies' as AdminTab,
      label: 'Companies',
      icon: Building2,
      badge: '3 Active',
    },
    {
      id: 'inquiries' as AdminTab,
      label: 'Inquiries',
      icon: Inbox,
      badge: '2 Pending',
    },
  ];

  const handleLogout = () => {
    authStorage.clearAuth();
    if (logout) logout();
    navigate('/skillhub-secure-admin', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f8fafc',
        fontFamily: 'var(--font-family, inherit)',
        color: '#0f172a',
      }}
    >
      {/* =========================================================
          1. SKILL HUB DASHBOARD SIDEBAR (Candidate & Company Theme)
          White background, emerald accents, executive user pill
          ========================================================= */}
      <aside
        className="dashboard-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 272,
          minWidth: 272,
          height: '100vh',
          background: '#ffffff',
          borderRight: '1px solid #edf2f7',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '1px 0 4px rgba(15, 23, 42, 0.02)',
        }}
      >
        <div>
          {/* 1.1 Brand Header */}
          <div className="dashboard-sidebar-header">
            <div className="dashboard-brand-link" style={{ cursor: 'pointer' }}>
              <div className="logo-icon-wrap">
                <Sparkles size={18} strokeWidth={2.5} />
              </div>
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
            </div>
          </div>

          {/* 1.2 Identity Card (Like in Candidate / Company Dashboards) */}
          <div className="candidate-identity-card" style={{ cursor: 'default' }}>
            <div className="candidate-card-avatar-wrap">
              <div className="candidate-card-avatar">
                <span className="candidate-card-initials">SA</span>
              </div>
              <span className="candidate-card-online-dot" />
            </div>
            <div className="candidate-card-details">
              <div className="candidate-card-top-row">
                <span className="candidate-card-name">Super Admin</span>
                <span className="candidate-card-badge">ROOT</span>
              </div>
              <div className="candidate-card-bottom-row">
                <span className="candidate-card-headline">Production Node • Online</span>
              </div>
            </div>
          </div>

          {/* 1.3 Navigation Menu */}
          <div className="dashboard-nav-list" style={{ padding: '10px 12px' }}>
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
                  onClick={() => onTabChange && onTabChange(item.id)}
                  className={`dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  <div className="nav-icon-wrap">
                    <Icon size={16} />
                  </div>
                  <span className="nav-item-label">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`nav-badge-pill ${
                        isActive ? 'nav-badge-ai' : 'nav-badge-neutral'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1.4 Sidebar Footer: Profile Card & Logout */}
        <div className="dashboard-sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-initials">
              <ShieldCheck size={18} />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {currentUser?.fullName || 'Super Administrator'}
              </span>
              <span className="sidebar-user-email">
                {currentUser?.email || 'admin@skillhub.internal'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="sidebar-user-logout-icon"
              title="Terminate Admin Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================
          2. MAIN CONTENT AREA (Offset by 272px)
          ========================================================= */}
      <div
        style={{
          flex: 1,
          marginLeft: 272,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: '#f8fafc',
          minWidth: 0,
        }}
      >
        {/* Topbar Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            height: 64,
            background: '#ffffff',
            borderBottom: '1px solid #edf2f7',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Platform Governance</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: 800, textTransform: 'capitalize' }}>
              {activeTab}
            </span>
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

            <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />

            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Signed in as{' '}
              <strong style={{ color: '#0f172a' }}>
                {currentUser?.email || 'admin@skillhub.internal'}
              </strong>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <main style={{ flex: 1, padding: '32px', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
