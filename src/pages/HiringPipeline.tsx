import React, { useState, useEffect, useMemo } from 'react';
import { jobsApi, jobApplicationsApi, type JobDto } from '../services/api';
import { ShortlistedPipelineModal } from '../components/pipeline/ShortlistedPipelineModal';
import {
  FunnelIcon,
  SearchIcon,
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  BuildingIcon,
  UserCheckIcon,
  ArrowRightIcon,
} from '../components/common/Icons';
import { SkeletonGrid } from '../components/common/SkeletonCard';

export interface HiringPipelineProps {
  onSelectJob?: (jobId: string) => void;
}

export const HiringPipeline: React.FC<HiringPipelineProps> = ({ onSelectJob }) => {
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('All');
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobDto | null>(null);

  // Real applicant counts per job
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});

  // Fetch company jobs and their real applicant counts
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await jobsApi.getJobs();
      setJobs(data);

      // Fetch applicant counts for published jobs
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
      console.error('Error fetching jobs for hiring pipeline:', err);
      setErrorMessage(err.message || 'Failed to load company job requisitions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const publishedJobs = useMemo(() => {
    return jobs.filter((j) => (j.status || 'Active').toLowerCase() !== 'draft');
  }, [jobs]);

  const departments = useMemo(() => {
    const set = new Set(publishedJobs.map((j) => j.department?.trim()).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [publishedJobs]);

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

  const totalShortlistedCount = useMemo(() => {
    return publishedJobs.reduce((acc, job) => acc + (applicantCounts[job.id] || 0), 0);
  }, [publishedJobs, applicantCounts]);

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
            <FunnelIcon />
            <span>DESTINATION PIPELINE & INTERVIEWS</span>
          </div>
          <h1 className="pipeline-page-title">Hiring Pipeline</h1>
          <p className="pipeline-page-subtitle">
            Dedicated module for reviewing <strong>AI-Shortlisted Candidates</strong>. Click any job to view candidate portfolios, schedule interview rounds, or dispatch assessments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="pipeline-header-stats-badge" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span className="pipeline-stats-num" style={{ color: '#00b074' }}>{totalShortlistedCount}</span>
            <span className="pipeline-stats-label">Shortlisted Total</span>
          </div>
          <div className="pipeline-header-stats-badge" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span className="pipeline-stats-num" style={{ color: '#0284c7' }}>{publishedJobs.length}</span>
            <span className="pipeline-stats-label">Active Pipelines</span>
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
              placeholder="Search pipelines by role, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <div className="filter-input-group">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              aria-label="Filter by department"
            >
              <option value="All">All Departments</option>
              {departments.filter((d) => d !== 'All').map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs (All / Active / Closed) */}
          <div className="unified-tab-bar" style={{ width: '100%', justifyContent: 'center' }}>
            <button
              type="button"
              className={`unified-tab-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              <span>All</span>
              <span className="unified-tab-count">{publishedJobs.length}</span>
            </button>
            <button
              type="button"
              className={`unified-tab-btn ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              <span>Active</span>
            </button>
            <button
              type="button"
              className={`unified-tab-btn ${statusFilter === 'Closed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Closed')}
            >
              <span>Closed</span>
            </button>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || selectedDepartment !== 'All' || statusFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDepartment('All');
                setStatusFilter('All');
              }}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748b',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Requisitions Grid */}
      {loading ? (
        <SkeletonGrid count={6} variant="grid" />
      ) : errorMessage ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
          <p className="text-sm font-semibold text-red-800 mb-3">{errorMessage}</p>
          <button
            type="button"
            onClick={fetchJobs}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Retry Loading
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <BriefcaseIcon />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Job Requisitions Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedDepartment !== 'All' || statusFilter !== 'All'
              ? 'Try relaxing your search terms or filters.'
              : 'Create job postings to begin receiving and shortlisting candidates.'}
          </p>
        </div>
      ) : (
        <div className="jobs-grid">
          {filteredJobs.map((job) => {
            const isClosed = (job.status || '').toLowerCase() === 'closed';
            const shortlistedCount = applicantCounts[job.id] || 0;

            return (
              <div
                key={job.id}
                onClick={() => handleCardClick(job)}
                className="job-card"
                style={{ cursor: 'pointer' }}
              >
                {/* Header */}
                <div className="job-card-header">
                  <div className="company-info">
                    <div className="company-logo" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                      <BuildingIcon />
                    </div>
                    <div className="company-details">
                      <span className="company-name">{job.department}</span>
                      <span className="post-time font-mono text-[11px] text-slate-400">
                        REQ #{job.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Shortlisted Candidate Count Badge */}
                  <span
                    className="match-badge"
                    style={{
                      background: '#e6f9f2',
                      borderColor: '#b7eedc',
                      color: '#009e67',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      gap: '4px',
                    }}
                  >
                    <UserCheckIcon />
                    <span>{shortlistedCount} Shortlisted</span>
                  </span>
                </div>

                {/* Job Title */}
                <h3 className="job-title" style={{ fontSize: '17px', margin: '4px 0 10px 0' }}>
                  {job.title}
                </h3>

                {/* Meta Row */}
                <div className="job-meta-row" style={{ gap: '14px', fontSize: '12.5px', marginBottom: '16px' }}>
                  <div className="meta-item">
                    <MapPinIcon />
                    <span>{job.location}</span>
                  </div>
                  <div className="meta-item">
                    <ClockIcon />
                    <span>{job.employmentType}</span>
                  </div>
                  <div className="meta-item">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{ background: isClosed ? '#64748b' : '#10b981' }}
                    />
                    <span style={{ color: isClosed ? '#64748b' : '#059669', fontWeight: 600 }}>
                      {isClosed ? 'Closed' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Pipeline Progression Bar */}
                <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569' }}>
                      Ready for Interviews
                    </span>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#009e67' }}>
                      {shortlistedCount} Candidates
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #00b074 0%, #10b981 100%)',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="job-card-footer">
                  <span className="salary" style={{ fontSize: '14px' }}>
                    {job.salaryRange || 'Competitive Salary'}
                  </span>

                  <span
                    className="view-details-btn"
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#00b074',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>View Shortlist</span>
                    <ArrowRightIcon />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shortlisted Candidates Modal */}
      <ShortlistedPipelineModal
        isOpen={!!selectedJobForModal}
        onClose={() => setSelectedJobForModal(null)}
        job={selectedJobForModal}
      />
    </div>
  );
};
