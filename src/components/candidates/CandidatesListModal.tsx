import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JobDto } from '../../services/api';
import {
  SparkleIcon,
  XIcon,
  SearchIcon,
  UsersIcon,
  ClockIcon,
  ArrowLeftIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  KanbanIcon,
  CheckIcon,
  BriefcaseIcon,
  GraduationCapIcon,
} from '../common/Icons';

export interface CandidateExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ModalCandidate {
  id: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  appliedDate: string;
  stage: 'Applied' | 'AI Shortlisted';
  aiScore: number | null;
  experienceYears: number;
  skills: string[];
  avatarBg: string;
  isTopMatch?: boolean;
  rank?: number;
  bio: string;
  education: string;
  currentCompany: string;
  experienceHistory: CandidateExperience[];
  keyHighlights: string[];
}

const BASE_JOB_CANDIDATES: ModalCandidate[] = [
  {
    id: 'cand-1',
    name: 'Alex Morgan',
    headline: 'Senior Full Stack Engineer (React, .NET Core, AWS)',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA (Remote)',
    appliedDate: 'Jan 12, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 6,
    skills: ['React', 'TypeScript', '.NET Core', 'PostgreSQL', 'AWS'],
    avatarBg: 'linear-gradient(135deg, #00b074 0%, #008759 100%)',
    bio: 'Accomplished full stack software engineer with 6+ years designing cloud-native applications, scalable microservices, and modern React SPAs.',
    education: 'B.S. in Computer Science — UC Berkeley',
    currentCompany: 'Apex Cloud Solutions',
    experienceHistory: [
      {
        title: 'Senior Software Engineer',
        company: 'Apex Cloud Solutions',
        duration: '2022 - Present',
        description: 'Led a distributed team architecting microservices with .NET 8 and React 19, reducing API latencies by 42%.',
      },
      {
        title: 'Full Stack Engineer',
        company: 'Vanguard Labs',
        duration: '2019 - 2022',
        description: 'Developed high-throughput customer portals using TypeScript, PostgreSQL, and AWS ECS.',
      },
    ],
    keyHighlights: ['6+ Years Enterprise Full-Stack', 'Strong .NET Core & React proficiency', 'AWS Solutions Architect Certified'],
  },
  {
    id: 'cand-2',
    name: 'Sophia Zhang',
    headline: 'Lead Cloud & Backend Architect',
    email: 'sophia.zhang@techcorp.io',
    phone: '+1 (555) 456-7890',
    location: 'Austin, TX',
    appliedDate: 'Jan 13, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 8,
    skills: ['C#', '.NET 8', 'PostgreSQL', 'Kubernetes', 'Redis'],
    avatarBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    bio: 'Cloud and backend systems architect specializing in high-concurrency event-driven platforms, distributed caching, and zero-downtime infrastructure.',
    education: 'M.S. in Software Engineering — UT Austin',
    currentCompany: 'OmniCloud Technologies',
    experienceHistory: [
      {
        title: 'Lead Architect',
        company: 'OmniCloud Technologies',
        duration: '2021 - Present',
        description: 'Architected distributed event-sourcing pipelines processing over 25M daily transactions.',
      },
      {
        title: 'Senior Backend Engineer',
        company: 'DataStream Corp',
        duration: '2018 - 2021',
        description: 'Engineered high-performance REST and gRPC microservices in C# with Redis clustering.',
      },
    ],
    keyHighlights: ['8+ Years Backend Engineering', 'Deep Distributed Systems Design', 'Kubernetes & Docker Specialist'],
  },
  {
    id: 'cand-3',
    name: 'Marcus Vance',
    headline: 'Senior Frontend Engineer & UI Designer',
    email: 'marcus.v@designcode.dev',
    phone: '+1 (555) 890-1234',
    location: 'Seattle, WA',
    appliedDate: 'Jan 14, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 5,
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
    avatarBg: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
    bio: 'Product-focused frontend engineer passionate about design systems, web performance, accessibility, and intuitive user experiences.',
    education: 'B.A. in Digital Arts & Computer Science — University of Washington',
    currentCompany: 'AeroWeb Studios',
    experienceHistory: [
      {
        title: 'Senior Frontend Developer',
        company: 'AeroWeb Studios',
        duration: '2022 - Present',
        description: 'Authored multi-tenant corporate design system adopted across 8 distinct web applications.',
      },
      {
        title: 'Frontend Developer',
        company: 'PixelCraft Interactive',
        duration: '2020 - 2022',
        description: 'Built complex data visualization dashboards with React and TypeScript.',
      },
    ],
    keyHighlights: ['Design System Leadership', 'Modern React 19 / TypeScript Master', 'Web Performance Optimization'],
  },
  {
    id: 'cand-4',
    name: 'Elena Rostova',
    headline: 'DevOps & Distributed Systems Specialist',
    email: 'elena.rostova@cloudscale.net',
    phone: '+1 (555) 345-6789',
    location: 'Chicago, IL',
    appliedDate: 'Jan 14, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 4,
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux'],
    avatarBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    bio: 'DevOps and infrastructure specialist experienced in automated CI/CD pipelines, container orchestration, and multi-region cloud security.',
    education: 'B.S. in Information Systems — UIUC',
    currentCompany: 'Matrix Infra Group',
    experienceHistory: [
      {
        title: 'DevOps Engineer',
        company: 'Matrix Infra Group',
        duration: '2021 - Present',
        description: 'Implemented zero-downtime deployment pipelines across multi-region Kubernetes clusters.',
      },
    ],
    keyHighlights: ['CI/CD Automation', 'Container Orchestration', 'Cloud Security Posture'],
  },
  {
    id: 'cand-5',
    name: 'Priya Patel',
    headline: 'UI/UX & Frontend Platform Engineer',
    email: 'priya.patel@webstudio.io',
    phone: '+1 (555) 567-8901',
    location: 'Boston, MA',
    appliedDate: 'Jan 16, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 3,
    skills: ['React', 'CSS Systems', 'Figma', 'TypeScript'],
    avatarBg: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    bio: 'Frontend platform developer bridging the gap between Figma design prototypes and robust, reusable React components.',
    education: 'B.S. in Software Design — Boston University',
    currentCompany: 'NovaInterface',
    experienceHistory: [
      {
        title: 'Frontend Engineer',
        company: 'NovaInterface',
        duration: '2023 - Present',
        description: 'Built responsive client web applications and implemented unit testing suites in Jest.',
      },
    ],
    keyHighlights: ['Design-to-Code Velocity', 'Accessible Component Design', 'Modern CSS Architecture'],
  },
  {
    id: 'cand-6',
    name: 'David Kim',
    headline: 'Full Stack Software Engineer II',
    email: 'david.kim@codeworks.org',
    phone: '+1 (555) 678-9012',
    location: 'New York, NY',
    appliedDate: 'Jan 15, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 2,
    skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
    avatarBg: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    bio: 'Emerging full-stack developer with solid foundation in JavaScript, React web components, and RESTful API services.',
    education: 'B.A. in Computer Science — NYU',
    currentCompany: 'StartScale Labs',
    experienceHistory: [
      {
        title: 'Junior Developer',
        company: 'StartScale Labs',
        duration: '2023 - Present',
        description: 'Maintained client-facing portals and integrated third-party payment gateways.',
      },
    ],
    keyHighlights: ['Quick Learner', 'Clean JavaScript Fundamentals', 'Agile Team Contributor'],
  },
  {
    id: 'cand-7',
    name: 'Liam O’Connor',
    headline: 'Senior Staff Platform Engineer',
    email: 'liam.oconnor@platform.io',
    phone: '+1 (555) 901-2345',
    location: 'Boston, MA',
    appliedDate: 'Jan 17, 2026',
    stage: 'Applied',
    aiScore: null,
    experienceYears: 7,
    skills: ['C#', 'Distributed DBs', 'Azure', 'Docker', '.NET Core'],
    avatarBg: 'linear-gradient(135deg, #009e67 0%, #065f46 100%)',
    bio: 'Platform lead with 7+ years delivering resilient backend infrastructure, fault-tolerant messaging queues, and high-throughput data processing.',
    education: 'B.S. in Computer Science — MIT',
    currentCompany: 'Vanguard Tech',
    experienceHistory: [
      {
        title: 'Senior Staff Engineer',
        company: 'Vanguard Tech',
        duration: '2020 - Present',
        description: 'Led technical roadmap for enterprise core banking infrastructure with 99.999% uptime.',
      },
    ],
    keyHighlights: ['7+ Years Platform Architecture', 'Expert in .NET & Distributed DBs', 'System Resilience Lead'],
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
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [topCount, setTopCount] = useState<number>(5);
  const [candidates, setCandidates] = useState<ModalCandidate[]>(BASE_JOB_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<ModalCandidate | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStageText, setAnalyzingStageText] = useState('');

  // Reset state when a new job opens
  useEffect(() => {
    if (isOpen) {
      setCandidates(BASE_JOB_CANDIDATES);
      setCurrentStep(1);
      setSearchQuery('');
      setIsAnalyzing(false);
      setSelectedCandidate(null);
    }
  }, [isOpen, job?.id]);

  // AI Agent Simulation Handler -> Transitions directly to Step 2
  const handleRunAiAnalysis = () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalyzingStageText('AI Agent scanning candidate CVs & parsing skill competencies...');

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
      // Automatically transition to Step 2: Shortlisted View
      setCurrentStep(2);
    }, 1500);
  };

  // Pipeline Board Navigation
  const handleMoveToPipelineBoard = () => {
    onClose();
    navigate(`/dashboard/pipelines/${job?.id}`);
  };

  // List of candidates for current view
  const displayedCandidates = useMemo(() => {
    if (currentStep === 2) {
      return candidates.filter((c) => c.isTopMatch);
    }
    return candidates;
  }, [candidates, currentStep]);

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
                    REQ #{job.id.substring(0, 8).toUpperCase()}
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
                    Click any candidate row to view Digital CV Profile
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
        {currentStep === 1 && (
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

              return (
                <div
                  key={candidate.id}
                  className={`candidates-modal-row cursor-pointer ${currentStep === 2 ? 'highlight-top-match' : ''}`}
                  onClick={() => setSelectedCandidate(candidate)}
                  title="Click to view Digital CV Profile"
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
                        {currentStep === 2 && candidate.rank && (
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
                      {candidate.skills.slice(0, 2).map((skill, idx) => (
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
                          Applied
                        </span>

                        <div
                          className="flex items-center"
                          title="AI Match Score will be calculated when running AI Analysis"
                        >
                          <span className="candidates-modal-score-placeholder">—</span>
                        </div>
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
                          onClick={() => setSelectedCandidate(candidate)}
                          title="View Digital CV profile drawer"
                        >
                          <span>View Profile →</span>
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
      {selectedCandidate && (
        <>
          {/* Soft Dark Backdrop Overlay */}
          <div
            className="candidate-cv-drawer-overlay"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCandidate(null);
            }}
          />

          {/* Sliding Drawer Panel */}
          <div
            className="candidate-cv-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="candidate-cv-drawer-header">
              <div className="candidate-cv-drawer-header-left">
                <div
                  className="candidate-cv-drawer-avatar"
                  style={{ background: selectedCandidate.avatarBg }}
                >
                  {selectedCandidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)}
                </div>
                <div className="candidate-cv-drawer-title-box">
                  <h3 className="candidate-cv-drawer-name">
                    {selectedCandidate.name}
                  </h3>
                  <p className="candidate-cv-drawer-headline">
                    {selectedCandidate.headline}
                  </p>
                  <div className="candidate-cv-drawer-meta">
                    <span className="flex items-center gap-1">
                      <MapPinIcon /> {selectedCandidate.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ClockIcon /> {selectedCandidate.experienceYears} yrs exp
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Drawer Button */}
              <button
                type="button"
                className="candidate-cv-drawer-close-btn"
                onClick={() => setSelectedCandidate(null)}
                title="Close Profile Drawer"
              >
                <XIcon />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="candidate-cv-drawer-body">
              {/* Card 1: Stage & AI Score Card */}
              <div className="candidate-cv-drawer-card">
                <div className="candidate-cv-drawer-card-header">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Stage:</span>
                    <span className="candidates-modal-stage-badge shortlisted">
                      {selectedCandidate.stage}
                    </span>
                  </div>

                  {selectedCandidate.aiScore !== null ? (
                    <span className="candidates-modal-score-badge">
                      <SparkleIcon />
                      <span>{selectedCandidate.aiScore}% Match</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Score Pending</span>
                  )}
                </div>

                {/* Candidate Bio */}
                <p className="candidate-cv-drawer-bio">
                  {selectedCandidate.bio}
                </p>

                {/* Key Highlights */}
                {selectedCandidate.keyHighlights.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-slate-700 block">Candidate Highlights:</span>
                    <div className="candidate-cv-drawer-highlights">
                      {selectedCandidate.keyHighlights.map((hl, idx) => (
                        <span key={idx} className="candidate-cv-drawer-highlight-tag">
                          <CheckIcon />
                          <span>{hl}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Contact Information */}
              <div className="candidate-cv-drawer-card">
                <h4 className="candidate-cv-drawer-card-title">
                  <MailIcon />
                  <span>Contact Information</span>
                </h4>
                <div className="candidate-cv-drawer-contact-list">
                  <div className="candidate-cv-drawer-contact-item">
                    <span className="text-slate-400"><MailIcon /></span>
                    <a href={`mailto:${selectedCandidate.email}`} className="text-blue-600 hover:underline">
                      {selectedCandidate.email}
                    </a>
                  </div>
                  <div className="candidate-cv-drawer-contact-item">
                    <span className="text-slate-400"><PhoneIcon /></span>
                    <span>{selectedCandidate.phone}</span>
                  </div>
                  <div className="candidate-cv-drawer-contact-item">
                    <span className="text-slate-400"><MapPinIcon /></span>
                    <span>{selectedCandidate.location}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Skills & Competencies */}
              <div className="candidate-cv-drawer-card">
                <h4 className="candidate-cv-drawer-card-title">
                  <BriefcaseIcon />
                  <span>Core Skills & Technologies</span>
                </h4>
                <div className="candidate-cv-drawer-skills-list">
                  {selectedCandidate.skills.map((skill, idx) => (
                    <span key={idx} className="candidate-cv-drawer-skill-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 4: Work Experience Timeline */}
              <div className="candidate-cv-drawer-card">
                <h4 className="candidate-cv-drawer-card-title">
                  <ClockIcon />
                  <span>Experience History</span>
                </h4>
                <div className="candidate-cv-drawer-timeline">
                  {selectedCandidate.experienceHistory.map((exp, idx) => (
                    <div key={idx} className="candidate-cv-drawer-timeline-item">
                      <div className="candidate-cv-drawer-timeline-top">
                        <span className="candidate-cv-drawer-timeline-title">{exp.title}</span>
                        <span className="candidate-cv-drawer-timeline-duration">{exp.duration}</span>
                      </div>
                      <div className="candidate-cv-drawer-timeline-company">
                        {exp.company}
                      </div>
                      <p className="candidate-cv-drawer-timeline-desc">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 5: Education */}
              <div className="candidate-cv-drawer-card">
                <h4 className="candidate-cv-drawer-card-title">
                  <GraduationCapIcon />
                  <span>Education & Credentials</span>
                </h4>
                <p className="candidate-cv-drawer-education">
                  {selectedCandidate.education}
                </p>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="candidate-cv-drawer-footer">
              <button
                type="button"
                className="candidate-cv-drawer-btn-secondary"
                onClick={() => setSelectedCandidate(null)}
              >
                Close Profile
              </button>

              <button
                type="button"
                className="candidate-cv-drawer-btn-primary"
                onClick={() => {
                  setSelectedCandidate(null);
                  handleMoveToPipelineBoard();
                }}
              >
                <KanbanIcon />
                <span>Move to Pipeline Board</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
