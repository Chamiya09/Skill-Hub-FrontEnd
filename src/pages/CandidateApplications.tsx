import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  jobApplicationsApi,
  type CandidateApplicationItemDto,
} from '../services/api';
import {
  BriefcaseIcon,
  SearchIcon,
  ArrowRightIcon,
  MapPinIcon,
  ClockIcon,
  SparkleIcon,
  BuildingIcon,
} from '../components/common/Icons';

export const CandidateApplications: React.FC = () => {
  const [applications, setApplications] = useState<CandidateApplicationItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await jobApplicationsApi.getMyApplications();
      setApplications(data || []);
    } catch (err: any) {
      console.error('Error fetching candidate applications:', err);
      setError(err.message || 'Failed to load your submitted job applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-[#00b074] text-xs font-bold tracking-wider mb-2 border border-emerald-100/60">
            <BriefcaseIcon />
            <span>APPLICATIONS TRACKER</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Applied Positions</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track real-time candidate status, recruiter reviews, and AI shortlist results for your Digital CV applications.
          </p>
        </div>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00b074] hover:bg-[#009663] text-white font-semibold text-xs sm:text-sm transition-all shadow-none self-start sm:self-auto"
        >
          <SearchIcon />
          <span>Explore Open Positions</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchApplications}
            className="text-xs font-semibold text-red-800 underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500">Loading your applications...</p>
        </div>
      ) : applications.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#00b074] border border-emerald-100 flex items-center justify-center mx-auto text-2xl">
            <BriefcaseIcon />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No Job Applications Yet</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
              You haven't submitted any job applications yet. Browse verified opportunities from top engineering and product teams and apply in 1-click using your Digital CV.
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00b074] text-white font-bold text-xs sm:text-sm hover:bg-[#009663] transition-all"
          >
            <span>Find & Apply to Jobs</span>
            <ArrowRightIcon />
          </Link>
        </div>
      ) : (
        /* Applications List Cards */
        <div className="space-y-4">
          {applications.map((app) => {
            const formattedDate = app.appliedDate
              ? new Date(app.appliedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            const initials = app.companyName
              ? app.companyName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : 'CO';

            const isShortlisted = app.status?.toLowerCase().includes('shortlist');

            return (
              <div
                key={app.id}
                className="bg-white border border-gray-200 hover:border-emerald-300 rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                {/* Left: Company & Job Identity */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-base overflow-hidden">
                    {app.companyLogoUrl ? (
                      <img
                        src={app.companyLogoUrl}
                        alt={app.companyName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/jobs/${app.jobId}`}
                        className="text-base sm:text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                      >
                        {app.jobTitle}
                      </Link>
                      
                      {isShortlisted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
                          <SparkleIcon />
                          <span>AI Shortlisted</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <BuildingIcon />
                      <span>{app.companyName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 flex-wrap">
                      {app.location && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon />
                          <span>{app.location}</span>
                        </span>
                      )}
                      {app.employmentType && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ClockIcon />
                            <span>{app.employmentType}</span>
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-slate-400">Applied {formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & View Job Link */}
                <div className="flex items-center gap-3 sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isShortlisted
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : app.status?.toLowerCase() === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{app.status || 'Applied'}</span>
                    </span>
                  </div>

                  <Link
                    to={`/jobs/${app.jobId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    <span>View Requisition</span>
                    <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
