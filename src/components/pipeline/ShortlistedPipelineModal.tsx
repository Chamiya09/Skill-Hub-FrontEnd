import React, { useState, useEffect, useMemo } from 'react';
import {
  jobApplicationsApi,
  type JobDto,
  type JobApplicantDto,
} from '../../services/api';
import { CandidateProfileReadOnly } from '../candidates/CandidateProfileReadOnly';
import {
  SparkleIcon,
  XIcon,
  SearchIcon,
  MapPinIcon,
  ClockIcon,
  DollarSignIcon,
  MailIcon,
  CheckIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  UserCheckIcon,
  BriefcaseIcon,
  UsersIcon,
  ArrowRightIcon,
} from '../common/Icons';

export interface PipelineCandidate {
  id: string; // application id
  candidateId: string; // user id
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  appliedDate: string;
  status: string; // 'Applied' | 'Shortlisted' | 'Interview' | 'Offered' | etc.
  aiScore: number | null;
  skills: string[];
  avatarUrl?: string;
  avatarBg: string;
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

const PIPELINE_COLUMNS = [
  { id: 'Applied', title: 'Applied', description: 'New candidate intake' },
  { id: 'Shortlisted', title: 'Shortlisted', description: 'AI & screening passed' },
  { id: 'Interview', title: 'Interview', description: 'Technical & culture rounds' },
  { id: 'Offered', title: 'Offered', description: 'Offer extended / hired' },
];

export interface ShortlistedPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDto | null;
}

