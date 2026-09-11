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
      <div className="min-h-screen bg-slate-50/50 p-6 sm:p-10 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading vacancy details from database...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !job) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 sm:p-10">
        <div className="max-w-5xl mx-auto">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors mb-6"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeftIcon />
            <span>Back to Vacancies</span>
          </button>
          <div className="p-10 bg-white border border-slate-200 rounded-2xl text-center max-w-lg mx-auto">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
              <BriefcaseIcon />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Job Vacancy Not Found</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {errorMessage || 'The requested job vacancy was not found in your company repository or may have been deleted.'}
            </p>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
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
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-10 text-slate-900">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl flex items-center gap-3 text-sm font-medium shadow-lg animate-bounce">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* =========================================================
            1. NAVIGATION BAR (← Back to Jobs & Breadcrumbs)
            ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-fit"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeftIcon />
            <span>Back to Vacancies</span>
          </button>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 overflow-hidden">
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate('/dashboard')}>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate('/dashboard')}>Vacancies</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900 truncate max-w-xs">{job.title}</span>
          </div>
        </div>

        {/* =========================================================
            2. HEADER SECTION (Title, Dept, Status Pill, Edit & Delete)
            ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            {/* Meta Tags Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200/60">
                REQ #{job.id.substring(0, 8).toUpperCase()}
              </span>

              {/* Status Pill */}
              {job.status === 'Active' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Requisition
                </span>
              )}
              {job.status === 'Draft' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Draft Mode
                </span>
              )}
              {job.status === 'Closed' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Closed
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <SparkleIcon />
                <span>95% AI Match Pipeline</span>
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {job.title}
            </h1>

            {/* Department / Location / Date Sub-row */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-600 pt-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <BuildingIcon />
                <span>{job.department}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <MapPinIcon />
                <span>{job.location}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-slate-500">
                <CalendarIcon />
                <span>
                  Posted on{' '}
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
          <div className="flex items-center gap-3 self-start pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-colors"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Vacancy Details"
            >
              <EditIcon />
              <span>Edit Vacancy</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT / MAIN COLUMN: Card 1 (Specs) & Card 2 (Description & What We Offer) */}
          <div className="lg:col-span-2 space-y-6">
            {/* ----------------------------------------------------
                CARD 1: JOB SPECIFICATIONS & COMPLIANCE SUMMARY
                ---------------------------------------------------- */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <BriefcaseIcon />
                <span>Role Specifications</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                    <BriefcaseIcon />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Employment Type</span>
                    <span className="block text-sm font-semibold text-slate-900 mt-0.5">{job.employmentType}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                    <GraduationCapIcon />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Experience Level</span>
                    <span className="block text-sm font-semibold text-slate-900 mt-0.5">{job.experienceLevel}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                    <DollarSignIcon />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Target Compensation</span>
                    <span className="block text-sm font-semibold text-slate-900 mt-0.5">{job.salaryRange || 'Competitive / Unspecified'}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                    <BuildingIcon />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Hiring Company</span>
                    <span className="block text-sm font-semibold text-slate-900 mt-0.5">{job.companyName || 'Enterprise Employer'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                CARD 2: RICH TEXT DESCRIPTION & WHAT WE OFFER
                ---------------------------------------------------- */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <SparkleIcon />
                <span>Job Description & Requirements</span>
              </h2>

              {/* Rich Text HTML Description */}
              <div
                className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />

              {/* What We Offer / Benefits */}
              {job.whatWeOffer && (
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <SparkleIcon />
                    <span>What We Offer (Perks & Benefits)</span>
                  </h3>
                  <div
                    className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: job.whatWeOffer }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT / SIDEBAR COLUMN: Card 3 (Applicants Summary) & Quick Links */}
          <div className="space-y-6">
            {/* ----------------------------------------------------
                CARD 3: APPLICANTS SUMMARY & CANDIDATE PIPELINE CTA
                ---------------------------------------------------- */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CANDIDATE INTELLIGENCE</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Pipeline
                </span>
              </div>

              {/* Counter Display */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <UsersIcon />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 block leading-tight">0</span>
                  <span className="text-xs font-medium text-slate-500">Total Active Applicants</span>
                </div>
              </div>

              {/* Note */}
              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                <ClockIcon />
                <span>AI candidate matching is actively parsing qualified talent profiles for this position.</span>
              </div>

              {/* Primary Action Button: View Candidates Pipeline */}
              <div>
                <Link
                  to="/dashboard"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 animate-scaleUp">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <TrashIcon />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Delete Job Vacancy?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">"{job.title}"</strong>?
                This will perform a direct hard-delete from the PostgreSQL database.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
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
