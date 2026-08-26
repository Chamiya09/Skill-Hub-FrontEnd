import { useState } from 'react'
import './App.css'

// Sparkle icon for AI badge
const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
)

// Search icon
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

// Check icon
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Target / Bullseye icon
const TargetIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

// Lightning icon
const LightningIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

// Trend Up icon
const TrendUpIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
)

// Location Pin icon
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

// Clock / Remote icon
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 14 14" />
  </svg>
)

// Chevron Down
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// Arrow Right
const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)


interface Job {
  id: string
  company: string
  companyShort: string
  postedTime: string
  matchPercent: number
  isMultilineMatch?: boolean
  title: string
  location: string
  workType: string
  salary: string
}

const jobOpportunities: Job[] = [
  {
    id: '1',
    company: 'Neuralabs AI',
    companyShort: 'NL',
    postedTime: '2d ago',
    matchPercent: 96,
    title: 'Senior Frontend Engineer',
    location: 'San Francisco, CA',
    workType: 'Remote',
    salary: '$160k - $210k',
  },
  {
    id: '2',
    company: 'Vector Compute',
    companyShort: 'VC',
    postedTime: '1d ago',
    matchPercent: 92,
    isMultilineMatch: true,
    title: 'ML Platform Engineer',
    location: 'New York, NY',
    workType: 'Hybrid',
    salary: '$180k - $230k',
  },
  {
    id: '3',
    company: 'Flowstate',
    companyShort: 'FS',
    postedTime: '4d ago',
    matchPercent: 88,
    title: 'Product Designer, AI Tools',
    location: 'Remote',
    workType: 'Remote',
    salary: '$140k - $175k',
  },
]

