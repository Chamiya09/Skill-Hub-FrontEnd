import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { publicJobsApi, type JobDto } from '../services/api'
import { JobVacancyCard } from '../components/jobs/JobVacancyCard'
import {
  SparkleIcon,
  MapPinIcon,
  ClockIcon,
  BriefcaseIcon,
  CheckIcon,
  ArrowRightIcon,
  BookmarkIcon,
  SearchIcon,
  SendIcon,
} from '../components/common/Icons'

export const JobDetailsPublic: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [job, setJob] = useState<JobDto | null>(null)
  const [suggestedJobs, setSuggestedJobs] = useState<JobDto[]>([])
  const [loading, setLoading] = useState(true)
  const [suggestedLoading, setSuggestedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)

  // Apply form state
  const [applicantName, setApplicantName] = useState('')
  const [applicantEmail, setApplicantEmail] = useState('')
  const [applicantPhone, setApplicantPhone] = useState('')
  const [applicantLinkedin, setApplicantLinkedin] = useState('')
  const [coverNote, setCoverNote] = useState('')
  const [resumeFile, setResumeFile] = useState<string | null>(null)
  const [submittingApply, setSubmittingApply] = useState(false)

  // Scroll to top when job ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  // Fetch target job details
  useEffect(() => {
    if (!id) return

    const fetchJob = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await publicJobsApi.getJobById(id)
        setJob(data)
      } catch (err: any) {
        console.error('Error fetching job details:', err)
        setError(err.message || 'Job vacancy could not be found or has expired.')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [id])

  // Fetch suggested matching jobs
  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        setSuggestedLoading(true)
        const allJobs = await publicJobsApi.getJobs({ limit: 6 })
        // Filter out current job and pick up to 3 suggested matches
        const others = allJobs.filter((j) => j.id !== id).slice(0, 3)
        setSuggestedJobs(others)
      } catch (err) {
        console.error('Error fetching suggested jobs:', err)
      } finally {
        setSuggestedLoading(false)
      }
    }

    fetchSuggested()
  }, [id])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 3000)
  }

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingApply(true)
    setTimeout(() => {
      setSubmittingApply(false)
      setShowApplyModal(false)
      setApplicationSubmitted(true)
      setTimeout(() => setApplicationSubmitted(false), 5000)
    }, 1200)
  }

  if (loading) {
    return (
      <div className="findjobs-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500 }}>
            Loading job requisition details...
          </p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="findjobs-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '48px 32px',
            maxWidth: '560px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <SearchIcon />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Job Requisition Not Found
          </h2>
          <p style={{ color: '#64748b', fontSize: '14.5px', marginBottom: '24px' }}>
            {error || 'This job vacancy may have been closed or removed by the employer.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="btn-primary"
            style={{ margin: '0 auto' }}
          >
            ← Browse All Live Jobs
          </button>
        </div>
      </div>
    )
  }

  const companyInitials = (job.companyName || 'CO')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CO'

  const formattedDate = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently Posted'

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '24px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Toast Alerts */}
        {shareCopied && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              background: '#0f172a',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckIcon />
            <span>Job link copied to clipboard!</span>
          </div>
        )}

        {applicationSubmitted && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              background: '#ffffff',
              color: '#0f172a',
              padding: '18px 24px',
              borderRadius: '16px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid #b7eedc',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
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
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Application Dispatched!</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Your candidacy for <strong>{job.title}</strong> was submitted to the employer.
              </div>
            </div>
          </div>
        )}

        {/* Back navigation */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/jobs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#00b074')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <span>← Back to Explore Jobs</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* HERO REQUISITION CARD */}
        {/* ========================================================================= */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            {/* Left Header info */}
            <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: '280px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  background: '#d1fae5',
                  color: '#065f46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '22px',
                  border: '1px solid #a7f3d0',
                  flexShrink: 0,
                }}
              >
                {companyInitials}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                    {job.companyName}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #dbeafe',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    <CheckIcon /> Verified Employer
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#0b1329',
                    letterSpacing: '-0.5px',
                    lineHeight: 1.25,
                    marginBottom: '14px',
                  }}
                >
                  {job.title}
                </h1>

                {/* Badges / Meta row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: 500,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPinIcon />
                    <span>{job.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClockIcon />
                    <span>{job.employmentType}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BriefcaseIcon />
                    <span>{job.experienceLevel} Seniority</span>
                  </div>
                  <div
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                    }}
                  >
                    {job.department}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Header: AI Match badge & Action buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '16px',
              }}
            >
              {/* AI Match badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#e6f9f2',
                  border: '1px solid #b7eedc',
                  color: '#009e67',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  padding: '6px 16px',
                  borderRadius: '9999px',
                }}
              >
                <SparkleIcon />
                <span>95% AI Match Recommendation</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  style={{
                    background: isBookmarked ? '#e6f9f2' : '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '11px 16px',
                    color: isBookmarked ? '#00b074' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <BookmarkIcon filled={isBookmarked} />
                  <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '11px 16px',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <SendIcon />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="btn-primary"
                  style={{
                    padding: '12px 26px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Apply Now</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY: TWO COLUMNS (CONTENT + STICKY SIDEBAR) */}
        {/* ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: '32px',
            alignItems: 'start',
            marginBottom: '64px',
          }}
        >
          {/* Left Column: Job Description & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* AI Fit Breakdown Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1px solid #bbf7d0',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#00b074',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SparkleIcon />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#065f46', marginBottom: '4px' }}>
                  Why you match this role (95% AI Compatibility)
                </h3>
                <p style={{ fontSize: '14px', color: '#166534', lineHeight: 1.55, margin: 0 }}>
                  This requisition requires expertise in <strong>{job.department}</strong> frameworks, engineering rigor, and problem solving. Your verified profile matches the core requirements and experience thresholds set by {job.companyName}.
                </p>
              </div>
            </div>

            {/* About the Role */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                About the Position
              </h2>
              <div
                style={{
                  fontSize: '15px',
                  color: '#334155',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {job.description || (
                  <p>
                    We are seeking a talented and proactive <strong>{job.title}</strong> to join our team at {job.companyName}.
                    In this role, you will lead the design, development, and maintenance of high-performance scalable systems,
                    collaborate closely with product stakeholders, and drive technical excellence.
                  </p>
                )}
              </div>
            </div>

            {/* Key Responsibilities */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '18px',
                }}
              >
                Key Responsibilities
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  `Architect, build, and deploy mission-critical software components in ${job.department}.`,
                  'Participate in agile sprint rituals, peer code reviews, and architectural design evaluations.',
                  'Work with cross-functional product designers, managers, and QA engineers to deliver robust features.',
                  'Identify performance bottlenecks, automate deployment pipelines, and optimize database queries.',
                  'Mentor junior team members and maintain high engineering standards and documentation.',
                ].map((resp, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#e6f9f2',
                        color: '#00b074',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <CheckIcon />
                    </div>
                    <span style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.5 }}>
                      {resp}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements & Qualifications */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '18px',
                }}
              >
                Requirements & Qualifications
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  `Proven background as a ${job.title} with at least ${job.experienceLevel.toLowerCase().includes('senior') ? '4-6+' : '2-4+'} years of hands-on experience.`,
                  'Strong command of modern frameworks, RESTful APIs, asynchronous programming, and clean code principles.',
                  'Experience working with relational databases (e.g. PostgreSQL, SQL Server) and database optimization.',
                  'Familiarity with containerization (Docker), CI/CD pipelines, and cloud environments (AWS / Azure / GCP).',
                  'Outstanding analytical problem solving, verbal communication, and collaborative teamwork skills.',
                ].map((req, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    >
                      ✓
                    </div>
                    <span style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.5 }}>
                      {req}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* What We Offer / Benefits */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '16px',
                }}
              >
                What We Offer & Benefits
              </h2>
              <div
                style={{
                  fontSize: '15px',
                  color: '#334155',
                  lineHeight: 1.7,
                  marginBottom: '18px',
                }}
              >
                {job.whatWeOffer || (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                    }}
                  >
                    {[
                      { title: 'Competitive Compensation', desc: job.salaryRange || 'Top tier industry package' },
                      { title: 'Flexible Work Model', desc: `${job.employmentType} flexibility & work-life balance` },
                      { title: 'Health & Wellness', desc: 'Comprehensive medical, dental & optical coverage' },
                      { title: 'Learning & Growth', desc: 'Annual education stipend & certification funds' },
                      { title: 'Modern Equipment', desc: 'Latest Apple MacBook Pro or high-end workstation' },
                      { title: 'Paid Time Off', desc: 'Generous vacation, sick days & parental leave' },
                    ].map((perk, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '16px',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#0f172a', marginBottom: '4px' }}>
                          {perk.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{perk.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Summary & Apply Card */}
          <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Apply Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Interested in this role?
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                Submit your profile and resume directly to {job.companyName}'s recruiting pipeline.
              </p>

              <button
                type="button"
                onClick={() => setShowApplyModal(true)}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  fontSize: '15px',
                  fontWeight: 700,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <span>Apply for this Job</span>
                <ArrowRightIcon />
              </button>

              <div style={{ textAlign: 'center', fontSize: '12.5px', color: '#94a3b8' }}>
                Average application time: <strong>2 minutes</strong>
              </div>
            </div>

            {/* Requisition Details Summary */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              }}
            >
              <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', marginBottom: '18px' }}>
                Job Overview
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Salary Range
                  </div>
                  <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 700, marginTop: '2px' }}>
                    {job.salaryRange || 'Competitive Package'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Location
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {job.location}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Employment Type
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {job.employmentType}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Experience Level
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {job.experienceLevel}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Department
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {job.department}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Date Posted
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {formattedDate}
                  </div>
                </div>
              </div>
            </div>

            {/* About Company Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#d1fae5',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {companyInitials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{job.companyName}</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Verified Hiring Organization</div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                {job.companyName} is actively hiring top-tier talent via Skill Hub's AI recruitment ecosystem.
              </p>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUGGESTED JOBS FOR YOU / MATCHING SECTION (SCROLL DOWN VIEW) */}
        {/* ========================================================================= */}
        <section
          style={{
            marginTop: '60px',
            paddingTop: '48px',
            borderTop: '2px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#e6f9f2',
                  border: '1px solid #b7eedc',
                  color: '#009e67',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  marginBottom: '10px',
                }}
              >
                <SparkleIcon />
                <span>AI-RECOMMENDED VACANCIES</span>
              </div>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#0b1329',
                  letterSpacing: '-0.6px',
                  margin: 0,
                }}
              >
                Suggested Jobs For You
              </h2>
              <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '6px', margin: 0 }}>
                Other active positions matching your skill profile and experience level
              </p>
            </div>

            <Link
              to="/jobs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#00b074',
                fontSize: '14.5px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#008759')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#00b074')}
            >
              <span>Explore all jobs</span>
              <ArrowRightIcon />
            </Link>
          </div>

          {suggestedLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium">Fetching suggested matching jobs...</p>
            </div>
          ) : suggestedJobs.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#64748b', fontSize: '14.5px', margin: 0 }}>
                No other matching jobs right now. Check back soon for new openings!
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
              }}
            >
              {suggestedJobs.map((sJob) => (
                <JobVacancyCard
                  key={sJob.id}
                  job={sJob}
                  matchPercentage={92}
                />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ========================================================================= */}
      {/* QUICK APPLY MODAL */}
      {/* ========================================================================= */}
      {showApplyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
          onClick={() => setShowApplyModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              padding: '32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span
                  style={{
                    background: '#e6f9f2',
                    color: '#009e67',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                  }}
                >
                  Direct Application
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '6px', margin: 0 }}>
                  Apply for {job.title}
                </h2>
                <div style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
                  {job.companyName} • {job.location}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chamod Ekanayaka"
                  className="input-field-standard"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="chamod@example.com"
                    className="input-field-standard"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+94 77 123 4567"
                    className="input-field-standard"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  LinkedIn or Portfolio URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  className="input-field-standard"
                  value={applicantLinkedin}
                  onChange={(e) => setApplicantLinkedin(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Resume / CV (PDF, DOCX) *
                </label>
                <div
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                  }}
                  onClick={() => setResumeFile('Resume_Chamod_FullStack.pdf')}
                >
                  {resumeFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#00b074', fontWeight: 700 }}>
                      <CheckIcon />
                      <span>{resumeFile} attached</span>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                        Click to attach Resume or CV
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        PDF, DOCX up to 10MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Short Cover Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell the employer why you're a strong match for this role..."
                  className="input-field-standard"
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="btn-primary"
                  style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {submittingApply ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <SendIcon />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
