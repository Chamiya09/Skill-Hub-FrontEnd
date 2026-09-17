import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseBusiness, RefreshCw, Sparkles } from 'lucide-react'
import { RecommendedJobCard } from '../components/jobs/RecommendedJobCard'
import { useAuth } from '../context/AuthContext'
import {
  jobRecommendationsApi,
  type RecommendedJobDto,
} from '../services/api'

export function CandidateDashboard() {
  const { currentUser } = useAuth()
  const [jobs, setJobs] = useState<RecommendedJobDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const candidateId = currentUser?.id

  const loadRecommendations = async () => {
    if (!candidateId) return

    try {
      setIsLoading(true)
      setError(null)
      setJobs(await jobRecommendationsApi.getForCandidate(candidateId))
    } catch (requestError: unknown) {
      console.error('Unable to load AI job recommendations:', requestError)
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load recommendations right now.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!candidateId) return

    let isCurrent = true
    jobRecommendationsApi
      .getForCandidate(candidateId)
      .then((recommendations) => {
        if (isCurrent) setJobs(recommendations)
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return
        console.error('Unable to load AI job recommendations:', requestError)
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load recommendations right now.',
        )
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [candidateId])

  return (
    <div className="candidate-recommendations-page space-y-6">
      <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold tracking-wider">
            <Sparkles size={14} aria-hidden="true" />
            SEMANTIC TWIN RECOMMENDATIONS
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-3">
            Recommended Jobs For You
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Live opportunities ranked against your verified Digital CV skills.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRecommendations()}
          disabled={isLoading}
          className="recommendations-refresh inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-sm hover:bg-emerald-100 disabled:opacity-60 transition-all"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh Matches
        </button>
      </section>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button type="button" onClick={() => void loadRecommendations()} className="font-bold">
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="recommended-jobs-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="recommended-job-skeleton w-full bg-white border border-gray-200 rounded-2xl" />
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="recommended-jobs-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => <RecommendedJobCard key={job.jobId} job={job} />)}
        </div>
      ) : !error ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <BriefcaseBusiness size={36} className="text-emerald-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900 mt-4">No recommendations yet</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add skills to your Digital CV or check back when new jobs are published.
          </p>
          <Link to="/candidate/profile" className="inline-flex mt-5 text-sm font-bold text-emerald-700">
            Update Digital CV →
          </Link>
        </div>
      ) : null}
    </div>
  )
}
