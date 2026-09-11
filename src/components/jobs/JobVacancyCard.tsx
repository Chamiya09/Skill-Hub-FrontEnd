import React from 'react'
import { Link } from 'react-router-dom'
import type { JobDto } from '../../services/api'
import {
  SparkleIcon,
  MapPinIcon,
  ClockIcon,
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
  matchPercentage?: number
  className?: string
}

export const JobVacancyCard: React.FC<JobVacancyCardProps> = ({
  job,
  isBookmarked = false,
  onToggleBookmark,
  showBookmark = false,
  matchPercentage = 95,
  className = '',
}) => {
  // Generate 2-letter company initials for avatar badge
  const companyInitials = (job.companyName || 'CO')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CO'

  // Format creation date: e.g. "Sep 11"
  const formattedDate = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Recent'

  // Parse or format salary range display
  const formatSalary = (salary?: string) => {
    if (!salary || salary.toLowerCase() === 'competitive') {
      return { main: 'Competitive', sub: 'Based on experience' }
    }
    // If format has /yr or /hr, parse cleanly
    if (salary.includes('/')) {
      const parts = salary.split('/')
      return { main: parts[0].trim(), sub: `/${parts[1].trim()}` }
    }
    return { main: salary, sub: '/ yr' }
  }

  const salaryDisplay = formatSalary(job.salaryRange)

  return (
    <div
      className={`job-card ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Company Avatar Badge */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#d1fae5',
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '-0.3px',
              flexShrink: 0,
              border: '1px solid #a7f3d0',
            }}
          >
            {companyInitials}
          </div>

          {/* Company Name & Date */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.25,
              }}
            >
              {job.companyName || 'Company'}
            </span>
            <span
              style={{
                fontSize: '12.5px',
                color: '#94a3b8',
                marginTop: '3px',
                fontWeight: 500,
              }}
            >
              {formattedDate}
            </span>
          </div>
        </div>

        {/* AI Match Pill Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: '#e6f9f2',
            border: '1px solid #b7eedc',
            color: '#009e67',
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 11px',
            borderRadius: '9999px',
            whiteSpace: 'nowrap',
          }}
        >
          <SparkleIcon />
          <span>{matchPercentage}% AI Match</span>
        </div>
      </div>

      {/* Job Title */}
      <Link
        to={`/jobs/${job.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <h3
          style={{
            fontSize: '17.5px',
            fontWeight: 700,
            color: '#0b1329',
            marginBottom: '12px',
            lineHeight: 1.35,
            cursor: 'pointer',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#00b074')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#0b1329')}
        >
          {job.title}
        </h3>
      </Link>

      {/* Meta Location & Employment Type Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: '#94a3b8',
          fontSize: '13px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <MapPinIcon />
          <span style={{ color: '#64748b', fontWeight: 500 }}>
            {job.location || 'Remote'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ClockIcon />
          <span style={{ color: '#64748b', fontWeight: 500 }}>
            {job.employmentType || 'Full-time'}
          </span>
        </div>
      </div>

      {/* Footer Row: Salary & View Details Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        {/* Salary Information */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#0b1329',
              lineHeight: 1.2,
            }}
          >
            {salaryDisplay.main}
          </span>
          {salaryDisplay.sub && (
            <span
              style={{
                fontSize: '12.5px',
                color: '#64748b',
                fontWeight: 600,
                marginTop: '2px',
              }}
            >
              {salaryDisplay.sub}
            </span>
          )}
        </div>

        {/* Actions on Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {showBookmark && onToggleBookmark && (
            <button
              type="button"
              className={`bookmark-btn ${isBookmarked ? 'saved' : ''}`}
              onClick={() => onToggleBookmark(job.id)}
              title={isBookmarked ? 'Saved to bookmarks' : 'Save job'}
              aria-label="Bookmark job"
              style={{
                background: isBookmarked ? '#e6f9f2' : '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '8px',
                color: isBookmarked ? '#00b074' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookmarkIcon filled={isBookmarked} />
            </button>
          )}

          {/* View Details Navigation Button */}
          <Link
            to={`/jobs/${job.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#00b074',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              padding: '6px 4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#008759'
              e.currentTarget.style.transform = 'translateX(2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#00b074'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <span>View Details</span>
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
  )
}
