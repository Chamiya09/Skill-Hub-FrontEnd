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
    <div className="job-applicants-table-wrapper">
      <table className="job-applicants-table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Role & Experience</th>
            <th>Skills</th>
            <th>Applied Date</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6}>
                <div className="job-applicants-loading-state">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Loading applicants...</p>
                </div>
              </td>
            </tr>
          ) : applicants.length === 0 ? (
            /* 1. STRICT 0 APPLICANTS EMPTY STATE AS REQUIRED */
            <tr>
              <td colSpan={6}>
                <div className="job-applicants-empty-state">
                  <div className="job-applicants-empty-icon">
                    <UsersIcon />
                  </div>
                  <h3 className="job-applicants-empty-title">No applicants yet</h3>
                  <p className="job-applicants-empty-desc">
                    When candidates apply for this position, they will appear here.
                  </p>
                </div>
              </td>
            </tr>
          ) : filteredApplicants.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <div className="job-applicants-empty-state">
                  <div className="job-applicants-empty-icon">
                    <UsersIcon />
                  </div>
                  <h3 className="job-applicants-empty-title">No candidates match your search</h3>
                  <p className="job-applicants-empty-desc">
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
                  onClick={() => onSelectCandidate && onSelectCandidate(applicant.candidateId)}
                >
                  {/* Candidate Identity */}
                  <td>
                    <div className="job-applicants-candidate-cell">
                      {applicant.candidateAvatarUrl ? (
                        <div className="job-applicants-avatar">
                          <img
                            src={applicant.candidateAvatarUrl}
                            alt={name}
                          />
                        </div>
                      ) : (
                        <div
                          className="job-applicants-avatar"
                          style={{ background: getGradientForName(name) }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="job-applicants-info">
                        <span className="job-applicants-name">{name}</span>
                        <span className="job-applicants-email">
                          <MailIcon /> {applicant.candidateEmail || 'No email'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Role & Headline */}
                  <td>
                    <div className="job-applicants-headline">
                      {applicant.candidateHeadline || 'Candidate'}
                    </div>
                    <div className="job-applicants-location">
                      <MapPinIcon /> {applicant.candidateLocation || 'Location unspecified'}
                    </div>
                  </td>

                  {/* Skills Snippet */}
                  <td>
                    <div className="job-applicants-skills-list">
                      {(applicant.skills || []).slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="job-applicants-skill-tag">
                          {skill}
                        </span>
                      ))}
                      {(applicant.skills || []).length > 3 && (
                        <span className="job-applicants-more-skills">
                          +{applicant.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Applied Date */}
                  <td>
                    <span className="job-applicants-date">
                      <ClockIcon /> {formattedDate}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className="job-applicants-status-badge">
                      <span className="job-applicants-status-dot"></span>
                      {applicant.status || 'Applied'}
                    </span>
                  </td>

                  {/* Action */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCandidate && onSelectCandidate(applicant.candidateId);
                      }}
                      className="job-applicants-view-cv-btn"
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
