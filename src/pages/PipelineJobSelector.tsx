import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi, type JobDto } from '../services/api';
import { CandidatesListModal } from '../components/candidates/CandidatesListModal';
import {
  SparkleIcon,
  SearchIcon,
  BriefcaseIcon,
  UsersIcon,
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon,
  PlusIcon,
  BuildingIcon,
} from '../components/common/Icons';

interface PipelineJobSelectorProps {
  onSelectJob?: (jobId: string) => void;
}

export const PipelineJobSelector: React.FC<PipelineJobSelectorProps> = ({ onSelectJob }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobDto | null>(null);

  // Fetch company jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await jobsApi.getJobs();
      setJobs(data);
    } catch (err: any) {
      console.error('Error fetching jobs for pipeline selector:', err);
      setErrorMessage(err.message || 'Failed to load active job vacancies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter only Active jobs
  const activeJobs = useMemo(() => {
    return jobs.filter((j) => (j.status || 'Active').toLowerCase() === 'active');
  }, [jobs]);

  // Extract unique departments from active jobs
  const departments = useMemo(() => {
    const set = new Set(activeJobs.map((j) => j.department?.trim()).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [activeJobs]);

  // Apply search and department filter
  const filteredJobs = useMemo(() => {
    return activeJobs.filter((job) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.department.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query);

      const matchesDept =
        selectedDepartment === 'All' ||
        job.department.toLowerCase() === selectedDepartment.toLowerCase();

      return matchesSearch && matchesDept;
    });
  }, [activeJobs, searchQuery, selectedDepartment]);

  const handleCardClick = (job: JobDto) => {
    if (onSelectJob) {
      onSelectJob(job.id);
    } else {
      setSelectedJobForModal(job);
    }
  };

  return (
    <div className="pipeline-selector-container">
      {/* Page Header */}
      <div className="pipeline-selector-header">
        <div className="pipeline-header-title-box">
          <div className="badge-tag">
            <SparkleIcon />
            <span>TALENT PIPELINE INTELLIGENCE</span>
          </div>
          <h1 className="pipeline-page-title">Select Requisition Pipeline</h1>
          <p className="pipeline-page-subtitle">
            Choose an active job vacancy below to view its dedicated candidate pipeline, AI match rankings, and Kanban hiring stages.
          </p>
        </div>

        <div className="pipeline-header-stats-badge">
          <span className="pipeline-stats-num">{activeJobs.length}</span>
          <span className="pipeline-stats-label">Active Pipelines</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-card-wrapper" style={{ marginBottom: '24px' }}>
        <div className="filter-grid-bar" style={{ gridTemplateColumns: '2fr 1.2fr auto' }}>
          {/* Keyword Search */}
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search active roles by title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Department Select */}
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}>
              <BuildingIcon />
            </span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Action */}
          {(searchQuery || selectedDepartment !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDepartment('All');
              }}
              className="btn-secondary"
              style={{ padding: '10px 16px' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchJobs}
            className="text-xs font-semibold text-red-800 underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="p-16 bg-white border border-slate-200 rounded-2xl text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading active company requisitions...</p>
        </div>
      ) : activeJobs.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '56px 24px',
            textAlign: 'center',
            maxWidth: '540px',
            margin: '0 auto',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#94a3b8',
            }}
          >
            <BriefcaseIcon />
          </div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '6px',
            }}
          >
            No Active Requisitions Found
          </h3>
          <p
            style={{
              fontSize: '13.5px',
              color: '#64748b',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}
          >
            You do not have any active job vacancies to view candidate pipelines for. Publish a new job or activate an existing draft requisition.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ display: 'inline-flex', margin: '0 auto' }}
            onClick={() => navigate('/dashboard/jobs/new')}
          >
            <PlusIcon />
            <span>Create New Job Vacancy</span>
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            No Active Jobs Match Filter
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Try clearing your search query or selecting a different department.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setSelectedDepartment('All');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="pipeline-jobs-grid">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="pipeline-job-card"
              onClick={() => handleCardClick(job)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(job);
                }
              }}
            >
              {/* Card Header: Dept & Status Pill */}
              <div className="pipeline-card-topbar">
                <span className="pipeline-dept-badge">{job.department}</span>
                <span className="pipeline-status-pill">
                  <span className="pipeline-status-dot"></span>
                  Active
                </span>
              </div>

              {/* Title */}
              <h3 className="pipeline-card-title">{job.title}</h3>

              {/* Location & Meta info */}
              <div className="pipeline-card-meta">
                <div className="pipeline-meta-item">
                  <MapPinIcon />
                  <span>{job.location}</span>
                </div>
                <div className="pipeline-meta-item">
                  <ClockIcon />
                  <span>{job.employmentType}</span>
                </div>
              </div>

              {/* Metric & Info Row */}
              <div className="pipeline-card-metrics">
                <div className="pipeline-applicant-count">
                  <UsersIcon />
                  <span>6 Applicants</span>
                </div>
                <div className="pipeline-ai-badge">
                  <SparkleIcon />
                  <span>95% AI Match Engine</span>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="pipeline-card-footer">
                <span className="pipeline-salary-text">
                  {job.salaryRange || 'Competitive Compensation'}
                </span>
                <button
                  type="button"
                  className="pipeline-open-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(job);
                  }}
                >
                  <UsersIcon />
                  <span>View Candidates</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidates List Modal Popup Over Job Selector */}
      <CandidatesListModal
        isOpen={!!selectedJobForModal}
        onClose={() => setSelectedJobForModal(null)}
        job={selectedJobForModal}
      />
    </div>
  );
};