export default function App() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Navigation Bar */}
        <header className="navbar">
          <div className="brand">
            <div className="logo-icon-wrap">
              <SparkleIcon />
            </div>
            <span className="brand-name">Skill Hub</span>
          </div>

          <nav className="nav-center-menu">
            <a href="#home" className="nav-link active">Home</a>
            <a href="#find-jobs" className="nav-link">Find Jobs</a>
            <a href="#about" className="nav-link">About Us</a>
            <a href="#contact" className="nav-link">Contact Us</a>
          </nav>

          <button className="user-profile-btn" type="button">
            <div className="avatar-circle">RJ</div>
            <span className="user-name">Riya J.</span>
            <span className="chevron-icon">
              <ChevronDownIcon />
            </span>
          </button>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="badge-tag">
            <SparkleIcon />
            <span>AI-POWERED RECRUITMENT PLATFORM</span>
          </div>

          <h1 className="hero-heading">
            Find your next role with <span className="ai-text">AI precision</span>
          </h1>

          <p className="hero-subtext">
            Skill Hub matches you to the best AI and tech roles based on your skills,
            experience, and career goals. Smart matching, real-time updates, and a
            seamless application experience.
          </p>

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-input-wrap">
              <span className="search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search for jobs, companies, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="search-button" type="button">
              Search
              <ArrowRightIcon />
            </button>
          </div>

          {/* Metric Highlights */}
          <div className="metrics-row">
            <div className="metric-item">
              <CheckIcon />
              <span>2,840+ active roles</span>
            </div>
            <div className="metric-item">
              <CheckIcon />
              <span>AI-powered matching</span>
            </div>
            <div className="metric-item">
              <CheckIcon />
              <span>Free for candidates</span>
            </div>
          </div>
        </section>

        {/* Feature Value Proposition Cards */}
        <section className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <TargetIcon />
            </div>
            <h3 className="feature-title">AI Match Scoring</h3>
            <p className="feature-description">
              Our engine analyzes your profile against every role and surfaces only
              the best fits.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <LightningIcon />
            </div>
            <h3 className="feature-title">Instant Applications</h3>
            <p className="feature-description">
              Apply with one click. Your profile is automatically tailored for each
              submission.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <TrendUpIcon />
            </div>
            <h3 className="feature-title">Real-time Tracking</h3>
            <p className="feature-description">
              Track every application from submission to interview in one unified
              dashboard.
            </p>
          </div>
        </section>

        {/* Featured Roles Section */}
        <section className="featured-section">
          <div className="section-header">
            <div className="section-header-left">
              <div className="section-tag">
                <SparkleIcon />
                <span>FEATURED ROLES</span>
              </div>
              <h2 className="section-title">Top AI-matched opportunities</h2>
            </div>
            <a href="#all-jobs" className="view-all-link">
              View all jobs
              <ArrowRightIcon />
            </a>
          </div>

          {/* Job Cards */}
          <div className="jobs-grid">
            {jobOpportunities.map((job) => (
              <div className="job-card" key={job.id}>
                <div className="job-card-header">
                  <div className="company-info">
                    <div className="company-logo">{job.companyShort}</div>
                    <div className="company-details">
                      <span className="company-name">{job.company}</span>
                      <span className="post-time">{job.postedTime}</span>
                    </div>
                  </div>

                  {job.isMultilineMatch ? (
                    <div className="match-badge multiline">
                      <SparkleIcon />
                      <div className="match-badge-text-stack">
                        <span>{job.matchPercent}% AI</span>
                        <span>Match</span>
                      </div>
                    </div>
                  ) : (
                    <div className="match-badge">
                      <SparkleIcon />
                      <span>{job.matchPercent}% AI Match</span>
                    </div>
                  )}
                </div>

                <h3 className="job-title">{job.title}</h3>

                <div className="job-meta-row">
                  <div className="meta-item">
                    <MapPinIcon />
                    <span>{job.location}</span>
                  </div>
                  <div className="meta-item">
                    <ClockIcon />
                    <span>{job.workType}</span>
                  </div>
                </div>

                <div className="job-card-footer">
                  <span className="salary">{job.salary}</span>
                  <button className="view-details-btn" type="button">
                    View Details
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer Section */}
      <footer className="footer-container">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="brand">
                <div className="logo-icon-wrap">
                  <SparkleIcon />
                </div>
                <span className="brand-name">Skill Hub</span>
              </div>
              <p className="footer-tagline">
                AI-powered recruitment platform connecting top talent with next-generation AI and tech roles.
              </p>
            </div>

            <div className="footer-links-grid">
              <div className="footer-column">
                <h4 className="footer-column-title">Platform</h4>
                <ul className="footer-list">
                  <li><a href="#find-jobs" className="footer-link">Find Jobs</a></li>
                  <li><a href="#browse-companies" className="footer-link">Browse Companies</a></li>
                  <li><a href="#salary-calculator" className="footer-link">Salary Calculator</a></li>
                  <li><a href="#ai-matching" className="footer-link">AI Match Engine</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4 className="footer-column-title">Candidates</h4>
                <ul className="footer-list">
                  <li><a href="#resume-builder" className="footer-link">Profile Tailoring</a></li>
                  <li><a href="#job-alerts" className="footer-link">Job Alerts</a></li>
                  <li><a href="#career-guidance" className="footer-link">Career Insights</a></li>
                  <li><a href="#applications" className="footer-link">Application Tracker</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4 className="footer-column-title">Company</h4>
                <ul className="footer-list">
                  <li><a href="#about" className="footer-link">About Us</a></li>
                  <li><a href="#careers" className="footer-link">Careers</a></li>
                  <li><a href="#privacy" className="footer-link">Privacy Policy</a></li>
                  <li><a href="#contact" className="footer-link">Contact Support</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} Skill Hub Inc. All rights reserved.
            </p>
            <div className="footer-legal-links">
              <a href="#privacy" className="footer-legal-link">Privacy Policy</a>
              <span className="legal-dot">•</span>
              <a href="#terms" className="footer-legal-link">Terms of Service</a>
              <span className="legal-dot">•</span>
              <a href="#cookies" className="footer-legal-link">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

