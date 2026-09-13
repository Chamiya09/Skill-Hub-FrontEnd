import React from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseIcon, SearchIcon, ArrowRightIcon } from '../components/common/Icons';

export const CandidateApplications: React.FC = () => {
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
            Track real-time candidate status, recruiter reviews, and scheduled interview rounds.
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

      {/* Empty / Initial State Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#00b074] border border-emerald-100 flex items-center justify-center mx-auto text-2xl">
          <BriefcaseIcon />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">No Job Applications Yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
            You haven't submitted any job applications yet. Browse verified opportunities from top engineering and product teams.
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
    </div>
  );
};
