import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  jobsApi,
  jobApplicationsApi,
  assessmentsApi,
  type JobDto,
  type JobApplicantDto,
  type ShortlistedApplicantDto,
  type AssessmentTrackSummaryDto,
  type DispatchAssessmentResponseDto,
} from '../services/api';
import { CandidateProfileReadOnly } from '../components/candidates/CandidateProfileReadOnly';

import {
  SparkleIcon,
  SearchIcon,
  BriefcaseIcon,
  UsersIcon,
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon,
  PlusIcon,
  XIcon,
  MailIcon,
  PhoneIcon,
  UserCheckIcon,
} from '../components/common/Icons';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import './PipelineJobSelectorFull.css';

// Clipboard / Assessment Icon
const ClipboardCheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

export interface ShortlistedCandidate {
  id: string; // application id
  candidateId: string; // user id
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  appliedDate: string;
  status: string;
  aiScore: number;
  skills: string[];
  avatarUrl?: string;
  avatarBg: string;
  jobId: string;
  jobTitle: string;
  assessmentStatus?: 'None' | 'Sent' | 'Completed';
  interviewStatus?: 'None' | 'Scheduled' | 'Completed';
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #059669 0%, #00b074 100%)', // Corporate Emerald
  'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', // Teal Forest
  'linear-gradient(135deg, #047857 0%, #10b981 100%)', // Forest Mint
  'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)', // Ocean Cyan
  'linear-gradient(135deg, #1e293b 0%, #334155 100%)', // Slate Indigo
  'linear-gradient(135deg, #065f46 0%, #059669 100%)', // Deep Emerald
];

const getGradientForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

const getDaysInStage = (appliedDate: string): number => {
  const startedAt = new Date(appliedDate).getTime();
  if (Number.isNaN(startedAt)) return 1;

  return Math.max(1, Math.ceil((Date.now() - startedAt) / 86_400_000));
};

