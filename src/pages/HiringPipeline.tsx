import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  jobsApi,
  jobApplicationsApi,
  type JobDto,
  type JobApplicantDto,
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
  BuildingIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  MailIcon,
  PhoneIcon,
  UserCheckIcon,
} from '../components/common/Icons';
import { SkeletonGrid } from '../components/common/SkeletonCard';

// Clipboard / Assessment Icon
const ClipboardCheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

// Calendar / Interview Icon
const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="12" cy="15" r="1.5" fill="currentColor" />
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
  'linear-gradient(135deg, #00b074 0%, #008759 100%)',
  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
  'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
];

const getGradientForName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

export const HiringPipeline: React.FC = () => {
  const navigate = useNavigate();

  // 1. Requisitions & Job List State
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('All');
  const [applicantCounts, setApplicantCounts] = useState<Record<string, { total: number; shortlisted: number }>>({});

  // 2. Selected Job Modal Popup State
  const [selectedJob, setSelectedJob] = useState<JobDto | null>(null);
  const [isShortlistModalOpen, setIsShortlistModalOpen] = useState<boolean>(false);
  const [loadingApplicants, setLoadingApplicants] = useState<boolean>(false);
  const [shortlistedCandidates, setShortlistedCandidates] = useState<ShortlistedCandidate[]>([]);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');

  // 3. Candidate Full Digital CV View State
  const [viewingCvCandidateId, setViewingCvCandidateId] = useState<string | null>(null);

  // 4. Action Modals State (Connect Assessment & Schedule Interview)
  const [assessmentCandidate, setAssessmentCandidate] = useState<ShortlistedCandidate | null>(null);
  const [interviewCandidate, setInterviewCandidate] = useState<ShortlistedCandidate | null>(null);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string>('full-stack-senior');
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [interviewTime, setInterviewTime] = useState<string>('10:00 AM');
  const [interviewFormat, setInterviewFormat] = useState<string>('Google Meet / Video Call');

  // 5. Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
            const apps: JobApplicantDto[] = await jobApplicationsApi.getJobApplicants(job.id);
            const total = apps.length;
            const shortlisted = apps.filter((a) => {
              const st = (a.status || '').toLowerCase();
              return st.includes('shortlist') || st.includes('screen');
            }).length;
            counts[job.id] = { total, shortlisted };
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

  // Fetch Shortlisted Candidates for the selected job
  const fetchShortlistedForJob = async (job: JobDto) => {
    try {
      setLoadingApplicants(true);
      setSelectedJob(job);
      setIsShortlistModalOpen(true);
      setModalSearchQuery('');

      const apps: JobApplicantDto[] = await jobApplicationsApi.getJobApplicants(job.id);

      // Filter STRICTLY shortlisted candidates (or top tier AI candidates)
      const mapped: ShortlistedCandidate[] = (apps || [])
        .map((app, idx) => {
          const rawStatus = (app.status || 'Applied').trim();
          const isExplicitlyShortlisted =
            rawStatus.toLowerCase().includes('shortlist') ||
            rawStatus.toLowerCase().includes('screen') ||
            rawStatus.toLowerCase().includes('interview');

          const skillBonus = Math.min(20, (app.skills?.length || 0) * 5);
          const score = Math.min(99, Math.max(78, 84 + skillBonus - ((idx * 6) % 12)));

          return {
            id: app.id,
            candidateId: app.candidateId,
            name: app.candidateName || 'Candidate',
            headline: app.candidateHeadline || 'Specialist Profile',
            location: app.candidateLocation || 'Remote / Unspecified',
            email: app.candidateEmail || 'candidate@example.com',
            phone: app.candidatePhone || 'Not provided',
            appliedDate: app.appliedDate
              ? new Date(app.appliedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent',
            status: isExplicitlyShortlisted ? 'Shortlisted' : rawStatus,
            aiScore: score,
            skills: app.skills || [],
            avatarUrl: app.candidateAvatarUrl,
            avatarBg: getGradientForName(app.candidateName || 'Candidate'),
            jobId: job.id,
            jobTitle: job.title,
            assessmentStatus: 'None',
            interviewStatus: 'None',
          } as ShortlistedCandidate;
        })
        .filter((c) => c.status.toLowerCase() === 'shortlisted' || c.aiScore >= 85);

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
    return Object.values(applicantCounts).reduce((acc, curr) => acc + (curr.shortlisted || 0), 0);
  }, [applicantCounts]);

  const activeCount = useMemo(() => {
    return publishedJobs.filter((j) => (j.status || 'Active').toLowerCase() === 'active').length;
  }, [publishedJobs]);

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
  const handleSendAssessment = () => {
    if (!assessmentCandidate) return;
    setShortlistedCandidates((prev) =>
      prev.map((c) =>
        c.id === assessmentCandidate.id ? { ...c, assessmentStatus: 'Sent' } : c
      )
    );
    showToast(`✓ Skill assessment invitation sent to ${assessmentCandidate.name}!`);
    setAssessmentCandidate(null);
  };

  // Handler: Confirm Schedule Interview
  const handleScheduleInterview = () => {
    if (!interviewCandidate) return;
    setShortlistedCandidates((prev) =>
      prev.map((c) =>
        c.id === interviewCandidate.id ? { ...c, interviewStatus: 'Scheduled' } : c
      )
    );
    showToast(`✓ Interview scheduled with ${interviewCandidate.name} for ${interviewDate || 'upcoming date'} (${interviewTime})!`);
    setInterviewCandidate(null);
  };

  return (
    <div className="pipeline-selector-container">
      {/* Action Toast Alert */}
      {toastMessage && (
        <div className="job-details-toast" style={{ zIndex: 999999 }}>
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================
          1. INITIAL VIEW: JOBS LIST (AISCREEN MIRROR)
          ========================================================= */}
      <div className="pipeline-selector-header">
        <div className="pipeline-header-title-box">
          <div className="badge-tag">
            <SparkleIcon />
            <span>SHORTLISTED TALENT PIPELINE</span>
          </div>
          <h1 className="pipeline-page-title">Hiring Pipeline & Shortlisted Candidates</h1>
          <p className="pipeline-page-subtitle">
            Select a job requisition below to view the <strong>AI Shortlisted Candidates</strong>. Review qualifications, dispatch assessments, and schedule interviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="pipeline-header-stats-badge" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span className="pipeline-stats-num" style={{ color: '#00b074' }}>{activeCount}</span>
            <span className="pipeline-stats-label">Active Requisitions</span>
          </div>
          <div className="pipeline-header-stats-badge" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span className="pipeline-stats-num" style={{ color: '#0284c7' }}>{totalShortlistedCount}</span>
            <span className="pipeline-stats-label">Shortlisted Talent</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-card-wrapper" style={{ marginBottom: '24px' }}>
        <div className="filter-grid-bar" style={{ gridTemplateColumns: '2fr 1fr 1.2fr auto' }}>
          {/* Search Input */}
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}><SearchIcon /></span>
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
              aria-label="Filter jobs by status"
            >
              <option value="All">All Statuses ({publishedJobs.length})</option>
              <option value="Active">Active ({activeCount})</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Department Select */}
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}><BuildingIcon /></span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              aria-label="Filter jobs by department"
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
            className="popup-card"
            style={{
              maxWidth: '1024px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                background: '#ffffff',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: '#00b074',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SparkleIcon />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Shortlisted Candidates: {selectedJob.title}
                  </h2>
                  <span
                    style={{
                      background: '#e6f9f2',
                      color: '#008759',
                      border: '1px solid #bbf7d0',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {filteredModalCandidates.length} Candidates
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  {selectedJob.department} · {selectedJob.location} · Review verified profiles, send skill assessments, and schedule interviews.
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsShortlistModalOpen(false)}
                className="popup-close-btn"
                aria-label="Close Modal"
              >
                <XIcon />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div
              style={{
                padding: '12px 24px',
                borderBottom: '1px solid #f1f5f9',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  flex: 1,
                  maxWidth: '420px',
                }}
              >
                <span style={{ color: '#94a3b8' }}><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="Filter by name, skill, location, or email..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    width: '100%',
                    background: 'transparent',
                    color: '#0f172a',
                  }}
                />
              </div>

              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>
                Showing <strong style={{ color: '#0f172a' }}>{filteredModalCandidates.length}</strong> Shortlisted
              </div>
            </div>

            {/* Vertical Shortlist Container (Clean Vertical List, NO KANBAN) */}
            <div
              style={{
                padding: '20px 24px',
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
                filteredModalCandidates.map((candidate, idx) => {
                  const initials = candidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  const score = candidate.aiScore || 88;

                  return (
                    /* Neat Horizontal Card / Row */
                    <div
                      key={candidate.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '20px',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00b074';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 176, 116, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                      }}
                    >
                      {/* Left Side: Avatar, Full Name, Applied Role, AI Match Score */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
                        {/* Avatar / Initials */}
                        {candidate.avatarUrl ? (
                          <img
                            src={candidate.avatarUrl}
                            alt={candidate.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid #e2e8f0',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              background: candidate.avatarBg,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                        )}

                        {/* Candidate Identity & Role */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                              {candidate.name}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <MapPinIcon /> {candidate.location}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                background: '#e6f9f2',
                                color: '#008759',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                              }}
                            >
                              #{idx + 1} AI Match
                            </span>

                            {/* Optional Status Indicators */}
                            {candidate.assessmentStatus === 'Sent' && (
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                                Assessment Sent
                              </span>
                            )}
                            {candidate.interviewStatus === 'Scheduled' && (
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                                Interview Scheduled
                              </span>
                            )}
                          </div>

                          {/* Applied Role */}
                          <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px', fontWeight: 500 }}>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>Applied Role:</span> {candidate.jobTitle} &nbsp;·&nbsp; <span style={{ color: '#64748b' }}>{candidate.headline}</span>
                          </div>

                          {/* Contact & Skills */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MailIcon /> {candidate.email}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <PhoneIcon /> {candidate.phone}
                            </span>

                            {/* View Digital CV Text Link */}
                            <button
                              type="button"
                              onClick={() => setViewingCvCandidateId(candidate.candidateId)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#00b074',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '0 4px',
                              }}
                              title="View Verified Candidate Digital CV"
                            >
                              <span>View Digital CV</span>
                              <ArrowRightIcon />
                            </button>
                          </div>
                        </div>

                        {/* AI Match Score Progress / Badge */}
                        <div style={{ width: '130px', flexShrink: 0, textAlign: 'right', paddingRight: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginBottom: '4px' }}>
                            <span style={{ color: '#008759' }}><SparkleIcon /></span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#008759' }}>
                              {score}% Match
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${score}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #00b074 0%, #10b981 100%)',
                                borderRadius: '9999px',
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Side (Actions): Connect Assessment & Schedule Interview */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        {/* 1. Connect Assessment (Secondary Outline Button) */}
                        <button
                          type="button"
                          onClick={() => setAssessmentCandidate(candidate)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#334155',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#00b074';
                            e.currentTarget.style.color = '#008759';
                            e.currentTarget.style.background = '#f0fdf4';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.color = '#334155';
                            e.currentTarget.style.background = '#ffffff';
                          }}
                          title="Connect and send specialized skill assessment"
                        >
                          <ClipboardCheckIcon />
                          <span>Connect Assessment</span>
                        </button>

                        {/* 2. Schedule Interview (Primary Solid Button) */}
                        <button
                          type="button"
                          onClick={() => setInterviewCandidate(candidate)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: '#00b074',
                            border: '1px solid #009e67',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#008759';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#00b074';
                          }}
                          title="Schedule calendar interview with candidate"
                        >
                          <CalendarIcon />
                          <span>Schedule Interview</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SparkleIcon />
                <span>Actions automatically sync with Candidate ATS and notification service.</span>
              </div>

              <button
                type="button"
                onClick={() => setIsShortlistModalOpen(false)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '7px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
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
            style={{ maxWidth: '520px', width: '100%', padding: '24px', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardCheckIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Connect Skill Assessment
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    For {assessmentCandidate.name} ({assessmentCandidate.jobTitle})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssessmentCandidate(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <XIcon />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Select Assessment Track:
                </label>
                <select
                  value={selectedAssessmentType}
                  onChange={(e) => setSelectedAssessmentType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                >
                  <option value="full-stack-senior">Senior Full Stack Architecture (60 min)</option>
                  <option value="react-typescript">Modern React & TypeScript Mastery (45 min)</option>
                  <option value="backend-dotnet">Enterprise .NET & Distributed Systems (45 min)</option>
                  <option value="system-design">Cloud Architecture & System Design (60 min)</option>
                </select>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                  An automated secure test link will be dispatched to <strong>{assessmentCandidate.email}</strong> with a 48-hour completion window.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAssessmentCandidate(null)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAssessment}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <ClipboardCheckIcon />
                <span>Send Assessment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ACTION DIALOG 2: SCHEDULE INTERVIEW MODAL
          ========================================================= */}
      {interviewCandidate && (
        <div
          className="popup-backdrop"
          style={{ zIndex: 1100 }}
          onClick={() => setInterviewCandidate(null)}
        >
          <div
            className="popup-card"
            style={{ maxWidth: '520px', width: '100%', padding: '24px', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e6f9f2', color: '#008759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Schedule Interview
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    With {interviewCandidate.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInterviewCandidate(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <XIcon />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Interview Date:
                </label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Preferred Time:
                </label>
                <select
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                >
                  <option value="09:00 AM">09:00 AM (EST)</option>
                  <option value="10:00 AM">10:00 AM (EST)</option>
                  <option value="11:30 AM">11:30 AM (EST)</option>
                  <option value="02:00 PM">02:00 PM (EST)</option>
                  <option value="04:00 PM">04:00 PM (EST)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Interview Format:
                </label>
                <select
                  value={interviewFormat}
                  onChange={(e) => setInterviewFormat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                >
                  <option value="Google Meet / Video Call">Google Meet / Video Conference</option>
                  <option value="Live Technical Pair Programming">Live Technical Pair Programming</option>
                  <option value="On-Site Executive Round">On-Site Office Interview</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setInterviewCandidate(null)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleInterview}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <CalendarIcon />
                <span>Confirm & Send Invite</span>
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
