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
  XIcon,
} from '../components/common/Icons';
import { Briefcase } from 'lucide-react';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import './PipelineJobSelectorFull.css';

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
  const [sortBy, setSortBy] = useState<'priority' | 'applicants' | 'newest' | 'title'>('priority');
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

  const totalApplicantsCount = useMemo(() => {
    return publishedJobs.reduce((sum, job) => sum + (applicantCounts[job.id] || 0), 0);
  }, [publishedJobs, applicantCounts]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedDepartment !== 'All' ||
    statusFilter !== 'All' ||
    sortBy !== 'priority';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('All');
    setStatusFilter('All');
    setSortBy('priority');
  };

  // Apply search, status, department filter, and sorting
  const filteredJobs = useMemo(() => {
    return publishedJobs
      .filter((job) => {
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
      })
      .sort((a, b) => {
        if (sortBy === 'applicants') {
          return (applicantCounts[b.id] || 0) - (applicantCounts[a.id] || 0);
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        // Priority: Screening ready (Closed) first, then highest applicant count
        const isAClosed = (a.status || '').toLowerCase() === 'closed';
        const isBClosed = (b.status || '').toLowerCase() === 'closed';
        if (isAClosed && !isBClosed) return -1;
        if (!isAClosed && isBClosed) return 1;
        return (applicantCounts[b.id] || 0) - (applicantCounts[a.id] || 0);
      });
  }, [publishedJobs, searchQuery, selectedDepartment, statusFilter, sortBy, applicantCounts]);

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
      {/* =========================================================
          1. TOP COMPONENT: PIPELINE DASHBOARD CARD
          (Matches Candidate Technical Assessments Dashboard Header & Metrics)
          ========================================================= */}
      <section className="pipeline-dashboard-card" aria-labelledby="pipeline-dashboard-title">
        <div className="pipeline-dashboard-header">
          <div>
            <span className="pipeline-dashboard-eyebrow">AI Batch Screening & Candidate Intelligence</span>
            <h2 id="pipeline-dashboard-title">AI Screening Dashboard</h2>
            <p>
              Review applicant pools, evaluate candidate suitability scores, and trigger automated AI batch screening on closed requisitions.
            </p>
          </div>

          <div className="pipeline-dashboard-header-actions">
            <span className="pipeline-dashboard-live">
              <span /> AI Engine Ready
            </span>
            <button
              type="button"
              className="btn-primary pipeline-action-btn"
              onClick={() => setStatusFilter(statusFilter === 'Closed' ? 'All' : 'Closed')}
              title={statusFilter === 'Closed' ? 'Show all requisitions' : 'Filter to screening-ready requisitions'}
            >
              <SparkleIcon />
              <span>{statusFilter === 'Closed' ? 'Show All Roles' : `Screening Ready (${closedCount})`}</span>
            </button>
          </div>
        </div>

        <div className="pipeline-summary-grid">
          <article className="pipeline-summary-card summary-total">
            <div className="summary-icon"><Briefcase size={22} /></div>
            <div>
              <span>Total Requisitions</span>
              <strong>{publishedJobs.length}</strong>
              <small>All published roles</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-ready">
            <div className="summary-icon"><SparkleIcon /></div>
            <div>
              <span>Screening Ready</span>
              <strong>{closedCount}</strong>
              <small>Closed & ready for AI run</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-active">
            <div className="summary-icon"><ClockIcon /></div>
            <div>
              <span>Collecting Applicants</span>
              <strong>{activeCount}</strong>
              <small>Active talent sourcing</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-applicants">
            <div className="summary-icon"><UsersIcon /></div>
            <div>
              <span>Total Applicants</span>
              <strong>{totalApplicantsCount}</strong>
              <small>Candidates in pipeline</small>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          2. FILTER & SEARCH CONTROLS PANEL
          (Matches Candidate Technical Assessments Filter Toolbar)
          ========================================================= */}
      <section className="pipeline-filter-panel" aria-label="Requisition filters">
        <div className="pipeline-filter-heading">
          <div>
            <span className="filter-eyebrow">Requisition workspace</span>
            <h2>Select a job requisition</h2>
          </div>
          <span className="filter-result-count">
            {filteredJobs.length} of {publishedJobs.length} shown
          </span>
        </div>

        <div className="pipeline-toolbar">
          {/* Status Tabs */}
          <div className="pipeline-tabs">
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All Requisitions ({publishedJobs.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'Closed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Closed')}
            >
              Screening Ready ({closedCount})
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              Open for Applications ({activeCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="pipeline-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search requisitions by title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <XIcon />
              </button>
            )}
          </div>

          {/* Department Select */}
          <div className="pipeline-select-group">
            <label htmlFor="pipeline-dept-filter">Department</label>
            <select
              id="pipeline-dept-filter"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div className="pipeline-select-group">
            <label htmlFor="pipeline-sort-filter">Sort by</label>
            <select
              id="pipeline-sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="priority">Screening ready first</option>
              <option value="applicants">Most applicants</option>
              <option value="newest">Newest created</option>
              <option value="title">Role title (A - Z)</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="pipeline-clear-filters"
              onClick={clearFilters}
            >
              <XIcon /> Clear filters
            </button>
          )}
        </div>
      </section>

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
