import React from 'react';
import type { JobApplicantDto } from '../../services/api';
import {
  UsersIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  ArrowRightIcon,
} from '../common/Icons';

export interface JobApplicantsTableProps {
  applicants: JobApplicantDto[];
  isLoading?: boolean;
  onSelectCandidate?: (candidateId: string) => void;
  searchQuery?: string;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #00b074 0%, #008759 100%)',
  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
  'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
];

const getGradientForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

export const JobApplicantsTable: React.FC<JobApplicantsTableProps> = ({
  applicants,
  isLoading = false,
  onSelectCandidate,
  searchQuery = '',
}) => {
  const filteredApplicants = React.useMemo(() => {
    if (!searchQuery.trim()) return applicants;
    const q = searchQuery.toLowerCase().trim();
    return applicants.filter(
      (app) =>
        (app.candidateName || '').toLowerCase().includes(q) ||
        (app.candidateHeadline || '').toLowerCase().includes(q) ||
        (app.candidateEmail || '').toLowerCase().includes(q) ||
        (app.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [applicants, searchQuery]);

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-600">
            <th className="py-3.5 px-4">Candidate</th>
            <th className="py-3.5 px-4">Role & Experience</th>
            <th className="py-3.5 px-4">Skills</th>
            <th className="py-3.5 px-4">Applied Date</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <tr>
              <td colSpan={100} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold text-slate-500">Loading applicants...</p>
                </div>
              </td>
            </tr>
          ) : applicants.length === 0 ? (
            /* 1. STRICT 0 APPLICANTS EMPTY STATE AS REQUIRED */
            <tr>
              <td colSpan={100} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                    <UsersIcon />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">No applicants yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    When candidates apply for this position, they will appear here.
                  </p>
                </div>
              </td>
            </tr>
          ) : filteredApplicants.length === 0 ? (
            <tr>
              <td colSpan={100} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                    <UsersIcon />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">No candidates match your search</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Try searching with a different candidate name or skill keyword.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            filteredApplicants.map((applicant) => {
              const name = applicant.candidateName || 'Unnamed Candidate';
              const initials = name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              const formattedDate = applicant.appliedDate
                ? new Date(applicant.appliedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <tr
                  key={applicant.id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  onClick={() => onSelectCandidate && onSelectCandidate(applicant.candidateId)}
                >
                  {/* Candidate Identity */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {applicant.candidateAvatarUrl ? (
                        <img
                          src={applicant.candidateAvatarUrl}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-none"
                          style={{ background: getGradientForName(name) }}
                        >
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MailIcon /> {applicant.candidateEmail || 'No email'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role & Headline */}
                  <td className="py-4 px-4">
                    <div className="text-sm font-medium text-slate-800">
                      {applicant.candidateHeadline || 'Candidate'}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPinIcon /> {applicant.candidateLocation || 'Location unspecified'}
                    </div>
                  </td>

                  {/* Skills Snippet */}
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(applicant.skills || []).slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {(applicant.skills || []).length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{applicant.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Applied Date */}
                  <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <ClockIcon /> {formattedDate}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {applicant.status || 'Applied'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCandidate && onSelectCandidate(applicant.candidateId);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <span>View CV</span>
                      <ArrowRightIcon />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
