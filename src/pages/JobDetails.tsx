import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BriefcaseIcon,
  BuildingIcon,
  MapPinIcon,
  DollarSignIcon,
  GraduationCapIcon,
  CalendarIcon,
  UsersIcon,
  SparkleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  KanbanIcon,
  ClockIcon,
  CopyIcon,
  ExternalLinkIcon,
  ShareIcon,
} from '../components/common/Icons';
import { JobFormModal, type JobFormData } from '../components/jobs/JobFormModal';
import { jobsApi, type JobDto } from '../services/api';

export const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchJobDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await jobsApi.getJobById(id);
      setJob(data);
    } catch (err: any) {
      console.error('Error fetching job details:', err);
      setErrorMessage(err.message || 'Failed to load job details from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const handleEditSubmit = async (data: JobFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const updated = await jobsApi.updateJob(id, {
        title: data.title,
        department: data.department,
        location: data.location,
        employmentType: data.type,
        experienceLevel: data.experienceLevel,
        salaryRange: data.salaryRange,
        status: data.status,
        description: data.description,
        whatWeOffer: data.benefits,
      });
      setJob(updated);
      setIsEditModalOpen(false);
      showToast(`Job vacancy "${data.title}" updated successfully.`);
    } catch (err: any) {
      console.error('Error updating job vacancy:', err);
      alert(err.message || 'Failed to update job vacancy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Hard Deletion Handler: DELETE /api/jobs/{id}
  const handleConfirmDirectDelete = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await jobsApi.deleteJob(id);
      setIsDeleteModalOpen(false);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error deleting job vacancy:', err);
      alert(err.message || 'Failed to delete job vacancy.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (!job) return;
    const url = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard.writeText(url);
    showToast('Public job board URL copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="job-details-page-container flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Loading vacancy details from database...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !job) {
    return (
      <div className="job-details-page-container">
        <div className="job-details-wrapper">
          <button
            type="button"
            className="job-details-back-btn w-fit"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeftIcon />
            <span>Back to Vacancies</span>
          </button>
          <div className="job-details-card text-center max-w-lg mx-auto py-12">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <BriefcaseIcon />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Job Vacancy Not Found</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {errorMessage || 'The requested job vacancy was not found in your company repository or may have been deleted.'}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              Return to Vacancies Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(job.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="job-details-page-container">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="job-details-toast">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="job-details-wrapper">
        {/* =========================================================
            1. NAVIGATION & BREADCRUMBS ROW
            ========================================================= */}
        <div className="job-details-nav-row">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              className="job-details-back-btn"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeftIcon />
              <span>Back to Vacancies</span>
            </button>

            <div className="job-details-breadcrumbs">
              <Link to="/dashboard" className="job-details-breadcrumb-link">Dashboard</Link>
              <span className="job-details-breadcrumb-sep">/</span>
              <Link to="/dashboard" className="job-details-breadcrumb-link">Vacancies</Link>
              <span className="job-details-breadcrumb-sep">/</span>
              <span className="job-details-breadcrumb-current">{job.title}</span>
            </div>
          </div>

          <div className="job-details-nav-actions">
            <button
              type="button"
              className="job-details-share-btn"
              onClick={handleCopyPublicLink}
              title="Copy public link to clipboard"
            >
              <ShareIcon />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            2. HERO HEADER BANNER CARD
            ========================================================= */}
        <div className="job-details-hero-card">
          <div className="job-details-hero-left">
            {/* Meta Badges */}
            <div className="job-details-meta-tags">
              <span className="job-details-req-code">
                REQ #{job.id.substring(0, 8).toUpperCase()}
              </span>

              {job.status === 'Active' && (
                <span className="job-details-status-badge active">
                  <span className="job-details-status-dot"></span>
                  Active Requisition
                </span>
              )}
              {job.status === 'Draft' && (
                <span className="job-details-status-badge draft">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Draft Mode
                </span>
              )}
              {job.status === 'Closed' && (
                <span className="job-details-status-badge closed">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Closed
                </span>
              )}

              <span className="job-details-dept-badge">{job.department}</span>

              <span className="job-details-ai-badge">
                <SparkleIcon />
                <span>95% AI Match Pipeline</span>
              </span>
            </div>

            {/* Main Requisition Title */}
            <h1 className="job-details-title">{job.title}</h1>

            {/* Sub-row Information */}
            <div className="job-details-subrow">
              <div className="job-details-subrow-item company-name">
                <BuildingIcon />
                <span>{job.companyName || 'Enterprise Employer'}</span>
              </div>
              <span className="job-details-subrow-sep">•</span>
              <div className="job-details-subrow-item">
                <MapPinIcon />
                <span>{job.location}</span>
              </div>
              <span className="job-details-subrow-sep">•</span>
              <div className="job-details-subrow-item">
                <ClockIcon />
                <span>{job.employmentType}</span>
              </div>
              {job.salaryRange && (
                <>
                  <span className="job-details-subrow-sep">•</span>
                  <div className="job-details-subrow-item font-semibold text-emerald-700">
                    <DollarSignIcon />
                    <span>{job.salaryRange}</span>
                  </div>
                </>
              )}
              <span className="job-details-subrow-sep">•</span>
              <div className="job-details-subrow-item text-slate-500">
                <CalendarIcon />
                <span>Posted {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="job-details-hero-actions">
            <Link
              to={`/dashboard/pipelines/${job.id}`}
              className="btn-pipeline-primary"
              title="Open Talent Pipeline Kanban for this job"
            >
              <KanbanIcon />
              <span>Talent Pipeline</span>
              <ArrowRightIcon />
            </Link>

            <button
              type="button"
              className="btn-details-edit"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Vacancy Details"
            >
              <EditIcon />
              <span>Edit</span>
            </button>

            <button
              type="button"
              className="btn-details-delete"
              onClick={() => setIsDeleteModalOpen(true)}
              title="Delete Vacancy"
            >
              <TrashIcon />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            3. STATS HIGHLIGHT STRIP
            ========================================================= */}
        <div className="job-details-stats-grid">
          <div className="job-details-stat-card">
            <div className="job-details-stat-icon-wrap emerald">
              <UsersIcon />
            </div>
            <div className="job-details-stat-info">
              <span className="job-details-stat-value">0</span>
              <span className="job-details-stat-label">Active Applicants</span>
            </div>
          </div>

          <div className="job-details-stat-card">
            <div className="job-details-stat-icon-wrap blue">
              <SparkleIcon />
            </div>
            <div className="job-details-stat-info">
              <span className="job-details-stat-value">95%</span>
              <span className="job-details-stat-label">Avg AI Match Fit</span>
            </div>
          </div>

          <div className="job-details-stat-card">
            <div className="job-details-stat-icon-wrap indigo">
              <GraduationCapIcon />
            </div>
            <div className="job-details-stat-info">
              <span className="job-details-stat-value">{job.experienceLevel || 'Mid-Senior'}</span>
              <span className="job-details-stat-label">Experience Tier</span>
            </div>
          </div>

          <div className="job-details-stat-card">
            <div className="job-details-stat-icon-wrap amber">
              <BuildingIcon />
            </div>
            <div className="job-details-stat-info">
              <span className="job-details-stat-value">{job.department}</span>
              <span className="job-details-stat-label">Division</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            4. TWO-COLUMN MAIN CONTENT GRID
            ========================================================= */}
        <div className="job-details-layout-grid">
          {/* Main Column (2/3) */}
          <div className="job-details-main-column">
            {/* Card 1: Role Specifications */}
            <div className="job-details-card">
              <div className="job-details-card-header">
                <h2 className="job-details-card-title">
                  <span className="job-details-card-title-icon"><BriefcaseIcon /></span>
                  <span>Role Specifications</span>
                </h2>
              </div>

              <div className="job-details-specs-grid">
                <div className="job-details-spec-tile">
                  <div className="job-details-spec-icon-box">
                    <BriefcaseIcon />
                  </div>
                  <div className="job-details-spec-meta">
                    <span className="job-details-spec-label">Employment Type</span>
                    <span className="job-details-spec-val">{job.employmentType}</span>
                  </div>
                </div>

                <div className="job-details-spec-tile">
                  <div className="job-details-spec-icon-box">
                    <GraduationCapIcon />
                  </div>
                  <div className="job-details-spec-meta">
                    <span className="job-details-spec-label">Experience Level</span>
                    <span className="job-details-spec-val">{job.experienceLevel}</span>
                  </div>
                </div>

                <div className="job-details-spec-tile">
                  <div className="job-details-spec-icon-box">
                    <DollarSignIcon />
                  </div>
                  <div className="job-details-spec-meta">
                    <span className="job-details-spec-label">Target Compensation</span>
                    <span className="job-details-spec-val">{job.salaryRange || 'Competitive / Unspecified'}</span>
                  </div>
                </div>

                <div className="job-details-spec-tile">
                  <div className="job-details-spec-icon-box">
                    <BuildingIcon />
                  </div>
                  <div className="job-details-spec-meta">
                    <span className="job-details-spec-label">Department</span>
                    <span className="job-details-spec-val">{job.department}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Description & Requirements */}
            <div className="job-details-card">
              <div className="job-details-card-header">
                <h2 className="job-details-card-title">
                  <span className="job-details-card-title-icon"><SparkleIcon /></span>
                  <span>Job Description & Requirements</span>
                </h2>
              </div>

              <div
                className="job-details-prose"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />

              {/* What We Offer / Benefits */}
              {job.whatWeOffer && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <span className="text-emerald-600"><CheckIcon /></span>
                    <span>What We Offer (Perks & Benefits)</span>
                  </h3>
                  <div className="job-details-benefits-box">
                    <div
                      className="job-details-prose"
                      dangerouslySetInnerHTML={{ __html: job.whatWeOffer }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column (1/3) */}
          <div className="job-details-sidebar-column">
            {/* Sidebar Card 1: Candidate Pipeline CTA */}
            <div className="job-details-pipeline-card">
              <div className="job-details-pipeline-header">
                <span className="job-details-pipeline-kicker">Candidate Pipeline</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Board
                </span>
              </div>

              <div className="job-details-pipeline-count-row">
                <div className="job-details-pipeline-count-icon">
                  <UsersIcon />
                </div>
                <div>
                  <span className="job-details-pipeline-count-val">0</span>
                  <span className="job-details-pipeline-count-label block">Active Candidates</span>
                </div>
              </div>

              <div className="job-details-ai-hint-box">
                <ClockIcon />
                <span>AI matching is continuously scanning qualified talent profiles for this position.</span>
              </div>

              <Link
                to={`/dashboard/pipelines/${job.id}`}
                className="job-details-pipeline-cta-btn"
                title="View applicants Kanban board"
              >
                <KanbanIcon />
                <span>Open Pipeline Kanban</span>
                <ArrowRightIcon />
              </Link>
            </div>

            {/* Sidebar Card 2: Requisition Governance */}
            <div className="job-details-card">
              <div className="job-details-card-header">
                <h3 className="job-details-card-title">
                  <span className="job-details-card-title-icon"><BuildingIcon /></span>
                  <span>Governance & Links</span>
                </h3>
              </div>

              <div className="job-details-info-table">
                <div className="job-details-info-row">
                  <span className="job-details-info-label">Requisition ID</span>
                  <span className="job-details-info-value font-mono text-xs">{job.id.substring(0, 13)}...</span>
                </div>
                <div className="job-details-info-row">
                  <span className="job-details-info-label">Created</span>
                  <span className="job-details-info-value">{formattedDate}</span>
                </div>
                <div className="job-details-info-row">
                  <span className="job-details-info-label">Status</span>
                  <span className="job-details-info-value">{job.status}</span>
                </div>
                <div className="job-details-info-row">
                  <span className="job-details-info-label">Hiring Company</span>
                  <span className="job-details-info-value">{job.companyName || 'Enterprise'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Public Candidate Link</span>
                <div className="job-details-public-link-box">
                  <Link
                    to={`/jobs/${job.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="job-details-public-link-text"
                  >
                    <span>View Public Board</span>
                    <ExternalLinkIcon />
                  </Link>
                  <button
                    type="button"
                    onClick={handleCopyPublicLink}
                    className="text-slate-400 hover:text-emerald-600 p-1 transition-colors"
                    title="Copy Link"
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          5. EDIT JOB MODAL
          ========================================================= */}
      <JobFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        initialData={{
          title: job.title,
          department: job.department,
          location: job.location,
          type: (job.employmentType as any) || 'Full-time',
          status: (job.status as any) || 'Active',
          experienceLevel: job.experienceLevel,
          salaryRange: job.salaryRange || '',
          description: job.description,
          benefits: job.whatWeOffer || '',
        }}
        isEditMode={true}
      />

      {/* =========================================================
          6. DIRECT HARD DELETE CONFIRMATION MODAL
          ========================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <TrashIcon />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Delete Job Vacancy?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">"{job.title}"</strong>?
                This will permanently remove the requisition from the database.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                disabled={isDeleting}
                onClick={handleConfirmDirectDelete}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
