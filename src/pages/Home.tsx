import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { publicJobsApi, type JobDto } from '../services/api'
import { JobVacancyCard } from '../components/jobs/JobVacancyCard'
import {
  SparkleIcon,
  SearchIcon,
  ArrowRightIcon,
  CheckIcon,
  TargetIcon,
  LightningIcon,
  TrendUpIcon,
} from '../components/common/Icons'

export const Home = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedJobs = async () => {
      try {
        setLoading(true)
        const data = await publicJobsApi.getJobs({ limit: 6 })
        setJobs(data)
      } catch (err) {
        console.error('Error loading public jobs for home page:', err)
      } finally {
        setLoading(false)
      }
    }
    loadFeaturedJobs()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/jobs')
    }
  }

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
          Skill Hub matches you to verified technical and AI roles directly from registered employers.
          Smart matching, real-time updates, and a seamless application experience.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-bar-container">
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
          <button className="search-button" type="submit">
            Search
            <ArrowRightIcon />
          </button>
        </form>

        {/* Metric Highlights */}
        <div className="metrics-row">
          <div className="metric-item">
            <CheckIcon />
            <span>{loading ? '...' : `${jobs.length}+`} active verified roles</span>
          </div>
          <div className="metric-item">
            <CheckIcon />
            <span>AI-powered matching</span>
          </div>
          <div className="metric-item">
            <CheckIcon />
            <span>Direct employer requisitions</span>
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
            Our engine analyzes candidate technical profiles against live requisitions to surface top matches.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-box">
            <LightningIcon />
          </div>
          <h3 className="feature-title">Instant Applications</h3>
          <p className="feature-description">
            Apply with one click directly to verified employer databases with zero middleman noise.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-box">
            <TrendUpIcon />
          </div>
          <h3 className="feature-title">Real-time Tracking</h3>
          <p className="feature-description">
            Track requisition status, employer feedback, and interview schedules in real time.
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
            <h2 className="section-title">Top live opportunities</h2>
          </div>
          <Link to="/jobs" className="view-all-link">
            View all jobs
            <ArrowRightIcon />
          </Link>
        </div>

        {/* Job Cards */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Fetching verified job vacancies...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              maxWidth: '520px',
              margin: '0 auto',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#94a3b8',
              }}
            >
              <SearchIcon />
            </div>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '6px',
              }}
            >
              No Active Vacancies Right Now
            </h3>
            <p
              style={{
                fontSize: '13.5px',
                color: '#64748b',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              We are currently updating our open positions. Please check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobVacancyCard
                key={job.id}
                job={job}
                matchPercentage={95}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
