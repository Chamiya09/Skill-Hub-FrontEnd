import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authStorage, type UserDto } from '../services/api'
import {
  SparkleIcon,
  LayoutDashboardIcon,
  BriefcaseIcon,
  KanbanIcon,
  UsersIcon,
  LightningIcon,
  TrendUpIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  BuildingIcon,
  CheckIcon,
  ClockIcon,
  ArrowRightIcon,
} from '../components/common/Icons'
import { JobVacancies } from './JobVacancies'

interface JobVacancy {
  id: string
  title: string
  department: string
  location: string
  type: string
  applicantsCount: number
  aiMatchScore: number
  status: 'Active' | 'Draft' | 'Paused'
  postedDate: string
}

interface CandidateActivity {
  id: string
  candidateName: string
  role: string
  matchScore: number
  stage: 'AI Screened' | 'Technical Round' | 'Executive Review' | 'Offer Sent'
  appliedTime: string
  avatarBg: string
}

export const Dashboard = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'vacancies' | 'pipelines' | 'candidates' | 'settings'>('overview')
  const [selectedFilter, setSelectedFilter] = useState('All')

  // Real-time Date and Time state
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Format cleanly: e.g. Friday, Sep 11, 2026 | 10:30 AM
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

  useEffect(() => {
    const user = authStorage.getUser()
    const token = authStorage.getToken()
    if (!token || !user) {
      navigate('/company-login')
      return
    }
    setCurrentUser(user)
  }, [navigate])

  const handleLogout = () => {
    authStorage.clearAuth()
    navigate('/company-login')
  }

  // Sample data for ATS Dashboard
  const sampleVacancies: JobVacancy[] = [
    {
      id: 'job-1',
      title: 'Senior Full Stack Engineer (React / .NET)',
      department: 'Engineering',
      location: 'Remote (APAC)',
      type: 'Full-time',
      applicantsCount: 42,
      aiMatchScore: 96,
      status: 'Active',
      postedDate: '2d ago',
    },
    {
      id: 'job-2',
      title: 'Staff AI / ML Infrastructure Architect',
      department: 'AI Research',
      location: 'San Francisco, CA (Hybrid)',
      type: 'Full-time',
      applicantsCount: 28,
      aiMatchScore: 92,
      status: 'Active',
      postedDate: '4d ago',
    },
    {
      id: 'job-3',
      title: 'Lead Product Designer (Design Systems)',
      department: 'Product',
      location: 'London, UK (Remote)',
      type: 'Full-time',
      applicantsCount: 19,
      aiMatchScore: 89,
      status: 'Active',
      postedDate: '1w ago',
    },
    {
      id: 'job-4',
      title: 'Enterprise DevOps & Security Engineer',
      department: 'Infrastructure',
      location: 'New York, NY (Onsite)',
      type: 'Contract',
      applicantsCount: 14,
      aiMatchScore: 85,
      status: 'Draft',
      postedDate: '1w ago',
    },
  ]

  const sampleCandidates: CandidateActivity[] = [
    {
      id: 'cand-1',
      candidateName: 'Alexander Hayes',
      role: 'Senior Full Stack Engineer',
      matchScore: 98,
      stage: 'AI Screened',
      appliedTime: '10m ago',
      avatarBg: '#00b074',
    },
    {
      id: 'cand-2',
      candidateName: 'Dr. Elena Rostova',
      role: 'Staff AI / ML Infrastructure Architect',
      matchScore: 95,
      stage: 'Technical Round',
      appliedTime: '1h ago',
      avatarBg: '#3b82f6',
    },
    {
      id: 'cand-3',
      candidateName: 'Marcus Vance',
      role: 'Lead Product Designer',
      matchScore: 91,
      stage: 'Executive Review',
      appliedTime: '3h ago',
      avatarBg: '#8b5cf6',
    },
    {
      id: 'cand-4',
      candidateName: 'Sophia Lin',
      role: 'Enterprise DevOps & Security Engineer',
      matchScore: 88,
      stage: 'Offer Sent',
      appliedTime: 'Yesterday',
      avatarBg: '#f59e0b',
    },
  ]

  const filteredVacancies = sampleVacancies.filter((v) => {
    if (selectedFilter === 'All') return true
    return v.department.toLowerCase().includes(selectedFilter.toLowerCase())
  })

  const companyDisplayName = currentUser?.companyName || 'Corporate Employer'

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

        {/* Company Context Pill */}
        <div className="dashboard-company-pill">
          <div className="company-avatar-box">
            <BuildingIcon />
          </div>
          <div className="company-pill-details">
            <span className="company-pill-name">{companyDisplayName}</span>
            <span className="company-pill-role">
              {currentUser?.role === 'HR_Admin' ? 'Administrator' : currentUser?.role || 'Company Portal'}
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
            <span className="nav-badge-count">{sampleVacancies.length}</span>
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

          <button
            type="button"
            className={`dashboard-nav-item ${activeTab === 'candidates' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('candidates')
              setSidebarOpen(false)
            }}
          >
            <UsersIcon />
            <span>Candidates</span>
            <span className="nav-badge-pill">AI Calibrated</span>
          </button>

          <div className="nav-group-label" style={{ marginTop: '16px' }}>ORGANIZATION</div>

          <Link
            to="/users"
            className="dashboard-nav-item"
            onClick={() => setSidebarOpen(false)}
          >
            <UsersIcon />
            <span>Team Management</span>
          </Link>

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
              {currentUser?.fullName
                ? currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                : 'CO'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{currentUser?.fullName || 'Employer User'}</span>
              <span className="sidebar-user-email">{currentUser?.email}</span>
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
                {activeTab === 'candidates' && 'Candidates Pool'}
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
          ) : (
            <>
              {/* Welcome Banner */}
              <section className="dashboard-welcome-card">
                <div className="welcome-text-col">
                  <div className="welcome-badge">
                    <SparkleIcon />
                    <span>AI Hiring Intelligence Active</span>
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
                    <span>ATS Engine Online & Synced</span>
                  </div>
                </div>
              </section>

              {/* =========================================================
                  3. STAT CARDS (B2B METRICS, ROUNDED-XL, SOFT SHADOW)
                  ========================================================= */}
              <section className="stats-grid-row">
                {/* Card 1: Active Jobs */}
                <div className="dashboard-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Active Vacancies</span>
                    <div className="stat-icon-wrapper stat-icon-blue">
                      <BriefcaseIcon />
                    </div>
                  </div>
                  <div className="stat-value-box">
                    <span className="stat-number">{sampleVacancies.length}</span>
                    <span className="stat-trend positive">
                      <TrendUpIcon />
                      <span>+2 this month</span>
                    </span>
                  </div>
                  <p className="stat-footer-text">All roles actively accepting AI-matched candidates</p>
                </div>

                {/* Card 2: Total Candidates */}
                <div className="dashboard-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Total Applicants</span>
                    <div className="stat-icon-wrapper stat-icon-green">
                      <UsersIcon />
                    </div>
                  </div>
                  <div className="stat-value-box">
                    <span className="stat-number">124</span>
                    <span className="stat-trend positive">
                      <TrendUpIcon />
                      <span>+18% vs last week</span>
                    </span>
                  </div>
                  <p className="stat-footer-text">38 pre-screened in the last 48 hours</p>
                </div>

                {/* Card 3: AI Matching Accuracy */}
                <div className="dashboard-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">AI Match Confidence</span>
                    <div className="stat-icon-wrapper stat-icon-purple">
                      <LightningIcon />
                    </div>
                  </div>
                  <div className="stat-value-box">
                    <span className="stat-number">94.8%</span>
                    <span className="stat-trend neutral">
                      <CheckIcon />
                      <span>High Precision</span>
                    </span>
                  </div>
                  <p className="stat-footer-text">Based on skills, code benchmarks & stack fit</p>
                </div>

                {/* Card 4: Scheduled Interviews */}
                <div className="dashboard-stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Interviews Pipeline</span>
                    <div className="stat-icon-wrapper stat-icon-orange">
                      <ClockIcon />
                    </div>
                  </div>
                  <div className="stat-value-box">
                    <span className="stat-number">16</span>
                    <span className="stat-trend positive">
                      <span>4 Scheduled Today</span>
                    </span>
                  </div>
                  <p className="stat-footer-text">Technical and executive interview rounds</p>
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
                      <p className="panel-subtitle">Real-time candidate volume & AI suitability score</p>
                    </div>
                    <div className="panel-filter-pills">
                      {['All', 'Engineering', 'Product', 'Infrastructure'].map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          className={`filter-pill-btn ${selectedFilter === filter ? 'active' : ''}`}
                          onClick={() => setSelectedFilter(filter)}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="vacancies-table-wrapper">
                    <table className="vacancies-table">
                      <thead>
                        <tr>
                          <th>ROLE & DEPARTMENT</th>
                          <th>LOCATION / TYPE</th>
                          <th>APPLICANTS</th>
                          <th>AI MATCH FIT</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'right' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVacancies.map((job) => (
                          <tr key={job.id} className="vacancy-table-row">
                            <td>
                              <div className="vacancy-title-cell">
                                <span className="job-row-title">{job.title}</span>
                                <span className="job-row-dept">{job.department}</span>
                              </div>
                            </td>
                            <td>
                              <div className="vacancy-meta-cell">
                                <span>{job.location}</span>
                                <span className="type-badge">{job.type}</span>
                              </div>
                            </td>
                            <td>
                              <div className="applicants-count-cell">
                                <UsersIcon />
                                <span className="applicants-num">{job.applicantsCount}</span>
                              </div>
                            </td>
                            <td>
                              <div className="ai-score-pill">
                                <SparkleIcon />
                                <span>{job.aiMatchScore}% Match</span>
                              </div>
                            </td>
                            <td>
                              <span className="status-pill active-pill">Active</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn-table-action"
                                onClick={() => setActiveTab('vacancies')}
                              >
                                <span>Manage</span>
                                <ArrowRightIcon />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Right Column: Recent Applicant Pipeline */}
                <section className="dashboard-panel-card">
                  <div className="panel-card-header">
                    <div>
                      <h2 className="panel-title">Recent Pipeline Activity</h2>
                      <p className="panel-subtitle">Latest candidate stage updates</p>
                    </div>
                    <span className="activity-count-badge">Live Updates</span>
                  </div>

                  <div className="candidates-activity-list">
                    {sampleCandidates.map((cand) => (
                      <div key={cand.id} className="candidate-activity-card">
                        <div
                          className="candidate-avatar-circle"
                          style={{ backgroundColor: cand.avatarBg }}
                        >
                          {cand.candidateName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="candidate-details-col">
                          <div className="candidate-name-row">
                            <span className="candidate-name">{cand.candidateName}</span>
                            <span className="candidate-time">{cand.appliedTime}</span>
                          </div>
                          <span className="candidate-role">{cand.role}</span>
                          <div className="candidate-tags-row">
                            <span className="candidate-stage-pill">{cand.stage}</span>
                            <span className="candidate-score-pill">
                              <SparkleIcon />
                              {cand.matchScore}% AI Match
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick ATS Action Shortcuts */}
                  <div className="quick-shortcuts-box">
                    <h3 className="shortcuts-title">Quick Actions</h3>
                    <div className="shortcuts-grid">
                      <Link to="/users" className="shortcut-btn">
                        <UsersIcon />
                        <span>Invite Team Member</span>
                      </Link>
                      <Link to="/jobs" className="shortcut-btn">
                        <BriefcaseIcon />
                        <span>Explore Talent Pool</span>
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
