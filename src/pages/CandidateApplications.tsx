import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  jobApplicationsApi,
  type CandidateApplicationItemDto,
} from '../services/api';
import {
  ApplicationProgressModal,
} from '../components/jobs/ApplicationProgressModal';
import {
  ArrowRightIcon,
  BriefcaseIcon,
  SearchIcon,
} from '../components/common/Icons';
import './CandidateApplications.css';

const STAGE_LABELS = ['Applied', 'Under Review', 'Shortlisted', 'Assessment', 'Interview', 'Offer'];

const getApplicationStage = (status?: string | null): number => {
  const value = (status || 'Applied').toLowerCase();
  if (value.includes('offer') || value.includes('accepted') || value.includes('hired')) return 5;
  if (value.includes('interview')) return 4;
  if (value.includes('assess') || value.includes('test') || value.includes('exam')) return 3;
  if (value.includes('shortlist')) return 2;
  if (value.includes('review') || value.includes('screen')) return 1;
  return 0;
};

const PREVIEW_APPLICATIONS: CandidateApplicationItemDto[] = [
  {
    id: 'preview-applied', jobId: 'preview-backend-role',
    jobTitle: 'Senior .NET Backend Engineer', companyName: 'Northstar Digital',
    location: 'Colombo, Sri Lanka', employmentType: 'Full-time', workplaceType: 'Hybrid',
    appliedDate: '2026-09-14T09:30:00Z', status: 'Applied',
  },
  {
    id: 'preview-shortlisted', jobId: 'preview-platform-role',
    jobTitle: 'Full-Stack Platform Engineer', companyName: 'Vertex Labs',
    location: 'Remote', employmentType: 'Full-time', workplaceType: 'Remote',
    appliedDate: '2026-09-08T13:15:00Z', status: 'Shortlisted',
  },
];

export const CandidateApplications: React.FC = () => {
  const previewMode = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('preview') === 'applications';
  const [applications, setApplications] = useState<CandidateApplicationItemDto[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<CandidateApplicationItemDto | null>(null);
  const [isLoading, setIsLoading] = useState(!previewMode);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
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
  }, [previewMode]);

  useEffect(() => {
    void Promise.resolve().then(fetchApplications);
  }, [fetchApplications]);

  const openFromKeyboard = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    application: CandidateApplicationItemDto,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedApplication(application);
    }
  };

  return (
    <div className="candidate-applications-page">
      <section className="applications-hero">
        <div>
          <div className="applications-eyebrow"><BriefcaseIcon /> APPLICATION TRACKER</div>
          <h1>Applied Positions</h1>
          <p className="applications-subtitle">Review every application and open its complete hiring journey.</p>
        </div>
        <Link to="/jobs" className="applications-primary-action"><SearchIcon /> Explore Open Positions</Link>
      </section>

      {error && <div className="applications-error" role="alert"><span>{error}</span>
        <button type="button" onClick={() => void fetchApplications()}>Retry</button></div>}

      {isLoading ? (
        <div className="applications-state-card" aria-live="polite"><div className="applications-spinner" /><p>Loading your applications...</p></div>
      ) : applications.length === 0 ? (
        <div className="applications-state-card applications-empty">
          <div className="applications-empty-icon"><BriefcaseIcon /></div><h2>No Job Applications Yet</h2>
          <p>Browse verified opportunities and apply in one click with your Digital CV.</p>
          <Link to="/jobs" className="applications-primary-action">Find Opportunities <ArrowRightIcon /></Link>
        </div>
      ) : (
        <div className="applications-table-card">
          <div className="applications-table-summary"><strong>{applications.length}</strong> active {applications.length === 1 ? 'application' : 'applications'}</div>
          <div className="applications-table-scroll">
            <table className="applications-table">
              <thead><tr><th>Position &amp; Company</th><th>Location &amp; Type</th><th>Date Applied</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
              <tbody>{applications.map((application) => {
                const stage = getApplicationStage(application.status);
                const initials = application.companyName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();
                const date = new Date(application.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return <tr key={application.id} tabIndex={0} role="button"
                  onClick={() => setSelectedApplication(application)}
                  onKeyDown={(event) => openFromKeyboard(event, application)}>
                  <td><div className="table-position"><span className="table-company-avatar">{initials}</span><div><strong>{application.jobTitle}</strong><span>{application.companyName}</span></div></div></td>
                  <td><div className="table-location"><strong>{application.location}</strong><span>{application.workplaceType ? `${application.workplaceType} • ` : ''}{application.employmentType}</span></div></td>
                  <td><span className="table-date">{date}</span></td>
                  <td><span className={`table-status stage-${stage}`}><b />{STAGE_LABELS[stage]}</span></td>
                  <td><button type="button" className="track-progress-button" onClick={(event) => { event.stopPropagation(); setSelectedApplication(application); }}>Track Progress ↗</button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {selectedApplication && <ApplicationProgressModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />}
    </div>
  );
};
