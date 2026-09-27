import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { publicJobsApi, type JobDto } from '../services/api'
import { JobVacancyCard } from '../components/jobs/JobVacancyCard'
import { SkeletonGrid } from '../components/common/SkeletonCard'
import {
  SparkleIcon,
  SearchIcon,
  ArrowRightIcon,
  CheckIcon,

  LightningIcon,
  TrendUpIcon,
} from '../components/common/Icons'
import './Home.css'

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

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="skillhub-home">
      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="home-hero-content">
          <div className="home-eyebrow">
            <SparkleIcon />
            <span>AI-powered career platform</span>
          </div>

          <h1>Build skills. Prove your ability. <span>Land the right role.</span></h1>
          <p className="home-hero-copy">
            Discover verified opportunities, complete technical assessments, track every application,
            and prepare for interviews from one focused career workspace.
          </p>

          <form onSubmit={handleSearchSubmit} className="home-search-form">
            <span className="home-search-icon"><SearchIcon /></span>
            <input
              type="search"
              aria-label="Search jobs, companies, or skills"
              placeholder="Search jobs, companies, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">Find Jobs <ArrowRightIcon /></button>
          </form>

          <div className="home-trust-row">
            <span><CheckIcon /> Verified employers</span>
            <span><CheckIcon /> Technical assessments</span>
            <span><CheckIcon /> AI interview preparation</span>
          </div>
        </div>

        <div className="home-workspace-preview" aria-label="SkillHub career journey preview">
          <div className="home-preview-topline">
            <div>
              <small>Your career workspace</small>
              <strong>One journey, fully connected</strong>
            </div>
            <span className="home-live-pill"><i /> Live</span>
          </div>
          <div className="home-journey-list">
            <div className="home-journey-item active">
              <b>01</b><div><strong>Discover roles</strong><span>Explore verified opportunities</span></div><CheckIcon />
            </div>
            <div className="home-journey-item">
              <b>02</b><div><strong>Show your skills</strong><span>Complete technical challenges</span></div><LightningIcon />
            </div>
            <div className="home-journey-item">
              <b>03</b><div><strong>Prepare with confidence</strong><span>Use tailored interview guides</span></div><SparkleIcon />
            </div>
          </div>
          <div className="home-preview-footer">
            <span>{loading ? 'Loading live roles...' : `${jobs.length} featured roles available now`}</span>
            <Link to="/candidate-register">Create your profile <ArrowRightIcon /></Link>
          </div>
        </div>
      </section>

      {/* Feature Value Proposition Cards */}
      <section className="home-capabilities-section">
        <div className="home-section-heading centered">
          <span>Everything in one place</span>
          <h2>A clearer path from application to interview</h2>
          <p>Purpose-built tools help candidates stay organized, demonstrate skills, and prepare for every hiring stage.</p>
        </div>
        <div className="home-capabilities-grid">
        <article className="home-capability-card">
          <div className="home-feature-icon">
            <LightningIcon />
          </div>
          <span>01</span>
          <h3>Simple applications</h3>
          <p>
            Find verified vacancies and manage saved roles and submitted applications from your candidate portal.
          </p>
        </article>

        <article className="home-capability-card">
          <div className="home-feature-icon">
            <TrendUpIcon />
          </div>
          <span>02</span>
          <h3>Visible hiring progress</h3>
          <p>
            Follow application stages, technical assessment results, and scheduled interviews without losing context.
          </p>
        </article>

        <article className="home-capability-card">
          <div className="home-feature-icon"><SparkleIcon /></div>
          <span>03</span>
          <h3>Focused interview prep</h3>
          <p>Review role-specific theoretical concepts, practical focus areas, and coach guidance before your interview.</p>
        </article>
        </div>
      </section>

      {/* Featured Roles Section */}
      <section className="home-featured-section">
        <div className="home-featured-header">
          <div className="home-section-heading">
            <div className="home-section-tag">
              <SparkleIcon />
              <span>Featured opportunities</span>
            </div>
            <h2>Explore roles hiring now</h2>
            <p>Open positions published directly by registered employers.</p>
          </div>
          <Link to="/jobs" className="home-view-all-link">
            View all jobs
            <ArrowRightIcon />
          </Link>
        </div>

        {/* Job Cards */}
        {loading ? (
          <SkeletonGrid count={4} variant="rich-grid" />
        ) : jobs.length === 0 ? (
          <div className="home-jobs-empty">
            <div><SearchIcon /></div>
            <h3>
              No Active Vacancies Right Now
            </h3>
            <p>
              We are currently updating our open positions. Please check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="rich-jobs-grid">
            {jobs.map((job) => (
              <JobVacancyCard
                key={job.id}
                job={job}
                isBookmarked={bookmarkedIds.includes(job.id)}
                onToggleBookmark={toggleBookmark}
                showBookmark={true}
              />
            ))}
          </div>
        )}
      </section>

      <section className="home-cta-section">
        <div>
          <span>Ready for your next opportunity?</span>
          <h2>Turn your skills into career momentum.</h2>
          <p>Create your candidate profile and keep your entire hiring journey organized in SkillHub.</p>
        </div>
        <div className="home-cta-actions">
          <Link to="/candidate-register">Get started <ArrowRightIcon /></Link>
          <Link to="/jobs">Browse jobs</Link>
        </div>
      </section>
    </div>
  )
}
