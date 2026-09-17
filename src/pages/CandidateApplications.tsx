import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  jobApplicationsApi,
  type CandidateApplicationItemDto,
} from '../services/api';
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  ClockIcon,
  MapPinIcon,
  SearchIcon,
  SparkleIcon,
} from '../components/common/Icons';
import './CandidateApplications.css';

const STAGES = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Offer'] as const;

const PREVIEW_APPLICATIONS: CandidateApplicationItemDto[] = [
  {
    id: 'preview-applied',
    jobId: 'preview-backend-role',
    jobTitle: 'Senior .NET Backend Engineer',
    companyName: 'Northstar Digital',
    location: 'Colombo, Sri Lanka',
    employmentType: 'Full-time',
    workplaceType: 'Hybrid',
    appliedDate: '2026-09-14T09:30:00Z',
    status: 'Applied',
  },
  {
    id: 'preview-shortlisted',
    jobId: 'preview-platform-role',
    jobTitle: 'Full-Stack Platform Engineer',
    companyName: 'Vertex Labs',
    location: 'Remote',
    employmentType: 'Full-time',
    workplaceType: 'Remote',
    appliedDate: '2026-09-08T13:15:00Z',
    status: 'Shortlisted',
  },
];

const getStageIndex = (status: string): number => {
  const value = status.toLowerCase();
  if (value.includes('offer') || value.includes('accepted') || value.includes('hired')) return 4;
  if (value.includes('interview')) return 3;
  if (value.includes('shortlist')) return 2;
  if (value.includes('review') || value.includes('screen')) return 1;
  return 0;
};

const getCopilotMessage = (stage: number): string => [
  'Your profile shows strong alignment with the role. We will help you prepare as the application progresses.',
  'Your application is being evaluated. Refresh your Digital CV with measurable project outcomes while you wait.',
  'You made the shortlist. Your next best step is a focused mock interview based on this role.',
  'Interview stage reached. Rehearse concise STAR examples and prepare questions for the hiring team.',
  'You reached the offer stage. Review the complete package, role expectations, and growth path carefully.',
][stage];

export const CandidateApplications: React.FC = () => {
  const previewMode = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('preview') === 'applications';
  const [applications, setApplications] = useState<CandidateApplicationItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(!previewMode);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    if (previewMode) {
      setApplications(PREVIEW_APPLICATIONS);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setApplications((await jobApplicationsApi.getMyApplications()) || []);
    } catch (err: unknown) {
      console.error('Error fetching candidate applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load your applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications();
  }, []);

  return (
    <div className="candidate-applications-page">
      <section className="applications-hero">
        <div>
          <div className="applications-eyebrow"><BriefcaseIcon /> APPLICATION TRACKER</div>
          <h1>Applied Positions</h1>
          <p className="applications-subtitle">
            Follow every hiring milestone and get actionable guidance from your AI Copilot.
          </p>
        </div>
        <Link to="/jobs" className="applications-primary-action">
          <SearchIcon /> Explore Open Positions
        </Link>
      </section>

      {error && (
        <div className="applications-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchApplications()}>Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="applications-state-card" aria-live="polite">
          <div className="applications-spinner" aria-hidden="true" />
          <p>Loading your application journey...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="applications-state-card applications-empty">
          <div className="applications-empty-icon"><BriefcaseIcon /></div>
          <h3>No Job Applications Yet</h3>
          <p>Browse verified opportunities and apply in one click with your Digital CV.</p>
          <Link to="/jobs" className="applications-primary-action">
            Find &amp; Apply to Jobs <ArrowRightIcon />
          </Link>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((app) => {
            const currentStage = getStageIndex(app.status || 'Applied');
            const initials = app.companyName
              .split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const appliedDate = new Date(app.appliedDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <article className="application-card" key={app.id}>
                <header className="application-card-header">
                  <div className="application-identity">
                    <div className="application-logo">
                      {app.companyLogoUrl
                        ? <img src={app.companyLogoUrl} alt={`${app.companyName} logo`} />
                        : <span>{initials}</span>}
                    </div>
                    <div className="application-details">
                      <div className="application-title-row">
                        <Link to={`/jobs/${app.jobId}`} className="application-title">
                          {app.jobTitle}
                        </Link>
                        <span className="application-status"><b />{STAGES[currentStage]}</span>
                      </div>
                      <div className="application-company"><BuildingIcon /> {app.companyName}</div>
                      <div className="application-meta">
                        <span><MapPinIcon /> {app.location || 'Location not specified'}</span>
                        <i aria-hidden="true" />
                        <span><ClockIcon /> {app.employmentType || 'Job type not specified'}</span>
                        {app.workplaceType && <><i aria-hidden="true" /><span>{app.workplaceType}</span></>}
                        <i aria-hidden="true" />
                        <span>Applied {appliedDate}</span>
                      </div>
                    </div>
                  </div>
                </header>

                <div className="application-stepper" aria-label={`Application status: ${STAGES[currentStage]}`}>
                  {STAGES.map((stage, index) => (
                    <div
                      className={`application-step ${index <= currentStage ? 'is-complete' : ''} ${index === currentStage ? 'is-current' : ''}`}
                      key={stage}
                    >
                      <div className="application-step-track">
                        <span className="application-step-dot">{index < currentStage ? '✓' : index + 1}</span>
                        {index < STAGES.length - 1 && <span className="application-step-line" />}
                      </div>
                      <span className="application-step-label">{stage}</span>
                    </div>
                  ))}
                </div>

                <div className="application-copilot">
                  <span className="application-copilot-icon"><SparkleIcon /></span>
                  <div><strong>AI Copilot Insight</strong><p>{getCopilotMessage(currentStage)}</p></div>
                </div>

                <footer className="application-actions">
                  <Link to={`/jobs/${app.jobId}`} className="application-view-link">
                    View Job Details <ArrowRightIcon />
                  </Link>
                  {currentStage === 2 ? (
                    <Link to={`/candidate/mock-interview?jobId=${app.jobId}`} className="application-smart-action">
                      🎯 Practice Mock Interview
                    </Link>
                  ) : currentStage === 0 ? (
                    <Link to={`/jobs/${app.jobId}?showInsights=true`} className="application-smart-action">
                      <SparkleIcon /> Review Match Insights
                    </Link>
                  ) : null}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
