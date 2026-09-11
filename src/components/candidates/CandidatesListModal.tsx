import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JobDto } from '../../services/api';
import {
  SparkleIcon,
  XIcon,
  SearchIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightIcon,
  MailIcon,
  MapPinIcon,
  KanbanIcon,
} from '../common/Icons';

export interface ModalCandidate {
  id: string;
  name: string;
  headline: string;
  email: string;
  location: string;
  appliedDate: string;
  stage: 'Applied' | 'AI Shortlisted';
  aiScore: number | null;
  experienceYears: number;
  skills: string[];
  avatarBg: string;
  isTopMatch?: boolean;
  rank?: number;
}

const BASE_JOB_CANDIDATES: ModalCandidate[] = [
  {
    id: 'cand-1',
    name: 'Alex Morgan',
    headline: 'Senior Full Stack Engineer (React, .NET Core, AWS)',
    email: 'alex.morgan@example.com',
    location: 'San Francisco, CA (Remote)',
    appliedDate: 'Jan 12, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 6,
    skills: ['React', 'TypeScript', '.NET Core', 'PostgreSQL'],
    avatarBg: 'linear-gradient(135deg, #00b074 0%, #008759 100%)',
  },
  {
    id: 'cand-2',
    name: 'Sophia Zhang',
    headline: 'Lead Cloud & Backend Architect',
    email: 'sophia.zhang@techcorp.io',
    location: 'Austin, TX',
    appliedDate: 'Jan 13, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 8,
    skills: ['C#', 'PostgreSQL', 'Kubernetes', 'Redis'],
    avatarBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  },
  {
    id: 'cand-3',
    name: 'Marcus Vance',
    headline: 'Senior Frontend Engineer & UI Designer',
    email: 'marcus.v@designcode.dev',
    location: 'Seattle, WA',
    appliedDate: 'Jan 14, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 5,
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
    avatarBg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  },
  {
    id: 'cand-4',
    name: 'Elena Rostova',
    headline: 'DevOps & Distributed Systems Specialist',
    email: 'elena.rostova@cloudscale.net',
    location: 'Chicago, IL',
    appliedDate: 'Jan 14, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 4,
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
    avatarBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  },
  {
    id: 'cand-5',
    name: 'Priya Patel',
    headline: 'UI/UX & Frontend Platform Engineer',
    email: 'priya.patel@webstudio.io',
    location: 'Boston, MA',
    appliedDate: 'Jan 16, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 3,
    skills: ['React', 'CSS Systems', 'Figma', 'TypeScript'],
    avatarBg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  },
  {
    id: 'cand-6',
    name: 'David Kim',
    headline: 'Full Stack Software Engineer II',
    email: 'david.kim@codeworks.org',
    location: 'New York, NY',
    appliedDate: 'Jan 15, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 2,
    skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
    avatarBg: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  },
  {
    id: 'cand-7',
    name: 'Liam O’Connor',
    headline: 'Senior Staff Platform Engineer',
    email: 'liam.oconnor@platform.io',
    location: 'Boston, MA',
    appliedDate: 'Jan 17, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 7,
    skills: ['C#', 'Distributed DBs', 'Azure', 'Docker'],
    avatarBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
  },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [topCount, setTopCount] = useState<number>(5);
  const [candidates, setCandidates] = useState<ModalCandidate[]>(BASE_JOB_CANDIDATES);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStageText, setAnalyzingStageText] = useState('');
  const [aiAnalyzed, setAiAnalyzed] = useState(false);

  // Reset state when a new job opens
  useEffect(() => {
    if (isOpen) {
      setCandidates(BASE_JOB_CANDIDATES);
      setSearchQuery('');
      setAiAnalyzed(false);
      setIsAnalyzing(false);
    }
  }, [isOpen, job?.id]);

  // AI Agent Simulation Handler
  const handleRunAiAnalysis = () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalyzingStageText('AI Agent analyzing candidate resumes & parsing skill competencies...');

    setTimeout(() => {
      setAnalyzingStageText('Evaluating qualification alignment, experience tier & role relevance...');
    }, 700);

    setTimeout(() => {
      // Assign calibrated mock match scores
      const scoredList: ModalCandidate[] = BASE_JOB_CANDIDATES.map((c) => {
        let score = 72;
        if (c.id === 'cand-1') score = 98; // Alex Morgan
        else if (c.id === 'cand-2') score = 95; // Sophia Zhang
        else if (c.id === 'cand-7') score = 91; // Liam O'Connor
        else if (c.id === 'cand-3') score = 88; // Marcus Vance
        else if (c.id === 'cand-4') score = 85; // Elena Rostova
        else if (c.id === 'cand-5') score = 78; // Priya Patel
        else if (c.id === 'cand-6') score = 68; // David Kim

        return {
          ...c,
          aiScore: score,
        };
      });

      // Sort descending by AI score (highest at top)
      scoredList.sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));

      // Differentiate the Top N candidates
      const updated = scoredList.map((cand, index) => {
        const isTopN = index < topCount;
        return {
          ...cand,
          rank: index + 1,
          isTopMatch: isTopN,
          stage: isTopN ? ('AI Shortlisted' as const) : ('Applied' as const),
        };
      });

      setCandidates(updated);
      setIsAnalyzing(false);
      setAiAnalyzed(true);
    }, 1500);
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [candidates, searchQuery]);

  if (!isOpen || !job) return null;

  return (
    <div className="candidates-modal-backdrop" onClick={onClose}>
      {/* Modal Card */}
      <div className="candidates-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="candidates-modal-header">
          <div className="candidates-modal-header-left">
            <div className="candidates-modal-badges">
              <span className="candidates-modal-req-tag">
                REQ #{job.id.substring(0, 8).toUpperCase()}
              </span>
              <span className="candidates-modal-dept-badge">
                {job.department}
              </span>
              <span className="candidates-modal-ai-badge">
                <SparkleIcon />
                <span>AI Agent Ready</span>
              </span>
            </div>

            <h2 className="candidates-modal-title">
              {job.title}
            </h2>

            <div className="candidates-modal-meta-row">
              <span className="candidates-modal-meta-item highlight">
                <UsersIcon />
                <span>{candidates.length} Total Applicants</span>
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

        {/* AI Action Bar */}
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
              max={candidates.length}
              value={topCount}
              onChange={(e) => {
                const val = Math.max(1, Math.min(candidates.length, parseInt(e.target.value) || 1));
                setTopCount(val);
                // If AI already ran, re-apply Top N highlighting
                if (aiAnalyzed) {
                  setCandidates((prev) =>
                    prev.map((c, index) => {
                      const isTopN = index < val;
                      return {
                        ...c,
                        isTopMatch: isTopN,
                        stage: isTopN ? 'AI Shortlisted' : 'Applied',
                      };
                    })
                  );
                }
              }}
              className="candidates-modal-number-input"
              disabled={isAnalyzing}
            />
            <span className="text-xs text-slate-500 hidden sm:inline">
              (out of {candidates.length} applicants)
            </span>
          </div>

          <button
            type="button"
            className="candidates-modal-run-ai-btn"
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            title="Analyze candidate qualifications and rank top matches"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>AI Analyzing...</span>
              </>
            ) : (
              <>
                <SparkleIcon />
                <span>✨ Run AI Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* AI Progress Banner */}
        {isAnalyzing && (
          <div className="candidates-modal-ai-progress">
            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>{analyzingStageText}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="candidates-modal-filter-bar">
          <div className="candidates-modal-search-box">
            <span className="candidates-modal-search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search candidate name, role, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="candidates-modal-search-input"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {aiAnalyzed ? (
              <span className="text-emerald-700 font-bold">
                ✓ AI Analysis Complete • Top {topCount} Shortlisted
              </span>
            ) : (
              <span>Showing {filteredCandidates.length} of {candidates.length} applicants</span>
            )}
          </div>
        </div>

        {/* Modal Body: Candidates List */}
        <div className="candidates-modal-body">
          {filteredCandidates.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <UsersIcon />
              </div>
              <p className="text-sm font-semibold text-slate-700">No candidates match your search</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with a different candidate name or skill keyword.
              </p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => {
              const initials = candidate.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2);

              const isTop = candidate.isTopMatch;

              return (
                <div
                  key={candidate.id}
                  className={`candidates-modal-row ${isTop ? 'highlight-top-match' : ''}`}
                >
                  {/* Candidate Identity */}
                  <div className="candidates-modal-row-left">
                    <div
                      className="candidates-modal-avatar"
                      style={{ background: candidate.avatarBg }}
                    >
                      {initials}
                    </div>
                    <div className="candidates-modal-candidate-info">
                      <h4 className="candidates-modal-candidate-name">
                        <span>{candidate.name}</span>
                        {isTop && candidate.rank && (
                          <span className="candidates-modal-top-rank-badge">
                            #{candidate.rank} Top Match
                          </span>
                        )}
                        <span className="candidates-modal-candidate-exp">
                          ({candidate.experienceYears} yrs exp)
                        </span>
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
                          <ClockIcon /> Applied {candidate.appliedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Meta: Status Badge & AI Score */}
                  <div className="candidates-modal-row-right">
                    {/* Skills Snippet */}
                    <div className="candidates-modal-skills">
                      {candidate.skills.slice(0, 2).map((skill, idx) => (
                        <span key={idx} className="candidates-modal-skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Dynamic Status Badge */}
                    {isTop ? (
                      <span className="candidates-modal-stage-badge ai-shortlisted">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        AI Shortlisted
                      </span>
                    ) : (
                      <span className="candidates-modal-stage-badge applied">
                        <span className="candidates-modal-stage-dot"></span>
                        Applied
                      </span>
                    )}

                    {/* AI Match Score Badge / Placeholder */}
                    {candidate.aiScore !== null ? (
                      <span
                        className={`candidates-modal-score-badge ${
                          candidate.aiScore >= 90 ? '' : 'pending'
                        }`}
                      >
                        <SparkleIcon />
                        <span>{candidate.aiScore}% Match</span>
                      </span>
                    ) : (
                      <div
                        className="flex items-center"
                        title="AI Match Score will be calculated when running AI Analysis"
                      >
                        <span className="candidates-modal-score-placeholder">—</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="candidates-modal-footer">
          <button
            type="button"
            className="candidates-modal-open-board-btn"
            onClick={() => {
              onClose();
              navigate(`/dashboard/pipelines/${job.id}`);
            }}
          >
            <KanbanIcon />
            <span>Open Full Interactive Pipeline Kanban Board</span>
            <ArrowRightIcon />
          </button>

          <button
            type="button"
            className="candidates-modal-dismiss-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
