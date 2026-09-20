import React, { useState, useEffect } from 'react';
import {
  jobsApi,
  jobApplicationsApi,
  type JobDto,
} from '../../services/api';
import { CandidateProfileReadOnly } from './CandidateProfileReadOnly';
import {
  SparkleIcon,
  XIcon,
  SearchIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightIcon,
  MapPinIcon,
  CheckIcon,
  InfoIcon,
  DollarSignIcon,
} from '../common/Icons';

export interface ModalCandidate {
  id: string; // application id
  candidateId: string; // user id
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  appliedDate: string;
  isShortlisted?: boolean;
  aiScore: number | null;
  skills: string[];
  avatarUrl?: string;
  avatarBg: string;
  rank?: number;
  status: string;
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

export interface AIScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDto | null;
  onJobUpdated?: (updatedJob: JobDto) => void;
}

export const AIScreeningModal: React.FC<AIScreeningModalProps> = ({
  isOpen,
  onClose,
  job,
  onJobUpdated,
}) => {
  const [currentJob, setCurrentJob] = useState<JobDto | null>(job);
  const [candidates, setCandidates] = useState<ModalCandidate[]>([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState<boolean>(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStageText, setAnalyzingStageText] = useState('');
  const [isAiAnalyzed, setIsAiAnalyzed] = useState(false);
  const [isTransferred, setIsTransferred] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [topCount, setTopCount] = useState<number>(5);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchApplicants = async (jobId: string) => {
    try {
      setIsLoadingApplicants(true);
      setAnalyzingStageText('AI is analyzing candidate profiles... This may take a few seconds.');
      const data = await jobApplicationsApi.getRankedApplicants(jobId);

      const mapped: ModalCandidate[] = (data || [])
        .filter((app) => {
          const st = (app.status || '').toLowerCase();
          return st !== 'assessment_reviewed' && st !== 'interview' && st !== 'rejected';
        })
        .map((app) => ({
          id: app.applicationId,
          candidateId: app.candidateId,
          name: app.fullName || 'Unnamed Candidate',
          headline: app.headline || 'Candidate Profile',
          email: app.email || '',
          phone: app.phone || '',
          location: app.location || 'Location unspecified',
          appliedDate: app.appliedDate
            ? new Date(app.appliedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recent',
          isShortlisted: (app.status || '').toLowerCase() === 'shortlisted',
          aiScore: app.aiMatchScore,
          skills: app.skills || [],
          avatarBg: getGradientForName(app.fullName || 'Candidate'),
          status: app.status || 'Applied',
        }));

      setCandidates(mapped);
      setIsAiAnalyzed(mapped.length > 0);
    } catch (err: any) {
      console.error('Error loading applicants for AI screening:', err);
      setErrorMessage(err.message || 'Failed to fetch applicants for this requisition.');
    } finally {
      setIsLoadingApplicants(false);
    }
  };

  // Fetch real applicants for the selected job whenever modal opens or job changes
  useEffect(() => {
    if (!isOpen || !job?.id) return;

    setCurrentJob(job);
    setIsAiAnalyzed(false);
    setIsAnalyzing(false);
    setIsTransferred(false);
    setSelectedCandidateId(null);
    setSearchQuery('');
    setErrorMessage(null);

    fetchApplicants(job.id);
  }, [isOpen, job?.id, job?.status]);

  if (!isOpen || !currentJob) return null;

  const isJobClosed = (currentJob.status || '').toLowerCase() === 'closed';
  const isJobActive = (currentJob.status || 'Active').toLowerCase() === 'active';

  // Toggle Job Status between Active and Closed
  const handleToggleJobStatus = async () => {
    const newStatus = isJobClosed ? 'Active' : 'Closed';
    try {
      setIsUpdatingStatus(true);
      const updatedPayload = {
        title: currentJob.title,
        department: currentJob.department,
        location: currentJob.location,
        employmentType: currentJob.employmentType,
        experienceLevel: currentJob.experienceLevel,
        salaryRange: currentJob.salaryRange,
        status: newStatus,
        description: currentJob.description,
        whatWeOffer: currentJob.whatWeOffer,
      };

      await jobsApi.updateJob(currentJob.id, updatedPayload).catch(() => null);

      const updated = { ...currentJob, status: newStatus };
      setCurrentJob(updated);
      if (onJobUpdated) onJobUpdated(updated);
      showToast(`Requisition marked as "${newStatus}".`);
    } catch (err) {
      console.error('Failed to update status:', err);
      const updated = { ...currentJob, status: newStatus };
      setCurrentJob(updated);
      if (onJobUpdated) onJobUpdated(updated);
      showToast(`Requisition marked as "${newStatus}" (Local).`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Run AI Screening Analysis on real candidate data
  const handleRunAiAnalysis = async () => {
    if (isAnalyzing || candidates.length === 0) return;
    setIsAnalyzing(true);
    setAnalyzingStageText('AI is analyzing candidate profiles... This may take a few seconds.');
    setErrorMessage(null);
    try {
      const ranked = await jobApplicationsApi.runAiScreen(currentJob.id, { forceRefresh: true });
      setCandidates(ranked.map((result, index) => {
        const existing = candidates.find(candidate => candidate.candidateId === result.candidateId);
        return {
          ...existing!,
          id: result.applicationId,
          candidateId: result.candidateId,
          name: result.fullName,
          headline: result.headline || existing?.headline || 'Candidate Profile',
          email: result.email,
          skills: result.skills,
          aiScore: result.aiMatchScore,
          status: result.status,
          isShortlisted: result.status.toLowerCase() === 'shortlisted',
          rank: index + 1,
          phone: existing?.phone || '',
          location: existing?.location || 'Location unspecified',
          appliedDate: existing?.appliedDate || new Date(result.appliedDate).toLocaleDateString(),
          avatarBg: existing?.avatarBg || getGradientForName(result.fullName),
        };
      }));
      setIsAiAnalyzed(true);
      showToast('Batch AI Screening Complete! Top candidates shortlisted.');
    } catch (error: any) {
      setErrorMessage(error.message || 'The Skill Hu AI screening service is unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  };



  const handleShortlistCandidate = async (candidateId: string) => {
    if (!currentJob) return;
    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate) return;

    try {
      await jobApplicationsApi.moveToShortlist(currentJob.id, [candidate.candidateId]);
      showToast(`✓ ${candidate.name} added to the shortlist.`);
      await fetchApplicants(currentJob.id); // Refetch from DB to ensure sync
    } catch (err: any) {
      showToast(`Failed to shortlist ${candidate.name}: ${err.message}`);
    }
  };

  const handleShortlist = async () => {
    if (!currentJob || selectedCandidateIds.length === 0) return;
    
    const candidateIdsToShortlist = candidates
      .filter((c) => selectedCandidateIds.includes(c.id))
      .map((c) => c.candidateId);

    try {
      await jobApplicationsApi.moveToShortlist(currentJob.id, candidateIdsToShortlist);
      showToast(`✓ ${selectedCandidateIds.length} candidate(s) added to the shortlist.`);
      setSelectedCandidateIds([]);
      await fetchApplicants(currentJob.id); // Refetch from DB to ensure sync
    } catch (err: any) {
      showToast(`Failed to shortlist candidates: ${err.message}`);
    }
  };

  const handleAutoSelect = () => {
    const sorted = [...otherList].sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
    const topIds = sorted.slice(0, topCount).map(c => c.id);
    setSelectedCandidateIds(topIds);
  };

  const handleRemoveFromShortlist = async (candidateId: string) => {
    if (!currentJob) return;
    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate) return;

    try {
      await jobApplicationsApi.removeFromShortlist(currentJob.id, [candidate.candidateId]);
      showToast(`✕ ${candidate.name} removed from the shortlist.`);
      await fetchApplicants(currentJob.id); // Refetch from DB to ensure sync
    } catch (err: any) {
      showToast(`Failed to unshortlist ${candidate.name}: ${err.message}`);
    }
  };

  const handleRejectCandidate = async (candidateId: string) => {
    if (!currentJob) return;
    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate) return;

    try {
      await jobApplicationsApi.rejectApplicant(currentJob.id, [candidate.candidateId]);
      showToast(`✕ ${candidate.name} has been rejected.`);
      await fetchApplicants(currentJob.id); // Refetch from DB to ensure sync
    } catch (err: any) {
      showToast(`Failed to reject ${candidate.name}: ${err.message}`);
    }
  };

  const shortlistedList = candidates.filter((c) => c.isShortlisted);
  const otherList = candidates.filter((c) => !c.isShortlisted);

  const filterList = (list: ModalCandidate[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
    );
  };

  return (
    <div className="popup-backdrop" onClick={onClose}>
      {/* Modal Card */}
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        {/* =========================================================
            1. POPUP HEADER
            ========================================================= */}
        <div className="popup-header">
          <div className="popup-header-info">
            <div className="popup-badge-row">
              <span className="popup-tag-req">
                REQ #{currentJob.id.substring(0, 8).toUpperCase()}
              </span>
              <span className="popup-tag-dept">
                {currentJob.department}
              </span>
              <span className={`popup-tag-status ${isJobClosed ? 'closed' : 'active'}`}>
                <span className={`popup-tag-dot ${isJobClosed ? 'closed' : 'active'}`} />
                {isJobClosed ? 'Closed (Intake Ended)' : 'Active (Applications Open)'}
              </span>
            </div>

            <h2 className="popup-title">
              {currentJob.title}
            </h2>

            <div className="popup-header-meta">
              <span className="popup-meta-item highlight">
                <UsersIcon />
                <span>{candidates.length} Applicants Received</span>
              </span>
              <span className="popup-meta-divider">•</span>
              <span className="popup-meta-item">
                <MapPinIcon />
                <span>{currentJob.location}</span>
              </span>
              <span className="popup-meta-divider">•</span>
              <span className="popup-meta-item">
                <ClockIcon />
                <span>{currentJob.employmentType}</span>
              </span>
              {currentJob.salaryRange && (
                <>
                  <span className="popup-meta-divider">•</span>
                  <span className="popup-meta-item highlight">
                    <DollarSignIcon />
                    <span>{currentJob.salaryRange}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Header Actions: Toggle Status & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleToggleJobStatus}
              disabled={isUpdatingStatus}
              className="popup-status-toggle-btn"
              title={isJobClosed ? 'Reopen applications' : 'Mark job closed to enable AI screening'}
            >
              <ClockIcon />
              <span>{isJobClosed ? 'Reopen Job' : 'Mark as Closed'}</span>
            </button>

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
        <div className="popup-body">
          {/* DEADLINE ENFORCEMENT BANNER (IF ACTIVE) */}
          {isJobActive && (
            <div className="popup-banner-info">
              <div className="popup-banner-info-icon">
                <InfoIcon />
              </div>
              <div>
                <div className="popup-banner-info-title">Applications Are Still Open</div>
                <p className="popup-banner-info-desc">
                  Applications are currently open for candidates. AI Screening can be run anytime or once this job is marked as Closed.
                </p>
              </div>
            </div>
          )}

          {/* AI ACTION BANNER (IF CLOSED) */}
          {isJobClosed && !isAiAnalyzed && !isAnalyzing && (
            <div className="popup-banner-ready">
              <div style={{ maxWidth: '560px' }}>
                <div className="popup-banner-ready-title">
                  <SparkleIcon />
                  <span>Requisition Closed — Ready for Batch AI Screening</span>
                </div>
                <p className="popup-banner-ready-desc">
                  Run comprehensive AI parsing across all {candidates.length} candidate CVs to calculate match scores and shortlist the top candidates.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={candidates.length === 0}
                className="popup-footer-btn-primary"
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                <SparkleIcon />
                <span>Run AI Analysis</span>
              </button>
            </div>
          )}

          {/* AI PROCESSING STATE BANNER */}
          {isAnalyzing && (
            <div className="ai-screening-progress-banner" style={{ margin: 0 }}>
              <div className="ai-screening-progress-left">
                <div className="ai-screening-spinner" />
                <span>{analyzingStageText}</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Processing Batch
              </span>
            </div>
          )}

          {/* TRANSFERRED SUCCESS NOTIFICATION */}
          {isTransferred && (
            <div className="ai-screening-transferred-card" style={{ margin: 0 }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <div className="font-bold text-sm text-emerald-950">Shortlisted Candidates Transferred</div>
                  <div className="text-xs text-emerald-700">Top candidates dispatched to the Hiring Pipeline module for next-stage interviews.</div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded border border-emerald-200">
                Handoff Complete
              </span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SEARCH & FILTER BAR */}
          <div className="popup-search-bar">
            <span className="popup-search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search candidates by name, headline, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="popup-search-input"
            />
            {isAiAnalyzed && (
              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#009e67',
                  background: '#e6f9f2',
                  border: '1px solid #b7eedc',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
                title="Re-run AI batch scoring"
              >
                <SparkleIcon />
                <span>Re-run Analysis</span>
              </button>
            )}
          </div>

          {/* =========================================================
              CANDIDATES DISPLAY
              ========================================================= */}
          {isLoadingApplicants ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-slate-500">AI is analyzing candidate profiles... This may take a few seconds.</p>
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
          ) : isAiAnalyzed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Shortlisted Section */}
              <div className="popup-section-card shortlist-highlight">
                <div className="popup-section-header">
                  <div className="popup-section-title" style={{ color: '#064e3b' }}>
                    <SparkleIcon />
                    <span>AI Shortlisted Candidates ({shortlistedList.length})</span>
                  </div>
                  <span className="popup-tag-status active">
                    Top Tier (85%+ Match)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filterList(shortlistedList).length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No shortlisted candidates match your filter.
                    </div>
                  ) : (
                    filterList(shortlistedList).map((candidate) => {
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
                          className="ai-screening-candidate-card flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-indigo-100 rounded-2xl gap-4 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                          title="Click to view full verified Digital CV Profile"
                        >
                          <div className="flex items-center gap-4 ai-screening-candidate-identity">
                            {candidate.avatarUrl ? (
                              <img
                                src={candidate.avatarUrl}
                                alt={candidate.name}
                                className="candidate-avatar object-cover"
                              />
                            ) : (
                              <div className="candidate-avatar" style={{ background: candidate.avatarBg }}>
                                {initials}
                              </div>
                            )}
                            <div className="flex flex-col justify-center">
                              <div className="flex items-center gap-2 ai-screening-name-row">
                                <h4 className="text-base font-bold text-gray-900 leading-none">{candidate.name}</h4>
                                <span className="text-sm font-medium text-gray-400 leading-none flex items-center gap-1">
                                  <MapPinIcon /> {candidate.location}
                                </span>
                                {candidate.rank && (
                                  <span className="ai-rank-badge">#{candidate.rank} ranked</span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-600 mt-1.5">{candidate.headline}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {candidate.skills.slice(0, 4).map((skill, idx) => (
                                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 sm:ml-auto ai-screening-actions">
                            <div className="ai-match-ring" style={{ '--match-score': `${candidate.aiScore ?? 0}%` } as React.CSSProperties}>
                              <span>{candidate.aiScore}%</span>
                              <small>Match</small>
                            </div>
                            <button
                              type="button"
                              className="ai-view-cv-link"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedCandidateId(candidate.candidateId);
                              }}
                            >
                              View CV <ArrowRightIcon />
                            </button>
                            <button
                              type="button"
                              className="ai-shortlist-btn is-shortlisted"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveFromShortlist(candidate.id);
                              }}
                              title="Click to remove from shortlist"
                            >
                              <CheckIcon /> Unshortlist
                            </button>
                            <button
                              type="button"
                              className="ai-reject-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRejectCandidate(candidate.id);
                              }}
                              title="Click to reject candidate"
                            >
                              <XIcon /> Reject
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Other Applicants Section */}
              {otherList.length > 0 && (
                <div className="popup-section-card">
                  <div className="popup-section-header flex justify-between items-center">
                    <h3 className="popup-section-title">
                      Other Applicants ({otherList.length})
                    </h3>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        Quick Select Top:
                        <input
                          type="number"
                          min="1"
                          className="ai-auto-select-input"
                          value={topCount}
                          onChange={(e) => setTopCount(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoSelect}
                        className="ai-auto-select-btn"
                      >
                        Auto-Select
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filterList(otherList).map((candidate) => {
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
                          className="ai-screening-candidate-card flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-indigo-100 rounded-2xl gap-4 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                          title="Click to view full verified Digital CV Profile"
                        >
                          <div className="flex items-center gap-4 ai-screening-candidate-identity">
                            <input
                              type="checkbox"
                              className="ai-screening-checkbox"
                              checked={selectedCandidateIds.includes(candidate.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedCandidateIds((prev) =>
                                  e.target.checked
                                    ? [...prev, candidate.id]
                                    : prev.filter((id) => id !== candidate.id)
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {candidate.avatarUrl ? (
                              <img src={candidate.avatarUrl} alt={candidate.name} className="candidate-avatar object-cover" />
                            ) : (
                              <div className="candidate-avatar" style={{ background: candidate.avatarBg }}>{initials}</div>
                            )}
                            <div className="flex flex-col justify-center">
                              <div className="flex items-center gap-2 ai-screening-name-row">
                                <h4 className="text-base font-bold text-gray-900 leading-none">{candidate.name}</h4>
                                <span className="text-sm font-medium text-gray-400 leading-none flex items-center gap-1">
                                  <MapPinIcon /> {candidate.location}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-600 mt-1.5">{candidate.headline}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {candidate.skills.slice(0, 3).map((skill, idx) => (
                                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 sm:ml-auto ai-screening-actions">
                            <div className="ai-match-ring" style={{ '--match-score': `${candidate.aiScore ?? 0}%` } as React.CSSProperties}>
                              <span>{candidate.aiScore}%</span>
                              <small>Match</small>
                            </div>
                            <button
                              type="button"
                              className="ai-view-cv-link"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedCandidateId(candidate.candidateId);
                              }}
                            >
                              View CV <ArrowRightIcon />
                            </button>
                            <button
                              type="button"
                              className="ai-shortlist-btn"
                              disabled={candidate.status?.toLowerCase() === 'rejected'}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleShortlistCandidate(candidate.id);
                              }}
                            >
                              <CheckIcon /> Shortlist
                            </button>
                            <button
                              type="button"
                              className={`ai-reject-btn ${candidate.status?.toLowerCase() === 'rejected' ? 'is-rejected' : ''}`}
                              disabled={candidate.status?.toLowerCase() === 'rejected'}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRejectCandidate(candidate.id);
                              }}
                              title={candidate.status?.toLowerCase() === 'rejected' ? 'Candidate Rejected' : 'Click to reject candidate'}
                            >
                              <XIcon /> {candidate.status?.toLowerCase() === 'rejected' ? 'Rejected' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* BEFORE AI ANALYSIS: PURE APPLICANTS LIST */
            <div className="popup-section-card">
              <div className="popup-section-header">
                <h3 className="popup-section-title">
                  Received Applications ({candidates.length})
                </h3>
                <span className="popup-section-subtitle">
                  Click any applicant to view full Digital CV Profile
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filterList(candidates).length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No candidates match your search keyword.
                  </div>
                ) : (
                  filterList(candidates).map((candidate) => {
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
                        className="ai-screening-candidate-card flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-indigo-100 rounded-2xl gap-4 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                        title="Click to view full verified Digital CV Profile"
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            className="ai-screening-checkbox"
                            checked={selectedCandidateIds.includes(candidate.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedCandidateIds((prev) =>
                                e.target.checked
                                  ? [...prev, candidate.id]
                                  : prev.filter((id) => id !== candidate.id)
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {candidate.avatarUrl ? (
                            <img
                              src={candidate.avatarUrl}
                              alt={candidate.name}
                              className="candidate-avatar object-cover"
                            />
                          ) : (
                            <div className="candidate-avatar" style={{ background: candidate.avatarBg }}>
                              {initials}
                            </div>
                          )}

                          <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-gray-900 leading-none">
                                {candidate.name}
                              </h4>
                              <span className="text-sm font-medium text-gray-400 leading-none flex items-center gap-1">
                                <MapPinIcon />
                                {candidate.location}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mt-1.5">
                              {candidate.headline}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {candidate.skills.slice(0, 4).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 sm:ml-auto ai-screening-actions">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-sm font-medium text-indigo-700">
                            <ClockIcon />
                            <span>AI score pending</span>
                          </span>
                          <button
                            type="button"
                            className="ai-view-cv-link"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedCandidateId(candidate.candidateId);
                            }}
                          >
                            View CV <ArrowRightIcon />
                          </button>
                          <button
                            type="button"
                            className={`ai-shortlist-btn ${candidate.isShortlisted ? 'is-shortlisted' : ''}`}
                            disabled={candidate.isShortlisted || candidate.status?.toLowerCase() === 'rejected'}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleShortlistCandidate(candidate.id);
                            }}
                          >
                            <CheckIcon /> {candidate.isShortlisted ? 'Shortlisted' : 'Shortlist'}
                          </button>
                          <button
                            type="button"
                            className={`ai-reject-btn ${candidate.status?.toLowerCase() === 'rejected' ? 'is-rejected' : ''}`}
                            disabled={candidate.status?.toLowerCase() === 'rejected'}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRejectCandidate(candidate.id);
                            }}
                            title={candidate.status?.toLowerCase() === 'rejected' ? 'Candidate Rejected' : 'Click to reject candidate'}
                          >
                            <XIcon /> {candidate.status?.toLowerCase() === 'rejected' ? 'Rejected' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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

          {/* PIPELINE MOVE BUTTON / RUN AI ACTION / BULK SHORTLIST */}
          {isAiAnalyzed ? (
            <button
              type="button"
              onClick={handleShortlist}
              disabled={selectedCandidateIds.length === 0}
              className="popup-footer-btn-primary"
              title="Transfer all shortlisted candidates to the next hiring pipeline module"
            >
              <ArrowRightIcon />
              <span>
                Send Shortlisted ({selectedCandidateIds.length}) to Hiring Pipeline
              </span>
            </button>
          ) : isJobClosed ? (
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing || candidates.length === 0}
              className="popup-footer-btn-primary"
            >
              <SparkleIcon />
              <span>Run AI Analysis</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing || candidates.length === 0}
              className="popup-footer-btn-primary"
              title="Run AI screening across currently received applications"
            >
              <SparkleIcon />
              <span>Run AI Screening ({candidates.length})</span>
            </button>
          )}
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
