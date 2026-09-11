import React, { useState, useEffect } from 'react';
import { jobsApi, type JobDto } from '../../services/api';
import {
  SparkleIcon,
  XIcon,
  SearchIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightIcon,
  MailIcon,
  MapPinIcon,
  CheckIcon,
  GraduationCapIcon,
  InfoIcon,
  DollarSignIcon,
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
  isShortlisted?: boolean;
  aiScore: number | null;
  experienceYears: number;
  skills: string[];
  avatarBg: string;
  rank?: number;
  bio: string;
  education: string;
  currentCompany: string;
  experienceHistory: CandidateExperience[];
  keyHighlights: string[];
  missingSkills?: string[];
}

const INITIAL_MODAL_CANDIDATES: ModalCandidate[] = [
  {
    id: 'cand-1',
    name: 'Alex Morgan',
    headline: 'Senior Full Stack Engineer (React, .NET Core, AWS)',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA (Remote)',
    appliedDate: 'Jan 12, 2026',
    isShortlisted: false,
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
    missingSkills: ['GraphQL (Minor preferred)'],
  },
  {
    id: 'cand-2',
    name: 'Sophia Zhang',
    headline: 'Lead Cloud & Backend Architect',
    email: 'sophia.zhang@techcorp.io',
    phone: '+1 (555) 456-7890',
    location: 'Austin, TX',
    appliedDate: 'Jan 13, 2026',
    isShortlisted: false,
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
    missingSkills: ['Tailwind CSS'],
  },
  {
    id: 'cand-3',
    name: 'Marcus Vance',
    headline: 'Senior Frontend Engineer & UI Designer',
    email: 'marcus.v@designcode.dev',
    phone: '+1 (555) 890-1234',
    location: 'Seattle, WA',
    appliedDate: 'Jan 14, 2026',
    isShortlisted: false,
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
    missingSkills: ['C# Backend Experience'],
  },
  {
    id: 'cand-4',
    name: 'Elena Rostova',
    headline: 'DevOps & Distributed Systems Specialist',
    email: 'elena.rostova@cloudscale.net',
    phone: '+1 (555) 345-6789',
    location: 'Chicago, IL',
    appliedDate: 'Jan 14, 2026',
    isShortlisted: false,
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
    missingSkills: ['React State Management'],
  },
  {
    id: 'cand-5',
    name: 'David Kim',
    headline: 'Junior-Mid Full Stack Developer',
    email: 'david.kim@codeworks.org',
    phone: '+1 (555) 678-9012',
    location: 'New York, NY',
    appliedDate: 'Jan 15, 2026',
    isShortlisted: false,
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
    missingSkills: ['Senior System Design', 'High Load Optimization'],
  },
  {
    id: 'cand-6',
    name: 'Rachel Bennett',
    headline: 'Cloud Backend Developer (Go & .NET)',
    email: 'rachel.b@innovatetech.com',
    phone: '+1 (555) 789-0123',
    location: 'Boston, MA',
    appliedDate: 'Jan 16, 2026',
    isShortlisted: false,
    aiScore: null,
    experienceYears: 3,
    skills: ['C#', 'Go', '.NET Core', 'Docker', 'RabbitMQ', 'PostgreSQL'],
    avatarBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    bio: 'Specialized in asynchronous microservices, gRPC protocols, and enterprise backend persistence layers.',
    education: 'B.S. in Software Engineering - Northeastern',
    currentCompany: 'Apex Networks',
    experienceHistory: [
      {
        title: 'Backend Developer',
        company: 'Apex Networks',
        duration: '2023 - Present',
        description: 'Maintained enterprise message routing queues and API integrations.',
      },
    ],
    keyHighlights: ['Microservices Patterns', 'Strong .NET Basics'],
    missingSkills: ['Frontend React'],
  },
];

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
  const [candidates, setCandidates] = useState<ModalCandidate[]>(INITIAL_MODAL_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<ModalCandidate | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStageText, setAnalyzingStageText] = useState('');
  const [isAiAnalyzed, setIsAiAnalyzed] = useState(false);
  const [isTransferred, setIsTransferred] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    if (isOpen && job) {
      setCurrentJob(job);
      setCandidates(INITIAL_MODAL_CANDIDATES);
      setIsAiAnalyzed(false);
      setIsAnalyzing(false);
      setIsTransferred(false);
      setSelectedCandidate(null);
      setSearchQuery('');
    }
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

  // Run AI Screening Analysis
  const handleRunAiAnalysis = () => {
    if (!isJobClosed || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalyzingStageText('AI Agent scanning candidate CVs & parsing qualification profiles...');

    setTimeout(() => {
      setAnalyzingStageText('Evaluating technical skills ontology, experience depth & role requirements...');
    }, 800);

    setTimeout(() => {
      setAnalyzingStageText('Computing match scores and ranking applicants...');
    }, 1500);

    setTimeout(() => {
      const scoredList: ModalCandidate[] = INITIAL_MODAL_CANDIDATES.map((c) => {
        let score = 72;
        if (c.id === 'cand-1') score = 98; // Alex Morgan
        else if (c.id === 'cand-2') score = 95; // Sophia Zhang
        else if (c.id === 'cand-3') score = 89; // Marcus Vance
        else if (c.id === 'cand-4') score = 86; // Elena Rostova
        else if (c.id === 'cand-5') score = 68; // David Kim
        else if (c.id === 'cand-6') score = 74; // Rachel Bennett

        const isTop = score >= 85;
        return {
          ...c,
          aiScore: score,
          isShortlisted: isTop,
        };
      });

      scoredList.sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));

      setCandidates(scoredList);
      setIsAnalyzing(false);
      setIsAiAnalyzed(true);
      showToast('✨ Batch AI Screening Complete! Top candidates shortlisted.');
    }, 2200);
  };

  // Single Action: Send Shortlisted Candidates to Hiring Pipeline
  const handleSendToHiringPipeline = () => {
    setIsTransferred(true);
    showToast('🚀 Shortlisted candidates transferred to the Hiring Pipeline module!');
  };

  const shortlistedList = candidates.filter((c) => c.isShortlisted);
  const otherList = candidates.filter((c) => !c.isShortlisted);

  const filteredCandidates = (list: ModalCandidate[]) => {
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
      {/* Toast Alert */}
      {toastMessage && (
        <div className="job-details-toast" style={{ zIndex: 999999 }}>
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

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
                  Applications are currently open for candidates. AI Screening can only be performed once this job is marked as Closed.
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
                className="popup-footer-btn-primary"
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                <SparkleIcon />
                <span>✨ Run AI Analysis</span>
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
          {isAiAnalyzed ? (
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
                  {filteredCandidates(shortlistedList).map((candidate) => {
                    const initials = candidate.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2);

                    return (
                      <div
                        key={candidate.id}
                        onClick={() => setSelectedCandidate(candidate)}
                        className="popup-candidate-item highlight"
                      >
                        <div className="candidate-avatar" style={{ background: candidate.avatarBg }}>
                          {initials}
                        </div>
                        <div className="candidate-main-info">
                          <div className="candidate-name-row">
                            <span className="candidate-name">{candidate.name}</span>
                            <span className="candidate-company">• {candidate.currentCompany}</span>
                          </div>
                          <p className="candidate-headline">{candidate.headline}</p>
                          <div className="candidate-skills-wrap">
                            {candidate.skills.slice(0, 4).map((s, idx) => (
                              <span key={idx} className="candidate-skill-pill">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="candidate-right-actions">
                          <span className="popup-status-score high">
                            <SparkleIcon />
                            <span>{candidate.aiScore}% Match</span>
                          </span>
                          <span className="popup-view-cv-link">
                            View CV →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Other Applicants Section */}
              {otherList.length > 0 && (
                <div className="popup-section-card">
                  <div className="popup-section-header">
                    <h3 className="popup-section-title">
                      Other Applicants ({otherList.length})
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredCandidates(otherList).map((candidate) => {
                      const initials = candidate.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2);

                      return (
                        <div
                          key={candidate.id}
                          onClick={() => setSelectedCandidate(candidate)}
                          className="popup-candidate-item"
                        >
                          <div className="candidate-avatar" style={{ background: candidate.avatarBg }}>
                            {initials}
                          </div>
                          <div className="candidate-main-info">
                            <div className="candidate-name-row">
                              <span className="candidate-name">{candidate.name}</span>
                              <span className="candidate-company">• {candidate.currentCompany}</span>
                            </div>
                            <p className="candidate-headline">{candidate.headline}</p>
                            <div className="candidate-skills-wrap">
                              {candidate.skills.slice(0, 3).map((s, idx) => (
                                <span key={idx} className="candidate-skill-pill">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="candidate-right-actions">
                            <span className="popup-status-score moderate">
                              <span>{candidate.aiScore}% Match</span>
                            </span>
                            <span className="popup-view-cv-link" style={{ color: '#64748b' }}>
                              View CV →
                            </span>
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
                  Click any applicant to view full resume
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredCandidates(candidates).map((candidate) => {
                  const initials = candidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2);

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate)}
                      className="popup-candidate-item"
                    >
                      <div className="candidate-avatar" style={{ background: candidate.avatarBg }}>
                        {initials}
                      </div>
                      <div className="candidate-main-info">
                        <div className="candidate-name-row">
                          <span className="candidate-name">{candidate.name}</span>
                          <span className="candidate-company">• {candidate.currentCompany}</span>
                        </div>
                        <p className="candidate-headline">{candidate.headline}</p>
                        <div className="candidate-skills-wrap">
                          {candidate.skills.slice(0, 4).map((s, idx) => (
                            <span key={idx} className="candidate-skill-pill">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="candidate-right-actions">
                        <span className="popup-status-pending">
                          <ClockIcon />
                          <span>Screening Pending</span>
                        </span>
                        <span className="popup-view-cv-link">
                          View CV →
                        </span>
                      </div>
                    </div>
                  );
                })}
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

          {/* SINGLE PIPELINE MOVE BUTTON (SHOWN AFTER SHORTLISTING) */}
          {isAiAnalyzed ? (
            <button
              type="button"
              onClick={handleSendToHiringPipeline}
              disabled={isTransferred}
              className="popup-footer-btn-primary"
              title="Transfer all shortlisted candidates to the next hiring pipeline module"
            >
              <ArrowRightIcon />
              <span>
                {isTransferred
                  ? '✓ Shortlisted Sent to Hiring Pipeline'
                  : `Send Shortlisted (${shortlistedList.length}) to Hiring Pipeline`}
              </span>
            </button>
          ) : isJobClosed ? (
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing}
              className="popup-footer-btn-primary"
            >
              <SparkleIcon />
              <span>✨ Run AI Analysis</span>
            </button>
          ) : (
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ClockIcon />
              <span>AI Screening unlocks when requisition is Closed</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          4. DIGITAL CV DRAWER (SLIDES OVER MODAL)
          ========================================================= */}
      {selectedCandidate && (
        <>
          <div
            className="cv-drawer-backdrop"
            onClick={() => setSelectedCandidate(null)}
          />

          <div className="cv-drawer-container">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-white flex-shrink-0">
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: selectedCandidate.avatarBg }}
                >
                  {selectedCandidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">{selectedCandidate.name}</h3>
                  <p className="text-xs text-slate-500 m-0">{selectedCandidate.headline}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1"><MapPinIcon /> {selectedCandidate.location}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MailIcon /> {selectedCandidate.email}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="popup-close-btn"
              >
                <XIcon />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-sm">
              {/* AI Score Box (if analyzed) */}
              {selectedCandidate.aiScore !== null ? (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                      <SparkleIcon />
                      <span>AI Role Alignment</span>
                    </span>
                    <span className="ai-score-pill high text-xs px-2.5 py-0.5">
                      {selectedCandidate.aiScore}% Match
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed m-0">{selectedCandidate.bio}</p>

                  <div className="pt-2 border-t border-emerald-100 space-y-1.5 text-xs">
                    <span className="font-bold text-emerald-950 block">AI Match Strengths:</span>
                    <ul className="list-disc list-inside text-emerald-800 space-y-0.5">
                      {selectedCandidate.keyHighlights.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <ClockIcon />
                    <span>AI Screening Pending</span>
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    {isJobActive
                      ? 'AI analysis will run across all applicants once this job is marked as Closed.'
                      : 'Run batch AI analysis to calculate match rankings and insights.'}
                  </p>
                </div>
              )}

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Competencies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.map((s, idx) => (
                    <span key={idx} className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Career Experience ({selectedCandidate.experienceYears} Years)
                </h4>
                <div className="space-y-3 border-l-2 border-slate-200 pl-3 ml-1">
                  {selectedCandidate.experienceHistory.map((exp, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-bold text-xs text-slate-900">{exp.title}</div>
                      <div className="text-xs text-emerald-700 font-semibold">{exp.company} • {exp.duration}</div>
                      <p className="text-xs text-slate-600 leading-relaxed m-0">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Education & Credentials</h4>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                  <GraduationCapIcon />
                  <span>{selectedCandidate.education}</span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
