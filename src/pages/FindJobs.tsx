import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publicJobsApi, savedJobsApi, type JobDto } from '../services/api'
import { jobRecommendationsApi } from '../services/api'
import { JobVacancyCard } from '../components/jobs/JobVacancyCard'
import { SkeletonGrid } from '../components/common/SkeletonCard'
import { useAuth } from '../context/AuthContext'
import {
  SparkleIcon,
  SearchIcon,
  ClockIcon,
  BriefcaseIcon,
  FilterIcon,
} from '../components/common/Icons'

export const FindJobs = () => {
  const { currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [jobs, setJobs] = useState<JobDto[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [matchScores, setMatchScores] = useState<Record<string, number>>({})

  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState('All Roles')
  const [selectedWorkType, setSelectedWorkType] = useState('All')
  const [selectedExperience, setSelectedExperience] = useState('All')
  const [sortBy, setSortBy] = useState<'match' | 'recent'>('match')
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])

  // Fetch real public jobs from backend
  const fetchPublicJobs = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const data = await publicJobsApi.getJobs()
      setJobs(data)
    } catch (err: any) {
      console.error('Error fetching public jobs:', err)
      setErrorMessage(err.message || 'Failed to fetch active vacancies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPublicJobs()

    const handleProfileUpdate = () => {
      fetchPublicJobs()
    }

    window.addEventListener('skillhub_company_profile_updated', handleProfileUpdate)
    window.addEventListener('skillhub_auth_change', handleProfileUpdate)
    return () => {
      window.removeEventListener('skillhub_company_profile_updated', handleProfileUpdate)
      window.removeEventListener('skillhub_auth_change', handleProfileUpdate)
    }
  }, [])

  const isCandidate = currentUser?.role?.toLowerCase() === 'candidate'

  useEffect(() => {
    if (!isCandidate || !currentUser?.id) {
      return
    }

    let isCurrent = true
    Promise.resolve()
      .then(() => {
        return jobRecommendationsApi.getForCandidate(currentUser.id)
      })
      .then((recommendations) => {
        if (!isCurrent) return
        setMatchScores(
          Object.fromEntries(
            recommendations.map((job) => [
              job.jobId,
              Math.min(100, Math.max(0, job.matchPercentage)),
            ]),
          ),
        )
      })
      .catch((error: unknown) => {
        if (!isCurrent) return
        console.error('Unable to load AI job recommendations:', error)
      })

    return () => {
      isCurrent = false
    }
  }, [currentUser?.id, isCandidate])

  useEffect(() => {
    if (!isCandidate) return

    savedJobsApi.getIds()
      .then(setBookmarkedIds)
      .catch((error: unknown) => console.error('Unable to load saved jobs:', error))
  }, [isCandidate])

  // Sync search input if query param changes
  useEffect(() => {
    const q = searchParams.get('search')
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q)
    }
  }, [searchParams])

  // Extract dynamic categories from live jobs
  const categories = useMemo(() => {
    const depts = new Set(jobs.map((j) => j.department?.trim()).filter(Boolean))
    return ['All Roles', ...Array.from(depts)]
  }, [jobs])

  const toggleBookmark = async (id: string) => {
    if (!isCandidate) return

    const wasSaved = bookmarkedIds.includes(id)
    setBookmarkedIds((current) => wasSaved
      ? current.filter((item) => item !== id)
      : [...current, id])

    try {
      if (wasSaved) await savedJobsApi.remove(id)
      else await savedJobsApi.save(id)
    } catch (error) {
      setBookmarkedIds((current) => wasSaved
        ? [...new Set([...current, id])]
        : current.filter((item) => item !== id))
      console.error('Unable to update saved job:', error)
    }
  }

  const scoredJobs = useMemo(
    () => jobs.map((job) => ({ ...job, matchPercentage: matchScores[job.id] })),
    [jobs, matchScores],
  )

  const filteredJobs = useMemo(() => {
    return scoredJobs
      .filter((job) => {
        const term = searchTerm.toLowerCase().trim()
        const matchesTags = (job.tags || []).some((tag) =>
          tag.toLowerCase().includes(term)
        )

        const matchesSearch =
          !term ||
          job.title.toLowerCase().includes(term) ||
          (job.companyName || '').toLowerCase().includes(term) ||
          job.department.toLowerCase().includes(term) ||
          job.location.toLowerCase().includes(term) ||
          matchesTags

        const matchesCategory =
          selectedCategory === 'All Roles' ||
          job.department.toLowerCase() === selectedCategory.toLowerCase()

        const matchesWorkType =
          selectedWorkType === 'All' ||
          job.employmentType.toLowerCase().includes(selectedWorkType.toLowerCase())

        const matchesExp =
          selectedExperience === 'All' ||
          job.experienceLevel.toLowerCase().includes(selectedExperience.toLowerCase())

        return matchesSearch && matchesCategory && matchesWorkType && matchesExp
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        return (b.matchPercentage ?? -1) - (a.matchPercentage ?? -1)
      })
  }, [scoredJobs, searchTerm, selectedCategory, selectedWorkType, selectedExperience, sortBy])

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedCategory('All Roles')
    setSelectedWorkType('All')
    setSelectedExperience('All')
    setSearchParams({})
  }

  return (
    <div className="findjobs-container">
      {/* Hero Section */}
      <div className="findjobs-hero">
        <div className="badge-tag">
          <SparkleIcon />
          <span>LIVE VACANCY DIRECTORY</span>
        </div>
        <h1 className="hero-heading">
          Discover high-impact roles <br />
          <span className="ai-text">matched to your skills</span>
        </h1>
        <p className="hero-subtext">
          Browse verified technical and AI positions directly from employer applicant tracking systems.
        </p>
      </div>

      {/* Standardized Search & Filter Bar */}
      <div className="filter-card-wrapper">
        <div className="filter-grid-bar">
          {/* Keyword Search */}
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search by job title, department, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Work Type Select */}
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}>
              <ClockIcon />
            </span>
            <select
              value={selectedWorkType}
              onChange={(e) => setSelectedWorkType(e.target.value)}
            >
              <option value="All">All Work Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Remote">Remote</option>
              <option value="Contract">Contract</option>
              <option value="Part-time">Part-time</option>
            </select>
          </div>

          {/* Experience Select */}
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}>
              <BriefcaseIcon />
            </span>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
            >
              <option value="All">All Seniorities</option>
              <option value="Entry">Entry Level</option>
              <option value="Mid">Mid-Level</option>
              <option value="Senior">Senior Level</option>
              <option value="Lead">Lead / Staff</option>
            </select>
          </div>

          {/* Sort Select */}
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}>
              <FilterIcon />
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="match">Highest AI Match</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>

          {/* Reset Action */}
          {(searchTerm ||
            selectedCategory !== 'All Roles' ||
            selectedWorkType !== 'All' ||
            selectedExperience !== 'All') && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn-secondary"
              style={{ padding: '10px 16px' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Standardized Category Tabs */}
      {categories.length > 1 && (
        <div className="category-pills-row">
          <div className="unified-tab-bar">
            {categories.map((cat) => {
              const count =
                cat === 'All Roles'
                  ? jobs.length
                  : jobs.filter((j) => j.department?.toLowerCase() === cat.toLowerCase()).length

              return (
                <button
                  key={cat}
                  type="button"
                  className={`unified-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span>{cat}</span>
                  <span className="unified-tab-count">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchPublicJobs}
            className="text-xs font-semibold text-red-800 underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Meta Header */}
      <div className="jobs-results-header">
        <div className="jobs-count-text">
          Showing <span className="jobs-count-number">{filteredJobs.length}</span> live verified roles
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
          <span>PostgreSQL Active Sync</span>
          <span style={{ color: '#00b074' }}>●</span>
        </div>
      </div>

      {/* Job Cards Grid */}
      {loading ? (
        <SkeletonGrid count={6} variant="rich-grid" />
      ) : filteredJobs.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
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
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            No jobs match your filter criteria
          </h3>
          <p style={{ color: '#64748b', fontSize: '14.5px', marginBottom: '24px' }}>
            Try broadening your search terms or clearing selected role filters.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="btn-primary"
            style={{ margin: '0 auto' }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="rich-jobs-grid">
          {filteredJobs.map((job) => {
            const isBookmarked = bookmarkedIds.includes(job.id)

            return (
              <JobVacancyCard
                key={job.id}
                job={job}
                isBookmarked={isBookmarked}
                onToggleBookmark={toggleBookmark}
                showBookmark={true}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
