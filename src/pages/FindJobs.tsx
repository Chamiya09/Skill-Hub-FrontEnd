import { useState, useMemo } from 'react'
import {
  SparkleIcon,
  SearchIcon,
  MapPinIcon,
  ClockIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  FilterIcon,
} from '../components/common/Icons'

interface JobItem {
  id: string
  title: string
  company: string
  companyShort: string
  companyBg: string
  location: string
  workType: 'Remote' | 'Hybrid' | 'On-site'
  experience: 'Entry' | 'Mid' | 'Senior' | 'Lead / Staff'
  category: 'Engineering' | 'AI & ML' | 'Product & Design' | 'Data Science'
  salary: string
  matchPercent: number
  postedTime: string
  skills: string[]
  isFeatured?: boolean
}

const allJobsList: JobItem[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer (Design Systems)',
    company: 'Neuralabs AI',
    companyShort: 'NL',
    companyBg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    location: 'San Francisco, CA',
    workType: 'Remote',
    experience: 'Senior',
    category: 'Engineering',
    salary: '$165,000 - $210,000',
    matchPercent: 98,
    postedTime: 'Just now',
    skills: ['React 19', 'TypeScript', 'Tailwind', 'Next.js', 'WebGL'],
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Staff Machine Learning Platform Engineer',
    company: 'Vector Compute',
    companyShort: 'VC',
    companyBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    location: 'New York, NY',
    workType: 'Hybrid',
    experience: 'Lead / Staff',
    category: 'AI & ML',
    salary: '$210,000 - $265,000',
    matchPercent: 95,
    postedTime: '2 hours ago',
    skills: ['PyTorch', 'Kubernetes', 'Distributed Systems', 'CUDA', 'Python'],
    isFeatured: true,
  },
  {
    id: '3',
    title: 'Lead Product Designer, AI Tools',
    company: 'Flowstate Design',
    companyShort: 'FS',
    companyBg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    location: 'Austin, TX',
    workType: 'Remote',
    experience: 'Senior',
    category: 'Product & Design',
    salary: '$150,000 - $185,000',
    matchPercent: 92,
    postedTime: '5 hours ago',
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
  },
  {
    id: '4',
    title: 'Senior Full Stack Engineer (Core Platform)',
    company: 'HyperScale Data',
    companyShort: 'HD',
    companyBg: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
    location: 'Seattle, WA',
    workType: 'Remote',
    experience: 'Senior',
    category: 'Engineering',
    salary: '$170,000 - $220,000',
    matchPercent: 94,
    postedTime: '1 day ago',
    skills: ['Node.js', 'React', 'PostgreSQL', 'Go', 'GraphQL'],
  },
  {
    id: '5',
    title: 'AI Research Scientist (Reasoning Models)',
    company: 'Cognition Lab',
    companyShort: 'CL',
    companyBg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    location: 'San Francisco, CA',
    workType: 'Hybrid',
    experience: 'Lead / Staff',
    category: 'AI & ML',
    salary: '$240,000 - $310,000',
    matchPercent: 96,
    postedTime: '1 day ago',
    skills: ['LLM Fine-Tuning', 'RLHF', 'Transformers', 'JAX', 'NLP'],
    isFeatured: true,
  },
  {
    id: '6',
    title: 'Principal Data Architect & Analytics Lead',
    company: 'OmniMetrics Enterprise',
    companyShort: 'OM',
    companyBg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
    location: 'Boston, MA',
    workType: 'On-site',
    experience: 'Lead / Staff',
    category: 'Data Science',
    salary: '$190,000 - $240,000',
    matchPercent: 89,
    postedTime: '2 days ago',
    skills: ['Snowflake', 'dbt', 'Databricks', 'Apache Spark', 'Python'],
  },
]

const categories = [
  'All Roles',
  'Engineering',
  'AI & ML',
  'Product & Design',
  'Data Science',
]

