import React from 'react'
import { Link } from 'react-router-dom'
import type { JobDto } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  SparkleIcon,
  MapPinIcon,
  ClockIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  BookmarkIcon,
} from '../common/Icons'

interface JobVacancyCardProps {
  job: JobDto
  isBookmarked?: boolean
  onToggleBookmark?: (id: string) => void
  onQuickApply?: (jobTitle: string) => void
  showBookmark?: boolean
  showApplyButton?: boolean
  showAiMatch?: boolean
  matchPercentage?: number
  className?: string
}

export const JobVacancyCard: React.FC<JobVacancyCardProps> = ({
  job,
  isBookmarked = false,
  onToggleBookmark,
  showBookmark = true,
  showAiMatch = true,
  matchPercentage = 95,
  className = '',
}) => {
  const { currentUser } = useAuth()

  // Hide AI Match recommendation completely for employers (companies)
  const isEmployer =
    currentUser?.role === 'COMPANY' ||
    currentUser?.role === 'EMPLOYER' ||
    (currentUser as any)?.type === 'EMPLOYER'

  const shouldShowAiMatch = showAiMatch && !isEmployer

  // Check if current user is the employer/company owner of this job
  const isOwner =
    currentUser &&
    (currentUser.companyId === job.companyId ||
      currentUser.id === job.companyId ||
      (isEmployer && (!job.companyId || job.companyName === currentUser.companyName)));

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

  // Dynamically resolve live company name and logo
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

  // Generate 2-letter company initials for avatar badge fallback
  const companyInitials =
    dynamicCompanyName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CO'

  // Format creation date: e.g. "Sep 11, 2026"
  const formattedDate = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently Posted'

  // Parse or format salary range display
  const formatSalary = (salary?: string) => {
    if (!salary || salary.toLowerCase() === 'competitive') {
      return { main: 'Competitive', sub: 'Based on experience' }
    }
    if (salary.includes('/')) {
      const parts = salary.split('/')
      return { main: parts[0].trim(), sub: `/${parts[1].trim()}` }
    }
    return { main: salary, sub: '/ yr' }
  }

  const salaryDisplay = formatSalary(job.salaryRange)

  return (
    <div className={`rich-job-card ${className}`}>
      {/* Top Header Row: Company Info + AI Match Badge */}
      <div className="job-card-header">
        <Link
          to={`/company/${job.companyId || encodeURIComponent(dynamicCompanyName)}`}
          className="job-company-identity hover:opacity-85 transition-opacity"
          style={{ textDecoration: 'none' }}
        >
          {/* Company Avatar Badge */}
          <div className="company-avatar-badge" style={{ overflow: 'hidden', padding: 0 }}>
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

          {/* Company Name & Date */}
          <div className="company-text-meta">
            <span className="company-name-text">
              {dynamicCompanyName}
            </span>
            <span className="job-post-date">{formattedDate}</span>
          </div>
        </Link>

        {/* AI Match Pill Badge (Strictly visible only to Candidates) */}
        {shouldShowAiMatch && (
          <div className="job-ai-match-pill">
            <SparkleIcon />
            <span>{matchPercentage}% AI Match</span>
          </div>
        )}
      </div>

      {/* Job Title */}
      <Link to={`/jobs/${job.id}`} className="job-title-link">
        <h3 className="job-card-title">{job.title}</h3>
      </Link>

      {/* Meta Location, Employment Type & Experience Row */}
      <div className="job-meta-row">
        <div className="job-meta-pill">
          <MapPinIcon />
          <span>{job.location || 'Remote'}</span>
        </div>
        <div className="job-meta-pill">
          <ClockIcon />
          <span>{job.employmentType || 'Full-time'}</span>
        </div>
        {job.experienceLevel && (
          <div className="job-meta-pill">
            <BriefcaseIcon />
            <span>{job.experienceLevel}</span>
          </div>
        )}
      </div>

      {/* Department / Category Pill Tag */}
      {job.department && (
        <div className="job-department-row">
          <span className="job-dept-pill">
            {job.department}
          </span>
        </div>
      )}

      {/* Footer Row: Salary & Action Buttons */}
      <div className="job-card-footer">
        {/* Salary Information */}
        <div className="job-salary-stack">
          <span className="job-salary-amount">{salaryDisplay.main}</span>
          {salaryDisplay.sub && (
            <span className="job-salary-period">{salaryDisplay.sub}</span>
          )}
        </div>

        {/* Actions on Right */}
        <div className="job-actions-stack">
          {showBookmark && onToggleBookmark && (
            <button
              type="button"
              className={`bookmark-btn ${isBookmarked ? 'saved' : ''}`}
              onClick={() => onToggleBookmark(job.id)}
              title={isBookmarked ? 'Saved to bookmarks' : 'Save job'}
              aria-label="Bookmark job"
            >
              <BookmarkIcon filled={isBookmarked} />
            </button>
          )}

          {/* View Details Navigation Button */}
          <Link to={`/jobs/${job.id}`} className="job-details-link-btn">
            <span>View Details</span>
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
  )
}