export const HiringPipeline: React.FC = () => {
  const navigate = useNavigate();

  // 1. Requisitions & Job List State
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Shortlisted' | 'Active' | 'Closed'>('All');
  const [sortBy, setSortBy] = useState<'shortlisted' | 'applicants' | 'newest' | 'title'>('shortlisted');
  const [applicantCounts, setApplicantCounts] = useState<Record<string, { total: number; shortlisted: number }>>({});

  // 2. Selected Job Modal Popup State
  const [selectedJob, setSelectedJob] = useState<JobDto | null>(null);
  const [isShortlistModalOpen, setIsShortlistModalOpen] = useState<boolean>(false);
  const [loadingApplicants, setLoadingApplicants] = useState<boolean>(false);
  const [shortlistedCandidates, setShortlistedCandidates] = useState<ShortlistedCandidate[]>([]);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');

  // 3. Candidate Full Digital CV View State
  const [viewingCvCandidateId, setViewingCvCandidateId] = useState<string | null>(null);

  // 4. Action Modals State (Connect Assessment)
  const [assessmentCandidate, setAssessmentCandidate] = useState<ShortlistedCandidate | null>(null);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string>('');
  const [availableTracks, setAvailableTracks] = useState<AssessmentTrackSummaryDto[]>([]);
  const [loadingTracks, setLoadingTracks] = useState<boolean>(false);
  const [sendingAssessment, setSendingAssessment] = useState<boolean>(false);
  const [dispatchedModalData, setDispatchedModalData] = useState<DispatchAssessmentResponseDto | null>(null);

  // Load available published assessment tracks for the selected job when modal opens
  useEffect(() => {
    if (assessmentCandidate && selectedJob) {
      setLoadingTracks(true);
      assessmentsApi.getTracksByJob(selectedJob.id)
        .then((tracks) => {
          setAvailableTracks(tracks || []);
          if (tracks && tracks.length > 0) {
            setSelectedAssessmentType(tracks[0].id);
          } else {
            setSelectedAssessmentType('');
          }
        })
        .catch((err) => {
          console.warn('Could not load assessment tracks:', err);
          setAvailableTracks([]);
          setSelectedAssessmentType('');
        })
        .finally(() => setLoadingTracks(false));
    }
  }, [assessmentCandidate, selectedJob]);

  // 5. Toast Feedback State
  const [, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Jobs and compute shortlist counts
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await jobsApi.getJobs();
      setJobs(data || []);

      const published = (data || []).filter((j) => (j.status || 'Active').toLowerCase() !== 'draft');
      const counts: Record<string, { total: number; shortlisted: number }> = {};

      await Promise.allSettled(
        published.map(async (job) => {
          try {
            // Use the lightweight shortlisted endpoint just for count
            const shortlistedApps: ShortlistedApplicantDto[] = await jobApplicationsApi.getShortlisted(job.id);
            const apps: JobApplicantDto[] = await jobApplicationsApi.getJobApplicants(job.id);
            counts[job.id] = { total: apps.length, shortlisted: shortlistedApps.length };
          } catch {
            counts[job.id] = { total: 0, shortlisted: 0 };
          }
        })
      );

      setApplicantCounts(counts);
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

  // Fetch Shortlisted Candidates for the selected job using the dedicated endpoint
  const fetchShortlistedForJob = async (job: JobDto) => {
    try {
      setLoadingApplicants(true);
      setSelectedJob(job);
      setIsShortlistModalOpen(true);
      setModalSearchQuery('');

      const apps: ShortlistedApplicantDto[] = await jobApplicationsApi.getShortlisted(job.id);

      const mapped: ShortlistedCandidate[] = (apps || []).map((app) => ({
        id: app.applicationId,
        candidateId: app.candidateId,
        name: app.fullName || 'Candidate',
        headline: app.headline || 'Specialist Profile',
        location: app.location || 'Remote / Unspecified',
        email: app.email || 'candidate@example.com',
        phone: app.phone || 'Not provided',
        appliedDate: app.shortlistedAt
          ? new Date(app.shortlistedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : app.appliedDate
          ? new Date(app.appliedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recent',
        status: 'Shortlisted',
        aiScore: app.aiMatchScore ?? 0,
        skills: app.skills || [],
        avatarUrl: app.avatarUrl,
        avatarBg: getGradientForName(app.fullName || 'Candidate'),
        jobId: job.id,
        jobTitle: job.title,
        assessmentStatus: app.assessmentStatus || 'None',
        interviewStatus: 'None',
      }));

      // Sort by AI score descending
      mapped.sort((a, b) => b.aiScore - a.aiScore);
      setShortlistedCandidates(mapped);
    } catch (err: any) {
      console.error('Error fetching shortlisted applicants:', err);
      showToast('Could not load candidates for this requisition.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Filter Jobs based on user input
  const publishedJobs = useMemo(() => {
    return jobs.filter((j) => (j.status || 'Active').toLowerCase() !== 'draft');
  }, [jobs]);

  const departments = useMemo(() => {
    const set = new Set(publishedJobs.map((j) => j.department?.trim()).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [publishedJobs]);

  const totalShortlistedCount = useMemo(() => {
    return Object.values(applicantCounts).reduce((acc, curr) => acc + (curr.shortlisted || 0), 0);
  }, [applicantCounts]);

  const activeCount = useMemo(() => {
    return publishedJobs.filter((j) => (j.status || 'Active').toLowerCase() === 'active').length;
  }, [publishedJobs]);

  const totalApplicantsCount = useMemo(() => {
    return Object.values(applicantCounts).reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [applicantCounts]);

  const requisitionsWithShortlistCount = useMemo(() => {
    return publishedJobs.filter((j) => (applicantCounts[j.id]?.shortlisted || 0) > 0).length;
  }, [publishedJobs, applicantCounts]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedDepartment !== 'All' || statusFilter !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('All');
    setStatusFilter('All');
    setSortBy('shortlisted');
  };

  const filteredJobs = useMemo(() => {
    const list = publishedJobs.filter((job) => {
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
      const shortlistedNum = applicantCounts[job.id]?.shortlisted || 0;

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Shortlisted' && shortlistedNum > 0) ||
        (statusFilter === 'Active' && jobStatus === 'active') ||
        (statusFilter === 'Closed' && jobStatus === 'closed');

      return matchesSearch && matchesDept && matchesStatus;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'shortlisted') {
        const diff = (applicantCounts[b.id]?.shortlisted || 0) - (applicantCounts[a.id]?.shortlisted || 0);
        if (diff !== 0) return diff;
        return (applicantCounts[b.id]?.total || 0) - (applicantCounts[a.id]?.total || 0);
      }
      if (sortBy === 'applicants') {
        return (applicantCounts[b.id]?.total || 0) - (applicantCounts[a.id]?.total || 0);
      }
      if (sortBy === 'newest') {
        const timeB = new Date(b.createdAt || 0).getTime();
        const timeA = new Date(a.createdAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [publishedJobs, searchQuery, selectedDepartment, statusFilter, sortBy, applicantCounts]);

  // Filtered Candidates inside Modal
  const filteredModalCandidates = useMemo(() => {
    if (!modalSearchQuery.trim()) return shortlistedCandidates;
    const q = modalSearchQuery.toLowerCase().trim();
    return shortlistedCandidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q)) ||
        c.location.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [shortlistedCandidates, modalSearchQuery]);

  // Handler: Confirm Assessment
  const handleSendAssessment = async () => {
    if (!assessmentCandidate || !selectedJob) return;
    try {
      setSendingAssessment(true);
      let targetAssessmentId = selectedAssessmentType;
      if (!targetAssessmentId && availableTracks.length > 0) {
        targetAssessmentId = availableTracks[0].id;
      }

      if (!targetAssessmentId) {
        showToast('No published assessment track found. Please configure and publish a manual assessment track first under Coding Assessments.');
        return;
      }

      const dispatchRes = await assessmentsApi.dispatch({
        assessmentId: targetAssessmentId,
        candidateId: assessmentCandidate.candidateId,
        applicationId: assessmentCandidate.id,
        jobVacancyId: selectedJob.id,
        cvMatchScore: assessmentCandidate.aiScore,
      });

      setShortlistedCandidates((prev) =>
        prev.map((c) =>
          c.id === assessmentCandidate.id ? { ...c, assessmentStatus: 'Sent' } : c
        )
      );

      setAssessmentCandidate(null);
      setDispatchedModalData(dispatchRes);
      showToast(`✓ Skill assessment successfully dispatched to ${assessmentCandidate.name}!`);
    } catch (err: any) {
      console.error('Error dispatching assessment:', err);
      showToast(err.message || 'Failed to dispatch skill assessment.');
    } finally {
      setSendingAssessment(false);
    }
  };

  return (
    <div className="pipeline-selector-container hiring-pipeline-page">
      {/* =========================================================
          1. TOP COMPONENT: HIRING PIPELINE DASHBOARD CARD
          (Matches Candidate Technical Assessments Dashboard Header & Metrics)
          ========================================================= */}
      <section className="pipeline-dashboard-card" aria-labelledby="pipeline-dashboard-title">
        <div className="pipeline-dashboard-header">
          <div>
            <span className="pipeline-dashboard-eyebrow">AI Shortlisted Candidates & Talent Pipeline</span>
            <h2 id="pipeline-dashboard-title">Hiring Pipeline Dashboard</h2>
            <p>
              Review qualified talent pools who passed AI screening, inspect digital CV profiles, track recruitment progression, and dispatch skill assessments.
            </p>
          </div>

          <div className="pipeline-dashboard-header-actions">
            <span className="pipeline-dashboard-live">
              <span /> Pipeline Active
            </span>
            <button
              type="button"
              className="btn-primary pipeline-action-btn"
              onClick={() => setStatusFilter(statusFilter === 'Shortlisted' ? 'All' : 'Shortlisted')}
              title={statusFilter === 'Shortlisted' ? 'Show all requisitions' : 'Filter to roles with shortlisted candidates'}
            >
              <SparkleIcon />
              <span>{statusFilter === 'Shortlisted' ? 'Show All Roles' : `Shortlisted Talent (${totalShortlistedCount})`}</span>
            </button>
          </div>
        </div>

        <div className="pipeline-summary-grid">
          <article className="pipeline-summary-card summary-total">
            <div className="summary-icon"><BriefcaseIcon /></div>
            <div>
              <span>Total Requisitions</span>
              <strong>{publishedJobs.length}</strong>
              <small>Published hiring campaigns</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-ready">
            <div className="summary-icon"><SparkleIcon /></div>
            <div>
              <span>Shortlisted Talent</span>
              <strong>{totalShortlistedCount}</strong>
              <small>Passed AI benchmark</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-active">
            <div className="summary-icon"><ClockIcon /></div>
            <div>
              <span>Active Openings</span>
              <strong>{activeCount}</strong>
              <small>Open for applications</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-applicants">
            <div className="summary-icon"><UsersIcon /></div>
            <div>
              <span>Total Candidates</span>
              <strong>{totalApplicantsCount}</strong>
              <small>Applicants in pipeline</small>
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
            <span className="filter-eyebrow">Pipeline workspace</span>
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
              className={`tab-btn ${statusFilter === 'Shortlisted' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Shortlisted')}
            >
              With Shortlist ({requisitionsWithShortlistCount})
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              Active Openings ({activeCount})
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
              <option value="shortlisted">Most shortlisted</option>
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

      {/* Jobs Grid Display */}
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
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            No Job Requisitions Found
          </h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
            Create a requisition to start screening candidates and advancing shortlisted talent through the hiring pipeline.
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
            Try adjusting your search criteria or resetting filters.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="pipeline-jobs-grid">
          {filteredJobs.map((job) => {
            const isClosed = (job.status || '').toLowerCase() === 'closed';
            const stats = applicantCounts[job.id] || { total: 0, shortlisted: 0 };

            return (
              <div
                key={job.id}
                className="pipeline-job-card"
                onClick={() => fetchShortlistedForJob(job)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fetchShortlistedForJob(job);
                  }
                }}
              >
                {/* Topbar: Dept & Status */}
                <div className="pipeline-card-topbar">
                  <span className="pipeline-dept-badge">{job.department}</span>
                  <span
                    className={`pipeline-status-pill ${isClosed ? 'closed' : ''}`}
                    style={
                      isClosed
                        ? { background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }
                        : undefined
                    }
                  >
                    <span
                      className="pipeline-status-dot"
                      style={isClosed ? { background: '#64748b' } : undefined}
                    ></span>
                    {isClosed ? 'Closed' : 'Active'}
                  </span>
                </div>

                {/* Job Title */}
                <h3 className="pipeline-card-title">{job.title}</h3>

                {/* Meta Items */}
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

                {/* Metric & Shortlisted Count */}
                <div className="pipeline-card-metrics">
                  <div className="pipeline-applicant-count">
                    <UsersIcon />
                    <span>{stats.total} Total Applicants</span>
                  </div>
                  <div
                    className="pipeline-ai-badge"
                    style={{
                      background: '#e6f9f2',
                      color: '#008759',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    <SparkleIcon />
                    <span>{stats.shortlisted} Shortlisted</span>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="pipeline-card-footer">
                  <span className="pipeline-salary-text">
                    {job.salaryRange || 'Competitive Compensation'}
                  </span>
                  <button
                    type="button"
                    className="pipeline-open-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchShortlistedForJob(job);
                    }}
                    style={{
                      background: '#00b074',
                      color: '#ffffff',
                      border: '1px solid #009e67',
                    }}
                  >
                    <UserCheckIcon />
                    <span>View Shortlist ({stats.shortlisted})</span>
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================
          2 & 3. THE MODAL POPUP (VERTICAL SHORTLIST - MAX-W-5XL)
          ========================================================= */}
      {isShortlistModalOpen && selectedJob && (
        <div
          className="popup-backdrop"
          style={{ zIndex: 1000 }}
          onClick={() => setIsShortlistModalOpen(false)}
        >
          {/* Wide Modal Container (max-w-5xl, Premium Corporate Light Theme) */}
          <div
            className="popup-card shortlist-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shortlist-modal-header">
              <div className="shortlist-modal-header-left">
                <div className="shortlist-modal-icon-badge">
                  <SparkleIcon />
                </div>
                <div>
                  <div className="shortlist-modal-title-row">
                    <h2 className="shortlist-modal-title">
                      <span>Shortlisted Candidates:</span>
                      <span className="shortlist-job-pill">{selectedJob.title}</span>
                    </h2>
                    <span className="shortlist-count-badge">
                      {filteredModalCandidates.length} Candidates
                    </span>
                  </div>
                  <p className="shortlist-modal-subtitle">
                    <span>{selectedJob.department}</span>
                    <span>·</span>
                    <span>{selectedJob.location}</span>
                    <span>·</span>
                    <span>Review verified profiles and send skill assessments.</span>
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsShortlistModalOpen(false)}
                className="shortlist-modal-close-btn"
                aria-label="Close Modal"
              >
                <XIcon />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="shortlist-filter-row">
              <div className="shortlist-search-box">
                <span className="shortlist-search-icon"><SearchIcon /></span>
                <input
                  type="text"
                  className="shortlist-search-input"
                  placeholder="Filter by name, skill, location, or email..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                />
              </div>

              <div className="shortlist-showing-badge">
                <span className="shortlist-pulse-dot" />
                <span>Showing <strong>{filteredModalCandidates.length}</strong> Shortlisted</span>
              </div>
            </div>

            {/* Vertical Shortlist Container (Clean Vertical List, NO KANBAN) */}
            <div
              style={{
                padding: '20px 28px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                flex: 1,
              }}
            >
              {loadingApplicants ? (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                    Loading shortlisted talent from database...
                  </p>
                </div>
              ) : filteredModalCandidates.length === 0 ? (
                <div
                  style={{
                    padding: '56px 24px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <UserCheckIcon />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    No Shortlisted Candidates Found
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '380px', margin: '0 auto 16px' }}>
                    {modalSearchQuery
                      ? 'No candidates match your current filter query.'
                      : 'Run AI Screening on this requisition to evaluate and shortlist the best-fit applicants.'}
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '12.5px', padding: '7px 16px' }}
                    onClick={() => {
                      setIsShortlistModalOpen(false);
                      navigate('/dashboard/pipelines');
                    }}
                  >
                    <SparkleIcon />
                    <span>Go to AI Screening Requisitions</span>
                  </button>
                </div>
              ) : (
                filteredModalCandidates.map((candidate) => {
                  const initials = candidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  const daysInStage = getDaysInStage(candidate.appliedDate);
                  const stageDetail = candidate.interviewStatus === 'Scheduled'
                    ? 'Interview scheduled — preparation in progress'
                    : candidate.assessmentStatus === 'Sent'
                      ? 'Assessment sent — awaiting completion'
                      : `In Shortlist for ${daysInStage} ${daysInStage === 1 ? 'day' : 'days'}`;

                  return (
                    <div
                      key={candidate.id}
                      className="pipeline-candidate-card"
                    >
                      <div className="pipeline-candidate-identity">
                        {candidate.avatarUrl ? (
                          <img
                            src={candidate.avatarUrl}
                            alt={candidate.name}
                            className="pipeline-candidate-avatar object-cover"
                          />
                        ) : (
                          <div className="pipeline-candidate-avatar" style={{ background: candidate.avatarBg }}>
                            {initials}
                          </div>
                        )}

                        <div className="pipeline-candidate-copy">
                          <div className="pipeline-candidate-name-row">
                            <h4>{candidate.name}</h4>
                            <span className="pipeline-candidate-location">
                              <MapPinIcon /> {candidate.location}
                            </span>
                          </div>
                          <p className="pipeline-candidate-role">
                            <span className="pipeline-job-badge">{candidate.jobTitle}</span>
                            <span>{candidate.headline}</span>
                          </p>
                          <span className="pipeline-stage-detail">
                            <ClockIcon /> {stageDetail}
                          </span>
                          <div className="pipeline-candidate-contact">
                            <span><MailIcon /> {candidate.email}</span>
                            <span><PhoneIcon /> {candidate.phone}</span>
                            <button
                              type="button"
                              className="pipeline-view-cv-link"
                              onClick={() => setViewingCvCandidateId(candidate.candidateId)}
                              title="View Verified Candidate Digital CV"
                            >
                              <span>View CV</span>
                              <ArrowRightIcon />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pipeline-candidate-actions">
                        <button
                          type="button"
                          onClick={() => setAssessmentCandidate(candidate)}
                          className="pipeline-action-btn pipeline-action-secondary"
                          title="Connect and send specialized skill assessment"
                        >
                          <ClipboardCheckIcon />
                          <span>Connect Assessment</span>
                        </button>
                      </div>


                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="shortlist-modal-footer">
              <div className="shortlist-footer-sync">
                <SparkleIcon />
                <span>Actions automatically sync with Candidate ATS and notification service.</span>
              </div>

              <button
                type="button"
                onClick={() => setIsShortlistModalOpen(false)}
                className="shortlist-modal-footer-close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ACTION DIALOG 1: CONNECT ASSESSMENT MODAL
          ========================================================= */}
      {assessmentCandidate && (
        <div
          className="popup-backdrop"
          style={{ zIndex: 1100 }}
          onClick={() => setAssessmentCandidate(null)}
        >
          <div
            className="popup-card"
            style={{ maxWidth: '520px', width: '100%', padding: '24px 28px', borderRadius: '20px', border: '1px solid #dce7e3', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.22)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#ecfdf5', color: '#00b074', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0, 176, 116, 0.12)' }}>
                  <ClipboardCheckIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                    Connect Skill Assessment
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                    For <strong style={{ color: '#0f172a' }}>{assessmentCandidate.name}</strong> ({assessmentCandidate.jobTitle})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssessmentCandidate(null)}
                className="shortlist-modal-close-btn"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Select Assessment Track:
                </label>
                {loadingTracks ? (
                  <div style={{ fontSize: '13px', color: '#64748b', padding: '8px 0' }}>
                    Loading available technical tracks...
                  </div>
                ) : (
                  <select
                    value={selectedAssessmentType}
                    onChange={(e) => setSelectedAssessmentType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9.5px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      background: '#ffffff',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                    }}
                  >
                    {availableTracks.length > 0 ? (
                      availableTracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.timeLimitMinutes} min • {t.questionCount} coding problems)
                        </option>
                      ))
                    ) : (
                      <option value="">
                        No published technical assessment tracks available
                      </option>
                    )}
                  </select>
                )}
              </div>

              <div style={{ padding: '14px 16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <p style={{ fontSize: '12.5px', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                  This technical assessment will be delivered directly to <strong>{assessmentCandidate.name}</strong>'s candidate profile under their <strong>Technical Assessments</strong> dashboard.
                </p>
                {availableTracks.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#dc2626', margin: '8px 0 0 0', fontWeight: 600 }}>
                    ⚠️ No published assessment tracks found for this requisition. Please configure and publish a manual assessment track first under the Coding Assessments tab.
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAssessmentCandidate(null)}
                className="btn-secondary"
                disabled={sendingAssessment}
                style={{ padding: '8.5px 20px', fontSize: '13px', borderRadius: '9999px', fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAssessment}
                className="btn-primary"
                disabled={sendingAssessment || availableTracks.length === 0}
                style={{
                  padding: '9px 22px',
                  fontSize: '13px',
                  borderRadius: '9999px',
                  fontWeight: 750,
                  background: 'linear-gradient(135deg, #059669 0%, #00b074 100%)',
                  boxShadow: '0 3px 10px rgba(0, 176, 116, 0.25)',
                  opacity: availableTracks.length === 0 ? 0.5 : 1,
                  cursor: availableTracks.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <ClipboardCheckIcon />
                <span>{sendingAssessment ? 'Dispatching...' : 'Dispatch to Candidate Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ACTION DIALOG: DISPATCHED TEST LINK CONFIRMATION
          ========================================================= */}
      {dispatchedModalData && (
        <div
          className="popup-backdrop"
          style={{ zIndex: 1150 }}
          onClick={() => setDispatchedModalData(null)}
        >
          <div
            className="popup-card"
            style={{ maxWidth: '540px', width: '100%', padding: '24px', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardCheckIcon />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Assessment Delivered to Candidate Profile
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                  Delivered to {dispatchedModalData.candidateEmail}
                </p>
              </div>
            </div>

            <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '10px', border: '1px solid #a7f3d0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: 700, fontSize: '12.5px', marginBottom: '4px' }}>
                <ClipboardCheckIcon />
                <span>Available on Candidate Dashboard</span>
              </div>
              <p style={{ fontSize: '12px', color: '#065f46', margin: 0, lineHeight: 1.5 }}>
                The candidate can now log into their candidate portal, open <strong>Technical Assessments</strong> in their navigation menu, and complete the coding challenges directly from their profile.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                DIRECT TEST LINK (FOR TESTING / SHARING):
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${dispatchedModalData.testLink}`}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${dispatchedModalData.testLink}`);
                    showToast('✓ Link copied to clipboard!');
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                >
                  Copy Link
                </button>
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '8px 0 0 0' }}>
                Completion Window: <strong>48 hours</strong> • Track: <strong>{dispatchedModalData.assessmentTitle}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDispatchedModalData(null)}
                className="btn-primary"
                style={{ padding: '8px 22px', fontSize: '13px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}



      {/* =========================================================
          FULL DIGITAL CV DRAWER (CandidateProfileReadOnly)
          ========================================================= */}
      {viewingCvCandidateId && (
        <>
          <div
            className="candidate-cv-drawer-overlay"
            style={{ zIndex: 1200 }}
            onClick={() => setViewingCvCandidateId(null)}
          />
          <div
            className="candidate-cv-drawer"
            style={{ width: '100%', maxWidth: '850px', overflowY: 'auto', zIndex: 1201 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CandidateProfileReadOnly
              candidateId={viewingCvCandidateId}
              onClose={() => setViewingCvCandidateId(null)}
            />
          </div>
        </>
      )}
    </div>
  );
};
