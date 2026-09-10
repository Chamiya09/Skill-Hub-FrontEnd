import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  BuildingIcon,
  MapPinIcon,
  DollarSignIcon,
  GraduationCapIcon,
  CalendarIcon,
  UsersIcon,
  SparkleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  KanbanIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '../components/common/Icons';

export interface JobDetailModel {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Contract' | 'Part-time' | 'Remote';
  status: 'Active' | 'Draft' | 'Closed';
  experienceLevel: string;
  salaryRange: string;
  postedDate: string;
  applicantsCount: number;
  aiMatchScore: number;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  preferredQualifications: string[];
  benefits: string[];
  hiringLead: {
    name: string;
    role: string;
    avatarInitials: string;
    avatarBg: string;
    email: string;
  };
  pipelineStats: {
    stage: string;
    count: number;
    color: string;
  }[];
}

const mockJobsDatabase: Record<string, JobDetailModel> = {
  'vac-1': {
    id: 'vac-1',
    title: 'Senior Full Stack Engineer (React / .NET Core)',
    department: 'Engineering',
    location: 'Remote (APAC / Singapore)',
    type: 'Full-time',
    status: 'Active',
    experienceLevel: 'Senior (5+ Years)',
    salaryRange: '$135,000 - $175,000 USD / yr',
    postedDate: '2026-09-08',
    applicantsCount: 42,
    aiMatchScore: 96,
    overview:
      'We are seeking a seasoned Senior Full Stack Engineer to lead the architecture and implementation of our next-generation Talent Intelligence platform. In this role, you will design robust microservices in ASP.NET Core 9, build high-performance React applications with TypeScript, and integrate cutting-edge LLM inference pipelines.',
    responsibilities: [
      'Architect and build resilient, distributed RESTful APIs and GraphQL endpoints using .NET 9 and PostgreSQL.',
      'Develop pixel-perfect, responsive UI components with React 19, TypeScript, and modern design systems.',
      'Optimize database queries, indexing strategies, and real-time WebSocket communication channels.',
      'Collaborate with Product Managers and AI Researchers to deploy automated candidate matching engines.',
      'Mentor intermediate engineers through code reviews, design docs, and architectural RFC discussions.',
    ],
    requirements: [
      '5+ years of production experience with C# / .NET Core and modern frontend frameworks (React, Next.js).',
      'Solid understanding of relational databases (PostgreSQL, SQL Server) and Entity Framework Core.',
      'Proven expertise in state management, asynchronous programming, and REST API design patterns.',
      'Strong command of modern CSS, responsive layouts, and accessibility (WCAG 2.1 AA) standards.',
      'Experience with CI/CD pipelines, Docker containerization, and AWS/Azure cloud deployments.',
    ],
    preferredQualifications: [
      'Experience integrating OpenAI, Anthropic, or HuggingFace AI models into production applications.',
      'Familiarity with distributed caching (Redis) and event streaming architectures (Kafka / RabbitMQ).',
      'Contributions to open-source software or technical conference speaking experience.',
    ],
    benefits: [
      'Competitive base salary + equity stock options.',
      '100% remote work flexibility with home office setup stipend ($1,500).',
      'Comprehensive health, dental, and vision coverage for you and dependents.',
      'Annual learning and conference budget ($2,500/year).',
      'Flexible paid time off (25 days minimum) plus public holidays.',
    ],
    hiringLead: {
      name: 'Marcus Vance',
      role: 'VP of Engineering',
      avatarInitials: 'MV',
      avatarBg: '#0284c7',
      email: 'm.vance@skillhub.enterprise.com',
    },
    pipelineStats: [
      { stage: 'Applied', count: 42, color: '#3b82f6' },
      { stage: 'AI Screened', count: 26, color: '#10b981' },
      { stage: 'Tech Interview', count: 9, color: '#f59e0b' },
      { stage: 'Executive Review', count: 4, color: '#8b5cf6' },
      { stage: 'Offer Extended', count: 1, color: '#00b074' },
    ],
  },
  'vac-2': {
    id: 'vac-2',
    title: 'Staff AI / ML Infrastructure Architect',
    department: 'AI Research',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    status: 'Active',
    experienceLevel: 'Staff / Principal (8+ Years)',
    salaryRange: '$220,000 - $280,000 USD / yr',
    postedDate: '2026-09-06',
    applicantsCount: 28,
    aiMatchScore: 92,
    overview:
      'We are looking for a Staff AI/ML Infrastructure Architect to spearhead our high-throughput vector database clusters, GPU orchestration framework, and real-time semantic search indexing engine powering millions of candidate evaluations.',
    responsibilities: [
      'Design and operate multi-node GPU training and inference clusters (Triton, vLLM, Ray).',
      'Scale vector database infrastructure (Milvus, Pinecone, pgvector) to handle billions of high-dimensional embeddings.',
      'Develop automated model evaluation, drift monitoring, and continuous fine-tuning pipelines.',
      'Partner with security teams to enforce enterprise data isolation and zero-leakage LLM governance.',
    ],
    requirements: [
      '8+ years in distributed systems, with 4+ years dedicated to ML/AI production infrastructure.',
      'Deep mastery of Python, C++, CUDA optimizations, and Kubernetes operator architectures.',
      'Hands-on experience deploying open weights LLMs (Llama 3, Mistral) with low-latency inference.',
    ],
    preferredQualifications: [
      'Ph.D. or Master’s in Computer Science, Machine Learning, or related quantitative field.',
      'Published research in MLSys, NeurIPS, ICML, or relevant academic venues.',
    ],
    benefits: [
      'Top-tier compensation package with meaningful founding-tier equity.',
      'Premium health, wellness, and commuter benefits.',
      'Latest compute hardware (M3 Max / Dual RTX workstations).',
    ],
    hiringLead: {
      name: 'Sophia Lin, PhD',
      role: 'Director of AI Systems',
      avatarInitials: 'SL',
      avatarBg: '#8b5cf6',
      email: 's.lin@skillhub.enterprise.com',
    },
    pipelineStats: [
      { stage: 'Applied', count: 28, color: '#3b82f6' },
      { stage: 'AI Screened', count: 18, color: '#10b981' },
      { stage: 'Tech Interview', count: 6, color: '#f59e0b' },
      { stage: 'Executive Review', count: 2, color: '#8b5cf6' },
      { stage: 'Offer Extended', count: 1, color: '#00b074' },
    ],
  },
  'vac-3': {
    id: 'vac-3',
    title: 'Lead Product Designer (Enterprise Design Systems)',
    department: 'Product Design',
    location: 'London, UK (Remote)',
    type: 'Full-time',
    status: 'Active',
    experienceLevel: 'Lead (6+ Years)',
    salaryRange: '£95,000 - £125,000 GBP / yr',
    postedDate: '2026-09-03',
    applicantsCount: 35,
    aiMatchScore: 88,
    overview:
      'Lead our global design system and craft intuitive, state-of-the-art enterprise ATS workflows that delight recruitment teams and executive hiring managers worldwide.',
    responsibilities: [
      'Govern and evolve our Figma enterprise token system and multi-brand component library.',
      'Conduct user research sessions with enterprise recruiters to identify UX friction and workflow enhancements.',
      'Create high-fidelity interactive prototypes, interaction specifications, and micro-animations.',
    ],
    requirements: [
      '6+ years of UX/UI design experience for SaaS or B2B enterprise software applications.',
      'Expertise in Figma, variables, auto-layout, and token-based design systems.',
      'Strong portfolio demonstrating complex workflow simplification and data visualization mastery.',
    ],
    preferredQualifications: [
      'Ability to write clean HTML/CSS/Tailwind code to prototype and inspect web UI.',
    ],
    benefits: [
      'Generous pension matching, private medical insurance, and 28 days paid leave.',
      'Full home office equipment budget and flexible asynchronous work hours.',
    ],
    hiringLead: {
      name: 'Oliver Thorne',
      role: 'Head of Product Experience',
      avatarInitials: 'OT',
      avatarBg: '#f59e0b',
      email: 'o.thorne@skillhub.enterprise.com',
    },
    pipelineStats: [
      { stage: 'Applied', count: 35, color: '#3b82f6' },
      { stage: 'AI Screened', count: 20, color: '#10b981' },
      { stage: 'Portfolio Review', count: 8, color: '#f59e0b' },
      { stage: 'Design Challenge', count: 3, color: '#8b5cf6' },
      { stage: 'Offer Extended', count: 0, color: '#00b074' },
    ],
  },
  'vac-4': {
    id: 'vac-4',
    title: 'Principal Cloud Security & DevOps Engineer',
    department: 'Infrastructure',
    location: 'Remote (Global)',
    type: 'Contract',
    status: 'Active',
    experienceLevel: 'Principal (8+ Years)',
    salaryRange: '$110 - $145 USD / hr',
    postedDate: '2026-08-30',
    applicantsCount: 19,
    aiMatchScore: 94,
    overview:
      'Oversee our multi-cloud AWS & Azure infrastructure, SOC-2 compliance automation, and implement zero-trust Kubernetes cluster network policies.',
    responsibilities: [
      'Maintain Terraform infrastructure-as-code across 4 global AWS/GCP regions.',
      'Execute continuous vulnerability scans, container hardening, and penetration test remediations.',
      'Automate deployment pipelines using GitHub Actions, ArgoCD, and Helm charts.',
    ],
    requirements: [
      '8+ years in DevOps and cloud infrastructure engineering.',
      'Demonstrated experience obtaining or maintaining SOC-2 Type II and ISO 27001 certifications.',
      'Expertise with Kubernetes, Istio service mesh, AWS IAM, and HashiCorp Vault.',
    ],
    preferredQualifications: [
      'AWS Certified DevOps Engineer - Professional or CKS (Certified Kubernetes Security Specialist).',
    ],
    benefits: [
      'Long-term rolling contract with competitive hourly rate and performance bonuses.',
    ],
    hiringLead: {
      name: 'Alexander Ross',
      role: 'Director of Cloud Operations',
      avatarInitials: 'AR',
      avatarBg: '#10b981',
      email: 'a.ross@skillhub.enterprise.com',
    },
    pipelineStats: [
      { stage: 'Applied', count: 19, color: '#3b82f6' },
      { stage: 'AI Screened', count: 12, color: '#10b981' },
      { stage: 'Security Exam', count: 4, color: '#f59e0b' },
      { stage: 'Offer Extended', count: 1, color: '#00b074' },
    ],
  },
  'vac-5': {
    id: 'vac-5',
    title: 'Senior Technical Product Manager - ATS Platforms',
    department: 'Product',
    location: 'New York, NY (Hybrid)',
    type: 'Full-time',
    status: 'Draft',
    experienceLevel: 'Senior (5+ Years)',
    salaryRange: '$160,000 - $200,000 USD / yr',
    postedDate: '2026-09-09',
    applicantsCount: 0,
    aiMatchScore: 0,
    overview:
      'Define the product strategy, developer APIs, and candidate discovery algorithms for the Skill Hub talent ecosystem.',
    responsibilities: [
      'Translate customer recruitment friction points into concise PRDs and engineering specifications.',
      'Drive roadmap prioritization using qualitative feedback and quantitative product analytics.',
    ],
    requirements: [
      '5+ years as a Product Manager in B2B SaaS or HR tech software.',
      'Technical background with ability to query data using SQL and analyze API architectures.',
    ],
    preferredQualifications: [
      'Prior experience scaling ATS, CRM, or workforce management tools.',
    ],
    benefits: [
      'Competitive base salary, 401(k) matching, and comprehensive healthcare.',
    ],
    hiringLead: {
      name: 'Marcus Vance',
      role: 'VP of Engineering',
      avatarInitials: 'MV',
      avatarBg: '#0284c7',
      email: 'm.vance@skillhub.enterprise.com',
    },
    pipelineStats: [],
  },
  'vac-6': {
    id: 'vac-6',
    title: 'Junior QA Automation Engineer',
    department: 'Engineering',
    location: 'Austin, TX',
    type: 'Full-time',
    status: 'Closed',
    experienceLevel: 'Junior (1-2 Years)',
    salaryRange: '$75,000 - $95,000 USD / yr',
    postedDate: '2026-08-15',
    applicantsCount: 64,
    aiMatchScore: 85,
    overview:
      'This vacancy has been successfully filled. The role involves developing Playwright and Cypress end-to-end automated regression test suites for web applications.',
    responsibilities: [
      'Write reliable automated UI and API tests using TypeScript and Playwright.',
      'Integrate test execution suites into CI/CD build workflows.',
    ],
    requirements: [
      '1-2 years experience in software testing or QA automation.',
      'Basic knowledge of TypeScript/JavaScript and Git.',
    ],
    preferredQualifications: [
      'Familiarity with CI/CD tools such as GitHub Actions.',
    ],
    benefits: [
      'Health insurance, 401(k), paid parental leave, and mentorship programs.',
    ],
    hiringLead: {
      name: 'Oliver Thorne',
      role: 'Head of Product Experience',
      avatarInitials: 'OT',
      avatarBg: '#f59e0b',
      email: 'o.thorne@skillhub.enterprise.com',
    },
    pipelineStats: [
      { stage: 'Completed', count: 64, color: '#64748b' },
    ],
  },
};

