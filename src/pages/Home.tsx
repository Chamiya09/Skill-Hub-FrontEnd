import { useState } from 'react'
import {
  SparkleIcon,
  SearchIcon,
  ArrowRightIcon,
  CheckIcon,
  TargetIcon,
  LightningIcon,
  TrendUpIcon,
  MapPinIcon,
  ClockIcon,
} from '../components/common/Icons'

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

export const Home = () => {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
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
    </>
  )
}
