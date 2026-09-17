import React from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, ArrowRightIcon } from '../components/common/Icons';

const BookmarkLargeIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

export const CandidateSavedJobs: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-[#00b074] text-xs font-bold tracking-wider mb-2 border border-emerald-100/60">
            <span className="text-sm">★</span>
            <span>SAVED BOOKMARKS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Saved Jobs</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Access job openings you've bookmarked to review or apply at your convenience.
          </p>
        </div>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00b074] hover:bg-[#009663] text-white font-semibold text-xs sm:text-sm transition-all shadow-none self-start sm:self-auto"
        >
          <SearchIcon />
          <span>Browse Available Jobs</span>
        </Link>
      </div>

      {/* Empty State Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#00b074] border border-emerald-100 flex items-center justify-center mx-auto text-2xl">
          <BookmarkLargeIcon />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">No Bookmarked Jobs</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
            When you find roles you like in the job board, click the bookmark icon to save them here for quick access.
          </p>
        </div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00b074] text-white font-bold text-xs sm:text-sm hover:bg-[#009663] transition-all"
        >
          <span>Explore Job Directory</span>
          <ArrowRightIcon />
        </Link>
      </div>
    </div>
  );
};