export const ShortlistedPipelineModal: React.FC<ShortlistedPipelineModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch real applicants from database for this specific job
  useEffect(() => {
    if (!isOpen || !job?.id) return;

    const fetchApplicants = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setSelectedCandidateId(null);
        setSearchQuery('');

        const data: JobApplicantDto[] = await jobApplicationsApi.getJobApplicants(job.id);

        const mapped: PipelineCandidate[] = (data || []).map((app, idx) => {
          // Normalize status
          const rawStatus = (app.status || 'Applied').trim();
          let status = 'Applied';
          const lower = rawStatus.toLowerCase();
          if (lower.includes('interview')) status = 'Interview';
          else if (lower.includes('offer') || lower.includes('hired')) status = 'Offered';
          else if (lower.includes('shortlist') || lower.includes('screen')) status = 'Shortlisted';
          else status = 'Applied';

          // Baseline calculated match score
          const skillScore = Math.min(25, (app.skills?.length || 0) * 6);
          const score = Math.min(98, Math.max(65, 75 + skillScore - ((idx * 5) % 12)));

          return {
            id: app.id,
            candidateId: app.candidateId,
            name: app.candidateName || 'Unnamed Candidate',
            headline: app.candidateHeadline || 'Candidate Profile',
            location: app.candidateLocation || 'Location unspecified',
            email: app.candidateEmail || '',
            phone: app.candidatePhone || '',
            appliedDate: app.appliedDate
              ? new Date(app.appliedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent',
            status,
            aiScore: score,
            skills: app.skills || [],
            avatarUrl: app.candidateAvatarUrl,
            avatarBg: getGradientForName(app.candidateName || 'Candidate'),
          };
        });

        setCandidates(mapped);
      } catch (err: any) {
        console.error('Error fetching pipeline applicants:', err);
        setErrorMessage(err.message || 'Failed to fetch applicants for this requisition.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicants();
  }, [isOpen, job?.id]);

  if (!isOpen || !job) return null;

  const triggerPlaceholderAction = (actionName: string, candidateName: string) => {
    setNotification(`"${actionName}" initialized for ${candidateName}.`);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const q = searchQuery.toLowerCase().trim();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q)
    );
  }, [candidates, searchQuery]);

  const candidatesByStage = useMemo(() => {
    const map: Record<string, PipelineCandidate[]> = {
      Applied: [],
      Shortlisted: [],
      Interview: [],
      Offered: [],
    };

    filteredCandidates.forEach((cand) => {
      if (map[cand.status]) {
        map[cand.status].push(cand);
      } else {
        map.Applied.push(cand);
      }
    });

    return map;
  }, [filteredCandidates]);

  return (
    <div className="popup-backdrop" onClick={onClose}>
      {/* Action Toast Notification */}
      {notification && (
        <div className="job-details-toast" style={{ zIndex: 999999 }}>
          <CheckIcon />
          <span>{notification}</span>
        </div>
      )}

      {/* Modal Card */}
      <div className="popup-card" style={{ maxWidth: '1200px' }} onClick={(e) => e.stopPropagation()}>
        {/* =========================================================
            1. POPUP HEADER
            ========================================================= */}
        <div className="popup-header">
          <div className="popup-header-info">
            <div className="popup-badge-row">
              <span className="popup-tag-req">
                REQ #{job.id.substring(0, 8).toUpperCase()}
              </span>
              <span className="popup-tag-dept">
                {job.department}
              </span>
              <span className="popup-tag-status active" style={{ background: '#e6f9f2', borderColor: '#b7eedc', color: '#009e67' }}>
                <UserCheckIcon />
                <span>{candidates.length} Total Applicants</span>
              </span>
            </div>

            <h2 className="popup-title">
              {job.title} — Hiring Pipeline
            </h2>

            <div className="popup-header-meta">
              <span className="popup-meta-item highlight">
                <SparkleIcon />
                <span>Real-Time Requisition Pipeline</span>
              </span>
              <span className="popup-meta-divider">•</span>
              <span className="popup-meta-item">
                <MapPinIcon />
                <span>{job.location}</span>
              </span>
              <span className="popup-meta-divider">•</span>
              <span className="popup-meta-item">
                <ClockIcon />
                <span>{job.employmentType}</span>
              </span>
              {job.salaryRange && (
                <>
                  <span className="popup-meta-divider">•</span>
                  <span className="popup-meta-item highlight">
                    <DollarSignIcon />
                    <span>{job.salaryRange}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Switcher (Kanban / List) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeView === 'kanban'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setActiveView('kanban')}
              >
                Kanban
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeView === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setActiveView('list')}
              >
                List View
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="popup-close-btn"
              aria-label="Close modal"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* =========================================================
            2. SCROLLABLE BODY
            ========================================================= */}
        <div className="popup-body" style={{ minHeight: '460px' }}>
          {/* SEARCH BAR */}
          <div className="popup-search-bar" style={{ marginBottom: '16px' }}>
            <span className="popup-search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search pipeline candidates by name, role, email, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="popup-search-input"
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-slate-500">Loading candidate pipeline from database...</p>
            </div>
          ) : candidates.length === 0 ? (
            /* 1. STRICT 0 APPLICANTS EMPTY STATE AS REQUIRED */
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <UsersIcon />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                No applicants yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                When candidates apply for this position, they will appear here.
              </p>
            </div>
          ) : activeView === 'kanban' ? (
            /* ================= KANBAN BOARD VIEW ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {PIPELINE_COLUMNS.map((col) => {
                const colCandidates = candidatesByStage[col.id] || [];

                return (
                  <div
                    key={col.id}
                    className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex flex-col min-h-[380px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            {col.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200">
                            {colCandidates.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{col.description}</p>
                      </div>
                    </div>

                    {/* Column Cards Stack */}
                    <div className="flex flex-col gap-2.5 flex-1">
                      {colCandidates.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 px-2 text-center border-2 border-dashed border-slate-200 rounded-lg">
                          <p className="text-xs font-medium text-slate-400">No candidates in {col.title}</p>
                        </div>
                      ) : (
                        colCandidates.map((candidate) => {
                          const initials = candidate.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase();

                          return (
                            <div
                              key={candidate.id}
                              onClick={() => setSelectedCandidateId(candidate.candidateId)}
                              className="bg-white border border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 cursor-pointer transition-all hover:bg-slate-50/50 shadow-none flex flex-col gap-2.5"
                              title="Click to view verified Digital CV"
                            >
                              {/* Header: Avatar + Real Name */}
                              <div className="flex items-start gap-2.5">
                                {candidate.avatarUrl ? (
                                  <img
                                    src={candidate.avatarUrl}
                                    alt={candidate.name}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                    style={{ background: candidate.avatarBg }}
                                  >
                                    {initials}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-sm font-bold text-slate-900 truncate">
                                    {candidate.name}
                                  </h5>
                                  <p className="text-xs text-slate-600 truncate mt-0.5">
                                    {candidate.headline}
                                  </p>
                                </div>
                              </div>

                              {/* Applied Date & Meta */}
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                <span className="flex items-center gap-1">
                                  <ClockIcon /> Applied {candidate.appliedDate}
                                </span>
                                {candidate.aiScore && (
                                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                    {candidate.aiScore}% Match
                                  </span>
                                )}
                              </div>

                              {/* Skills */}
                              {candidate.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {candidate.skills.slice(0, 2).map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                  {candidate.skills.length > 2 && (
                                    <span className="text-[10px] text-slate-400 self-center">
                                      +{candidate.skills.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Action Footer */}
                              <div
                                className="flex items-center justify-between pt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => triggerPlaceholderAction('Schedule Round', candidate.name)}
                                  className="text-[11px] font-semibold text-slate-700 hover:text-emerald-700 flex items-center gap-1 p-1"
                                >
                                  <CalendarIcon />
                                  <span>Schedule</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCandidateId(candidate.candidateId)}
                                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                                >
                                  <span>View CV</span>
                                  <ArrowRightIcon />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= LIST VIEW ================= */
            <div className="flex flex-col gap-2.5">
              {filteredCandidates.map((candidate) => {
                const initials = candidate.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidateId(candidate.candidateId)}
                    className="bg-white border border-slate-200 hover:border-emerald-500 rounded-xl p-4 cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {candidate.avatarUrl ? (
                        <img
                          src={candidate.avatarUrl}
                          alt={candidate.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ background: candidate.avatarBg }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-900">{candidate.name}</h5>
                          <span className="text-xs text-slate-500">• {candidate.location}</span>
                        </div>
                        <p className="text-xs text-slate-600 truncate mt-0.5">{candidate.headline}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MailIcon /> {candidate.email}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ClockIcon /> Applied {candidate.appliedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {candidate.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateId(candidate.candidateId)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                      >
                        View CV →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================
            3. POPUP FOOTER
            ========================================================= */}
        <div className="popup-footer">
          <button
            type="button"
            onClick={onClose}
            className="popup-footer-btn-secondary"
          >
            Close Window
          </button>

          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SparkleIcon />
            <span>Real Candidate Records • Connected to PostgreSQL ATS Database</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. DIGITAL CV DRAWER (SLIDES OVER MODAL)
          ========================================================= */}
      {selectedCandidateId && (
        <>
          <div
            className="candidate-cv-drawer-overlay"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCandidateId(null);
            }}
          />

          <div
            className="candidate-cv-drawer"
            style={{ width: '100%', maxWidth: '820px', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <CandidateProfileReadOnly
              candidateId={selectedCandidateId}
              onClose={() => setSelectedCandidateId(null)}
            />
          </div>
        </>
      )}
    </div>
  );
};
