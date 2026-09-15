import React from 'react';
import {
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';

export interface RecommendedJob {
  jobId: string;
  title: string;
  company: string;
  location: string;
  postedDate?: string;
  matchPercentage: number;
  isRecommended: boolean;
}

interface RecommendedJobCardProps {
  job: RecommendedJob;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
}

export const RecommendedJobCard: React.FC<RecommendedJobCardProps> = ({
  job,
  onApply,
  onSave,
  isSaved = false,
}) => {
  const isHighMatch = job.matchPercentage >= 80 || job.isRecommended;

  const formattedDate = job.postedDate
    ? new Date(job.postedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently Added';

  return (
    <article
      className="group relative flex flex-col justify-between w-full h-full bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1"
      aria-labelledby={`job-title-${job.jobId}`}
    >
      {/* Glow highlight for high matches */}
      {isHighMatch && (
        <div
          className="absolute -inset-px rounded-2xl bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 blur-sm -z-10 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Top Header Row: Badges & AI Match */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Recommendation Glowing Badge (>= 80%) */}
            {isHighMatch ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm shadow-emerald-200/50">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>✨ AI Recommended</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Standard Match
              </span>
            )}
          </div>

          {/* AI Match Percentage Badge (Top-Right) */}
          <div className="flex items-center">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                isHighMatch
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isHighMatch ? 'text-emerald-100' : 'text-emerald-600'}`} />
              <span>{job.matchPercentage}% Match</span>
            </div>
          </div>
        </div>

        {/* Job Title */}
        <h3
          id={`job-title-${job.jobId}`}
          className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1"
          title={job.title}
        >
          {job.title}
        </h3>

        {/* Company & Meta info */}
        <div className="mt-2.5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / CTA Actions */}
      <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onSave?.(job.jobId)}
          className={`p-2.5 rounded-xl border text-sm transition-colors ${
            isSaved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
          title={isSaved ? 'Job Saved' : 'Save Job'}
          aria-label="Bookmark job"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-600' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => onApply?.(job.jobId)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 active:scale-[0.98] transition-all"
        >
          <span>Apply Now</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </article>
  );
};
