import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi, type JobDto } from '../services/api';
import {
  SparkleIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  MapPinIcon,
  DollarSignIcon,
  UsersIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  GraduationCapIcon,
  MailIcon,
  PhoneIcon,
} from '../components/common/Icons';

export type PipelineStage = 'Applied' | 'AI Shortlisted' | 'Interviewing' | 'Hired';

export interface Candidate {
  id: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  appliedDate: string;
  stage: PipelineStage;
  aiMatchScore: number | null;
  aiSummary: string;
  keySkills: string[];
  experienceYears: number;
  education: string;
  currentCompany: string;
  experienceHistory: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  avatarColor: string;
  aiStrengths: string[];
  aiMissingSkills: string[];
  isRecentlyShortlisted?: boolean;
}

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Alex Morgan',
    headline: 'Senior Full Stack Engineer (React, .NET, Cloud)',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA (Remote)',
    appliedDate: 'Jan 12, 2026',
    stage: 'Applied',
    aiMatchScore: null,
    aiSummary: 'Strong full-stack background with 6+ years in modern React, TypeScript, and enterprise ASP.NET Core microservices architecture. High alignment with job specifications.',
    keySkills: ['React', 'TypeScript', '.NET Core', 'PostgreSQL', 'Docker', 'AWS'],
    experienceYears: 6,
    education: 'B.S. in Computer Science - University of Washington',
    currentCompany: 'Apex Systems Inc.',
    experienceHistory: [
      {
        title: 'Senior Full Stack Engineer',
        company: 'Apex Systems Inc.',
        duration: '2022 - Present',
        description: 'Led architecture of multi-tenant cloud SaaS platform with React micro-frontends and ASP.NET Core backends, improving query latency by 45%.',
      },
      {
        title: 'Software Engineer',
        company: 'CloudNova Labs',
        duration: '2019 - 2022',
        description: 'Developed scalable RESTful APIs, distributed message queues, and interactive telemetry dashboards.',
      },
    ],
    avatarColor: 'linear-gradient(135deg, #00b074 0%, #008759 100%)',
    aiStrengths: ['6+ Years Full Stack Experience', 'Enterprise ASP.NET & React Specialist', 'Production Cloud DevOps Track Record'],
    aiMissingSkills: ['GraphQL (Minor preferred)'],
  },
  {
    id: 'cand-2',
    name: 'Sophia Zhang',
    headline: 'Lead Cloud & Backend Architect',
    email: 'sophia.zhang@techcorp.io',
    phone: '+1 (555) 890-1234',
    location: 'Austin, TX',
    appliedDate: 'Jan 13, 2026',
    stage: 'Applied',
    aiMatchScore: null,
    aiSummary: 'Exceptional backend depth with distributed database optimization, Kubernetes infrastructure, and high-throughput transaction processing.',
    keySkills: ['C#', 'PostgreSQL', 'Kubernetes', 'Redis', 'System Design', 'Azure'],
    experienceYears: 8,
    education: 'M.S. in Software Engineering - UT Austin',
    currentCompany: 'QuantEdge Financial',
    experienceHistory: [
      {
        title: 'Lead Backend Architect',
        company: 'QuantEdge Financial',
        duration: '2021 - Present',
        description: 'Architected real-time order matching engine handling 120k requests/sec with 99.99% reliability SLA.',
      },
      {
        title: 'Senior Backend Developer',
        company: 'DataStream Systems',
        duration: '2017 - 2021',
        description: 'Designed distributed caching strategies and optimized PostgreSQL query execution plans.',
      },
    ],
    avatarColor: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    aiStrengths: ['8+ Years Backend Architecture', 'Distributed Systems Expert', 'High-Throughput PostgreSQL Tuning'],
    aiMissingSkills: ['Tailwind CSS'],
  },
  {
    id: 'cand-3',
    name: 'Marcus Vance',
    headline: 'Senior Frontend Engineer & UI System Designer',
    email: 'marcus.v@designcode.dev',
    phone: '+1 (555) 456-7890',
    location: 'Seattle, WA',
    appliedDate: 'Jan 14, 2026',
    stage: 'Applied',
    aiMatchScore: null,
    aiSummary: 'Top-tier frontend specialist with focus on performance optimization, design tokens, responsive corporate dashboards, and accessible component libraries.',
    keySkills: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Next.js', 'Figma'],
    experienceYears: 5,
    education: 'B.S. in Computer Science - UC Berkeley',
    currentCompany: 'PixelCraft Studio',
    experienceHistory: [
      {
        title: 'Senior Frontend Developer',
        company: 'PixelCraft Studio',
        duration: '2022 - Present',
        description: 'Created an enterprise design system used by 20+ engineering squads, reducing UI bugs by 60%.',
      },
      {
        title: 'Frontend Engineer',
        company: 'AeroWeb Technologies',
        duration: '2020 - 2022',
        description: 'Built complex data visualization dashboards using React, D3.js, and TypeScript.',
      },
    ],
    avatarColor: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    aiStrengths: ['Design System Leadership', 'Modern React 19 / TypeScript Master', 'Web Performance Optimization'],
    aiMissingSkills: ['C# Backend Experience'],
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
    aiMatchScore: null,
    aiSummary: 'Solid infrastructure background with automated CI/CD pipelines, Terraform infra-as-code, and Docker container orchestration.',
    keySkills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Terraform'],
    experienceYears: 4,
    education: 'B.S. in Information Systems - UIUC',
    currentCompany: 'Matrix Infra Group',
    experienceHistory: [
      {
        title: 'DevOps Engineer',
        company: 'Matrix Infra Group',
        duration: '2021 - Present',
        description: 'Implemented zero-downtime deployment pipelines across multi-region Kubernetes clusters.',
      },
    ],
    avatarColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    aiStrengths: ['CI/CD Automation', 'Multi-Cloud Infrastructure', 'Container Security'],
    aiMissingSkills: ['React State Management'],
  },
  {
    id: 'cand-5',
    name: 'David Kim',
    headline: 'Junior-Mid Full Stack Developer',
    email: 'david.kim@codeworks.org',
    phone: '+1 (555) 678-9012',
    location: 'New York, NY',
    appliedDate: 'Jan 15, 2026',
    stage: 'Applied',
    aiMatchScore: null,
    aiSummary: 'Emerging developer with good foundational knowledge in React and REST APIs, eager to grow into senior architectural roles.',
    keySkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
    experienceYears: 2,
    education: 'B.A. in Computer Science - NYU',
    currentCompany: 'StartScale Labs',
    experienceHistory: [
      {
        title: 'Junior Developer',
        company: 'StartScale Labs',
        duration: '2023 - Present',
        description: 'Maintained client-facing portals and integrated third-party payment gateways.',
      },
    ],
    avatarColor: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    aiStrengths: ['Quick Learner', 'Clean JavaScript Fundamentals'],
    aiMissingSkills: ['5+ Years Seniority Requirement', '.NET Core Enterprise Patterns'],
  },
  {
    id: 'cand-6',
    name: 'Liam O’Connor',
    headline: 'Senior Staff Engineer & Platform Lead',
    email: 'liam.oconnor@enterprise.io',
    phone: '+1 (555) 901-2345',
    location: 'Boston, MA',
    appliedDate: 'Jan 10, 2026',
    stage: 'AI Shortlisted',
    aiMatchScore: 94,
    aiSummary: 'Exceptional match with 7+ years in enterprise architectures, high security standards, and resilient distributed databases.',
    keySkills: ['React', 'TypeScript', 'C#', '.NET Core', 'PostgreSQL', 'Microservices'],
    experienceYears: 7,
    education: 'B.S. in Computer Science - MIT',
    currentCompany: 'Vanguard Tech',
    experienceHistory: [
      {
        title: 'Senior Staff Engineer',
        company: 'Vanguard Tech',
        duration: '2020 - Present',
        description: 'Led technical roadmap for enterprise core banking infrastructure with 99.999% uptime.',
      },
    ],
    avatarColor: 'linear-gradient(135deg, #00b074 0%, #008759 100%)',
    aiStrengths: ['94% Semantic Resume Match', '7+ Years Proven Leadership', 'Expert in Both Frontend & Backend'],
    aiMissingSkills: [],
  },
  {
    id: 'cand-7',
    name: 'Maya Lin',
    headline: 'Senior Application Architect & React Specialist',
    email: 'maya.lin@innovatech.com',
    phone: '+1 (555) 789-0123',
    location: 'San Jose, CA',
    appliedDate: 'Jan 09, 2026',
    stage: 'AI Shortlisted',
    aiMatchScore: 96,
    aiSummary: 'Top 1% candidate profile: deep expertise in high-concurrency architectures, enterprise state management, and modern Web APIs.',
    keySkills: ['React', 'TypeScript', '.NET Core', 'Azure', 'System Design', 'Tailwind CSS'],
    experienceYears: 8,
    education: 'M.S. in Computer Science - Stanford University',
    currentCompany: 'Synthetix Systems',
    experienceHistory: [
      {
        title: 'Principal Engineer',
        company: 'Synthetix Systems',
        duration: '2019 - Present',
        description: 'Directed engineering team of 14 developers building real-time analytics platforms.',
      },
    ],
    avatarColor: 'linear-gradient(135deg, #00b074 0%, #008759 100%)',
    aiStrengths: ['96% Top AI Rating', 'Stanford MS in CS', 'Direct Domain Experience'],
    aiMissingSkills: [],
  },
  {
    id: 'cand-8',
    name: 'Daniel Taylor',
    headline: 'Full Stack Engineer & Tech Lead',
    email: 'daniel.taylor@devlink.co',
    phone: '+1 (555) 567-8901',
    location: 'Denver, CO',
    appliedDate: 'Jan 07, 2026',
    stage: 'Interviewing',
    aiMatchScore: 91,
    aiSummary: 'Candidate progressed through initial technical review and is actively interviewing with engineering leads.',
    keySkills: ['React', 'C#', '.NET', 'PostgreSQL', 'Docker', 'REST APIs'],
    experienceYears: 5,
    education: 'B.S. in Software Engineering - Colorado State',
    currentCompany: 'Summit Cloudworks',
    experienceHistory: [
      {
        title: 'Full Stack Engineer',
        company: 'Summit Cloudworks',
        duration: '2021 - Present',
        description: 'Engineered modular web services and refactored monolithic codebase to modern API gateways.',
      },
    ],
    avatarColor: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    aiStrengths: ['Passed Technical Code Assessment', 'Excellent Communication Skills'],
    aiMissingSkills: [],
  },
  {
    id: 'cand-9',
    name: 'Sarah Jenkins',
    headline: 'Principal Software Architect',
    email: 'sarah.j@leadhire.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    appliedDate: 'Jan 02, 2026',
    stage: 'Hired',
    aiMatchScore: 98,
    aiSummary: 'Offer finalized and signed! Joined company as Principal Architect to lead technical design.',
    keySkills: ['React', 'TypeScript', 'C#', '.NET Core', 'Architecture', 'Kubernetes'],
    experienceYears: 9,
    education: 'M.S. in Computer Engineering - UC San Diego',
    currentCompany: 'Skill Hub Enterprise',
    experienceHistory: [
      {
        title: 'Principal Architect',
        company: 'Skill Hub Enterprise',
        duration: '2026 - Present',
        description: 'Leading global architecture and engineering standards across the platform.',
      },
    ],
    avatarColor: 'linear-gradient(135deg, #00b074 0%, #008759 100%)',
    aiStrengths: ['Offer Accepted', '98% Prime Qualification Match'],
    aiMissingSkills: [],
  },
];

