import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SearchIcon,
  UsersIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  BuildingIcon,
  MapPinIcon,
  CheckIcon,
} from '../components/common/Icons';
import { JobFormModal, type JobFormData } from '../components/jobs/JobFormModal';
import { jobsApi, type JobDto } from '../services/api';

export interface JobVacancyItem {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Contract' | 'Part-time' | 'Remote';
  status: 'Active' | 'Draft' | 'Closed';
  applicantsCount: number;
  aiMatchScore: number;
  postedDate: string;
  description?: string;
  benefits?: string;
  experienceLevel?: string;
  salaryRange?: string;
}

export const JobVacancies = () => {
  const [vacancies, setVacancies] = useState<JobVacancyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Multi-Step Modal State
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobVacancyItem | null>(null);

  // Modal states for Direct Delete
  const [vacancyToDelete, setVacancyToDelete] = useState<JobVacancyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch real jobs from PostgreSQL via backend API
  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data: JobDto[] = await jobsApi.getJobs();
      const mapped: JobVacancyItem[] = data.map((j) => ({
        id: j.id,
        title: j.title,
        department: j.department,
        location: j.location,
        type: (j.employmentType as any) || 'Full-time',
        status: (j.status as any) || 'Active',
        experienceLevel: j.experienceLevel,
        salaryRange: j.salaryRange || '',
        applicantsCount: 0,
        aiMatchScore: 95,
        postedDate: j.createdAt ? j.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        description: j.description,
        benefits: j.whatWeOffer || '',
      }));
      setVacancies(mapped);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setErrorMessage(err.message || 'Failed to load job vacancies.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Departments list dynamically computed
  const departments = useMemo(() => {
    const set = new Set(vacancies.map((v) => v.department));
    return ['All', ...Array.from(set).filter(Boolean)];
  }, [vacancies]);

  // Filtered vacancies
  const filteredVacancies = useMemo(() => {
    return vacancies.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
      const matchesDept = departmentFilter === 'All' || job.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [vacancies, searchQuery, statusFilter, departmentFilter]);

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleOpenCreate = () => {
    setEditingJob(null);
    setIsJobModalOpen(true);
  };

  const handleOpenEdit = (job: JobVacancyItem) => {
    setEditingJob(job);
    setIsJobModalOpen(true);
  };

  const handleJobModalSubmit = async (data: JobFormData) => {
    try {
      setIsSubmitting(true);
      if (editingJob) {
        // Edit Mode: PUT /api/jobs/{id}
        await jobsApi.updateJob(editingJob.id, {
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
        showToast(`Vacancy "${data.title}" updated successfully.`);
      } else {
        // Create Mode: POST /api/jobs
        await jobsApi.createJob({
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
        showToast(`New vacancy "${data.title}" published successfully.`);
      }
      setIsJobModalOpen(false);
      await fetchJobs();
    } catch (err: any) {
      console.error('Error saving job vacancy:', err);
      alert(err.message || 'Failed to save job vacancy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Hard Delete Handler: DELETE /api/jobs/{id}
  const handleConfirmDirectDelete = async () => {
    if (!vacancyToDelete) return;
    try {
      setIsDeleting(true);
      await jobsApi.deleteJob(vacancyToDelete.id);
      const deletedTitle = vacancyToDelete.title;
      setVacancies((prev) => prev.filter((v) => v.id !== vacancyToDelete.id));
      setVacancyToDelete(null);
      showToast(`Vacancy "${deletedTitle}" permanently deleted from database.`);
    } catch (err: any) {
      console.error('Error deleting job vacancy:', err);
      alert(err.message || 'Failed to delete job vacancy.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="job-vacancies-container">
      {/* Toast Notification */}
      {successToast && (
        <div className="vacancies-toast-banner">
          <CheckIcon />
          <span>{successToast}</span>
        </div>
      )}

      {/* =========================================================
          1. PAGE HEADER
          ========================================================= */}
      <div className="vacancies-page-header">
        <div className="vacancies-header-title-box">
          <div className="vacancies-title-row">
            <h1 className="vacancies-page-title">Job Vacancies</h1>
            <span className="vacancies-count-badge">
              {vacancies.filter((v) => v.status === 'Active').length} Active Roles
            </span>
          </div>
          <p className="vacancies-page-subtitle">
            Manage your corporate requisitions, monitor candidate pipelines, and post new positions to your PostgreSQL database.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary vacancies-create-btn"
          onClick={handleOpenCreate}
        >
          <PlusIcon />
          <span>Create New Job</span>
        </button>
      </div>

      {/* =========================================================
          2. SEARCH & FILTER CONTROLS BAR
          ========================================================= */}
      <div className="vacancies-filter-card">
        <div className="vacancies-search-group">
          <div className="vacancies-input-wrapper">
            <div className="vacancies-input-icon">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by job title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="vacancies-search-input"
            />
          </div>
        </div>

        <div className="vacancies-filter-dropdowns">
          {/* Status Filter */}
          <div className="vacancies-select-wrapper">
            <label htmlFor="status-filter-select" className="vacancies-filter-label">Status</label>
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="vacancies-select-input"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="vacancies-select-wrapper">
            <label htmlFor="dept-filter-select" className="vacancies-filter-label">Department</label>
            <select
              id="dept-filter-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="vacancies-select-input"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters CTA */}
          {(searchQuery || statusFilter !== 'All' || departmentFilter !== 'All') && (
            <button
              type="button"
              className="vacancies-reset-btn"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setDepartmentFilter('All');
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
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

      {/* =========================================================
          3. DATA TABLE (PREMIUM CORPORATE LIGHT THEME)
          ========================================================= */}
      <div className="vacancies-table-card">
        <div className="vacancies-table-container">
          <table className="vacancies-data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '280px' }}>JOB TITLE & ROLE</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th>APPLICANTS</th>
                <th>DATE POSTED</th>
                <th style={{ textAlign: 'right', minWidth: '120px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-medium text-gray-500">Loading vacancies from database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredVacancies.length > 0 ? (
                filteredVacancies.map((job) => (
                  <tr key={job.id} className="vacancies-table-row">
                    {/* Job Title Column */}
                    <td>
                      <div className="job-title-col">
                        <Link to={`/dashboard/jobs/${job.id}`} className="job-name-link" title="View Job Details">
                          <span className="job-name-text">{job.title}</span>
                        </Link>
                        <div className="job-meta-subrow">
                          <span className="job-loc-tag">
                            <MapPinIcon />
                            {job.location}
                          </span>
                          <span className="meta-sep">•</span>
                          <span className="job-type-tag">{job.type}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department Column */}
                    <td>
                      <div className="dept-cell-box">
                        <BuildingIcon />
                        <span className="dept-text">{job.department}</span>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td>
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
                    </td>

                    {/* Applicants Count Column */}
                    <td>
                      <div className="applicants-cell-box">
                        <div className="applicants-icon-wrap">
                          <UsersIcon />
                        </div>
                        <span className="applicants-count-num">
                          {job.applicantsCount} Applicants
                        </span>
                      </div>
                    </td>

                    {/* Date Posted Column */}
                    <td>
                      <span className="date-posted-text">
                        {new Date(job.postedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Actions Column: Edit & Direct Delete */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell-group">
                        <button
                          type="button"
                          className="action-icon-btn edit-btn"
                          title="Edit Job Vacancy"
                          onClick={() => handleOpenEdit(job)}
                          aria-label={`Edit ${job.title}`}
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn delete-btn"
                          title="Delete Job Vacancy"
                          onClick={() => setVacancyToDelete(job)}
                          aria-label={`Delete ${job.title}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div className="vacancies-empty-state">
                      <div className="empty-icon-circle">
                        <SearchIcon />
                      </div>
                      <h4 className="empty-state-title">No job vacancies found</h4>
                      <p className="empty-state-desc">
                        {searchQuery || statusFilter !== 'All' || departmentFilter !== 'All'
                          ? 'No requisitions matched your search query or filter selection.'
                          : 'You haven\'t posted any job vacancies yet. Click "Create New Job" to add your first position.'}
                      </p>
                      {(searchQuery || statusFilter !== 'All' || departmentFilter !== 'All') && (
                        <button
                          type="button"
                          className="btn-secondary empty-reset-btn"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('All');
                            setDepartmentFilter('All');
                          }}
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          4. DIRECT PHYSICAL DELETE CONFIRMATION MODAL
          ========================================================= */}
      {vacancyToDelete && (
        <div className="vacancies-modal-backdrop">
          <div className="vacancies-modal-card delete-confirm-card">
            <div className="delete-modal-icon-box">
              <TrashIcon />
            </div>
            <h3 className="delete-modal-title">Delete Job Vacancy?</h3>
            <p className="delete-modal-desc">
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: '#0f172a' }}>"{vacancyToDelete.title}"</strong>?
              This will perform a direct hard-delete from the PostgreSQL database.
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={isDeleting}
                onClick={() => setVacancyToDelete(null)}
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

      {/* =========================================================
          5. MULTI-STEP JOB FORM MODAL (CREATE & EDIT)
          ========================================================= */}
      <JobFormModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSubmit={handleJobModalSubmit}
        isSubmitting={isSubmitting}
        initialData={
          editingJob
            ? {
                title: editingJob.title,
                department: editingJob.department,
                location: editingJob.location,
                type: editingJob.type,
                status: editingJob.status,
                experienceLevel: editingJob.experienceLevel || 'Senior Level (5+ Yrs)',
                salaryRange: editingJob.salaryRange || '',
                description: editingJob.description || '',
                benefits: editingJob.benefits || '',
              }
            : null
        }
        isEditMode={!!editingJob}
      />
    </div>
  );
};
