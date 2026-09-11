import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  dashboardApi,
  jobsApi,
  type DashboardStatsDto,
  type JobDto,
} from '../services/api'
import {
  SparkleIcon,
  LayoutDashboardIcon,
  BriefcaseIcon,
  KanbanIcon,
  LightningIcon,
  TrendUpIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  BuildingIcon,
  ClockIcon,
  ArrowRightIcon,
  PlusIcon,
  UsersIcon,
} from '../components/common/Icons'
import { PipelineJobSelector } from './PipelineJobSelector'
import { JobVacancies } from './JobVacancies'

interface DashboardProps {
  defaultTab?: 'overview' | 'vacancies' | 'pipelines' | 'settings'
}

export const Dashboard: React.FC<DashboardProps> = ({ defaultTab = 'overview' }) => {
  const navigate = useNavigate()
  const { currentUser, logout, isAuthenticated, isLoading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'vacancies' | 'pipelines' | 'settings'>(defaultTab)
  const [selectedFilter, setSelectedFilter] = useState('All')

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab)
    }
  }, [defaultTab])

  // Data fetching state
  const [stats, setStats] = useState<DashboardStatsDto | null>(null)
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [dataLoading, setDataLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Real-time Date and Time state
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDateTime = (() => {
    const dateStr = currentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const timeStr = currentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return `${dateStr} | ${timeStr}`
  })()

  // Authenticate gate
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/company-login')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Fetch real company stats and jobs
  const fetchDashboardData = useCallback(async () => {
    try {
      setDataLoading(true);
      setErrorMessage(null);
      const [statsData, jobsData] = await Promise.all([
        dashboardApi.getStats().catch(() => null),
        jobsApi.getJobs().catch(() => []),
      ]);

      if (statsData) {
        setStats(statsData);
      } else {
        // Fallback compute from jobsData
        const active = jobsData.filter(j => j.status?.toLowerCase() === 'active').length;
        const draft = jobsData.filter(j => j.status?.toLowerCase() === 'draft').length;
        const closed = jobsData.filter(j => j.status?.toLowerCase() === 'closed').length;
        const depts = new Set(jobsData.map(j => j.department?.trim()).filter(Boolean)).size;

        setStats({
          activeVacanciesCount: active,
          draftVacanciesCount: draft,
          closedVacanciesCount: closed,
          totalVacanciesCount: jobsData.length,
          totalDepartmentsCount: depts,
          recentVacancies: jobsData.slice(0, 5),
        });
      }

      setJobs(jobsData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setErrorMessage(err.message || 'Unable to load real-time company metrics.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  const handleLogout = () => {
    logout()
    navigate('/company-login')
  }

  // Compute dynamic departments for filter tabs
  const departments = useMemo(() => {
    const depts = new Set(jobs.map((j) => j.department?.trim()).filter(Boolean))
    return ['All', ...Array.from(depts)]
  }, [jobs])

  const activeJobs = useMemo(() => {
    return jobs.filter((j) => (j.status || 'Active').toLowerCase() === 'active')
  }, [jobs])

  const filteredVacancies = useMemo(() => {
    return activeJobs.filter((v) => {
      if (selectedFilter === 'All') return true
      return v.department?.toLowerCase().includes(selectedFilter.toLowerCase())
    })
  }, [activeJobs, selectedFilter])

  const companyDisplayName = currentUser?.companyName || currentUser?.fullName || 'Enterprise Employer'
  const companyEmail = currentUser?.email || 'admin@enterprise.com'

  return (
    <div className="dashboard-container">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="dashboard-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =========================================================
          1. DASHBOARD SIDEBAR (LIGHT THEME B2B SAAS)
          ========================================================= */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Brand Header */}
        <div className="dashboard-sidebar-header">
          <Link to="/" className="dashboard-brand-link">
            <div className="logo-icon-wrap">
              <SparkleIcon />
            </div>
            <div className="dashboard-brand-text">
              <span className="dashboard-brand-title">Skill Hub</span>
              <span className="dashboard-brand-badge">ENTERPRISE ATS</span>
            </div>
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <XIcon />
          </button>
        </div>

        {/* Company Identity Profile Card in Sidebar */}
        <div className="dashboard-company-pill">
          <div className="company-avatar-box">
            <BuildingIcon />
          </div>
          <div className="company-pill-details">
            <span className="company-pill-name" title={companyDisplayName}>
              {companyDisplayName}
            </span>
            <span className="company-pill-role">
              <span className="company-pill-role-dot"></span>
              <span>{currentUser?.role === 'Company' ? 'Enterprise Account' : currentUser?.role || 'Company Account'}</span>
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="dashboard-nav-list">
          <div className="nav-group-label">RECRUITMENT PLATFORM</div>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview')
              setSidebarOpen(false)
            }}
          >
            <LayoutDashboardIcon />
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'vacancies' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('vacancies')
              setSidebarOpen(false)
            }}
          >
            <BriefcaseIcon />
            <span>Job Vacancies</span>
            <span className="nav-badge-count">{jobs.length}</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'pipelines' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pipelines')
              setSidebarOpen(false)
            }}
          >
            <KanbanIcon />
            <span>Talent Pipeline</span>
          </button>

          <div className="nav-group-label" style={{ marginTop: '16px' }}>SYSTEM</div>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings')
              setSidebarOpen(false)
            }}
          >
            <SettingsIcon />
            <span>Company Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer User Info & Signout */}
        <div className="dashboard-sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-initials">
              {companyDisplayName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{companyDisplayName}</span>
              <span className="sidebar-user-email">{companyEmail}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOutIcon />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          2. MAIN CONTENT AREA
          ========================================================= */}
      <div className="dashboard-main-area">
        {/* Dashboard Top Navbar */}
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
              <span className="breadcrumb-root">Dashboard</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">
                {activeTab === 'overview' && 'Company Overview'}
                {activeTab === 'vacancies' && 'Job Vacancies'}
                {activeTab === 'pipelines' && 'Hiring Pipelines'}
                {activeTab === 'settings' && 'Settings'}
              </span>
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
          {activeTab === 'vacancies' ? (
            <JobVacancies />
          ) : activeTab === 'pipelines' ? (
            <PipelineJobSelector />
          ) : activeTab === 'settings' ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl max-w-2xl">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Company Account Information</h2>
              <p className="text-sm text-slate-500 mb-6">Verified employer identity details stored in PostgreSQL.</p>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Registered Company Name</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">{companyDisplayName}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Contact / Administrator Email</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">{companyEmail}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Account Identifier</span>
                  <span className="text-xs font-mono text-slate-700 mt-1 block">{currentUser?.id || currentUser?.companyId}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={fetchDashboardData}
                    className="text-xs font-semibold text-red-800 underline hover:no-underline ml-4"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Welcome Banner */}
              <section className="dashboard-welcome-card">
                <div className="welcome-text-col">
                  <div className="welcome-badge">
                    <SparkleIcon />
                    <span>Real-time Talent Intelligence Connected</span>
                  </div>
                  <h1 className="welcome-heading">
                    Welcome back, <span className="welcome-highlight">{companyDisplayName}</span>
                  </h1>
                  <p className="welcome-subtitle">
                    Here is your live applicant pipeline, AI talent matches, and active engineering requisitions.
                  </p>
                </div>
                <div className="welcome-action-col">
                  <div className="system-health-tag">
                    <span className="pulse-dot-green"></span>
                    <span>PostgreSQL Database Synced</span>
                  </div>
                </div>
              </section>

              {/* =========================================================
                  3. STAT CARDS (REAL DATABASE METRICS)
                  ========================================================= */}
              <section className="stats-grid-row">
                {/* Card 1: Active Vacancies */}
                <div className="dashboard-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Active Vacancies</span>
                    <div className="stat-icon-wrapper stat-icon-blue">
                      <BriefcaseIcon />
                    </div>
                  </div>
                  <div className="stat-value-box">
                    <span className="stat-number">
                      {dataLoading ? '...' : stats?.activeVacanciesCount ?? activeJobs.length}
                    </span>
                    <span className="stat-trend positive">
                      <TrendUpIcon />
                      <span>Live Requisitions</span>
                    </span>
                  </div>
                  <p className="stat-footer-text">Published on public job board & accepting candidates</p>
                </div>

                {/* Card 2: Total Positions */}
                <div className="dashboard-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Total Vacancies</span>
                    <div className="stat-icon-wrapper stat-icon-green">
                      <UsersIcon />
                    </div>
                  </div>
                  <div className="stat-value-box">
                    <span className="stat-number">
                      {dataLoading ? '...' : stats?.totalVacanciesCount ?? jobs.length}
                    </span>
                    <span className="stat-trend neutral">
                      <span>{stats?.draftVacanciesCount ?? 0} in Draft</span>
                    </span>
                  </div>
                  <p className="stat-footer-text">Across all status tiers (Active, Draft, Closed)</p>
                </div>

                {/* Card 3: Active Departments */}
                <div className="dashboard-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Departments</span>
                    <div className="stat-icon-wrapper stat-icon-purple">
                      <BuildingIcon />
                    </div>
                  </div>
                  <div className="stat-value-box">
                    <span className="stat-number">
                      {dataLoading ? '...' : stats?.totalDepartmentsCount ?? (departments.length - 1)}
                    </span>
                    <span className="stat-trend positive">
                      <SparkleIcon />
                      <span>Hiring Units</span>
                    </span>
                  </div>
                  <p className="stat-footer-text">Engineering, AI Research, Design, Product & Ops</p>
                </div>

                {/* Card 4: AI Matching Precision */}
                <div className="dashboard-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">AI Match Status</span>
                    <div className="stat-icon-wrapper stat-icon-orange">
                      <LightningIcon />
                    </div>
                  </div>
                  <div className="stat-value-box">
                    <span className="stat-number">Active</span>
                    <span className="stat-trend positive">
                      <span>95% Fit Benchmark</span>
                    </span>
                  </div>
                  <p className="stat-footer-text">Real-time candidate indexing enabled</p>
                </div>
              </section>

              {/* =========================================================
                  4. DUAL-COLUMN ACTIVITY & VACANCY OVERVIEW
                  ========================================================= */}
              <div className="dashboard-content-split">
                {/* Left Column: Active Job Vacancies List */}
                <section className="dashboard-panel-card">
                  <div className="panel-card-header">
                    <div>
                      <h2 className="panel-title">Active Job Vacancies</h2>
                      <p className="panel-subtitle">Live corporate positions in PostgreSQL database</p>
                    </div>
                    <div className="panel-filter-pills">
                      {departments.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          className={`filter-pill-btn ${selectedFilter === dept ? 'active' : ''}`}
                          onClick={() => setSelectedFilter(dept)}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="vacancies-table-wrapper">
                    {dataLoading ? (
                      <div className="p-12 text-center text-slate-400">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm">Loading company job vacancies...</p>
                      </div>
                    ) : filteredVacancies.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <BriefcaseIcon />
                        </div>
                        <h4 className="text-base font-bold text-slate-800 mb-1">No Active Vacancies Found</h4>
                        <p className="text-xs text-slate-500 mb-4">
                          {selectedFilter === 'All'
                            ? 'You have not published any active job vacancies yet.'
                            : `No active positions found in ${selectedFilter}.`}
                        </p>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ margin: '0 auto', fontSize: '13px' }}
                          onClick={() => setActiveTab('vacancies')}
                        >
                          <PlusIcon />
                          <span>Create Job Vacancy</span>
                        </button>
                      </div>
                    ) : (
                      <table className="vacancies-table">
                        <thead>
                          <tr>
                            <th>ROLE & DEPARTMENT</th>
                            <th>LOCATION / TYPE</th>
                            <th>SALARY / EXPERIENCE</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVacancies.map((job) => (
                            <tr key={job.id} className="vacancy-table-row">
                              <td>
                                <div className="vacancy-title-cell">
                                  <Link to={`/dashboard/jobs/${job.id}`} className="job-row-title hover:text-blue-600 transition-colors">
                                    {job.title}
                                  </Link>
                                  <span className="job-row-dept">{job.department}</span>
                                </div>
                              </td>
                              <td>
                                <div className="vacancy-meta-cell">
                                  <span>{job.location}</span>
                                  <span className="type-badge">{job.employmentType}</span>
                                </div>
                              </td>
                              <td>
                                <div className="vacancy-meta-cell">
                                  <span className="font-semibold text-slate-800">{job.salaryRange || 'Competitive'}</span>
                                  <span className="text-[11px] text-slate-500">{job.experienceLevel}</span>
                                </div>
                              </td>
                              <td>
                                <span className="status-pill active-pill">Active</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <Link
                                  to={`/dashboard/jobs/${job.id}`}
                                  className="btn-table-action inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                >
                                  <span>Manage</span>
                                  <ArrowRightIcon />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                {/* Right Column: Recent Pipeline & Quick Actions */}
                <section className="dashboard-panel-card">
                  <div className="panel-card-header">
                    <div>
                      <h2 className="panel-title">Recent Requisitions</h2>
                      <p className="panel-subtitle">Latest postings from your account</p>
                    </div>
                    <span className="activity-count-badge">Live DB Feed</span>
                  </div>

                  <div className="candidates-activity-list">
                    {dataLoading ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Loading recent requisitions...
                      </div>
                    ) : jobs.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No recent positions created yet.
                      </div>
                    ) : (
                      jobs.slice(0, 4).map((job) => (
                        <div key={job.id} className="candidate-activity-card">
                          <div
                            className="candidate-avatar-circle"
                            style={{ backgroundColor: '#2563eb' }}
                          >
                            <BriefcaseIcon />
                          </div>
                          <div className="candidate-details-col">
                            <div className="candidate-name-row">
                              <span className="candidate-name truncate">{job.title}</span>
                              <span className="candidate-time">
                                {new Date(job.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <span className="candidate-role">{job.department} • {job.location}</span>
                            <div className="candidate-tags-row">
                              <span className={`candidate-stage-pill ${job.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {job.status}
                              </span>
                              <span className="candidate-score-pill">
                                <SparkleIcon />
                                95% AI Match
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick ATS Action Shortcuts */}
                  <div className="quick-shortcuts-box">
                    <h3 className="shortcuts-title">Quick Actions</h3>
                    <div className="shortcuts-grid">
                      <button
                        type="button"
                        onClick={() => setActiveTab('vacancies')}
                        className="shortcut-btn"
                        style={{ border: 'none', font: 'inherit', textAlign: 'left', width: '100%', cursor: 'pointer' }}
                      >
                        <BriefcaseIcon />
                        <span>Manage Requisitions</span>
                      </button>
                      <Link to="/jobs" className="shortcut-btn">
                        <SparkleIcon />
                        <span>Public Job Board</span>
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
