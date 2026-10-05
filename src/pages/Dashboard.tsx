import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  Filter,
  ClipboardCheck,
  Trophy,
  UserCheck,
  CalendarDays,
  Settings,
  ShieldCheck,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  dashboardApi,
  jobsApi,
  type DashboardStatsDto,
  type JobDto,
} from '../services/api'
import {
  SparkleIcon,
  BriefcaseIcon,
  TrendUpIcon,
  MenuIcon,
  XIcon,
  BuildingIcon,
  PlusIcon,
  UsersIcon,
} from '../components/common/Icons'
import { LiveDateTime } from '../components/common/LiveDateTime'
import { PipelineJobSelector } from './PipelineJobSelector'
import { HiringPipeline } from './HiringPipeline'
import { TechnicalAssessments } from './TechnicalAssessments'
import { MonthlyPlanner } from './MonthlyPlanner'
import { JobVacancies } from './JobVacancies'
import { InterviewSelection } from './InterviewSelection'
import { CompanySettings } from './CompanySettings'
import { SecuritySettings } from './SecuritySettings'
import { MetricCardSkeleton, TableRowSkeleton } from '../components/common/SkeletonCard'
import { CompanyOverview } from '../components/dashboard/CompanyOverview'

export type DashboardTab =
  | 'overview'
  | 'vacancies'
  | 'pipelines'
  | 'hiring-pipeline'
  | 'assessments'
  | 'assessment-templates'
  | 'performance-hub'
  | 'assessment-submissions'
  | 'assessment-leaderboard'
  | 'interview-selection'
  | 'monthly-planner'
  | 'settings'
  | 'security';

interface DashboardProps {
  defaultTab?: DashboardTab;
}

