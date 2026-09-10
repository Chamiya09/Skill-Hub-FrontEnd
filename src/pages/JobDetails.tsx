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

  if (isLoading) {
    return (
      <div className="job-details-page-wrapper">
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500">Loading vacancy details from database...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !job) {
    return (
      <div className="job-details-page-wrapper">
        <div className="job-details-inner-container">
          <button
            type="button"
            className="job-back-link-btn mb-6"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeftIcon />
            <span>Back to Jobs</span>
          </button>
          <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center max-w-lg mx-auto">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Job Vacancy Not Found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {errorMessage || 'The requested job vacancy was not found in your company repository or may have been deleted.'}
            </p>
            <button
              type="button"
              className="btn-primary inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-medium"
              onClick={() => navigate('/dashboard')}
            >
              Return to Vacancies Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-page-wrapper">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="job-details-toast">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="job-details-inner-container">
        {/* =========================================================
            1. NAVIGATION BAR (← Back to Jobs)
            ========================================================= */}
        <div className="job-details-nav-bar">
          <button
            type="button"
            className="job-back-link-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeftIcon />
            <span>Back to Jobs</span>
          </button>

          <div className="job-breadcrumb-tags">
            <span className="breadcrumb-muted">Dashboard</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-muted">Vacancies</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">{job.title}</span>
          </div>
        </div>

        {/* =========================================================
            2. HEADER SECTION (Title, Dept, Status Pill, Edit & Delete)
            ========================================================= */}
        <div className="job-header-card">
          <div className="job-header-main-box">
            <div className="job-header-meta-row">
              <span className="job-requisition-id">REQ #{job.id.substring(0, 8).toUpperCase()}</span>
              
              {/* Status Pill */}
              {job.status === 'Active' && (
                <span className="badge-pill badge-active">
                  <span className="badge-dot-green"></span>
                  Active
                </span>
              )}
              {job.status === 'Draft' && (
                <span className="badge-pill badge-draft">
                  <span className="badge-dot-amber"></span>
                  Draft
                </span>
              )}
              {job.status === 'Closed' && (
                <span className="badge-pill badge-closed">
                  <span className="badge-dot-gray"></span>
                  Closed
                </span>
              )}

              <span className="job-ai-pill">
                <SparkleIcon />
                <span>95% AI Match Quality</span>
              </span>
            </div>

            <h1 className="job-details-title">{job.title}</h1>

            <div className="job-header-subinfo-list">
              <div className="job-subinfo-item">
                <BuildingIcon />
                <span>{job.department}</span>
              </div>
              <span className="subinfo-divider">•</span>
              <div className="job-subinfo-item">
                <MapPinIcon />
                <span>{job.location}</span>
              </div>
              <span className="subinfo-divider">•</span>
              <div className="job-subinfo-item">
                <CalendarIcon />
                <span>
                  Posted{' '}
                  {new Date(job.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit Vacancy & Direct Delete */}
          <div className="job-header-actions-box">
            <button
              type="button"
              className="btn-secondary job-action-btn"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Vacancy Details"
            >
              <EditIcon />
              <span>Edit Vacancy</span>
            </button>
            <button
              type="button"
              className="btn-danger-outline job-action-btn"
              onClick={() => setIsDeleteModalOpen(true)}
              title="Delete Vacancy"
            >
              <TrashIcon />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            3. TWO-COLUMN MAIN CONTENT LAYOUT
            ========================================================= */}
        <div className="job-details-grid-layout">
          {/* LEFT / MAIN COLUMN: Card 1 (Specs) & Card 2 (Description & What We Offer) */}
          <div className="job-details-main-col">
            {/* ----------------------------------------------------
                CARD 1: JOB SPECIFICATIONS & COMPLIANCE SUMMARY
                ---------------------------------------------------- */}
            <div className="job-card job-specifications-card">
              <h2 className="job-card-heading">
                <BriefcaseIcon />
                <span>Role Specifications</span>
              </h2>

              <div className="job-specs-grid">
                <div className="spec-item-box">
                  <div className="spec-icon-circle">
                    <BriefcaseIcon />
                  </div>
                  <div className="spec-data">
                    <span className="spec-label">Employment Type</span>
                    <span className="spec-value">{job.employmentType}</span>
                  </div>
                </div>

                <div className="spec-item-box">
                  <div className="spec-icon-circle">
                    <GraduationCapIcon />
                  </div>
                  <div className="spec-data">
                    <span className="spec-label">Experience Level</span>
                    <span className="spec-value">{job.experienceLevel}</span>
                  </div>
                </div>

                <div className="spec-item-box">
                  <div className="spec-icon-circle">
                    <DollarSignIcon />
                  </div>
                  <div className="spec-data">
                    <span className="spec-label">Target Compensation</span>
                    <span className="spec-value">{job.salaryRange || 'Competitive / Unspecified'}</span>
                  </div>
                </div>

                <div className="spec-item-box">
                  <div className="spec-icon-circle">
                    <BuildingIcon />
                  </div>
                  <div className="spec-data">
                    <span className="spec-label">Hiring Company</span>
                    <span className="spec-value">{job.companyName || 'Enterprise Employer'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                CARD 2: RICH TEXT DESCRIPTION & WHAT WE OFFER
                ---------------------------------------------------- */}
            <div className="job-card job-description-card">
              <h2 className="job-card-heading">
                <SparkleIcon />
                <span>Role Description & Overview</span>
              </h2>

              {/* Rich Text HTML Description */}
              <div
                className="job-desc-rich-html prose max-w-none text-gray-700 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />

              {/* What We Offer / Benefits */}
              {job.whatWeOffer && (
                <div className="job-desc-section perks-section mt-8 pt-6 border-t border-gray-100">
                  <h3 className="job-desc-subtitle text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <SparkleIcon />
                    <span>What We Offer</span>
                  </h3>
                  <div
                    className="job-benefits-rich-html prose max-w-none text-gray-700 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: job.whatWeOffer }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT / SIDEBAR COLUMN: Card 3 (Applicants Summary) & Quick Links */}
          <div className="job-details-side-col">
            {/* ----------------------------------------------------
                CARD 3: APPLICANTS SUMMARY & CANDIDATE PIPELINE CTA
                ---------------------------------------------------- */}
            <div className="job-card job-pipeline-card">
              <div className="pipeline-card-top">
                <div className="pipeline-badge-row">
                  <span className="pipeline-card-tag">CANDIDATE INTELLIGENCE</span>
                  <span className="pipeline-live-indicator">
                    <span className="live-pulse"></span>
                    Live Pipeline
                  </span>
                </div>

                <div className="pipeline-counter-box">
                  <div className="counter-icon-circle">
                    <UsersIcon />
                  </div>
                  <div className="counter-data">
                    <span className="counter-number">0</span>
                    <span className="counter-title">Total Active Applicants</span>
                  </div>
                </div>
              </div>

              <div className="pipeline-empty-note py-4 text-center text-xs text-gray-500">
                <ClockIcon />
                <span className="ml-1">AI candidate matching is actively evaluating candidate profiles.</span>
              </div>

              {/* Primary Action Button: View Candidates Pipeline */}
              <div className="pipeline-action-box">
                <Link
                  to="/dashboard"
                  className="btn-primary pipeline-cta-btn"
                  title="Open candidate pipeline Kanban board"
                >
                  <KanbanIcon />
                  <span>View Candidates Pipeline</span>
                  <ArrowRightIcon />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. EDIT JOB MODAL
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
          5. DIRECT PHYSICAL DELETE CONFIRMATION MODAL
          ========================================================= */}
      {isDeleteModalOpen && (
        <div className="vacancies-modal-backdrop">
          <div className="vacancies-modal-card delete-confirm-card">
            <div className="delete-modal-icon-box">
              <TrashIcon />
            </div>
            <h3 className="delete-modal-title">Delete Job Vacancy?</h3>
            <p className="delete-modal-desc">
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: '#0f172a' }}>"{job.title}"</strong>?
              This will perform a direct hard-delete from the PostgreSQL database.
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
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