export const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find job from mock DB or fallback dynamically
  const initialJob = useMemo(() => {
    if (id && mockJobsDatabase[id]) {
      return mockJobsDatabase[id];
    }
    // Dynamic fallback for any other ID
    return {
      id: id || 'vac-default',
      title: 'Senior Enterprise Solutions Architect',
      department: 'Engineering',
      location: 'Remote (Worldwide)',
      type: 'Full-time' as const,
      status: 'Active' as const,
      experienceLevel: 'Senior (5+ Years)',
      salaryRange: '$145,000 - $190,000 USD / yr',
      postedDate: new Date().toISOString().split('T')[0],
      applicantsCount: 14,
      aiMatchScore: 94,
      overview:
        'Lead enterprise-grade architectural design, client technical integrations, and scalable cloud solutions for our global hiring intelligence platform.',
      responsibilities: [
        'Design high-availability cloud architecture on AWS/Azure.',
        'Collaborate with cross-functional engineering teams to implement microservices.',
        'Provide technical thought leadership and conduct architectural reviews.',
      ],
      requirements: [
        '5+ years in cloud architecture or full-stack software development.',
        'Strong hands-on experience with modern JavaScript/TypeScript and cloud technologies.',
      ],
      preferredQualifications: [
        'Cloud Solution Architect certifications (AWS / GCP / Azure).',
      ],
      benefits: [
        'Competitive salary, equity options, comprehensive healthcare, and flexible remote hours.',
      ],
      hiringLead: {
        name: 'Marcus Vance',
        role: 'VP of Engineering',
        avatarInitials: 'MV',
        avatarBg: '#0284c7',
        email: 'm.vance@skillhub.enterprise.com',
      },
      pipelineStats: [
        { stage: 'Applied', count: 14, color: '#3b82f6' },
        { stage: 'AI Screened', count: 8, color: '#10b981' },
        { stage: 'Interview', count: 3, color: '#f59e0b' },
      ],
    };
  }, [id]);

  const [job, setJob] = useState<JobDetailModel>(initialJob);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: job.title,
    department: job.department,
    location: job.location,
    type: job.type,
    status: job.status,
    salaryRange: job.salaryRange,
    experienceLevel: job.experienceLevel,
    overview: job.overview,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenEdit = () => {
    setEditForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      status: job.status,
      salaryRange: job.salaryRange,
      experienceLevel: job.experienceLevel,
      overview: job.overview,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setJob((prev) => ({
      ...prev,
      title: editForm.title,
      department: editForm.department,
      location: editForm.location,
      type: editForm.type,
      status: editForm.status,
      salaryRange: editForm.salaryRange,
      experienceLevel: editForm.experienceLevel,
      overview: editForm.overview,
    }));
    setIsEditModalOpen(false);
    showToast(`Job vacancy "${editForm.title}" updated successfully.`);
  };

  // Direct Physical Deletion Handler
  const handleConfirmDirectDelete = () => {
    setIsDeleteModalOpen(false);
    // In our direct delete architecture, remove and navigate back to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="job-details-page-wrapper">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="job-details-toast">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="job-details-inner-container">
        {/* =========================================================
            1. NAVIGATION BAR (← Back to Jobs)
            ========================================================= */}
        <div className="job-details-nav-bar">
          <button
            type="button"
            className="job-back-link-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeftIcon />
            <span>Back to Jobs</span>
          </button>

          <div className="job-breadcrumb-tags">
            <span className="breadcrumb-muted">Dashboard</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-muted">Vacancies</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">{job.title}</span>
          </div>
        </div>

        {/* =========================================================
            2. HEADER SECTION (Title, Dept, Status Pill, Edit & Delete)
            ========================================================= */}
        <div className="job-header-card">
          <div className="job-header-main-box">
            <div className="job-header-meta-row">
              <span className="job-requisition-id">REQ #{job.id.toUpperCase()}</span>
              
              {/* Status Pill */}
              {job.status === 'Active' && (
                <span className="badge-pill badge-active">
                  <span className="badge-dot-green"></span>
                  Active
                </span>
              )}
              {job.status === 'Draft' && (
                <span className="badge-pill badge-draft">
                  <span className="badge-dot-amber"></span>
                  Draft
                </span>
              )}
              {job.status === 'Closed' && (
                <span className="badge-pill badge-closed">
                  <span className="badge-dot-gray"></span>
                  Closed
                </span>
              )}

              {/* AI High Match Indicator */}
              {job.aiMatchScore > 0 && (
                <span className="job-ai-pill">
                  <SparkleIcon />
                  <span>{job.aiMatchScore}% AI Match Quality</span>
                </span>
              )}
            </div>

            <h1 className="job-details-title">{job.title}</h1>

            <div className="job-header-subinfo-list">
              <div className="job-subinfo-item">
                <BuildingIcon />
                <span>{job.department}</span>
              </div>
              <span className="subinfo-divider">•</span>
              <div className="job-subinfo-item">
                <MapPinIcon />
                <span>{job.location}</span>
              </div>
              <span className="subinfo-divider">•</span>
              <div className="job-subinfo-item">
                <CalendarIcon />
                <span>
                  Posted{' '}
                  {new Date(job.postedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit & Direct Delete */}
          <div className="job-header-actions-group">
            <button
              type="button"
              className="btn-secondary job-action-btn"
              onClick={handleOpenEdit}
            >
              <EditIcon />
              <span>Edit Job</span>
            </button>
            <button
              type="button"
              className="btn-danger-outline job-action-btn"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <TrashIcon />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            3. MAIN CONTENT GRID (Cards 1, 2, 3)
            ========================================================= */}
        <div className="job-details-layout-grid">
          {/* LEFT / MAIN COLUMN: Card 1 (Overview) & Card 2 (Description) */}
          <div className="job-details-main-col">
            {/* ----------------------------------------------------
                CARD 1: OVERVIEW (Job Meta-data)
                ---------------------------------------------------- */}
            <div className="job-card job-overview-card">
              <h2 className="job-card-heading">
                <span>Job Overview</span>
              </h2>

              <div className="job-overview-metrics-grid">
                {/* Location */}
                <div className="overview-metric-item">
                  <div className="overview-icon-box loc-icon">
                    <MapPinIcon />
                  </div>
                  <div className="overview-metric-text">
                    <span className="overview-label">Location</span>
                    <span className="overview-val">{job.location}</span>
                  </div>
                </div>

                {/* Employment Type */}
                <div className="overview-metric-item">
                  <div className="overview-icon-box type-icon">
                    <BriefcaseIcon />
                  </div>
                  <div className="overview-metric-text">
                    <span className="overview-label">Employment Type</span>
                    <span className="overview-val">{job.type}</span>
                  </div>
                </div>

                {/* Experience Level */}
                <div className="overview-metric-item">
                  <div className="overview-icon-box exp-icon">
                    <GraduationCapIcon />
                  </div>
                  <div className="overview-metric-text">
                    <span className="overview-label">Experience Level</span>
                    <span className="overview-val">{job.experienceLevel}</span>
                  </div>
                </div>

                {/* Salary Range */}
                <div className="overview-metric-item">
                  <div className="overview-icon-box sal-icon">
                    <DollarSignIcon />
                  </div>
                  <div className="overview-metric-text">
                    <span className="overview-label">Salary Range</span>
                    <span className="overview-val">{job.salaryRange}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                CARD 2: DESCRIPTION & REQUIREMENTS
                ---------------------------------------------------- */}
            <div className="job-card job-description-card">
              <h2 className="job-card-heading">
                <span>Role Description & Responsibilities</span>
              </h2>

              {/* Overview / Introduction */}
              <div className="job-desc-section">
                <p className="job-desc-paragraph">{job.overview}</p>
              </div>

              {/* Key Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="job-desc-section">
                  <h3 className="job-desc-subtitle">Key Responsibilities</h3>
                  <ul className="job-bullet-list">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx} className="job-bullet-item">
                        <div className="bullet-check-icon">
                          <CheckIcon />
                        </div>
                        <span className="bullet-item-text">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Qualifications */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="job-desc-section">
                  <h3 className="job-desc-subtitle">Required Qualifications</h3>
                  <ul className="job-bullet-list">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="job-bullet-item">
                        <div className="bullet-check-icon">
                          <CheckIcon />
                        </div>
                        <span className="bullet-item-text">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preferred Qualifications */}
              {job.preferredQualifications && job.preferredQualifications.length > 0 && (
                <div className="job-desc-section">
                  <h3 className="job-desc-subtitle">Preferred Qualifications & Bonus Skills</h3>
                  <ul className="job-bullet-list">
                    {job.preferredQualifications.map((pref, idx) => (
                      <li key={idx} className="job-bullet-item">
                        <div className="bullet-check-icon bonus-check">
                          <CheckIcon />
                        </div>
                        <span className="bullet-item-text">{pref}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits & Perks */}
              {job.benefits && job.benefits.length > 0 && (
                <div className="job-desc-section perks-section">
                  <h3 className="job-desc-subtitle">What We Offer</h3>
                  <div className="job-perks-grid">
                    {job.benefits.map((benefit, idx) => (
                      <div key={idx} className="perk-card-item">
                        <div className="perk-icon-wrap">
                          <SparkleIcon />
                        </div>
                        <span className="perk-card-text">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT / SIDEBAR COLUMN: Card 3 (Applicants Summary) & Quick Links */}
          <div className="job-details-side-col">
            {/* ----------------------------------------------------
                CARD 3: APPLICANTS SUMMARY & CANDIDATE PIPELINE CTA
                ---------------------------------------------------- */}
            <div className="job-card job-pipeline-card">
              <div className="pipeline-card-top">
                <div className="pipeline-badge-row">
                  <span className="pipeline-card-tag">CANDIDATE INTELLIGENCE</span>
                  <span className="pipeline-live-indicator">
                    <span className="live-pulse"></span>
                    Live Pipeline
                  </span>
                </div>

                <div className="pipeline-counter-box">
                  <div className="counter-icon-circle">
                    <UsersIcon />
                  </div>
                  <div className="counter-data">
                    <span className="counter-number">{job.applicantsCount}</span>
                    <span className="counter-title">Total Active Applicants</span>
                  </div>
                </div>
              </div>

              {/* Pipeline Stage Breakdown */}
              {job.pipelineStats && job.pipelineStats.length > 0 ? (
                <div className="pipeline-stages-list">
                  <div className="pipeline-stages-header">
                    <span className="stages-title">Pipeline Breakdown</span>
                    <span className="stages-sub">{job.applicantsCount} Total</span>
                  </div>
                  {job.pipelineStats.map((stg, i) => (
                    <div key={i} className="stage-progress-row">
                      <div className="stage-name-count">
                        <span className="stage-name">{stg.stage}</span>
                        <span className="stage-count">{stg.count}</span>
                      </div>
                      <div className="stage-progress-track">
                        <div
                          className="stage-progress-fill"
                          style={{
                            width: `${
                              job.applicantsCount > 0
                                ? Math.min(100, Math.round((stg.count / job.applicantsCount) * 100))
                                : 0
                            }%`,
                            backgroundColor: stg.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pipeline-empty-note">
                  <ClockIcon />
                  <span>No applicants received yet for this draft vacancy.</span>
                </div>
              )}

              {/* Primary Action Button: View Candidates Pipeline */}
              <div className="pipeline-action-box">
                <Link
                  to="/dashboard"
                  className="btn-primary pipeline-cta-btn"
                  title="Open candidate pipeline Kanban board"
                >
                  <KanbanIcon />
                  <span>View Candidates Pipeline</span>
                  <ArrowRightIcon />
                </Link>
                <p className="pipeline-cta-helper">
                  Review applicant resumes, AI scores, and move candidates across Kanban stages.
                </p>
              </div>
            </div>

            {/* Hiring Lead Info Card */}
            {job.hiringLead && (
              <div className="job-card job-hiring-lead-card">
                <h3 className="side-card-title">Assigned Hiring Lead</h3>
                <div className="hiring-lead-box">
                  <div
                    className="hiring-lead-avatar"
                    style={{ backgroundColor: job.hiringLead.avatarBg }}
                  >
                    {job.hiringLead.avatarInitials}
                  </div>
                  <div className="hiring-lead-info">
                    <span className="lead-name">{job.hiringLead.name}</span>
                    <span className="lead-role">{job.hiringLead.role}</span>
                    <span className="lead-email">{job.hiringLead.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Requisition Meta Card */}
            <div className="job-card job-quick-meta-card">
              <h3 className="side-card-title">Compliance & Auditing</h3>
              <div className="compliance-list">
                <div className="compliance-row">
                  <span className="comp-label">Requisition Status</span>
                  <span className="comp-val">{job.status}</span>
                </div>
                <div className="compliance-row">
                  <span className="comp-label">EEO Compliant</span>
                  <span className="comp-val text-emerald-600 font-medium">Verified ✓</span>
                </div>
                <div className="compliance-row">
                  <span className="comp-label">AI Bias Guard</span>
                  <span className="comp-val text-emerald-600 font-medium">Active ✓</span>
                </div>
                <div className="compliance-row">
                  <span className="comp-label">Candidate Notifications</span>
                  <span className="comp-val">Automated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. EDIT VACANCY MODAL
          ========================================================= */}
      {isEditModalOpen && (
        <div className="modal-backdrop-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="vacancies-form-modal job-edit-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="form-modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge">
                  <EditIcon />
                </div>
                <div>
                  <h3 className="form-modal-title">Edit Job Vacancy</h3>
                  <p className="form-modal-desc">
                    Update position details, requirements, and hiring status.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="vacancies-modal-form">
              {/* Job Title */}
              <div className="form-group-box">
                <label className="form-field-label">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <div className="form-input-wrapper">
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="form-text-input"
                  />
                </div>
              </div>

              {/* Department & Location Grid */}
              <div className="form-two-col-grid">
                <div className="form-group-box">
                  <label className="form-field-label">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="form-select-input"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="AI Research">AI Research</option>
                    <option value="Product Design">Product Design</option>
                    <option value="Product">Product</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales & GTM">Sales & GTM</option>
                  </select>
                </div>

                <div className="form-group-box">
                  <label className="form-field-label">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="form-text-input"
                  />
                </div>
              </div>

              {/* Type & Status Grid */}
              <div className="form-two-col-grid">
                <div className="form-group-box">
                  <label className="form-field-label">Employment Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        type: e.target.value as 'Full-time' | 'Contract' | 'Part-time' | 'Remote',
                      })
                    }
                    className="form-select-input"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div className="form-group-box">
                  <label className="form-field-label">Vacancy Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as 'Active' | 'Draft' | 'Closed',
                      })
                    }
                    className="form-select-input"
                  >
                    <option value="Active">Active (Accepting Applicants)</option>
                    <option value="Draft">Draft (Internal Only)</option>
                    <option value="Closed">Closed (Position Filled)</option>
                  </select>
                </div>
              </div>

              {/* Salary & Experience */}
              <div className="form-two-col-grid">
                <div className="form-group-box">
                  <label className="form-field-label">Salary Range</label>
                  <input
                    type="text"
                    value={editForm.salaryRange}
                    onChange={(e) => setEditForm({ ...editForm, salaryRange: e.target.value })}
                    className="form-text-input"
                  />
                </div>

                <div className="form-group-box">
                  <label className="form-field-label">Experience Level</label>
                  <input
                    type="text"
                    value={editForm.experienceLevel}
                    onChange={(e) => setEditForm({ ...editForm, experienceLevel: e.target.value })}
                    className="form-text-input"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group-box">
                <label className="form-field-label">Job Overview & Description</label>
                <textarea
                  rows={4}
                  value={editForm.overview}
                  onChange={(e) => setEditForm({ ...editForm, overview: e.target.value })}
                  className="form-textarea-input"
                ></textarea>
              </div>

              {/* Modal Actions */}
              <div className="form-modal-actions">
                <button
                  type="button"
                  className="btn-secondary modal-cancel-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary modal-submit-btn">
                  <CheckIcon />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          5. DIRECT PHYSICAL DELETION CONFIRMATION MODAL
          ========================================================= */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div
            className="vacancies-delete-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon-badge">
              <TrashIcon />
            </div>

            <div className="delete-modal-body">
              <h3 className="delete-modal-title">Delete Job Vacancy</h3>
              <p className="delete-modal-desc">
                Are you sure you want to permanently delete{' '}
                <strong className="text-gray-900 font-semibold">"{job.title}"</strong>?
              </p>
              <div className="delete-warning-box">
                <ShieldCheckIcon />
                <span>
                  <strong>Strict Direct Deletion:</strong> This vacancy will be permanently
                  erased from the database without disabling or soft-blocking.
                </span>
              </div>
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-secondary modal-cancel-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-solid modal-delete-btn"
                onClick={handleConfirmDirectDelete}
              >
                <TrashIcon />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