export const Dashboard: React.FC<DashboardProps> = ({ defaultTab = 'overview' }) => {
  const navigate = useNavigate()
  const { currentUser, logout, isAuthenticated, isLoading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('skillhub_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('skillhub_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }, [])

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleSidebarCollapsed()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebarCollapsed])
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    defaultTab === 'assessments' ? 'assessment-templates' : defaultTab
  )
  const [prevDefaultTab, setPrevDefaultTab] = useState<DashboardTab>(defaultTab)
  if (defaultTab !== prevDefaultTab) {
    setPrevDefaultTab(defaultTab)
    setActiveTab(defaultTab === 'assessments' ? 'assessment-templates' : defaultTab)
  }
  const [selectedFilter, setSelectedFilter] = useState('All')

  // Data fetching state
  const [stats, setStats] = useState<DashboardStatsDto | null>(null)
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [dataLoading, setDataLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Authenticate gate & Role Protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/company-login', { replace: true })
    } else if (!authLoading && isAuthenticated) {
      const role = currentUser?.role?.toLowerCase()
      if (role === 'admin' || role === 'super_admin') {
        navigate('/skillhub-secure-admin/dashboard', { replace: true })
      } else if (role === 'candidate') {
        navigate('/candidate/dashboard', { replace: true })
      }
    }
  }, [authLoading, isAuthenticated, currentUser, navigate])

  // Fetch real company stats and jobs
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const fetchDashboardData = useCallback(() => {
    setDataLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    const loadData = async () => {
      try {
        const [statsData, jobsData] = await Promise.all([
          dashboardApi.getStats().catch(() => null),
          jobsApi.getJobs().catch(() => []),
        ]);
        if (!isMounted) return;

        setErrorMessage(null);
        if (statsData) {
          setStats(statsData);
        } else {
          // Fallback compute from jobsData
          const active = jobsData.filter((j) => j.status?.toLowerCase() === 'active').length;
          const draft = jobsData.filter((j) => j.status?.toLowerCase() === 'draft').length;
          const closed = jobsData.filter((j) => j.status?.toLowerCase() === 'closed').length;
          const depts = new Set(jobsData.map((j) => j.department?.trim()).filter(Boolean)).size;

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
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Failed to load dashboard data:', err);
        const errorObj = err as { message?: string };
        setErrorMessage(errorObj?.message || 'Unable to load real-time company metrics.');
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, refreshTrigger]);

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

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#64748b',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #00b074',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '12px',
          }}
        ></div>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
          Initializing employer workspace...
        </p>
      </div>
    );
  }

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
          1. DASHBOARD SIDEBAR (LIGHT THEME B2B SAAS)
          ========================================================= */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Creative Edge Dock Toggle Handle */}
        <button
          type="button"
          className="sidebar-edge-toggle"
          onClick={toggleSidebarCollapsed}
          title={sidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={13} strokeWidth={2.6} />
          ) : (
            <ChevronLeft size={13} strokeWidth={2.6} />
          )}
        </button>

        {/* Sidebar Brand Header */}
        <div className="dashboard-sidebar-header">
          <Link to="/" className="dashboard-brand-link" title="Skill Hub Home">
            <div className="logo-icon-wrap">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            {!sidebarCollapsed && (
              <div className="dashboard-brand-text">
                <div className="dashboard-brand-row">
                  <span className="dashboard-brand-title">Skill Hub</span>
                  <span className="dashboard-brand-badge">ATS PRO</span>
                </div>
                <span className="dashboard-brand-subtitle">Enterprise Recruitment</span>
              </div>
            )}
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

        {/* Company Identity & Workspace Switcher Card */}
        <div
          className="dashboard-company-pill"
          title={sidebarCollapsed ? `${companyDisplayName} • Active Workspace` : undefined}
        >
          <div className="company-avatar-box">
            {currentUser?.logoUrl ? (
              <img
                src={currentUser.logoUrl}
                alt={companyDisplayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Building2 size={17} strokeWidth={2.2} />
            )}
            <span className="company-status-dot" title="Active Workspace" />
          </div>
          {!sidebarCollapsed && (
            <div className="company-pill-details">
              <span className="company-pill-name" title={companyDisplayName}>
                {companyDisplayName}
              </span>
              <div className="company-pill-meta">
                <span className="company-pill-tag">
                  {currentUser?.role === 'Company' ? 'Enterprise' : currentUser?.role || 'Company'}
                </span>
                <span className="company-pill-divider">•</span>
                <span className="company-pill-status">Active Workspace</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="dashboard-nav-list">
          {/* Group 1: RECRUITMENT */}
          <div className="nav-group-header">
            <span className="nav-group-label">RECRUITMENT</span>
          </div>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap"><LayoutDashboard size={17} /></span>
            {!sidebarCollapsed && <span className="nav-item-label">Overview</span>}
            {sidebarCollapsed && <span className="nav-collapsed-tooltip">Overview</span>}
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'vacancies' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('vacancies');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap">
              <Briefcase size={17} />
              {sidebarCollapsed && jobs.length > 0 && <span className="nav-collapsed-badge-dot" />}
            </span>
            {!sidebarCollapsed && (
              <>
                <span className="nav-item-label">Job Vacancies</span>
                {jobs.length > 0 && (
                  <span className="nav-badge-pill nav-badge-neutral">{jobs.length}</span>
                )}
              </>
            )}
            {sidebarCollapsed && (
              <span className="nav-collapsed-tooltip">
                Job Vacancies {jobs.length > 0 ? `(${jobs.length})` : ''}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'pipelines' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pipelines');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap">
              <Sparkles size={17} />
              {sidebarCollapsed && <span className="nav-collapsed-badge-dot nav-badge-dot--ai" />}
            </span>
            {!sidebarCollapsed && (
              <>
                <span className="nav-item-label">AI Screening</span>
                <span className="nav-badge-pill nav-badge-ai">AI</span>
              </>
            )}
            {sidebarCollapsed && <span className="nav-collapsed-tooltip">AI Screening (AI)</span>}
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'hiring-pipeline' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('hiring-pipeline');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap"><Filter size={17} /></span>
            {!sidebarCollapsed && <span className="nav-item-label">Hiring Pipeline</span>}
            {sidebarCollapsed && <span className="nav-collapsed-tooltip">Hiring Pipeline</span>}
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'assessment-templates' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('assessment-templates');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap"><ClipboardCheck size={17} /></span>
            {!sidebarCollapsed && <span className="nav-item-label">Assessments</span>}
            {sidebarCollapsed && <span className="nav-collapsed-tooltip">Assessments</span>}
          </button>

          {/* Group 2: INTERVIEWS & PERFORMANCE */}
          <div className="nav-group-header" style={{ marginTop: '14px' }}>
            <span className="nav-group-label">INTERVIEWS & PERFORMANCE</span>
          </div>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'performance-hub' || activeTab === 'assessment-submissions' || activeTab === 'assessment-leaderboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('performance-hub');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap">
              <Trophy size={17} />
              {sidebarCollapsed && <span className="nav-collapsed-badge-dot nav-badge-dot--indigo" />}
            </span>
            {!sidebarCollapsed && (
              <>
                <span className="nav-item-label">Performance Hub</span>
                <span className="nav-badge-pill nav-badge-indigo">Top 5</span>
              </>
            )}
            {sidebarCollapsed && <span className="nav-collapsed-tooltip">Performance Hub (Top 5)</span>}
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'interview-selection' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('interview-selection');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap"><UserCheck size={17} /></span>
            {!sidebarCollapsed && <span className="nav-item-label">Interview Selection</span>}
            {sidebarCollapsed && <span className="nav-collapsed-tooltip">Interview Selection</span>}
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'monthly-planner' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('monthly-planner');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap"><CalendarDays size={17} /></span>
            {!sidebarCollapsed && <span className="nav-item-label">Monthly Planner</span>}
            {sidebarCollapsed && <span className="nav-collapsed-tooltip">Monthly Planner</span>}
          </button>

          {/* Group 3: PREFERENCES & SYSTEM */}
          <div className="nav-group-header" style={{ marginTop: '14px' }}>
            <span className="nav-group-label">SYSTEM</span>
          </div>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap"><Settings size={17} /></span>
            {!sidebarCollapsed && <span className="nav-item-label">Company Settings</span>}
            {sidebarCollapsed && <span className="nav-collapsed-tooltip">Company Settings</span>}
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('security');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon-wrap"><ShieldCheck size={17} /></span>
            {!sidebarCollapsed && <span className="nav-item-label">Security</span>}
            {sidebarCollapsed && <span className="nav-collapsed-tooltip">Security</span>}
          </button>
        </nav>

        {/* Sidebar Footer User Info & Signout */}
        <div className="dashboard-sidebar-footer">
          <div
            className="sidebar-user-card"
            title={sidebarCollapsed ? `${companyDisplayName} • Click to Sign Out` : undefined}
            onClick={sidebarCollapsed ? handleLogout : undefined}
            style={sidebarCollapsed ? { cursor: 'pointer' } : undefined}
          >
            <div className="user-avatar-initials">
              {currentUser?.logoUrl ? (
                <img
                  src={currentUser.logoUrl}
                  alt={companyDisplayName}
                  className="sidebar-avatar-img"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                companyDisplayName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'BC'
              )}
            </div>
            {!sidebarCollapsed ? (
              <>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name" title={companyDisplayName}>{companyDisplayName}</span>
                  <span className="sidebar-user-email" title={companyEmail}>{companyEmail}</span>
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
              <span className="nav-collapsed-tooltip">Sign Out ({companyDisplayName})</span>
            )}
          </div>
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
                {activeTab === 'pipelines' && 'AI Screening'}
                {activeTab === 'hiring-pipeline' && 'Hiring Pipeline'}
                {activeTab === 'assessment-templates' && 'Assessments'}
                {(activeTab === 'performance-hub' || activeTab === 'assessment-submissions' || activeTab === 'assessment-leaderboard') && 'Performance Hub'}
                {activeTab === 'interview-selection' && 'Interview Selection'}
                {activeTab === 'monthly-planner' && 'Monthly Planner'}
                {activeTab === 'assessments' && 'Assessments'}
                {activeTab === 'settings' && 'Settings'}
                {activeTab === 'security' && 'Security'}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <LiveDateTime />
          </div>
        </header>

        {/* Dashboard Scrollable Viewport */}
        <main className={`dashboard-viewport ${activeTab === 'monthly-planner' ? 'dashboard-viewport--planner' : ''} ${activeTab === 'settings' ? 'dashboard-viewport--settings' : ''} ${activeTab === 'security' ? 'dashboard-viewport--security' : ''}`}>
          {activeTab === 'vacancies' ? (
            <JobVacancies />
          ) : activeTab === 'pipelines' ? (
            <PipelineJobSelector />
          ) : activeTab === 'hiring-pipeline' ? (
            <HiringPipeline />
          ) : activeTab === 'assessment-templates' ? (
            <TechnicalAssessments activeSection="templates" />
          ) : activeTab === 'performance-hub' ? (
            <TechnicalAssessments activeSection="performance-hub" />
          ) : activeTab === 'assessment-submissions' ? (
            <TechnicalAssessments activeSection="performance-hub" initialPerformanceTab="submissions" />
          ) : activeTab === 'assessment-leaderboard' ? (
            <TechnicalAssessments activeSection="performance-hub" initialPerformanceTab="leaderboard" />
          ) : activeTab === 'interview-selection' ? (
            <InterviewSelection />
          ) : activeTab === 'monthly-planner' ? (
            <MonthlyPlanner />
          ) : activeTab === 'assessments' ? (
            <TechnicalAssessments activeSection="templates" />
          ) : activeTab === 'settings' ? (
            <CompanySettings />
          ) : activeTab === 'security' ? (
            <SecuritySettings />
          ) : activeTab === 'overview' ? (
            <CompanyOverview
              companyName={companyDisplayName}
              stats={stats}
              jobs={jobs}
              loading={dataLoading}
              error={errorMessage}
              onRetry={fetchDashboardData}
              onOpenVacancies={() => setActiveTab('vacancies')}
            />
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
                {dataLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <MetricCardSkeleton key={i} />
                  ))
                ) : (
                  <>
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
                          {stats?.activeVacanciesCount ?? activeJobs.length}
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
                          {stats?.totalVacanciesCount ?? jobs.length}
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
                          {stats?.totalDepartmentsCount ?? (departments.length - 1)}
                        </span>
                        <span className="stat-trend positive">
                          <SparkleIcon />
                          <span>Hiring Units</span>
                        </span>
                      </div>
                      <p className="stat-footer-text">Engineering, AI Research, Design, Product & Ops</p>
                    </div>
                  </>
                )}
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
                      <table className="vacancies-table">
                        <thead>
                          <tr>
                            <th>ROLE & DEPARTMENT</th>
                            <th>LOCATION / TYPE</th>
                            <th>SALARY / EXPERIENCE</th>
                            <th style={{ textAlign: 'right' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 4 }).map((_, i) => (
                            <TableRowSkeleton key={i} cols={4} hasAvatar />
                          ))}
                        </tbody>
                      </table>
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
                            <th style={{ textAlign: 'right' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVacancies.map((job) => (
                            <tr key={job.id} className="vacancy-table-row">
                              <td>
                                <div className="vacancy-title-cell">
                                  <span className="job-row-title font-bold text-slate-900">
                                    {job.title}
                                  </span>
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
                              <td style={{ textAlign: 'right' }}>
                                <span className="status-pill active-pill">Active</span>
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
                      <div className="p-4 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl animate-pulse">
                            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                              <div className="h-2.5 bg-slate-200 rounded w-1/3" />
                            </div>
                          </div>
                        ))}
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