export const FindJobs = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Roles')
  const [selectedWorkType, setSelectedWorkType] = useState('All')
  const [selectedExperience, setSelectedExperience] = useState('All')
  const [sortBy, setSortBy] = useState<'match' | 'salary' | 'recent'>('match')
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [appliedJobTitle, setAppliedJobTitle] = useState<string | null>(null)

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleApply = (jobTitle: string) => {
    setAppliedJobTitle(jobTitle)
    setTimeout(() => {
      setAppliedJobTitle(null)
    }, 3500)
  }

  const filteredJobs = useMemo(() => {
    return allJobsList
      .filter((job) => {
        const matchesSearch =
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.skills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase())
          )
        const matchesCategory =
          selectedCategory === 'All Roles' || job.category === selectedCategory
        const matchesWorkType =
          selectedWorkType === 'All' || job.workType === selectedWorkType
        const matchesExp =
          selectedExperience === 'All' || job.experience === selectedExperience

        return matchesSearch && matchesCategory && matchesWorkType && matchesExp
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchPercent - a.matchPercent
        if (sortBy === 'recent') return a.id.localeCompare(b.id)
        return 0
      })
  }, [searchTerm, selectedCategory, selectedWorkType, selectedExperience, sortBy])

  return (
    <div className="findjobs-container">
      {/* Toast Notification (Light Theme) */}
      {appliedJobTitle && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#ffffff',
            color: '#0f172a',
            padding: '16px 24px',
            borderRadius: '16px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #b7eedc',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#e6f9f2',
              color: '#00b074',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckIcon />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Application Dispatched!</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Your profile was submitted to <strong>{appliedJobTitle}</strong>.
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="findjobs-hero">
        <div className="badge-tag">
          <SparkleIcon />
          <span>AI TALENT ENGINE & DISCOVERY</span>
        </div>
        <h1 className="hero-heading">
          Discover high-impact roles <br />
          <span className="ai-text">matched to your skills</span>
        </h1>
        <p className="hero-subtext">
          Browse verified technical and AI positions with transparent compensation and zero-noise matching.
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
              placeholder="Search by job title, tech stack, or company..."
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
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
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
              <option value="Lead / Staff">Staff / Principal</option>
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
              <option value="match">Highest Match</option>
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
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All Roles')
                setSelectedWorkType('All')
                setSelectedExperience('All')
              }}
              className="btn-secondary"
              style={{ padding: '10px 16px' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Standardized Category Tabs */}
      <div className="category-pills-row">
        <div className="unified-tab-bar">
          {categories.map((cat) => {
            const count =
              cat === 'All Roles'
                ? allJobsList.length
                : allJobsList.filter((j) => j.category === cat).length

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

      {/* Results Meta Header */}
      <div className="jobs-results-header">
        <div className="jobs-count-text">
          Showing <span className="jobs-count-number">{filteredJobs.length}</span> curated roles
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
          <span>AI Relevance Engine: Active</span>
          <span style={{ color: '#00b074' }}>●</span>
        </div>
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
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
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('All Roles')
              setSelectedWorkType('All')
              setSelectedExperience('All')
            }}
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
              <div
                key={job.id}
                className={`rich-job-card ${job.isFeatured ? 'featured-card' : ''}`}
              >
                {job.isFeatured && (
                  <div className="featured-corner-tag">Featured Role</div>
                )}

                {/* Job Card Header */}
                <div className="job-card-header">
                  <div className="company-info">
                    <div
                      className="company-logo"
                      style={{ background: job.companyBg }}
                    >
                      {job.companyShort}
                    </div>
                    <div className="company-details">
                      <span className="company-name">{job.company}</span>
                      <span className="post-time">{job.postedTime}</span>
                    </div>
                  </div>

                  <div className="match-badge">
                    <SparkleIcon />
                    <span>{job.matchPercent}% Match</span>
                  </div>
                </div>

                {/* Job Title */}
                <h3 className="job-title">{job.title}</h3>

                {/* Meta details */}
                <div className="job-meta-row">
                  <div className="meta-item">
                    <MapPinIcon />
                    <span>{job.location}</span>
                  </div>
                  <div className="meta-item">
                    <ClockIcon />
                    <span>{job.workType}</span>
                  </div>
                  <div className="meta-item">
                    <BriefcaseIcon />
                    <span>{job.experience}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="job-skills-tags">
                  {job.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="job-card-footer">
                  <div className="salary">{job.salary}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className={`bookmark-btn ${isBookmarked ? 'saved' : ''}`}
                      onClick={() => toggleBookmark(job.id)}
                      title={isBookmarked ? 'Saved to bookmarks' : 'Save job'}
                      aria-label="Bookmark job"
                    >
                      <BookmarkIcon filled={isBookmarked} />
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: '13.5px' }}
                      onClick={() => handleApply(job.title)}
                    >
                      <span>Quick Apply</span>
                      <ArrowRightIcon />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
