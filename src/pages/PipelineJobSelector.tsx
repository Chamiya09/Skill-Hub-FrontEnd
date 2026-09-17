import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi, jobApplicationsApi, type JobDto } from '../services/api';
import { AIScreeningModal } from '../components/candidates/AIScreeningModal';
import {
  SparkleIcon,
  SearchIcon,
  BriefcaseIcon,
  UsersIcon,
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon,
  BuildingIcon,
  PlusIcon,
  InfoIcon,
} from '../components/common/Icons';
import { SkeletonGrid } from '../components/common/SkeletonCard';

interface PipelineJobSelectorProps {
  onSelectJob?: (jobId: string) => void;
}

export const PipelineJobSelector: React.FC<PipelineJobSelectorProps> = ({ onSelectJob }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('All');
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobDto | null>(null);

  // Fetch company jobs and applicant counts
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await jobsApi.getJobs();
      setJobs(data);

      const published = (data || []).filter((j) => (j.status || 'Active').toLowerCase() !== 'draft');
      const countsMap: Record<string, number> = {};

      await Promise.allSettled(
        published.map(async (job) => {
          try {
            const apps = await jobApplicationsApi.getJobApplicants(job.id);
            countsMap[job.id] = apps.length;
          } catch {
            countsMap[job.id] = 0;
          }
        })
      );

      setApplicantCounts(countsMap);
    } catch (err: any) {
      console.error('Error fetching jobs for AI screening selector:', err);
      setErrorMessage(err.message || 'Failed to load company job requisitions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter out Draft jobs if desired, but keep Active and Closed
  const publishedJobs = useMemo(() => {
    return jobs.filter((j) => (j.status || 'Active').toLowerCase() !== 'draft');
  }, [jobs]);

  // Extract unique departments from published jobs
  const departments = useMemo(() => {
    const set = new Set(publishedJobs.map((j) => j.department?.trim()).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [publishedJobs]);

  // Apply search, status, and department filter
  const filteredJobs = useMemo(() => {
    return publishedJobs.filter((job) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.department.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query);

      const matchesDept =
        selectedDepartment === 'All' ||
        job.department.toLowerCase() === selectedDepartment.toLowerCase();

      const jobStatus = (job.status || 'Active').toLowerCase();
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && jobStatus === 'active') ||
        (statusFilter === 'Closed' && jobStatus === 'closed');

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [publishedJobs, searchQuery, selectedDepartment, statusFilter]);

  const handleCardClick = (job: JobDto) => {
    if (onSelectJob) {
      onSelectJob(job.id);
    } else {
      setSelectedJobForModal(job);
    }
  };

  const handleJobUpdated = (updatedJob: JobDto) => {
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    setSelectedJobForModal(updatedJob);
  };

  const closedCount = useMemo(() => {
    return publishedJobs.filter((j) => (j.status || '').toLowerCase() === 'closed').length;
  }, [publishedJobs]);

  const activeCount = useMemo(() => {
    return publishedJobs.filter((j) => (j.status || 'Active').toLowerCase() === 'active').length;
  }, [publishedJobs]);

  return (
    <div className="pipeline-selector-container">
      {/* Page Header */}
      <div className="pipeline-selector-header">
        <div className="pipeline-header-title-box">
          <div className="badge-tag">
            <SparkleIcon />
            <span>AI BATCH SCREENING & CANDIDATE INTELLIGENCE</span>
          </div>
          <h1 className="pipeline-page-title">AI Screening by Job Requisition</h1>
          <p className="pipeline-page-subtitle">
            Click any job requisition below to open the <strong>AI Screening Modal</strong>. Review applicants, and run batch AI screening once the requisition is marked as <strong>Closed</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="pipeline-header-stats-badge" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span className="pipeline-stats-num" style={{ color: '#00b074' }}>{activeCount}</span>
            <span className="pipeline-stats-label">Open Roles</span>
          </div>
          <div className="pipeline-header-stats-badge" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span className="pipeline-stats-num" style={{ color: '#6366f1' }}>{closedCount}</span>
            <span className="pipeline-stats-label">Closed / Ready</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-card-wrapper" style={{ marginBottom: '24px' }}>
        <div className="filter-grid-bar" style={{ gridTemplateColumns: '2fr 1fr 1.2fr auto' }}>
          {/* Keyword Search */}
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search requisitions by title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="filter-input-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Closed')}
            >
              <option value="All">All Statuses ({publishedJobs.length})</option>
              <option value="Closed">Closed / Screening Ready ({closedCount})</option>
              <option value="Active">Active / Applications Open ({activeCount})</option>
            </select>
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
          {(searchQuery || selectedDepartment !== 'All' || statusFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDepartment('All');
                setStatusFilter('All');
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
        <SkeletonGrid count={4} variant="rich-grid" />
      ) : publishedJobs.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '56px 24px',
            textAlign: 'center',
            maxWidth: '540px',
            margin: '0 auto',
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
            No Requisitions Found
          </h3>
          <p
            style={{
              fontSize: '13.5px',
              color: '#64748b',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}
          >
            You do not have any published job vacancies yet. Create a requisition to start collecting candidate applications for AI screening.
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
            No Jobs Match Filter
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Try clearing your search query or selecting a different department or status.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setSelectedDepartment('All');
              setStatusFilter('All');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="pipeline-jobs-grid">
          {filteredJobs.map((job) => {
            const isClosed = (job.status || '').toLowerCase() === 'closed';

            return (
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
                  <span
                    className={`pipeline-status-pill ${isClosed ? 'closed' : ''}`}
                    style={
                      isClosed
                        ? {
                            background: '#f1f5f9',
                            color: '#475569',
                            borderColor: '#cbd5e1',
                          }
                        : undefined
                    }
                  >
                    <span
                      className="pipeline-status-dot"
                      style={isClosed ? { background: '#64748b' } : undefined}
                    ></span>
                    {isClosed ? 'Closed (Deadline Reached)' : 'Active (Open)'}
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
                    <span>{applicantCounts[job.id] ?? 0} {applicantCounts[job.id] === 1 ? 'Applicant' : 'Applicants'}</span>
                  </div>
                  {isClosed ? (
                    <div
                      className="pipeline-ai-badge"
                      style={{
                        background: '#ede9fe',
                        color: '#6366f1',
                        border: '1px solid #ddd6fe',
                      }}
                    >
                      <SparkleIcon />
                      <span>Ready for AI Screening</span>
                    </div>
                  ) : (
                    <div
                      className="pipeline-ai-badge"
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      <InfoIcon />
                      <span>Intake Phase</span>
                    </div>
                  )}
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
                    style={
                      isClosed
                        ? {
                            background: '#00b074',
                            color: '#ffffff',
                            border: '1px solid #009e67',
                          }
                        : undefined
                    }
                  >
                    {isClosed ? <SparkleIcon /> : <UsersIcon />}
                    <span>{isClosed ? 'Open AI Screening' : 'View Applicants'}</span>
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AIScreeningModal Popup Over Job Selector */}
      <AIScreeningModal
        isOpen={!!selectedJobForModal}
        onClose={() => setSelectedJobForModal(null)}
        job={selectedJobForModal}
        onJobUpdated={handleJobUpdated}
      />
    </div>
  );
};