const STAGES: Array<{ id: PipelineStage; title: string; subtitle: string }> = [
  { id: 'Applied', title: 'Applied', subtitle: 'New incoming candidate intake' },
  { id: 'AI Shortlisted', title: 'AI Shortlisted', subtitle: 'Automated 85%+ candidate match' },
  { id: 'Interviewing', title: 'Interviewing', subtitle: 'Technical & executive assessment' },
  { id: 'Hired', title: 'Hired', subtitle: 'Final decision & contracting' },
];

export const TalentPipelineBoard: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isScreening, setIsScreening] = useState(false);
  const [screeningText, setScreeningText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    if (!jobId) return;
    const fetchJob = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await jobsApi.getJobById(jobId);
        setJob(data);
      } catch (err: any) {
        console.error('Error loading pipeline job:', err);
        setErrorMessage(err.message || 'Job requisition was not found in your company database.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // AI Screening Simulation Handler
  const handleRunAiScreening = () => {
    if (isScreening) return;
    setIsScreening(true);
    setScreeningText('AI Agent scanning candidate CVs & parsing qualification profiles...');

    setTimeout(() => {
      setScreeningText('Evaluating technical skills ontology, experience depth & role requirements...');
    }, 800);

    setTimeout(() => {
      // Update candidate scores and move top candidates (score >= 85) to 'AI Shortlisted'
      setCandidates((prev) => {
        return prev.map((c) => {
          if (c.stage === 'Applied') {
            // Assign calculated AI match score based on candidate profile
            let score = 72;
            if (c.id === 'cand-1') score = 96; // Alex Morgan
            else if (c.id === 'cand-2') score = 93; // Sophia Zhang
            else if (c.id === 'cand-3') score = 89; // Marcus Vance
            else if (c.id === 'cand-4') score = 86; // Elena Rostova
            else if (c.id === 'cand-5') score = 68; // David Kim

            const isTopCandidate = score >= 85;
            return {
              ...c,
              aiMatchScore: score,
              stage: isTopCandidate ? 'AI Shortlisted' : 'Applied',
              isRecentlyShortlisted: isTopCandidate,
            };
          }
          return c;
        });
      });

      setIsScreening(false);
      showToast('✨ AI Screening Complete! 4 top qualified candidates automatically moved to AI Shortlisted.');
    }, 1800);
  };

  // Move candidate to specific stage
  const handleMoveStage = (candidateId: string, newStage: PipelineStage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage, isRecentlyShortlisted: false } : c))
    );
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate((prev) => (prev ? { ...prev, stage: newStage } : null));
    }
    showToast(`Candidate moved to "${newStage}" stage.`);
  };

  if (loading) {
    return (
      <div className="job-details-page-container flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Loading candidate pipeline for requisition...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !job) {
    return (
      <div className="job-details-page-container">
        <div className="job-details-wrapper">
          <button
            type="button"
            className="job-details-back-btn w-fit"
            onClick={() => navigate('/dashboard/pipelines')}
          >
            <ArrowLeftIcon />
            <span>Back to Job Selector</span>
          </button>
          <div className="job-details-card text-center max-w-lg mx-auto py-12">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <BriefcaseIcon />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Requisition Pipeline Not Found</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {errorMessage || 'Unable to find requisition candidate pipeline.'}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/dashboard/pipelines')}
            >
              Return to Pipeline Selector
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="job-details-toast">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="job-details-wrapper" style={{ maxWidth: '100%' }}>
        {/* =========================================================
            1. TOP NAVIGATION & BREADCRUMBS ROW
            ========================================================= */}
        <div className="job-details-nav-row">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              className="job-details-back-btn"
              onClick={() => navigate('/dashboard/pipelines')}
            >
              <ArrowLeftIcon />
              <span>Back to Job Selector</span>
            </button>

            <div className="job-details-breadcrumbs">
              <Link to="/dashboard" className="job-details-breadcrumb-link">Dashboard</Link>
              <span className="job-details-breadcrumb-sep">/</span>
              <Link to="/dashboard/pipelines" className="job-details-breadcrumb-link">Candidates</Link>
              <span className="job-details-breadcrumb-sep">/</span>
              <span className="job-details-breadcrumb-current">{job.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/dashboard/jobs/${job.id}`}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
            >
              <BriefcaseIcon />
              <span>View Requisition</span>
            </Link>
          </div>
        </div>

        {/* =========================================================
            2. HEADER BANNER CARD WITH AI SCREENING TRIGGER
            ========================================================= */}
        <div className="job-details-hero-card">
          <div className="job-details-hero-left">
            <div className="job-details-meta-tags">
              <span className="job-details-status-badge active">
                <span className="job-details-status-dot"></span>
                {job.status} Pipeline
              </span>
              <span className="job-details-dept-badge">{job.department}</span>
              <span className="job-details-ai-badge">
                <SparkleIcon />
                <span>AI Screening Pipeline</span>
              </span>
            </div>

            <h1 className="job-details-title">{job.title}</h1>

            <div className="job-details-subrow">
              <div className="job-details-subrow-item company-name">
                <BuildingIcon />
                <span>{job.companyName || 'Enterprise'}</span>
              </div>
              <span className="job-details-subrow-sep">•</span>
              <div className="job-details-subrow-item">
                <MapPinIcon />
                <span>{job.location}</span>
              </div>
              <span className="job-details-subrow-sep">•</span>
              <div className="job-details-subrow-item">
                <ClockIcon />
                <span>{job.employmentType}</span>
              </div>
              {job.salaryRange && (
                <>
                  <span className="job-details-subrow-sep">•</span>
                  <div className="job-details-subrow-item font-semibold text-emerald-700">
                    <DollarSignIcon />
                    <span>{job.salaryRange}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI Screening Primary Action Button */}
          <div className="job-details-hero-actions">
            <button
              type="button"
              className="btn-ai-screen"
              onClick={handleRunAiScreening}
              disabled={isScreening}
              title="Run AI Agent Screening across all applied candidate resumes"
            >
              {isScreening ? (
                <>
                  <div className="ai-screening-spinner"></div>
                  <span>Analyzing Candidates...</span>
                </>
              ) : (
                <>
                  <SparkleIcon />
                  <span>✨ Run AI Screening</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* =========================================================
            3. AI SCREENING PROGRESS BANNER (WHEN ACTIVE)
            ========================================================= */}
        {isScreening && (
          <div className="ai-screening-progress-banner">
            <div className="ai-screening-progress-left">
              <div className="ai-screening-spinner"></div>
              <span>{screeningText}</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200">
              Agent Active
            </span>
          </div>
        )}

        {/* =========================================================
            4. HORIZONTAL KANBAN BOARD
            ========================================================= */}
        <div className="overflow-x-auto pb-4">
          <div className="kanban-board-grid" style={{ minWidth: '1060px' }}>
            {STAGES.map((stage) => {
              const stageCandidates = candidates.filter((c) => c.stage === stage.id);
              const isShortlistedColumn = stage.id === 'AI Shortlisted';

              return (
                <div key={stage.id} className="kanban-column-card">
                  {/* Column Header */}
                  <div className="kanban-column-header">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="kanban-column-title">{stage.title}</h3>
                        {isShortlistedColumn && (
                          <span className="text-emerald-600"><SparkleIcon /></span>
                        )}
                      </div>
                      <p className="kanban-column-desc">{stage.subtitle}</p>
                    </div>
                    <span className="kanban-count-pill">{stageCandidates.length}</span>
                  </div>

                  {/* Column Body & Cards */}
                  <div className="kanban-column-body">
                    {stageCandidates.length === 0 ? (
                      <div className="kanban-empty-dropzone">
                        <div className="kanban-dropzone-icon">
                          <UsersIcon />
                        </div>
                        <span className="kanban-dropzone-title">No Candidates</span>
                        <p className="kanban-dropzone-text">
                          {stage.id === 'AI Shortlisted'
                            ? 'Run AI Screening above to automatically filter top matches.'
                            : `No candidates currently in ${stage.title.toLowerCase()} stage.`}
                        </p>
                      </div>
                    ) : (
                      <div className="kanban-cards-stack">
                        {stageCandidates.map((candidate) => {
                          const initials = candidate.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2);

                          return (
                            <div
                              key={candidate.id}
                              className={`candidate-kanban-card ${candidate.isRecentlyShortlisted ? 'highlight-ai' : ''}`}
                              onClick={() => setSelectedCandidate(candidate)}
                              title="Click to view full Digital CV Profile"
                            >
                              {/* Card Header: Identity & AI Score */}
                              <div className="candidate-card-top">
                                <div className="candidate-card-identity">
                                  <div
                                    className="candidate-avatar"
                                    style={{ background: candidate.avatarColor }}
                                  >
                                    {initials}
                                  </div>
                                  <div className="candidate-name-box">
                                    <span className="candidate-card-name">{candidate.name}</span>
                                    <span className="candidate-card-headline">{candidate.currentCompany}</span>
                                  </div>
                                </div>

                                {/* AI Match Score Pill */}
                                {candidate.aiMatchScore !== null ? (
                                  <span
                                    className={`ai-score-pill ${
                                      candidate.aiMatchScore >= 90
                                        ? 'high'
                                        : candidate.aiMatchScore >= 80
                                        ? 'medium'
                                        : 'moderate'
                                    }`}
                                  >
                                    <SparkleIcon />
                                    <span>{candidate.aiMatchScore}%</span>
                                  </span>
                                ) : (
                                  <span className="ai-score-pill pending">
                                    <ClockIcon />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </div>

                              {/* Candidate Headline */}
                              <p className="text-xs text-slate-600 line-clamp-1">
                                {candidate.headline}
                              </p>

                              {/* Skills Badges */}
                              <div className="candidate-card-skills">
                                {candidate.keySkills.slice(0, 3).map((skill, idx) => (
                                  <span key={idx} className="candidate-skill-tag">
                                    {skill}
                                  </span>
                                ))}
                                {candidate.keySkills.length > 3 && (
                                  <span className="candidate-skill-tag">
                                    +{candidate.keySkills.length - 3}
                                  </span>
                                )}
                              </div>

                              {/* Card Footer: Date & Quick Stage Mover */}
                              <div className="candidate-card-footer">
                                <div className="candidate-card-date">
                                  <ClockIcon />
                                  <span>{candidate.appliedDate}</span>
                                </div>

                                <div className="candidate-stage-nav-btns" onClick={(e) => e.stopPropagation()}>
                                  {stage.id !== 'Applied' && (
                                    <button
                                      type="button"
                                      className="candidate-stage-btn"
                                      title="Move Left"
                                      onClick={(e) => {
                                        const stageIndex = STAGES.findIndex((s) => s.id === stage.id);
                                        if (stageIndex > 0) {
                                          handleMoveStage(candidate.id, STAGES[stageIndex - 1].id, e);
                                        }
                                      }}
                                    >
                                      ←
                                    </button>
                                  )}
                                  {stage.id !== 'Hired' && (
                                    <button
                                      type="button"
                                      className="candidate-stage-btn"
                                      title="Advance to Next Stage"
                                      onClick={(e) => {
                                        const stageIndex = STAGES.findIndex((s) => s.id === stage.id);
                                        if (stageIndex < STAGES.length - 1) {
                                          handleMoveStage(candidate.id, STAGES[stageIndex + 1].id, e);
                                        }
                                      }}
                                    >
                                      →
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          5. DIGITAL CV DRAWER (SLIDE-IN RIGHT PANEL)
          ========================================================= */}
      {selectedCandidate && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="cv-drawer-backdrop"
            onClick={() => setSelectedCandidate(null)}
          />

          {/* Drawer Container */}
          <div className="cv-drawer-container">
            {/* Drawer Header */}
            <div className="cv-drawer-header">
              <div className="flex items-start gap-3.5">
                <div
                  className="candidate-avatar"
                  style={{
                    background: selectedCandidate.avatarColor,
                    width: '46px',
                    height: '46px',
                    fontSize: '15px',
                  }}
                >
                  {selectedCandidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedCandidate.name}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {selectedCandidate.headline}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1"><MapPinIcon /> {selectedCandidate.location}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MailIcon /> {selectedCandidate.email}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><PhoneIcon /> {selectedCandidate.phone}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="cv-drawer-close-btn"
                onClick={() => setSelectedCandidate(null)}
                title="Close CV Drawer"
              >
                <XIcon />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="cv-drawer-body">
              {/* Card 1: Pipeline Stage & AI Match Breakdown */}
              <div className="cv-drawer-card">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Stage:</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {selectedCandidate.stage}
                    </span>
                  </div>

                  {selectedCandidate.aiMatchScore !== null ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <SparkleIcon />
                      <span>{selectedCandidate.aiMatchScore}% AI Match</span>
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">AI Screening Pending</span>
                  )}
                </div>

                {/* AI Summary Breakdown */}
                <div className="space-y-3">
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <SparkleIcon />
                      <span>AI Agent Evaluation Summary</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedCandidate.aiSummary}
                    </p>
                  </div>

                  {/* Strengths */}
                  {selectedCandidate.aiStrengths.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-bold text-slate-700 block">Candidate Key Highlights:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCandidate.aiStrengths.map((str, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                            <CheckIcon />
                            <span>{str}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Core Skills & Proficiencies */}
              <div className="cv-drawer-card">
                <h3 className="cv-drawer-card-title">
                  <span className="text-emerald-600"><BriefcaseIcon /></span>
                  <span>Core Skills & Technologies</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.keySkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 3: Experience Timeline */}
              <div className="cv-drawer-card">
                <h3 className="cv-drawer-card-title">
                  <span className="text-emerald-600"><BuildingIcon /></span>
                  <span>Experience History</span>
                </h3>
                <div className="space-y-4 pt-1">
                  {selectedCandidate.experienceHistory.map((exp, i) => (
                    <div key={i} className="cv-drawer-timeline-item">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{exp.title}</span>
                        <span className="text-xs font-medium text-slate-500">{exp.duration}</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700">{exp.company}</span>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Education */}
              <div className="cv-drawer-card">
                <h3 className="cv-drawer-card-title">
                  <span className="text-emerald-600"><GraduationCapIcon /></span>
                  <span>Education & Credentials</span>
                </h3>
                <div className="text-xs text-slate-800 font-medium">
                  {selectedCandidate.education}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="cv-drawer-footer">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  onClick={() => setSelectedCandidate(null)}
                >
                  Close
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedCandidate.stage !== 'Hired' && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '12.5px', padding: '8px 16px', borderRadius: '10px' }}
                    onClick={() => {
                      const stageIdx = STAGES.findIndex((s) => s.id === selectedCandidate.stage);
                      if (stageIdx < STAGES.length - 1) {
                        handleMoveStage(selectedCandidate.id, STAGES[stageIdx + 1].id);
                      }
                    }}
                  >
                    <span>Advance to {STAGES[Math.min(STAGES.findIndex((s) => s.id === selectedCandidate.stage) + 1, STAGES.length - 1)].title} →</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
