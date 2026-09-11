import { useState, useEffect } from 'react';
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
} from '../components/common/Icons';

export const JobPipelineKanban = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const stages = [
    { id: 'screened', title: 'AI Screened & Matched', subtitle: 'Automated 95%+ candidate fit' },
    { id: 'technical', title: 'Technical Assessment', subtitle: 'Code review & skills evaluation' },
    { id: 'interview', title: 'Interview Stage', subtitle: 'Team & executive rounds' },
    { id: 'offer', title: 'Offer Extended', subtitle: 'Final decision & contracting' },
  ];

  if (loading) {
    return (
      <div className="p-10 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-600">Loading candidate pipeline for requisition...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !job) {
    return (
      <div className="p-10 bg-slate-50 min-h-screen">
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BriefcaseIcon />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Requisition Not Found</h3>
          <p className="text-sm text-slate-500 mb-6">{errorMessage || 'Unable to find requisition pipeline.'}</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/dashboard/pipelines')}
          >
            <ArrowLeftIcon />
            <span>Back to Job Selector</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-kanban-page-container">
      {/* Top Navigation & Breadcrumbs */}
      <div className="kanban-nav-row">
        <button
          type="button"
          className="kanban-back-btn"
          onClick={() => navigate('/dashboard/pipelines')}
        >
          <ArrowLeftIcon />
          <span>Back to Job Selector</span>
        </button>

        <div className="kanban-breadcrumbs">
          <Link to="/dashboard" className="kanban-breadcrumb-link">Dashboard</Link>
          <span className="kanban-breadcrumb-sep">/</span>
          <Link to="/dashboard/pipelines" className="kanban-breadcrumb-link">Pipelines</Link>
          <span className="kanban-breadcrumb-sep">/</span>
          <span className="kanban-breadcrumb-current">{job.title}</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="kanban-header-card">
        <div className="kanban-header-info">
          <div className="kanban-meta-tags">
            <span className="kanban-status-badge">
              <span className="kanban-status-dot"></span>
              {job.status} Pipeline
            </span>
            <span className="kanban-dept-tag">{job.department}</span>
            <span className="kanban-ai-tag">
              <SparkleIcon />
              <span>AI Indexing Live</span>
            </span>
          </div>

          <h1 className="kanban-job-title">{job.title}</h1>

          <div className="kanban-submeta-row">
            <div className="kanban-submeta-item">
              <BuildingIcon />
              <span>{job.companyName}</span>
            </div>
            <span className="kanban-sep">•</span>
            <div className="kanban-submeta-item">
              <MapPinIcon />
              <span>{job.location}</span>
            </div>
            <span className="kanban-sep">•</span>
            <div className="kanban-submeta-item">
              <ClockIcon />
              <span>{job.employmentType}</span>
            </div>
            {job.salaryRange && (
              <>
                <span className="kanban-sep">•</span>
                <div className="kanban-submeta-item">
                  <DollarSignIcon />
                  <span>{job.salaryRange}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="kanban-header-actions">
          <Link
            to={`/dashboard/jobs/${job.id}`}
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '9px 16px' }}
          >
            <BriefcaseIcon />
            <span>Requisition Details</span>
          </Link>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="kanban-board-grid">
        {stages.map((stage) => (
          <div key={stage.id} className="kanban-column-card">
            <div className="kanban-column-header">
              <div>
                <h3 className="kanban-column-title">{stage.title}</h3>
                <p className="kanban-column-desc">{stage.subtitle}</p>
              </div>
              <span className="kanban-count-pill">0</span>
            </div>

            {/* Candidate Card Placeholder / Empty Stage */}
            <div className="kanban-column-body">
              <div className="kanban-empty-dropzone">
                <div className="kanban-dropzone-icon">
                  <UsersIcon />
                </div>
                <span className="kanban-dropzone-title">No Candidates in Stage</span>
                <p className="kanban-dropzone-text">
                  New applications and AI-screened profiles for this role will appear here automatically.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
