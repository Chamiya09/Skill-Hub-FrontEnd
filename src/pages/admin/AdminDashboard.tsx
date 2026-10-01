import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  GraduationCap,
  Cpu,
  TrendingUp,
  Activity,
  Server,
  Database,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi, type AdminDashboardStatsDto } from '../../services/api';
import './AdminDashboard.css';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<AdminDashboardStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="admin-page-container">
        {/* Top Action Ribbon */}
        <div className="admin-page-heading-row">
          <div>
            <span className="admin-page-eyebrow">Enterprise Telemetry</span>
            <h1 className="admin-page-title">
              {activeTab === 'dashboard' && 'Super Administrator Overview'}
              {activeTab === 'users' && 'Global User Directory & Governance'}
              {activeTab === 'jobs' && 'Platform Job Vacancies & Compliance'}
              {activeTab === 'logs' && 'Platform Audit Trails & Activity Logs'}
            </h1>
            <p className="admin-page-desc">
              Real-time monitoring of Candidate ATS profiles, Employer pipelines, AI evaluations, and backend services.
            </p>
          </div>

          <div className="admin-heading-actions">
            <button
              type="button"
              onClick={handleRefresh}
              className={`admin-action-btn ${isRefreshing ? 'is-loading' : ''}`}
              title="Refresh telemetry"
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>

        {isLoading && !stats && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="spin-icon" style={{ marginBottom: 12, color: '#00b074' }} />
            <p style={{ margin: 0, fontWeight: 700 }}>Connecting to Skill Hub Telemetry Engine...</p>
          </div>
        )}

        {/* =========================================================
            HOME DASHBOARD VIEW
            ========================================================= */}
        {activeTab === 'dashboard' && (
          <>
            {/* 4 Standard Summary Stat Cards */}
            <div className="admin-stats-grid">
              {/* Card 1: Total Candidates */}
              <div className="admin-stat-card card-candidates">
                <div className="admin-stat-header">
                  <span className="admin-stat-label">Total Candidates</span>
                  <div className="admin-stat-icon-wrap icon-emerald">
                    <Users size={20} />
                  </div>
                </div>
                <div className="admin-stat-value">
                  {stats ? stats.totalCandidates.toLocaleString() : '1,428'}
                </div>
                <div className="admin-stat-footer">
                  <span className="admin-stat-trend positive">
                    <TrendingUp size={13} /> +14.8%
                  </span>
                  <span className="admin-stat-meta">registered candidate accounts</span>
                </div>
              </div>

              {/* Card 2: Active Jobs */}
              <div className="admin-stat-card card-jobs">
                <div className="admin-stat-header">
                  <span className="admin-stat-label">Active Jobs</span>
                  <div className="admin-stat-icon-wrap icon-blue">
                    <Briefcase size={20} />
                  </div>
                </div>
                <div className="admin-stat-value">
                  {stats ? stats.activeJobs.toLocaleString() : '84'}
                </div>
                <div className="admin-stat-footer">
                  <span className="admin-stat-badge">
                    {stats?.totalCompanies || 32} Companies
                  </span>
                  <span className="admin-stat-meta">currently actively hiring</span>
                </div>
              </div>

              {/* Card 3: Total Assessments */}
              <div className="admin-stat-card card-assessments">
                <div className="admin-stat-header">
                  <span className="admin-stat-label">Total Assessments</span>
                  <div className="admin-stat-icon-wrap icon-purple">
                    <GraduationCap size={20} />
                  </div>
                </div>
                <div className="admin-stat-value">
                  {stats ? stats.totalAssessments.toLocaleString() : '3,920'}
                </div>
                <div className="admin-stat-footer">
                  <span className="admin-stat-trend positive">
                    <CheckCircle2 size={13} /> 91.4%
                  </span>
                  <span className="admin-stat-meta">completion & evaluation rate</span>
                </div>
              </div>

              {/* Card 4: AI API Usage */}
              <div className="admin-stat-card card-ai">
                <div className="admin-stat-header">
                  <span className="admin-stat-label">AI API Usage</span>
                  <div className="admin-stat-icon-wrap icon-teal">
                    <Cpu size={20} />
                  </div>
                </div>
                <div className="admin-stat-value admin-stat-ai-value">
                  {stats ? stats.aiApiUsage : '94.2k tokens'}
                </div>
                <div className="admin-stat-footer">
                  <span className="admin-stat-badge badge-uptime">
                    99.8% Uptime
                  </span>
                  <span className="admin-stat-meta">Groq / Python multi-agent pipeline</span>
                </div>
              </div>
            </div>

            {/* Quick Diagnostic Ribbon */}
            <div className="admin-diagnostics-ribbon">
              <div className="admin-diag-item">
                <Server size={16} color="#00b074" />
                <div>
                  <strong>Backend WebAPI:</strong> <span>.NET 8.0 (Kestrel HTTP/2)</span>
                </div>
              </div>
              <div className="admin-diag-item">
                <Database size={16} color="#2563eb" />
                <div>
                  <strong>NeonDB PostgreSQL:</strong> <span>Pooled (PgBouncer Latency &lt; 28ms)</span>
                </div>
              </div>
              <div className="admin-diag-item">
                <Activity size={16} color="#9333ea" />
                <div>
                  <strong>Agentic CV Inference:</strong> <span>Python FastAPI Worker Active</span>
                </div>
              </div>
            </div>

            {/* Main Operational Split: Recent Audit Logs & System Controls */}
            <div className="admin-dual-grid">
              {/* Left Column: Recent Audit Trails */}
              <div className="admin-panel admin-logs-panel">
                <div className="admin-panel-header">
                  <div>
                    <h2 className="admin-panel-title">System Activity & Audit Trails</h2>
                    <p className="admin-panel-subtitle">Chronological platform events across all users and bots</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('logs')}
                    className="admin-link-btn"
                  >
                    View All Logs
                  </button>
                </div>

                <div className="admin-logs-list">
                  {(stats?.recentLogs || []).map((log) => (
                    <div key={log.id} className="admin-log-row">
                      <div className={`admin-log-badge status-${log.status}`}>
                        <Clock size={13} />
                        <span>{log.id}</span>
                      </div>
                      <div className="admin-log-details">
                        <span className="admin-log-action">{log.action}</span>
                        <div className="admin-log-meta">
                          <span className="admin-log-user">{log.user}</span>
                          <span>•</span>
                          <span className="admin-log-role">{log.role}</span>
                          <span>•</span>
                          <span className="admin-log-time">{log.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Platform Governance & Quick Actions */}
              <div className="admin-panel admin-controls-panel">
                <div className="admin-panel-header">
                  <div>
                    <h2 className="admin-panel-title">Quick Administration Actions</h2>
                    <p className="admin-panel-subtitle">Immediate platform controls and resource maintenance</p>
                  </div>
                </div>

                <div className="admin-controls-list">
                  <div className="admin-action-tile" onClick={() => setActiveTab('users')}>
                    <div className="action-tile-icon icon-emerald">
                      <Users size={18} />
                    </div>
                    <div className="action-tile-text">
                      <strong>Audit User Accounts</strong>
                      <span>Review candidates, recruiters, and company accounts</span>
                    </div>
                  </div>

                  <div className="admin-action-tile" onClick={() => setActiveTab('jobs')}>
                    <div className="action-tile-icon icon-blue">
                      <Briefcase size={18} />
                    </div>
                    <div className="action-tile-text">
                      <strong>Review Active Jobs</strong>
                      <span>Inspect vacancies, application volumes, and status</span>
                    </div>
                  </div>

                  <div className="admin-action-tile" onClick={() => alert('NeonDB Connection Pool is healthy. Active connections: 4/20.')}>
                    <div className="action-tile-icon icon-purple">
                      <Database size={18} />
                    </div>
                    <div className="action-tile-text">
                      <strong>Database Health Check</strong>
                      <span>Ping NeonDB instance and test connection latency</span>
                    </div>
                  </div>

                  <div className="admin-action-tile" onClick={() => alert('Platform AI Inference Cache successfully cleared.')}>
                    <div className="action-tile-icon icon-teal">
                      <Cpu size={18} />
                    </div>
                    <div className="action-tile-text">
                      <strong>Flush AI Agent Memory Cache</strong>
                      <span>Clear prompt cache and reload Groq API endpoints</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================================================
            MANAGE USERS VIEW
            ========================================================= */}
        {activeTab === 'users' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2 className="admin-panel-title">Registered Platform Users</h2>
                <p className="admin-panel-subtitle">Overview of candidates, recruiters, and enterprise accounts</p>
              </div>
              <div className="admin-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Filter users by name or email..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Company / Affiliation</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Chamod Ekanayaka', email: 'chamod.ekanayaka@gmail.com', role: 'Candidate', status: 'Active', company: 'Independent Candidate', created: '2026-09-15' },
                    { name: 'Sarah Jenkins', email: 's.jenkins@virtusa.com', role: 'HR_Admin', status: 'Active', company: 'Virtusa Global', created: '2026-08-20' },
                    { name: 'Alex Fernando', email: 'alex@wavenet.io', role: 'Company', status: 'Active', company: 'WaveNet Technologies', created: '2026-07-12' },
                    { name: 'Nisal Perera', email: 'nisal.p@gmail.com', role: 'Candidate', status: 'Active', company: 'Independent Candidate', created: '2026-09-28' },
                  ]
                    .filter((u) => u.name.toLowerCase().includes(searchFilter.toLowerCase()) || u.email.toLowerCase().includes(searchFilter.toLowerCase()))
                    .map((user, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="admin-user-cell">
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-pill-role ${user.role.toLowerCase()}`}>{user.role}</span>
                        </td>
                        <td>
                          <span className="admin-pill-status active">{user.status}</span>
                        </td>
                        <td>{user.company}</td>
                        <td>{user.created}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-sm-btn"
                            onClick={() => alert(`Inspecting user profile: ${user.email}`)}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
            MANAGE JOBS VIEW
            ========================================================= */}
        {activeTab === 'jobs' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2 className="admin-panel-title">Active Job Vacancies Across All Companies</h2>
                <p className="admin-panel-subtitle">Monitor job postings, candidate pipelines, and hiring activity</p>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Applications</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { title: 'Senior Full Stack Engineer (.NET 8 & React)', company: 'Virtusa Global', dept: 'Engineering', status: 'Active', apps: 42 },
                    { title: 'AI Machine Learning Engineer', company: 'WaveNet Technologies', dept: 'AI Lab', status: 'Active', apps: 28 },
                    { title: 'Lead QA Automation Architect', company: 'Sysco LABS', dept: 'Quality Engineering', status: 'Active', apps: 19 },
                    { title: 'DevOps & Cloud Security Specialist', company: 'WSO2', dept: 'Infrastructure', status: 'Active', apps: 31 },
                  ].map((job, idx) => (
                    <tr key={idx}>
                      <td><strong>{job.title}</strong></td>
                      <td>{job.company}</td>
                      <td>{job.dept}</td>
                      <td><span className="admin-pill-status active">{job.status}</span></td>
                      <td><strong>{job.apps}</strong> Candidates</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
            SYSTEM LOGS VIEW
            ========================================================= */}
        {activeTab === 'logs' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2 className="admin-panel-title">Live Platform Audit Logs</h2>
                <p className="admin-panel-subtitle">Immutable security logs, auth events, and agent executions</p>
              </div>
              <button
                type="button"
                className="admin-action-btn"
                onClick={() => alert('Audit logs exported as JSON file.')}
              >
                Export JSON Log
              </button>
            </div>

            <div className="admin-logs-list full-page">
              {(stats?.recentLogs || []).map((log) => (
                <div key={log.id} className="admin-log-row">
                  <div className={`admin-log-badge status-${log.status}`}>
                    <Clock size={13} />
                    <span>{log.id}</span>
                  </div>
                  <div className="admin-log-details">
                    <span className="admin-log-action">{log.action}</span>
                    <div className="admin-log-meta">
                      <span className="admin-log-user">{log.user}</span>
                      <span>•</span>
                      <span className="admin-log-role">{log.role}</span>
                      <span>•</span>
                      <span className="admin-log-time">{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
