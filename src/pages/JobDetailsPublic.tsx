import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { publicJobsApi, jobApplicationsApi, type JobDto } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { JobVacancyCard } from '../components/jobs/JobVacancyCard'
import { AiMatchInsightsSidebar } from '../components/jobs/AiMatchInsightsSidebar'
import { SleekSpinner, JobCardSkeleton } from '../components/common/SkeletonCard'
import { Sparkles } from 'lucide-react'
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
  const { currentUser } = useAuth()

  const [job, setJob] = useState<JobDto | null>(null)
  const [suggestedJobs, setSuggestedJobs] = useState<JobDto[]>([])
  const [loading, setLoading] = useState(true)
  const [suggestedLoading, setSuggestedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isBookmarked, setIsBookmarked] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  
  // One-click Digital CV application state
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [applyErrorMessage, setApplyErrorMessage] = useState<string | null>(null)
  const [isMatchInsightsOpen, setIsMatchInsightsOpen] = useState(false)

  // Check if current user is an employer/recruiter
  const isEmployer = Boolean(
    currentUser && (
      currentUser.companyId ||
      currentUser.role?.toUpperCase().includes('COMPANY') ||
      currentUser.role?.toUpperCase().includes('EMPLOYER') ||
      currentUser.role?.toUpperCase().includes('RECRUITER') ||
      currentUser.role?.toUpperCase().includes('ADMIN')
    )
  )

  // Scroll to top when job ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setHasApplied(false)
    setApplyErrorMessage(null)
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

  // Check candidate application status
  useEffect(() => {
    if (!id || !currentUser || isEmployer) return

    const checkStatus = async () => {
      try {
        const res = await jobApplicationsApi.getStatus(id)
        if (res && res.hasApplied) {
          setHasApplied(true)
        }
      } catch (err) {
        // Silently catch status check error
      }
    }

    checkStatus()
  }, [id, currentUser, isEmployer])

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

  // =========================================================================
  // ONE-CLICK DIGITAL CV APPLY HANDLER (LIVE INTEGRATION)
  // =========================================================================
  const handleApply = async () => {
    if (isEmployer || hasApplied || isApplying) return

    if (!currentUser) {
      // Redirect unauthenticated user to login with redirect back
      navigate(`/candidate/login?redirect=/jobs/${id}`)
      return
    }

    if (!job?.id) return

    try {
      setIsApplying(true)
      setApplyErrorMessage(null)
      await jobApplicationsApi.apply(job.id)
      setHasApplied(true)
      setApplicationSubmitted(true)
      setTimeout(() => setApplicationSubmitted(false), 6000)
    } catch (err: any) {
      console.error('Error submitting application:', err)
      const msg = err.message || 'Failed to submit application.'
      setApplyErrorMessage(msg)
      if (msg.toLowerCase().includes('already applied')) {
        setHasApplied(true)
      }
    } finally {
      setIsApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="findjobs-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SleekSpinner size="lg" />
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

  // Check if viewing user is the employer or if company details are cached in local storage for this company
  const isOwner =
    currentUser &&
    (currentUser.companyId === job.companyId ||
      currentUser.id === job.companyId ||
      (currentUser.role?.toUpperCase().includes('COMPANY') && (!job.companyId || job.companyName === currentUser.companyName)));

  // Try to read any locally updated profile cache for this company
  let cachedCompany: { companyName?: string; logoUrl?: string } | null = null;
  if (!isOwner && typeof window !== 'undefined') {
    try {
      const stored =
        localStorage.getItem(`skillhub_company_profile_${job.companyId}`) ||
        localStorage.getItem(`skillhub_company_profile_${encodeURIComponent(job.companyName || '')}`);
      if (stored) cachedCompany = JSON.parse(stored);
    } catch {
      // Ignore
    }
  }

  const dynamicCompanyName =
    (isOwner && currentUser?.companyName) ||
    cachedCompany?.companyName ||
    job.companyName ||
    'Company';

  const dynamicLogoUrl =
    (isOwner && currentUser?.logoUrl) ||
    cachedCompany?.logoUrl ||
    job.logoUrl ||
    '';

  const companyInitials = (dynamicCompanyName || 'CO')
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
              gap: '14px',
              border: '1px solid #b7eedc',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#e6f9f2',
                color: '#00b074',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckIcon />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                Application Submitted Successfully using your Digital CV!
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Your verified candidate profile was submitted to <strong>{job.companyName}</strong>.
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
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            marginBottom: '28px',
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
              <Link
                to={`/company/${job.companyId || encodeURIComponent(dynamicCompanyName)}`}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: '#d1fae5',
                  color: '#065f46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '20px',
                  border: '1px solid #a7f3d0',
                  flexShrink: 0,
                  textDecoration: 'none',
                  overflow: 'hidden',
                }}
                title={`View ${dynamicCompanyName} profile`}
              >
                {dynamicLogoUrl ? (
                  <img
                    src={dynamicLogoUrl}
                    alt={dynamicCompanyName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                {!dynamicLogoUrl && companyInitials}
              </Link>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Link
                    to={`/company/${job.companyId || encodeURIComponent(dynamicCompanyName)}`}
                    style={{
                      fontSize: '16.5px',
                      fontWeight: 700,
                      color: '#0f172a',
                      textDecoration: 'none',
                    }}
                    className="hover:text-emerald-700 transition-colors"
                  >
                    {dynamicCompanyName}
                  </Link>
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
                    fontSize: '26px',
                    fontWeight: 800,
                    color: '#0b1329',
                    letterSpacing: '-0.5px',
                    lineHeight: 1.3,
                    marginBottom: '12px',
                  }}
                >
                  {job.title}
                </h1>

                {/* Core Badges: Location, Employment Type, Experience Level (Consolidated in Header) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    color: '#64748b',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPinIcon />
                    <span>{job.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ClockIcon />
                    <span>{job.employmentType}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <BriefcaseIcon />
                    <span>{job.experienceLevel}</span>
                  </div>
                </div>

                {/* Tags / Required Skills Badges */}
                {job.tags && job.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                    {job.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Header: AI analysis trigger and Save/Share actions */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '14px',
              }}
            >
              {/* Interactive AI analysis trigger for candidates/public applicants */}
              {!isEmployer && (
                <button
                  type="button"
                  onClick={() => setIsMatchInsightsOpen(true)}
                  className="job-details-analyze-match-btn flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 font-semibold text-sm rounded-full transition-all shadow-sm"
                  aria-haspopup="dialog"
                >
                  <Sparkles size={16} aria-hidden="true" />
                  <span>Analyze Match</span>
                </button>
              )}

              {/* Action Buttons: Save & Share */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  style={{
                    background: isBookmarked ? '#e6f9f2' : '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    color: isBookmarked ? '#00b074' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13.5px',
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
                    padding: '10px 16px',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <SendIcon />
                  <span>Share</span>
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
            gridTemplateColumns: '1fr 340px',
            gap: '28px',
            alignItems: 'start',
            marginBottom: '60px',
          }}
        >
          {/* Left Column: Job Description & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* About the Position (Rendered cleanly from raw HTML) */}
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
                  fontSize: '19px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                About the Position
              </h2>

              {/* Render rich HTML safely with prose typography */}
              {job.description ? (
                <div
                  className="rich-job-html-content prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                <p style={{ color: '#64748b', fontSize: '14.5px', lineHeight: 1.6 }}>
                  No description provided for this vacancy.
                </p>
              )}
            </div>

            {/* What We Offer / Benefits (If provided) */}
            {job.whatWeOffer && (
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
                    fontSize: '19px',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  What We Offer & Perks
                </h2>
                <div
                  className="rich-job-html-content prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.whatWeOffer }}
                />
              </div>
            )}

          </div>

          {/* Right Column: Sticky Summary & Apply Card */}
          <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Primary Apply Card (Digital CV One-Click Flow) */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '26px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Interested in this position?
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                Submit your verified Digital CV profile directly to {job.companyName}'s recruiting pipeline.
              </p>

              {/* Role-Based Restriction: Block Employers */}
              {isEmployer ? (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#64748b',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🔒</span>
                  <span>Employers cannot apply for jobs</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying || hasApplied}
                    className="btn-primary job-details-apply-btn w-full"
                    style={{
                      cursor: hasApplied ? 'default' : isApplying ? 'not-allowed' : 'pointer',
                      background: hasApplied ? '#e6f9f2' : undefined,
                      color: hasApplied ? '#009e67' : undefined,
                      borderColor: hasApplied ? '#b7eedc' : undefined,
                    }}
                  >
                    {isApplying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Applying...</span>
                      </>
                    ) : hasApplied ? (
                      <>
                        <CheckIcon />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <span>Apply Now</span>
                        <ArrowRightIcon />
                      </>
                    )}
                  </button>

                  {applyErrorMessage && (
                    <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px', textAlign: 'center' }}>
                      {applyErrorMessage}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                    Instant application powered by <strong>Digital CV</strong>
                  </div>
                </>
              )}
            </div>

            {/* Consolidated Job Overview (ONLY Unique details: Salary, Department, Date Posted, Status) */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                Job Overview
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Salary Range
                  </div>
                  <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 700, marginTop: '2px' }}>
                    {job.salaryRange || 'Competitive Package'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f8fafc', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Department
                  </div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {job.department}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f8fafc', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Date Posted
                  </div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {formattedDate}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f8fafc', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Status
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00b074' }}></span>
                    <span style={{ fontSize: '13.5px', color: '#065f46', fontWeight: 600 }}>Active & Accepting Applications</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#d1fae5',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    overflow: 'hidden',
                  }}
                >
                  {dynamicLogoUrl ? (
                    <img
                      src={dynamicLogoUrl}
                      alt={dynamicCompanyName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  {!dynamicLogoUrl && companyInitials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#0f172a' }}>{dynamicCompanyName}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Verified Organization</div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                {dynamicCompanyName} is actively hiring through Skill Hub's verified technical talent network.
              </p>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUGGESTED JOBS FOR YOU / MATCHING SECTION (SCROLL DOWN VIEW) */}
        {/* ========================================================================= */}
        <section
          style={{
            marginTop: '40px',
            paddingTop: '40px',
            borderTop: '2px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '28px',
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
                  fontSize: '26px',
                  fontWeight: 800,
                  color: '#0b1329',
                  letterSpacing: '-0.6px',
                  margin: 0,
                }}
              >
                Suggested Jobs For You
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', margin: 0 }}>
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
                fontSize: '14px',
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
              }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
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
                />
              ))}
            </div>
          )}
        </section>

      </div>

      {!isEmployer && (
        <AiMatchInsightsSidebar
          isOpen={isMatchInsightsOpen}
          onClose={() => setIsMatchInsightsOpen(false)}
          matchPercentage={88}
          onGenerateCoverLetter={handleApply}
        />
      )}
    </div>
  )
}
