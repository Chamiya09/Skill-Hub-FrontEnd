import React, { useState } from 'react';
import type { JobDto } from '../../services/api';
import {
  SparkleIcon,
  XIcon,
  SearchIcon,
  MapPinIcon,
  ClockIcon,
  DollarSignIcon,
  MailIcon,
  GraduationCapIcon,
  CheckIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  UserCheckIcon,
  BriefcaseIcon,
} from '../common/Icons';

export interface ShortlistedCandidate {
  id: string;
  name: string;
  headline: string;
  currentCompany: string;
  location: string;
  email: string;
  phone: string;
  aiScore: number;
  status: 'Shortlisted';
  interviewStatus?: 'Not Scheduled' | 'Interview Scheduled' | 'Completed';
  assessmentStatus?: 'Pending' | 'Sent' | 'Passed';
  skills: string[];
  avatarBg: string;
  experienceYears: number;
  bio: string;
  keyHighlights: string[];
  experienceHistory: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: string;
}

// Candidates with status strictly 'Shortlisted'
export const DEFAULT_SHORTLISTED_CANDIDATES: ShortlistedCandidate[] = [
  {
    id: 'cand-1',
    name: 'Alex Morgan',
    headline: 'Senior Full Stack Engineer (React, .NET Core, AWS)',
    currentCompany: 'Apex Cloud Solutions',
    location: 'San Francisco, CA (Remote)',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    aiScore: 98,
    status: 'Shortlisted',
    interviewStatus: 'Not Scheduled',
    assessmentStatus: 'Pending',
    skills: ['React', 'TypeScript', '.NET Core', 'PostgreSQL', 'AWS'],
    avatarBg: '#059669',
    experienceYears: 6,
    bio: 'Accomplished Full Stack Engineer with 6+ years specializing in enterprise distributed architectures, high-concurrency .NET APIs, and responsive React/TypeScript user interfaces.',
    keyHighlights: [
      'Exceeds technical bar for .NET Core backend & microservices',
      'Extensive React 18 & TypeScript frontend production experience',
      'Strong AWS cloud infrastructure and CI/CD automation background',
    ],
    experienceHistory: [
      {
        title: 'Senior Software Engineer',
        company: 'Apex Cloud Solutions',
        duration: '2022 – Present',
        description: 'Led a distributed team architecting microservices with .NET 8 and React 19, reducing API latencies by 42%.',
      },
      {
        title: 'Full Stack Engineer',
        company: 'Vanguard Labs',
        duration: '2019 – 2022',
        description: 'Developed high-throughput customer portals using TypeScript, PostgreSQL, and AWS ECS.',
      },
    ],
    education: 'B.S. in Computer Science — UC Berkeley',
  },
  {
    id: 'cand-2',
    name: 'Sophia Zhang',
    headline: 'Lead Cloud & Backend Architect',
    currentCompany: 'OmniCloud Technologies',
    location: 'Seattle, WA (Hybrid)',
    email: 'sophia.zhang@example.com',
    phone: '+1 (555) 345-6789',
    aiScore: 95,
    status: 'Shortlisted',
    interviewStatus: 'Not Scheduled',
    assessmentStatus: 'Pending',
    skills: ['C#', '.NET 8', 'PostgreSQL', 'Kubernetes', 'Azure'],
    avatarBg: '#2563eb',
    experienceYears: 8,
    bio: 'Lead Architect with 8+ years specializing in multi-tenant SaaS backends, database sharding, event-driven distributed message streaming, and container orchestrations.',
    keyHighlights: [
      'Architected tier-1 financial trading pipelines on .NET Core',
      'Deep PostgreSQL database optimization and high-scale indexing',
      'Proven team mentorship and technical roadmap execution',
    ],
    experienceHistory: [
      {
        title: 'Lead Backend Architect',
        company: 'OmniCloud Technologies',
        duration: '2021 – Present',
        description: 'Designed enterprise message bus processing 25M daily transactions with 99.999% availability.',
      },
      {
        title: 'Senior .NET Developer',
        company: 'HyperScale Systems',
        duration: '2017 – 2021',
        description: 'Built high-throughput gRPC APIs and resilient Redis caching layers.',
      },
    ],
    education: 'M.S. in Software Engineering — University of Washington',
  },
  {
    id: 'cand-3',
    name: 'Marcus Vance',
    headline: 'Senior Frontend Engineer & UI Designer',
    currentCompany: 'AeroWeb Studios',
    location: 'Austin, TX (Remote)',
    email: 'marcus.vance@example.com',
    phone: '+1 (555) 456-7890',
    aiScore: 89,
    status: 'Shortlisted',
    interviewStatus: 'Not Scheduled',
    assessmentStatus: 'Pending',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'GraphQL'],
    avatarBg: '#0f766e',
    experienceYears: 5,
    bio: 'Senior Frontend specialist with a deep eye for design systems, accessible corporate interfaces, and lightning-fast web performance.',
    keyHighlights: [
      'Authored design system component library adopted by 40+ internal engineers',
      'Advanced TypeScript, State Management (Zustand/Redux), and WebSockets',
      'Exceptional UI/UX intuition with strong product sensibility',
    ],
    experienceHistory: [
      {
        title: 'Senior Frontend Developer',
        company: 'AeroWeb Studios',
        duration: '2022 – Present',
        description: 'Standardized company frontend stack onto Vite/React with zero layout shifts and sub-second loads.',
      },
      {
        title: 'UI Engineer',
        company: 'Nexus Creative',
        duration: '2020 – 2022',
        description: 'Built interactive visual data dashboards and analytics visualizations.',
      },
    ],
    education: 'B.A. in Digital Arts & Computer Science — UT Austin',
  },
  {
    id: 'cand-4',
    name: 'Elena Rostova',
    headline: 'DevOps & Distributed Systems Specialist',
    currentCompany: 'Matrix Infra Group',
    location: 'Boston, MA (Onsite)',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 567-8901',
    aiScore: 86,
    status: 'Shortlisted',
    interviewStatus: 'Not Scheduled',
    assessmentStatus: 'Pending',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
    avatarBg: '#0284c7',
    experienceYears: 7,
    bio: 'Infrastructure and platform engineer focusing on automated GitOps pipelines, infrastructure as code, security hardening, and resilient Kubernetes deployments.',
    keyHighlights: [
      'Certified Kubernetes Administrator (CKA) with 7 years cloud experience',
      'Streamlined CI/CD pipeline reducing build and deploy times from 45m to 4m',
      'Strong automated observability and Datadog/Prometheus monitoring setups',
    ],
    experienceHistory: [
      {
        title: 'Staff Platform Engineer',
        company: 'Matrix Infra Group',
        duration: '2021 – Present',
        description: 'Maintained 12 multi-region EKS clusters serving 80+ backend microservices.',
      },
      {
        title: 'DevOps Engineer',
        company: 'Boston Cloud Solutions',
        duration: '2018 – 2021',
        description: 'Automated infrastructure deployments with Terraform and GitHub Actions.',
      },
    ],
    education: 'B.S. in Computer Systems — Boston University',
  },
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
  const [candidates] = useState<ShortlistedCandidate[]>(DEFAULT_SHORTLISTED_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<ShortlistedCandidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const triggerPlaceholderAction = (actionName: string, candidateName: string) => {
    setNotification(`[Developer Hook] "${actionName}" triggered for ${candidateName}. Feature integration ready.`);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const filteredCandidates = candidates.filter((c) => {
    // Strictly ONLY candidates with status 'Shortlisted'
    if (c.status !== 'Shortlisted') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.headline.toLowerCase().includes(q) ||
      c.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="popup-backdrop" onClick={onClose}>
      {/* Developer Hook Toast Notification */}
      {notification && (
        <div className="job-details-toast" style={{ zIndex: 999999 }}>
          <CheckIcon />
          <span>{notification}</span>
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
                REQ #{job.id.substring(0, 8).toUpperCase()}
              </span>
              <span className="popup-tag-dept">
                {job.department}
              </span>
              <span className="popup-tag-status active" style={{ background: '#e6f9f2', borderColor: '#b7eedc', color: '#009e67' }}>
                <UserCheckIcon />
                <span>{candidates.length} Shortlisted Candidates</span>
              </span>
            </div>

            <h2 className="popup-title">
              {job.title} — Hiring Pipeline
            </h2>

            <div className="popup-header-meta">
              <span className="popup-meta-item highlight">
                <SparkleIcon />
                <span>AI Screening Verified (85%+ Match)</span>
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

          <button
            type="button"
            onClick={onClose}
            className="popup-close-btn"
            aria-label="Close modal"
          >
            <XIcon />
          </button>
        </div>

        {/* =========================================================
            2. SCROLLABLE BODY
            ========================================================= */}
        <div className="popup-body">
          {/* Integration Intro Banner */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#e6f9f2',
                  color: '#009e67',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BriefcaseIcon />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                  Interview & Assessment Stage
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  These applicants met or exceeded the 85% AI screening benchmark and are ready for interview scheduling and technical assessments.
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="popup-search-bar">
            <span className="popup-search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search shortlisted candidates by name, tech stack, or headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="popup-search-input"
            />
          </div>

          {/* SHORTLISTED CANDIDATES LIST */}
          <div className="popup-section-card shortlist-highlight">
            <div className="popup-section-header">
              <h3 className="popup-section-title" style={{ color: '#064e3b' }}>
                <SparkleIcon />
                <span>Shortlisted Candidates ({filteredCandidates.length})</span>
              </h3>
              <span className="popup-section-subtitle">
                Click candidate card to open full Digital CV Drawer
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredCandidates.map((candidate) => {
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
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      padding: '14px 16px',
                    }}
                  >
                    {/* Left Identity & Skills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      <div className="candidate-avatar" style={{ background: candidate.avatarBg }}>
                        {initials}
                      </div>
                      <div className="candidate-main-info">
                        <div className="candidate-name-row">
                          <span className="candidate-name">{candidate.name}</span>
                          <span className="candidate-company">• {candidate.currentCompany}</span>
                          <span className="popup-status-score high" style={{ padding: '2px 8px', fontSize: '11px' }}>
                            <SparkleIcon />
                            <span>{candidate.aiScore}% Match</span>
                          </span>
                        </div>
                        <p className="candidate-headline">{candidate.headline}</p>
                        <div className="candidate-skills-wrap">
                          {candidate.skills.map((s, idx) => (
                            <span key={idx} className="candidate-skill-pill">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Developer Integration Action Placeholders & View CV */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Developer Hook Button 1: Schedule Interview */}
                      <button
                        type="button"
                        onClick={() => triggerPlaceholderAction('Schedule Interview', candidate.name)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#00b074';
                          e.currentTarget.style.color = '#009e67';
                          e.currentTarget.style.background = '#e6f9f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#334155';
                          e.currentTarget.style.background = '#ffffff';
                        }}
                        title="Integration Hook: Schedule Interview Round"
                      >
                        <CalendarIcon />
                        <span>Schedule Interview</span>
                      </button>

                      {/* Developer Hook Button 2: Assign Assessment */}
                      <button
                        type="button"
                        onClick={() => triggerPlaceholderAction('Send Assessment', candidate.name)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#00b074';
                          e.currentTarget.style.color = '#009e67';
                          e.currentTarget.style.background = '#e6f9f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#334155';
                          e.currentTarget.style.background = '#ffffff';
                        }}
                        title="Integration Hook: Assign Technical Assessment"
                      >
                        <ClipboardCheckIcon />
                        <span>Assessments</span>
                      </button>

                      {/* View CV Trigger */}
                      <button
                        type="button"
                        onClick={() => setSelectedCandidate(candidate)}
                        className="popup-view-cv-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', fontFamily: 'inherit' }}
                      >
                        <span>View CV →</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
            <span>Shortlist verified with SkillHub AI Core</span>
          </div>
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
            <div className="cv-drawer-header">
              <div className="cv-drawer-user-section">
                <div
                  className="cv-drawer-avatar"
                  style={{ background: selectedCandidate.avatarBg }}
                >
                  {selectedCandidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)}
                </div>
                <div className="cv-drawer-user-info">
                  <h3 className="cv-drawer-name">{selectedCandidate.name}</h3>
                  <p className="cv-drawer-headline">{selectedCandidate.headline}</p>
                  <div className="cv-drawer-contact-row">
                    <span className="cv-drawer-contact-item">
                      <MapPinIcon /> {selectedCandidate.location}
                    </span>
                    <span className="cv-drawer-contact-divider">•</span>
                    <span className="cv-drawer-contact-item">
                      <MailIcon /> {selectedCandidate.email}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="popup-close-btn"
                aria-label="Close CV profile"
              >
                <XIcon />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="cv-drawer-body">
              {/* AI Score / Status Box */}
              <div className="cv-drawer-card ai-aligned">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="cv-drawer-ai-title">
                    <SparkleIcon />
                    <span>AI Shortlist Verification</span>
                  </div>
                  <span className="popup-status-score high">
                    {selectedCandidate.aiScore}% Match
                  </span>
                </div>
                <p className="cv-drawer-bio">{selectedCandidate.bio}</p>

                <div style={{ borderTop: '1px solid #b7eedc', paddingTop: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#064e3b', display: 'block', marginBottom: '4px' }}>
                    Key Qualification Strengths:
                  </span>
                  <ul className="cv-drawer-highlights-list">
                    {selectedCandidate.keyHighlights.map((h, idx) => (
                      <li key={idx} className="cv-drawer-highlights-item">
                        <CheckIcon />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Developer Placeholder for Next Stage Actions */}
              <div className="cv-drawer-card" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
                <h4 className="cv-drawer-card-title">
                  <BriefcaseIcon />
                  <span>Pipeline Actions</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => triggerPlaceholderAction('Schedule Interview', selectedCandidate.name)}
                    className="popup-footer-btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 12px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CalendarIcon />
                    <span>Schedule Interview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerPlaceholderAction('Assign Assessment', selectedCandidate.name)}
                    className="popup-footer-btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 12px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ClipboardCheckIcon />
                    <span>Send Assessment</span>
                  </button>
                </div>
              </div>

              {/* Core Competencies */}
              <div className="cv-drawer-card">
                <h4 className="cv-drawer-card-title">
                  <SparkleIcon />
                  <span>Core Competencies</span>
                </h4>
                <div className="cv-drawer-skills-wrap">
                  {selectedCandidate.skills.map((s, idx) => (
                    <span key={idx} className="cv-drawer-skill-chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience Timeline */}
              <div className="cv-drawer-card">
                <h4 className="cv-drawer-card-title">
                  <ClockIcon />
                  <span>Career Experience ({selectedCandidate.experienceYears} Years)</span>
                </h4>
                <div className="cv-drawer-timeline">
                  {selectedCandidate.experienceHistory.map((exp, idx) => (
                    <div key={idx} className="cv-drawer-timeline-item">
                      <div className="cv-drawer-timeline-title">{exp.title}</div>
                      <div className="cv-drawer-timeline-company">{exp.company} • {exp.duration}</div>
                      <p className="cv-drawer-timeline-desc">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="cv-drawer-card">
                <h4 className="cv-drawer-card-title">
                  <GraduationCapIcon />
                  <span>Education & Credentials</span>
                </h4>
                <div className="cv-drawer-edu-item">
                  <div className="cv-drawer-edu-icon">
                    <GraduationCapIcon />
                  </div>
                  <span>{selectedCandidate.education}</span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="cv-drawer-footer">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="popup-footer-btn-secondary"
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
