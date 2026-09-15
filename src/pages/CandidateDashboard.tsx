import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  Search,
  CheckCircle2,
  Briefcase,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  RecommendedJobCard,
  type RecommendedJob,
} from '../components/candidates/RecommendedJobCard';

export const CandidateDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('skillhub_candidate_saved_jobs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [filterHighMatchOnly, setFilterHighMatchOnly] = useState<boolean>(false);

  const candidateId = currentUser?.id;

  const fetchRecommendedJobs = useCallback(async () => {
    if (!candidateId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/candidate/${candidateId}/recommended-jobs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('AI Recommendation Service is currently busy analyzing jobs. Please retry shortly.');
        }
        if (response.status === 404) {
          throw new Error('Candidate profile not found. Please complete your profile first.');
        }
        throw new Error(`Failed to load AI job recommendations (Code: ${response.status})`);
      }

      const data: RecommendedJob[] = await response.json();
      setJobs(data || []);
    } catch (err: any) {
      console.error('Error fetching recommended jobs:', err);
      setError(err.message || 'An unexpected error occurred while fetching AI job recommendations.');
    } finally {
      setIsLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchRecommendedJobs();
  }, [fetchRecommendedJobs]);

  const handleToggleSave = (jobId: string) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      try {
        localStorage.setItem('skillhub_candidate_saved_jobs', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error('Failed to save bookmark in local storage:', err);
      }
      return next;
    });
  };

  const handleApply = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const filteredJobs = filterHighMatchOnly
    ? jobs.filter((j) => j.matchPercentage >= 70 || j.isRecommended)
    : jobs;

  const topMatchCount = jobs.filter((j) => j.matchPercentage >= 70 || j.isRecommended).length;

  return (
    <div className="space-y-8">
      {/* 1. Hero / Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-10 shadow-xl border border-emerald-500/20">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-500/30 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>LANGGRAPH + GROQ DEEP SEMANTIC MATCHING</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Auto-Recommended Jobs
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time opportunities curated by analyzing your skills, portfolio projects, career experience, and certifications.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={fetchRecommendedJobs}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/10 backdrop-blur-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Matches</span>
            </button>
            <Link
              to="/candidate/profile"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-600/30 transition-all"
            >
              <span>Edit Digital CV</span>
            </Link>
          </div>
        </div>

        {/* Real-time stats strip */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Matches</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{jobs.length}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-400 font-medium">Top Matches (≥ 70%)</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">{topMatchCount}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Matching Engine</div>
            <div className="text-xs sm:text-sm font-semibold text-white mt-1">Groq LangGraph Twin</div>
          </div>
        </div>
      </div>

      {/* 2. Filter / Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterHighMatchOnly(false)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              !filterHighMatchOnly
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Recommendations ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterHighMatchOnly(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filterHighMatchOnly
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>High Matches Only ({topMatchCount})</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'position' : 'positions'}
        </span>
      </div>

      {/* 3. Loading Skeletons in 3-column Grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={`rec-skeleton-${i}`}
              className="w-full bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-6 w-28 bg-slate-200 rounded-full" />
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-200 rounded-lg" />
              <div className="h-4 w-2/3 bg-slate-100 rounded-lg" />
              <div className="h-10 w-full bg-slate-100 rounded-xl mt-6" />
            </div>
          ))}
        </div>
      )}

      {/* 4. Error State */}
      {!isLoading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 flex items-start gap-4 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold text-rose-900">Unable to Load AI Recommendations</h4>
            <p className="text-xs sm:text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={fetchRecommendedJobs}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 hover:text-rose-950 uppercase tracking-wide underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Query</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Empty State */}
      {!isLoading && !error && filteredJobs.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Job Recommendations Found</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            {filterHighMatchOnly
              ? 'None of the active jobs currently reach the 70% match threshold. Try viewing all recommendations or adding more skills to your CV.'
              : 'Add more skills, certifications, and project experience to your Digital CV to empower our AI matching engine.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {filterHighMatchOnly && (
              <button
                type="button"
                onClick={() => setFilterHighMatchOnly(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                View All Matches
              </button>
            )}
            <Link
              to="/candidate/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-all shadow-sm"
            >
              <span>Update My Skills & CV</span>
            </Link>
          </div>
        </div>
      )}

      {/* 6. Crucial Layout: Responsive CSS Grid */}
      {!isLoading && !error && filteredJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <RecommendedJobCard
              key={job.jobId}
              job={job}
              isSaved={savedJobIds.has(job.jobId)}
              onSave={handleToggleSave}
              onApply={handleApply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
