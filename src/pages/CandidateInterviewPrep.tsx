import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';  
import {
  interviewPrepApi,
  jobApplicationsApi,
  type CandidateApplicationItemDto,
} from '../services/api';
import './CandidateInterviewPrep.css';

// Crisp inline icons
const SparkleIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
  </svg>
);

const BriefcaseIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const LockIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const AlertTriangleIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowRightIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const CandidateInterviewPrep: React.FC = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<CandidateApplicationItemDto[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [generatingAppId, setGeneratingAppId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load candidate applications on mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoadingApps(true);
        const data = await jobApplicationsApi.getMyApplications();
        setApplications(data || []);
      } catch {
        // Fallback demo data for initial testing
        setApplications([
          {
            id: 'app-demo-1',
            jobId: 'job-101',
            jobTitle: 'Senior Full-Stack .NET & React Engineer',
            companyName: 'Acme Digital Solutions',
            status: 'Assessment',
            appliedDate: new Date().toISOString(),
          } as CandidateApplicationItemDto,
          {
            id: 'app-demo-2',
            jobId: 'job-102',
            jobTitle: 'Cloud Solutions & Systems Architect',
            companyName: 'Vertex Cloud Platforms',
            status: 'Interview',
            appliedDate: new Date().toISOString(),
          } as CandidateApplicationItemDto,
          {
            id: 'app-demo-3',
            jobId: 'job-103',
            jobTitle: 'Junior Frontend Developer',
            companyName: 'BlueSky Media',
            status: 'Pending',
            appliedDate: new Date().toISOString(),
          } as CandidateApplicationItemDto,
        ]);
      } finally {
        setIsLoadingApps(false);
      }
    };

    fetchApplications();
  }, []);

  // Filter strictly for eligible applications: ONLY where status is strictly 'Interview'
  const eligibleApplications = useMemo(() => {
    return applications.filter((app) => {
      const s = (app.status || '').toLowerCase().trim();
      return s === 'interview';
    });
  }, [applications]);

  // Non-eligible applications (Assessment, Pending, Rejected, etc.)
  const pendingOrRejectedApplications = useMemo(() => {
    return applications.filter((app) => {
      const s = (app.status || '').toLowerCase().trim();
      return s !== 'interview';
    });
  }, [applications]);

  // Primary Action: Generate AI Prep Guide and Navigate to Page 2
  const handleGenerateGuide = async (app: CandidateApplicationItemDto) => {
    try {
      setError(null);
      setGeneratingAppId(app.id);

      const response = await interviewPrepApi.generate({
        applicationId: app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        targetRole: app.jobTitle,
        jobDescription: `Position: ${app.jobTitle} at ${app.companyName || 'Enterprise'}. Core responsibilities include full lifecycle system architecture, high-performance web development, database optimization, and team collaboration.`,
      });

      const guideId = response.guideId || response.id || response.guide?.id;
      if (!guideId) {
        throw new Error('Guide generation completed but no guide ID was returned.');
      }

      // Store last generated guide ID for sidebar direct access
      localStorage.setItem('skillhub_last_guide_id', guideId);

      // Navigate seamlessly to Page 2: The Study Dashboard
      navigate(`/candidate/interview-prep/guide/${guideId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate interview preparation guide. Please try again.');
      setGeneratingAppId(null);
    }
  };

  return (
    <div className="prep-container">
      {/* 1. Header Banner */}
      <header className="prep-header">
        <div className="prep-title-area">
          <h1>
            AI Interview Prep Hub
            <span className="prep-badge-module">Student 1 Module</span>
          </h1>
          <p className="prep-subtitle">
            Technical Career Coach study guidelines analyzing role requirements to provide focus areas across theory, architecture, and practical implementation.
          </p>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="prep-error-card">
          <p>{error}</p>
          <button type="button" className="btn-error-retry" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Full-Screen Loading Overlay when Generating */}
      {generatingAppId && (
        <div className="prep-loading-card" style={{ marginBottom: '32px' }}>
          <div className="prep-spinner-wrap">
            <div className="prep-spinner" />
            <div className="prep-spinner-icon">
              <SparkleIcon />
            </div>
          </div>
          <div className="prep-loading-title">
            AI is analyzing the job description and your CV...
          </div>
          <p style={{ color: '#64748b', margin: '0 auto 16px', maxWidth: '540px' }}>
            Acting as your Technical Career Coach: analyzing job requirements, identifying key theoretical areas, extracting core concepts, and formulating practical implementation focus guidelines.
          </p>
          <div className="prep-loading-steps">
            <span className="prep-step-pill active">Analyzing Vacancy</span>
            <span className="prep-step-pill active">Key Theoretical Areas</span>
            <span className="prep-step-pill active">Technical Core Concepts</span>
            <span className="prep-step-pill active">Practical Focus</span>
          </div>
        </div>
      )}

      {/* 2. Loading State for Initial Fetch */}
      {isLoadingApps && (
        <div className="prep-loading-card">
          <div className="prep-spinner-wrap" style={{ width: '48px', height: '48px' }}>
            <div className="prep-spinner" style={{ width: '48px', height: '48px' }} />
          </div>
          <p style={{ color: '#64748b', margin: 0 }}>Checking eligible applications...</p>
        </div>
      )}

      {/* 3. Eligible Applications Grid (Status is strictly 'Interview') */}
      {!isLoadingApps && eligibleApplications.length > 0 && !generatingAppId && (
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Interview Positions ({eligibleApplications.length})
            </h2>
            <span style={{ fontSize: '0.825rem', color: '#00b074', fontWeight: 600 }}>
              &bull; Unlocked for Technical Career Coach Study Guidelines
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {eligibleApplications.map((app) => (
              <div key={app.id} className="prep-input-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div className="prep-status-pill-wrap status-eligible" style={{ margin: 0, padding: '3px 10px', fontSize: '0.75rem' }}>
                    Stage: Interview
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Applied {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'Recently'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                  {app.jobTitle}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.875rem', marginBottom: '16px' }}>
                  <BriefcaseIcon />
                  <span>{app.companyName || 'Enterprise Partner'}</span>
                  {app.location && <span>&bull; {app.location}</span>}
                </div>

                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, marginBottom: '20px', flexGrow: 1 }}>
                  You have been selected for the Interview stage! Generate your personalized study guideline to brush up on Key Theoretical Areas, Technical Core Concepts, and Practical Implementation priorities.
                </p>

                <button
                  type="button"
                  className="btn-generate-ai"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleGenerateGuide(app)}
                  disabled={!!generatingAppId}
                >
                  <SparkleIcon />
                  <span>Generate AI Prep Guide</span>
                  <ArrowRightIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Fallback Card when NO Eligible Applications */}
      {!isLoadingApps && eligibleApplications.length === 0 && (
        <div className="prep-locked-card">
          <div className="prep-locked-icon-wrap">
            <LockIcon />
          </div>

          <div className="prep-status-pill-wrap status-pending">
            <span>Current Application Stage: <strong>Assessment / Screening</strong></span>
          </div>

          <h2 className="prep-locked-title">Interview Preparation Locked</h2>

          <p className="prep-locked-msg">
            Interview Preparation will be unlocked once you are selected for an Interview. Candidates in Assessment or Pending stages must complete evaluation first.
          </p>

          {/* Visual Stage Gate Progression */}
          <div className="prep-stage-gate-indicator">
            <div className="prep-gate-step completed">
              <CheckIcon />
              <span>1. Application Submitted</span>
            </div>
            <span className="prep-gate-arrow">&rarr;</span>
            <div className="prep-gate-step current">
              <span>2. Assessment & Screening</span>
            </div>
            <span className="prep-gate-arrow">&rarr;</span>
            <div className="prep-gate-step locked">
              <LockIcon />
              <span>3. Interview Stage (Unlocks Prep)</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Ineligible Applications Section (Informative list) */}
      {!isLoadingApps && pendingOrRejectedApplications.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>
            Other Applications ({pendingOrRejectedApplications.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {pendingOrRejectedApplications.map((app) => {
              const isRej = (app.status || '').toLowerCase().includes('reject');
              return (
                <div
                  key={app.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                      {app.jobTitle}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
                        {app.companyName || 'Enterprise'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>&bull;</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                        {isRej ? 'Application Closed' : 'Unlocks strictly at Interview stage'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`prep-status-pill-wrap ${isRej ? 'status-rejected' : 'status-pending'}`}
                    style={{ margin: 0, padding: '2px 10px', fontSize: '0.75rem' }}
                  >
                    {app.status || 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateInterviewPrep;
