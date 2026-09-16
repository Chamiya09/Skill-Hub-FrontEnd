import { Link } from 'react-router-dom'
import { Building2, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import type { RecommendedJobDto } from '../../services/api'

interface RecommendedJobCardProps {
  job: RecommendedJobDto
}

export function RecommendedJobCard({ job }: RecommendedJobCardProps) {
  const postedDate = job.postedDate
    ? new Date(job.postedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently posted'

  const isRecommended = job.isRecommended || job.matchPercentage >= 80

  return (
    <article className="recommended-job-card w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="recommended-job-card-top flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/jobs/${job.jobId}`}
              className="recommended-job-title text-lg font-bold text-gray-900 hover:text-emerald-700 transition-colors"
            >
              {job.title}
            </Link>
            {isRecommended && (
              <span className="ai-recommended-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <Sparkles size={13} aria-hidden="true" />
                AI Recommended
              </span>
            )}
          </div>
          <div className="recommended-job-company flex items-center gap-1.5 mt-2 text-sm font-semibold text-gray-600">
            <Building2 size={15} aria-hidden="true" />
            <span>{job.company}</span>
          </div>
        </div>

        <span className="recommended-match-score shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
          {job.matchPercentage}% Match
        </span>
      </div>

      <div className="recommended-job-meta flex items-center gap-4 mt-5 pt-4 border-t border-gray-100 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <MapPin size={15} aria-hidden="true" />
          {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays size={15} aria-hidden="true" />
          {postedDate}
        </span>
        <Link
          to={`/jobs/${job.jobId}`}
          className="recommended-job-link text-emerald-700 font-bold hover:text-emerald-800 transition-colors"
        >
          View Details →
        </Link>
      </div>
    </article>
  )
}
