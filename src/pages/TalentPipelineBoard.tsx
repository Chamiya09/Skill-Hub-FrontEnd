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
  ClockIcon,
  CheckIcon,
  XIcon,
  GraduationCapIcon,
  MailIcon,
  PhoneIcon,
  InfoIcon,
  ArrowRightIcon,
} from '../components/common/Icons';

export interface Candidate {
  id: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  appliedDate: string;
  isShortlisted?: boolean;
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
    isShortlisted: false,
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
    isShortlisted: false,
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
    isShortlisted: false,
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
    isShortlisted: false,
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
    isShortlisted: false,
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
    aiMissingSkills: ['Senior System Design', 'High Load Optimization'],
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
    aiMatchScore: null,
    aiSummary: 'Specialized in asynchronous microservices, gRPC protocols, and enterprise backend persistence layers.',
    keySkills: ['C#', 'Go', '.NET Core', 'Docker', 'RabbitMQ', 'PostgreSQL'],
    experienceYears: 3,
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
    avatarColor: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    aiStrengths: ['Microservices Patterns', 'Strong .NET Basics'],
    aiMissingSkills: ['Frontend React'],
  },
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
  const [isAiAnalyzed, setIsAiAnalyzed] = useState(false);
  const [screeningText, setScreeningText] = useState('');
  const [isTransferred, setIsTransferred] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
        console.error('Error loading requisition for AI screening:', err);
        setErrorMessage(err.message || 'Job requisition was not found in your company database.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const isJobClosed = (job?.status || '').toLowerCase() === 'closed';
  const isJobActive = (job?.status || 'Active').toLowerCase() === 'active';

  // Toggle Job Status (e.g. Close Job so AI screening can run)
  const handleToggleJobStatus = async () => {
    if (!job) return;
    const newStatus = isJobClosed ? 'Active' : 'Closed';
    try {
      setIsUpdatingStatus(true);
      await jobsApi.updateJob(job.id, {
        title: job.title,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        salaryRange: job.salaryRange,
        status: newStatus,
        description: job.description,
        whatWeOffer: job.whatWeOffer,
      });
      setJob((prev) => (prev ? { ...prev, status: newStatus } : null));
      showToast(`Requisition status updated to "${newStatus}".`);
    } catch (err: any) {
      console.error('Failed to update job status:', err);
      // Fallback local update
      setJob((prev) => (prev ? { ...prev, status: newStatus } : null));
      showToast(`Requisition status updated to "${newStatus}" (Local).`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Run Batch AI Screening Handler (Only enabled when Closed)
  const handleRunAiScreening = () => {
    if (!isJobClosed || isScreening) return;
    setIsScreening(true);
    setScreeningText('AI Agent scanning candidate CVs & parsing qualification profiles...');

    setTimeout(() => {
      setScreeningText('Evaluating technical skills ontology, experience depth & role requirements...');
    }, 800);

    setTimeout(() => {
      setScreeningText('Calculating AI Match Scores and generating shortlisting ranks...');
    }, 1500);

    setTimeout(() => {
      // Calculate AI scores for full batch
      setCandidates((prev) => {
        return prev.map((c) => {
          let score = 72;
          if (c.id === 'cand-1') score = 96; // Alex Morgan
          else if (c.id === 'cand-2') score = 93; // Sophia Zhang
          else if (c.id === 'cand-3') score = 89; // Marcus Vance
          else if (c.id === 'cand-4') score = 86; // Elena Rostova
          else if (c.id === 'cand-5') score = 68; // David Kim
          else if (c.id === 'cand-6') score = 74; // Rachel Bennett

          const isTopCandidate = score >= 85;
          return {
            ...c,
            aiMatchScore: score,
            isShortlisted: isTopCandidate,
            isRecentlyShortlisted: isTopCandidate,
          };
        });
      });

      setIsScreening(false);
      setIsAiAnalyzed(true);
      showToast('✨ Batch AI Screening Complete! 4 top qualified candidates shortlisted.');
    }, 2200);
  };

  // Single Action: Send Shortlisted Candidates to Next Module (Hiring Pipeline)
  const handleSendToHiringPipeline = () => {
    setIsTransferred(true);
    showToast('🚀 Shortlisted candidates successfully sent to Hiring Pipeline module!');
  };

  const shortlistedCandidates = candidates.filter((c) => c.isShortlisted);
  const otherCandidates = candidates.filter((c) => !c.isShortlisted);

  if (loading) {
    return (
      <div className="job-details-page-container flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Loading AI Screening data for requisition...</p>
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
            <span>Back to Requisitions</span>
          </button>
          <div className="job-details-card text-center max-w-lg mx-auto py-12">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <BriefcaseIcon />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Requisition Not Found</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {errorMessage || 'Unable to find requisition candidate data.'}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/dashboard/pipelines')}
            >
              Return to Requisitions List
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
              <span>Back to Requisitions</span>
            </button>

            <div className="job-details-breadcrumbs">
              <Link to="/dashboard" className="job-details-breadcrumb-link">Dashboard</Link>
              <span className="job-details-breadcrumb-sep">/</span>
              <Link to="/dashboard/pipelines" className="job-details-breadcrumb-link">AI Screening</Link>
              <span className="job-details-breadcrumb-sep">/</span>
              <span className="job-details-breadcrumb-current">{job.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleToggleJobStatus}
              disabled={isUpdatingStatus}
              style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
              title={isJobClosed ? 'Re-open job applications' : 'Mark job closed to enable AI screening'}
            >
              <ClockIcon />
              <span>{isJobClosed ? 'Re-open Applications' : 'Mark as Closed'}</span>
            </button>

            <Link
              to={`/dashboard/jobs/${job.id}`}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
            >
              <BriefcaseIcon />
              <span>View Vacancy</span>
            </Link>
          </div>
        </div>

        {/* =========================================================
            2. HEADER BANNER CARD WITH AI SCREENING TRIGGER
            ========================================================= */}
        <div className="job-details-hero-card" style={{ marginBottom: '20px' }}>
          <div className="job-details-hero-left">
            <div className="job-details-meta-tags">
              <span
                className={`job-details-status-badge ${isJobActive ? 'active' : ''}`}
                style={
                  isJobClosed
                    ? {
                        background: '#f1f5f9',
                        color: '#475569',
                        borderColor: '#cbd5e1',
                      }
                    : undefined
                }
              >
                <span
                  className="job-details-status-dot"
                  style={isJobClosed ? { background: '#64748b' } : undefined}
                ></span>
                {isJobClosed ? 'Closed (Intake Ended)' : 'Active (Applications Open)'}
              </span>
              <span className="job-details-dept-badge">{job.department}</span>
              <span className="job-details-ai-badge">
                <SparkleIcon />
                <span>AI Batch Screening</span>
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

          {/* AI Screening Primary Action Button (Enabled ONLY if Closed) */}
          <div className="job-details-hero-actions">
            <button
              type="button"
              className="btn-ai-screen"
              onClick={handleRunAiScreening}
              disabled={!isJobClosed || isScreening}
              title={
                isJobActive
                  ? 'Job is still Active. Close requisition to enable AI Screening.'
                  : 'Run AI Batch Screening across all candidate CVs'
              }
            >
              {isScreening ? (
                <>
                  <div className="ai-screening-spinner"></div>
                  <span>Analyzing All Applicants...</span>
                </>
              ) : isAiAnalyzed ? (
                <>
                  <SparkleIcon />
                  <span>✨ Re-run AI Analysis</span>
                </>
              ) : (
                <>
                  <SparkleIcon />
                  <span>✨ Run AI Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* =========================================================
            3. STRICT ENFORCEMENT BANNER
            ========================================================= */}
        {isJobActive && (
          <div className="ai-screening-info-banner">
            <div className="ai-screening-info-icon">
              <InfoIcon />
            </div>
            <div>
              <div className="ai-screening-info-title">Applications Are Still Open</div>
              <p className="ai-screening-info-desc">
                Applications are still open. AI Screening can only be performed once the job is marked as Closed.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            4. AI SCREENING PROGRESS BANNER (WHEN RUNNING)
            ========================================================= */}
        {isScreening && (
          <div className="ai-screening-progress-banner" style={{ marginBottom: '24px' }}>
            <div className="ai-screening-progress-left">
              <div className="ai-screening-spinner"></div>
              <span>{screeningText}</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200">
              AI Batch Processor Active
            </span>
          </div>
        )}

        {/* =========================================================
            5. TRANSFERRED STATE BANNER / CONFIRMATION
            ========================================================= */}
        {isTransferred && (
          <div className="ai-screening-transferred-card">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#065f46' }}>
                  Shortlisted Candidates Transferred to Hiring Pipeline
                </div>
                <div style={{ fontSize: '12px', color: '#047857' }}>
                  The 4 top AI-ranked candidates have been dispatched to the interview & evaluation pipeline.
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: '#ffffff',
                color: '#059669',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #a7f3d0',
              }}
            >
              Handoff Complete
            </span>
          </div>
        )}

        {/* =========================================================
            6. APPLICANTS & SCREENING RESULTS VIEW
            ========================================================= */}
        {isAiAnalyzed ? (
          /* =========================================================
             AFTER AI RUNS: SHORTLISTED VS OTHER APPLICANTS
             ========================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Shortlisted Section with Transfer Button */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#00b074' }}><SparkleIcon /></span>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      AI Shortlisted Candidates ({shortlistedCandidates.length})
                    </h2>
                    <span
                      style={{
                        background: '#e6f9f2',
                        color: '#008759',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      Top Tier (85%+ Match)
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Ranked candidates meeting required technical competencies, experience depth, and qualification ontology.
                  </p>
                </div>

                {/* Single Pipeline Move Button */}
                <button
                  type="button"
                  className="btn-send-pipeline"
                  onClick={handleSendToHiringPipeline}
                  disabled={isTransferred}
                  title="Transfer all shortlisted candidates to the next hiring pipeline module"
                >
                  <ArrowRightIcon />
                  <span>
                    {isTransferred
                      ? '✓ Shortlisted Sent to Hiring Pipeline'
                      : 'Send Shortlisted to Hiring Pipeline'}
                  </span>
                </button>
              </div>

              {/* Shortlisted Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {shortlistedCandidates.map((candidate) => {
                  const initials = candidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2);

                  return (
                    <div
                      key={candidate.id}
                      className="candidate-kanban-card highlight-ai"
                      onClick={() => setSelectedCandidate(candidate)}
                      style={{ cursor: 'pointer' }}
                    >
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

                        <span className="ai-score-pill high">
                          <SparkleIcon />
                          <span>{candidate.aiMatchScore}%</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {candidate.headline}
                      </p>

                      <div className="candidate-card-skills">
                        {candidate.keySkills.slice(0, 4).map((skill, idx) => (
                          <span key={idx} className="candidate-skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="candidate-card-footer">
                        <div className="candidate-card-date">
                          <ClockIcon />
                          <span>Applied {candidate.appliedDate}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#008759',
                          }}
                        >
                          View CV Profile →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Applicants Section */}
            {otherCandidates.length > 0 && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#475569', margin: 0 }}>
                    Other Applicants ({otherCandidates.length})
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Applicants evaluated below the 85% shortlisting threshold for this role.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {otherCandidates.map((candidate) => {
                    const initials = candidate.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2);

                    return (
                      <div
                        key={candidate.id}
                        className="candidate-kanban-card"
                        onClick={() => setSelectedCandidate(candidate)}
                        style={{ cursor: 'pointer' }}
                      >
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

                          <span className="ai-score-pill moderate">
                            <SparkleIcon />
                            <span>{candidate.aiMatchScore}%</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-1">
                          {candidate.headline}
                        </p>

                        <div className="candidate-card-skills">
                          {candidate.keySkills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="candidate-skill-tag">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="candidate-card-footer">
                          <div className="candidate-card-date">
                            <ClockIcon />
                            <span>Applied {candidate.appliedDate}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            View CV Profile →
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
          /* =========================================================
             BEFORE AI RUNS: CURRENT APPLICANTS LIST (PURELY VIEWING)
             ========================================================= */
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f1f5f9',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Received Candidate Applications ({candidates.length})
                  </h2>
                  <span
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    Intake Repository
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
                  {isJobActive
                    ? 'Candidates are gathered here while applications are open. Click any candidate to view their resume profile.'
                    : 'Applications are closed. Click "✨ Run AI Analysis" above to process and shortlist candidates.'}
                </p>
              </div>

              {isJobClosed && (
                <button
                  type="button"
                  className="btn-ai-screen"
                  onClick={handleRunAiScreening}
                  disabled={isScreening}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  <SparkleIcon />
                  <span>✨ Run AI Analysis</span>
                </button>
              )}
            </div>

            {/* Candidate Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {candidates.map((candidate) => {
                const initials = candidate.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2);

                return (
                  <div
                    key={candidate.id}
                    className="candidate-kanban-card"
                    onClick={() => setSelectedCandidate(candidate)}
                    style={{ cursor: 'pointer' }}
                  >
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

                      <span className="ai-score-pill pending">
                        <ClockIcon />
                        <span>Screening Pending</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {candidate.headline}
                    </p>

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

                    <div className="candidate-card-footer">
                      <div className="candidate-card-date">
                        <ClockIcon />
                        <span>Applied {candidate.appliedDate}</span>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          color: '#00b074',
                          fontWeight: 600,
                        }}
                      >
                        View CV Profile →
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
          7. DIGITAL CV DRAWER (SLIDE-IN RIGHT PANEL)
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
                aria-label="Close CV Drawer"
              >
                <XIcon />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="cv-drawer-body">
              {/* AI Score & Analysis Box (if analyzed) */}
              {selectedCandidate.aiMatchScore !== null ? (
                <div className="candidate-cv-drawer-ai-box">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <SparkleIcon />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        AI Match Score & Role Alignment
                      </span>
                    </div>
                    <span className="ai-score-pill high text-xs px-3 py-1 font-bold">
                      {selectedCandidate.aiMatchScore}% Match
                    </span>
                  </div>
                  <p className="candidate-cv-drawer-ai-summary">
                    {selectedCandidate.aiSummary}
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-emerald-100 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-emerald-900 block mb-1">Key AI Strengths:</span>
                      <ul className="list-disc list-inside text-emerald-800 space-y-0.5">
                        {selectedCandidate.aiStrengths.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>
                    {selectedCandidate.aiMissingSkills.length > 0 && (
                      <div className="pt-1">
                        <span className="font-semibold text-slate-700 block mb-1">Potential Skill Gaps / Non-Core:</span>
                        <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                          {selectedCandidate.aiMissingSkills.map((gap, idx) => (
                            <li key={idx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-1">
                    <ClockIcon />
                    <span>AI Screening Pending</span>
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    {isJobActive
                      ? 'AI analysis runs automatically across all candidates once the job requisition is marked as Closed.'
                      : 'Run the batch AI analysis to compute match rankings and candidate qualification insights.'}
                  </p>
                </div>
              )}

              {/* Skills */}
              <div className="candidate-cv-drawer-section">
                <h3 className="candidate-cv-drawer-section-title">Verified Core Competencies</h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedCandidate.keySkills.map((skill, idx) => (
                    <span key={idx} className="candidate-skill-tag" style={{ fontSize: '11.5px', padding: '3px 9px' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience History */}
              <div className="candidate-cv-drawer-section">
                <h3 className="candidate-cv-drawer-section-title">
                  Career Experience ({selectedCandidate.experienceYears} Years Total)
                </h3>
                <div className="candidate-cv-drawer-timeline">
                  {selectedCandidate.experienceHistory.map((exp, idx) => (
                    <div key={idx} className="candidate-cv-drawer-timeline-item">
                      <div className="candidate-cv-drawer-timeline-dot" />
                      <div className="candidate-cv-drawer-timeline-content">
                        <div className="flex items-center justify-between">
                          <h4 className="candidate-cv-drawer-timeline-title">{exp.title}</h4>
                          <span className="candidate-cv-drawer-timeline-duration">{exp.duration}</span>
                        </div>
                        <span className="candidate-cv-drawer-timeline-company">{exp.company}</span>
                        <p className="candidate-cv-drawer-timeline-desc">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="candidate-cv-drawer-section">
                <h3 className="candidate-cv-drawer-section-title">Education & Credentials</h3>
                <div className="flex items-center gap-2.5 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500"><GraduationCapIcon /></span>
                  <p className="candidate-cv-drawer-education">{selectedCandidate.education}</p>
                </div>
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
            </div>
          </div>
        </>
      )}
    </div>
  );
};
