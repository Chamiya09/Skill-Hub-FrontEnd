import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  ArrowLeftIcon,
  MailIcon,
  MapPinIcon,
  CheckIcon,
} from '../common/Icons';

export interface DisplayApplicant {
  id: string; // application id
  candidateId: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  appliedDate: string;
  stage: string;
  aiScore: number | null;
  skills: string[];
  avatarUrl?: string;
  avatarBg: string;
  isTopMatch?: boolean;
  rank?: number;
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

interface CandidatesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDto | null;
}

export const CandidatesListModal: React.FC<CandidatesListModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [topCount, setTopCount] = useState<number>(5);
  const [applicants, setApplicants] = useState<DisplayApplicant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected candidate to view Digital CV
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // AI Shortlist simulation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStageText, setAnalyzingStageText] = useState('');

  // Fetch real applicants for the selected job
  useEffect(() => {
    if (!isOpen || !job?.id) return;

    const fetchApplicants = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setCurrentStep(1);
        setSearchQuery('');
        setIsAnalyzing(false);
        setSelectedCandidateId(null);

        setAnalyzingStageText('AI is analyzing candidate profiles... This may take a few seconds.');
        const data = await jobApplicationsApi.getRankedApplicants(job.id);
        
        const mapped: DisplayApplicant[] = (data || []).map((app) => ({
          id: app.applicationId,
          candidateId: app.candidateId,
          name: app.fullName || 'Unnamed Candidate',
          headline: app.headline || 'Candidate Profile',
          email: app.email || '',
          phone: '',
          location: 'Location not specified',
          appliedDate: app.appliedDate
            ? new Date(app.appliedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recent',
          stage: app.status || 'Applied',
          aiScore: app.aiMatchScore,
          skills: app.skills || [],
          avatarBg: getGradientForName(app.fullName || 'Candidate'),
        }));

        setApplicants(mapped);
        setTopCount(Math.min(5, Math.max(1, mapped.length)));
      } catch (err: any) {
        console.error('Error fetching job applicants:', err);
        setError(err.message || 'Failed to load applicants for this job requisition.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicants();
  }, [isOpen, job?.id]);

  // Calls the real Skill Hu AI endpoint and displays persisted LangGraph scores.
  const handleRunAiAnalysis = async () => {
    if (isAnalyzing || applicants.length === 0) return;
    setIsAnalyzing(true);
    setAnalyzingStageText('AI is analyzing candidate profiles... This may take a few seconds.');
    setError(null);
    try {
      const ranked = await jobApplicationsApi.runAiScreen(job!.id);
      const updated: DisplayApplicant[] = ranked.map((result, index) => {
        const existing = applicants.find(candidate => candidate.candidateId === result.candidateId);
        return {
          ...existing!,
          id: result.applicationId,
          candidateId: result.candidateId,
          name: result.fullName,
          headline: result.headline || existing?.headline || 'Candidate Profile',
          email: result.email,
          skills: result.skills,
          aiScore: result.aiMatchScore,
          stage: result.status,
          rank: index + 1,
          isTopMatch: index < topCount,
          phone: existing?.phone || '',
          location: existing?.location || 'Location not specified',
          appliedDate: existing?.appliedDate || new Date(result.appliedDate).toLocaleDateString(),
          avatarBg: existing?.avatarBg || getGradientForName(result.fullName),
        };
      });
      setApplicants(updated);
      setCurrentStep(2);
    } catch (requestError: any) {
      setError(requestError.message || 'The Skill Hu AI screening service is unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Pipeline Board Navigation
  const handleMoveToPipelineBoard = () => {
    onClose();
    navigate(`/dashboard/pipelines/${job?.id}`);
  };

  // List of candidates for current view
  const displayedCandidates = useMemo(() => {
    if (currentStep === 2) {
      return applicants.filter((c) => c.isTopMatch);
    }
    return applicants;
  }, [applicants, currentStep]);

  const filteredCandidates = useMemo(() => {
    return displayedCandidates.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [displayedCandidates, searchQuery]);

  if (!isOpen || !job) return null;

  return (
    <div className="candidates-modal-backdrop" onClick={onClose}>
      {/* Modal Card */}
      <div className="candidates-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* =========================================================
            HEADER (ADAPTS FOR STEP 1 VS STEP 2)
            ========================================================= */}
        <div className="candidates-modal-header">
          <div className="candidates-modal-header-left">
            {currentStep === 1 ? (
              <>
                <div className="candidates-modal-badges">
                  <span className="candidates-modal-req-tag">
                    REQ #{job.id ? job.id.substring(0, 8).toUpperCase() : 'JOB'}
                  </span>
                  <span className="candidates-modal-dept-badge">
                    {job.department}
                  </span>
                  <span className="candidates-modal-ai-badge">
                    <SparkleIcon />
                    <span>Step 1: All Applicants</span>
                  </span>
                </div>

                <h2 className="candidates-modal-title">
                  {job.title}
                </h2>

                <div className="candidates-modal-meta-row">
                  <span className="candidates-modal-meta-item highlight">
                    <UsersIcon />
                    <span>{applicants.length} Total Applicants</span>
                  </span>
                  <span>•</span>
                  <span className="candidates-modal-meta-item">
                    <MapPinIcon />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  <span className="candidates-modal-meta-item">
                    <ClockIcon />
                    <span>{job.employmentType}</span>
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <button
                    type="button"
                    className="candidates-modal-back-step-btn"
                    onClick={() => setCurrentStep(1)}
                    title="Return to all applicants intake view"
                  >
                    <ArrowLeftIcon />
                    <span>Back to All Applicants</span>
                  </button>

                  <span className="candidates-modal-ai-badge">
                    <SparkleIcon />
                    <span>Step 2: AI Shortlisted Candidates</span>
                  </span>
                </div>

                <h2 className="candidates-modal-title">
                  {job.title} — Shortlisted Top {displayedCandidates.length}
                </h2>

                <div className="candidates-modal-meta-row">
                  <span className="candidates-modal-meta-item highlight text-emerald-700">
                    <CheckIcon />
                    <span>{displayedCandidates.length} Candidates Qualified</span>
                  </span>
                  <span>•</span>
                  <span className="text-xs text-slate-500">
                    Click any candidate row to inspect Digital CV Profile
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            className="candidates-modal-close-btn"
            onClick={onClose}
            title="Close Modal"
          >
            <XIcon />
          </button>
        </div>

        {/* =========================================================
            STEP 1 ONLY: AI ACTION BAR
            ========================================================= */}
        {currentStep === 1 && applicants.length > 0 && (
          <div className="candidates-modal-ai-bar">
            <div className="candidates-modal-ai-controls">
              <label className="candidates-modal-input-label" htmlFor="topCandidatesInput">
                <SparkleIcon />
                <span>Top Candidates to Shortlist:</span>
              </label>
              <input
                id="topCandidatesInput"
                type="number"
                min={1}
                max={Math.max(1, applicants.length)}
                value={topCount}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(applicants.length, parseInt(e.target.value) || 1));
                  setTopCount(val);
                }}
                className="candidates-modal-number-input"
                disabled={isAnalyzing}
              />
              <span className="text-xs text-slate-500 hidden sm:inline">
                (out of {applicants.length} applicants)
              </span>
            </div>

            <button
              type="button"
              className="candidates-modal-run-ai-btn"
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing}
              title="Run AI Agent Analysis to score and shortlist top candidates"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>AI Agent Analyzing...</span>
                </>
              ) : (
                <>
                  <SparkleIcon />
                  <span>✨ Run AI Analysis</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* AI Progress Banner */}
        {isAnalyzing && (
          <div className="candidates-modal-ai-progress">
            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>{analyzingStageText}</span>
          </div>
        )}

        {/* STEP 2 ONLY: SHORTLIST NOTICE BANNER */}
        {currentStep === 2 && (
          <div className="shortlist-banner-notice">
            <div className="flex items-center gap-2">
              <SparkleIcon />
              <span>
                AI screening agent ranked all applicants. Showing top {displayedCandidates.length} high-fit candidates ready for next pipeline steps.
              </span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 mx-6 mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================
            SEARCH & STATS BAR
            ========================================================= */}
        <div className="candidates-modal-filter-bar">
          <div className="candidates-modal-search-box">
            <span className="candidates-modal-search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder={
                currentStep === 1
                  ? "Search applicant name, role, or skill..."
                  : "Search shortlisted candidates..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="candidates-modal-search-input"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-800">{filteredCandidates.length}</strong> of {displayedCandidates.length} {currentStep === 2 ? 'shortlisted candidates' : 'applicants'}
          </div>
        </div>

        {/* =========================================================
            MODAL BODY: CANDIDATE LIST (STEP 1 VS STEP 2)
            ========================================================= */}
        <div className="candidates-modal-body">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-slate-500">AI is analyzing candidate profiles... This may take a few seconds.</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <UsersIcon />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {applicants.length === 0
                  ? 'No applicants yet'
                  : 'No candidates match your search'}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {applicants.length === 0
                  ? 'When candidates apply for this position, they will appear here.'
                  : 'Try searching with a different candidate name or skill keyword.'}
              </p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => {
              const initials = candidate.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={candidate.id}
                  className={`candidates-modal-row cursor-pointer ${currentStep === 2 ? 'highlight-top-match' : ''}`}
                  onClick={() => setSelectedCandidateId(candidate.candidateId)}
                  title="Click to view Digital CV Profile"
                >
                  {/* Candidate Identity */}
                  <div className="candidates-modal-row-left">
                    {candidate.avatarUrl ? (
                      <img
                        src={candidate.avatarUrl}
                        alt={candidate.name}
                        className="candidates-modal-avatar object-cover"
                      />
                    ) : (
                      <div
                        className="candidates-modal-avatar"
                        style={{ background: candidate.avatarBg }}
                      >
                        {initials}
                      </div>
                    )}
                    
                    <div className="candidates-modal-candidate-info">
                      <h4 className="candidates-modal-candidate-name">
                        <span>{candidate.name}</span>
                        {currentStep === 2 && candidate.rank && (
                          <span className="candidates-modal-top-rank-badge">
                            #{candidate.rank} Top Match
                          </span>
                        )}
                      </h4>
                      <p className="candidates-modal-candidate-headline">
                        {candidate.headline}
                      </p>
                      <div className="candidates-modal-candidate-meta">
                        <span className="flex items-center gap-1">
                          <MailIcon /> {candidate.email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPinIcon /> {candidate.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ClockIcon /> Applied {candidate.appliedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Meta: Status, AI Score & Action Buttons */}
                  <div className="candidates-modal-row-right" onClick={(e) => e.stopPropagation()}>
                    {/* Skills Snippet */}
                    <div className="hidden lg:flex items-center gap-1">
                      {candidate.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="candidates-modal-skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Step 1 Status Badge & Score Placeholder */}
                    {currentStep === 1 && (
                      <>
                        <span className="candidates-modal-stage-badge applied">
                          <span className="candidates-modal-stage-dot"></span>
                          {candidate.stage}
                        </span>

                        <button
                          type="button"
                          className="candidates-modal-action-btn"
                          onClick={() => setSelectedCandidateId(candidate.candidateId)}
                          title="View candidate's verified Digital CV profile"
                        >
                          <span>View CV →</span>
                        </button>
                      </>
                    )}

                    {/* Step 2 Shortlisted View: Score & Shortlisted Badge */}
                    {currentStep === 2 && (
                      <>
                        {/* AI Match Score Badge */}
                        <span className="candidates-modal-score-badge">
                          <SparkleIcon />
                          <span>{candidate.aiScore}% Match</span>
                        </span>

                        {/* Shortlisted Status Badge */}
                        <span className="candidates-modal-stage-badge shortlisted">
                          Shortlisted
                        </span>

                        <button
                          type="button"
                          className="candidates-modal-action-btn"
                          onClick={() => setSelectedCandidateId(candidate.candidateId)}
                          title="View candidate's verified Digital CV profile"
                        >
                          <span>View CV →</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* =========================================================
            MODAL FOOTER (SINGLE PRIMARY CTA)
            ========================================================= */}
        <div className="candidates-modal-footer">
          <button
            type="button"
            className="candidates-modal-dismiss-btn"
            onClick={onClose}
          >
            Close
          </button>

          {currentStep === 2 && (
            <button
              type="button"
              className="bg-green-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-none text-sm inline-flex items-center gap-2 cursor-pointer"
              onClick={handleMoveToPipelineBoard}
            >
              <span>Move to Pipeline Board →</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================
          DIGITAL CV PROFILE DRAWER (RIGHT SIDE SLIDING PANEL)
          ========================================================= */}
      {selectedCandidateId && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="candidate-cv-drawer-overlay"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCandidateId(null);
            }}
          />

          {/* Sliding Drawer Panel containing CandidateProfileReadOnly */}
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
