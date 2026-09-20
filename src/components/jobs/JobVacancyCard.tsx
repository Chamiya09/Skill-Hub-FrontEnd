import React from 'react'
import { Link } from 'react-router-dom'

import type { JobDto } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
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
  showBookmark?: boolean
  className?: string
}

export const JobVacancyCard: React.FC<JobVacancyCardProps> = ({
  job,
  isBookmarked = false,
  onToggleBookmark,
  showBookmark = true,
  className = '',
}) => {
  const { currentUser } = useAuth()
  const legacyUserType =
    currentUser && 'type' in currentUser
      ? (currentUser as { type?: string }).type
      : undefined

  // Hide AI Match recommendation completely for employers (companies)
  const isEmployer =
    currentUser?.role === 'COMPANY' ||
    currentUser?.role === 'EMPLOYER' ||
    legacyUserType === 'EMPLOYER'

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
    <div className={`rich-job-card w-full ${className}`}>


      {/* Top Header Row: Company Info */}
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
        {job.deadline && (
          <div
            className="job-meta-pill"
            style={{
              color: '#d97706',
              borderColor: '#fde68a',
              background: '#fffbeb',
            }}
          >
            <ClockIcon />
            <span>
              Deadline:{' '}
              {new Date(job.deadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Department & Skill Tags Row */}
      {((job.tags && job.tags.length > 0) || job.department) && (
        <div className="job-department-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
          {job.department && (
            <span className="job-dept-pill">
              {job.department}
            </span>
          )}
          {job.tags &&
            job.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="job-skill-tag"
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '2.5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  lineHeight: 1.3,
                }}
              >
                {tag}
              </span>
            ))}
          {job.tags && job.tags.length > 3 && (
            <span
              className="job-skill-tag-more"
              style={{
                backgroundColor: '#f8fafc',
                color: '#64748b',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2.5px 6px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title={job.tags.slice(3).join(', ')}
            >
              +{job.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer Row: Salary & Action Buttons */}
      <div className="job-card-footer flex justify-between">
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
