import { useState, useMemo, useEffect } from 'react';
import {
  SearchIcon,
  UsersIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  BuildingIcon,
  MapPinIcon,
  CheckIcon,
  SparkleIcon,
  XIcon,
  ClockIcon,
} from '../components/common/Icons';
import { Briefcase } from 'lucide-react';
import { JobFormModal, type JobFormData } from '../components/jobs/JobFormModal';
import { CandidatesListModal } from '../components/candidates/CandidatesListModal';
import { jobsApi, type JobDto } from '../services/api';
import { TableRowSkeleton } from '../components/common/SkeletonCard';
import './JobVacanciesFull.css';

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
  tags?: string[];
  deadline?: string;
}

export const JobVacancies = () => {
  const [vacancies, setVacancies] = useState<JobVacancyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'applicants' | 'title'>('newest');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const employmentTypes = ['All', 'Full-time', 'Contract', 'Part-time', 'Remote'];

  // Multi-Step Modal State
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobVacancyItem | null>(null);

  // Applicants Modal State
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<JobDto | null>(null);

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
        applicantsCount: j.applicantsCount || 0,
        aiMatchScore: 95,
        postedDate: j.createdAt ? j.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        description: j.description,
        benefits: j.whatWeOffer || '',
        tags: j.tags || [],
        deadline: j.deadline,
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

    const handleProfileUpdate = () => {
      fetchJobs();
    };

    window.addEventListener('skillhub_company_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('skillhub_company_profile_updated', handleProfileUpdate);
    };
  }, []);

  // Departments list dynamically computed
  const departments = useMemo(() => {
    const set = new Set(vacancies.map((v) => v.department));
    return ['All', ...Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))];
  }, [vacancies]);

  // Status and metric counts
  const activeCount = useMemo(() => vacancies.filter((v) => v.status === 'Active').length, [vacancies]);
  const draftCount = useMemo(() => vacancies.filter((v) => v.status === 'Draft').length, [vacancies]);
  const closedCount = useMemo(() => vacancies.filter((v) => v.status === 'Closed').length, [vacancies]);
  const totalApplicants = useMemo(() => vacancies.reduce((sum, v) => sum + (v.applicantsCount || 0), 0), [vacancies]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    departmentFilter !== 'All' ||
    typeFilter !== 'All' ||
    sortBy !== 'newest';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setDepartmentFilter('All');
    setTypeFilter('All');
    setSortBy('newest');
  };

  // Filtered and sorted vacancies
  const filteredVacancies = useMemo(() => {
    return vacancies
      .filter((job) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesTags = (job.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchesSearch =
          !q ||
          job.title.toLowerCase().includes(q) ||
          job.department.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          matchesTags;

        const matchesStatus = statusFilter === 'All' || job.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesDept = departmentFilter === 'All' || job.department === departmentFilter;
        const matchesType = typeFilter === 'All' || (job.type && job.type.toLowerCase() === typeFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesDept && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.postedDate || 0).getTime() - new Date(b.postedDate || 0).getTime();
        }
        if (sortBy === 'applicants') {
          return (b.applicantsCount || 0) - (a.applicantsCount || 0);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        // Default: newest
        return new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime();
      });
  }, [vacancies, searchQuery, statusFilter, departmentFilter, typeFilter, sortBy]);

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
          tags: data.tags,
          deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
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
          tags: data.tags,
          deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
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
          1. TOP COMPONENT: VACANCIES DASHBOARD CARD
          (Matches Candidate Technical Assessments Dashboard Header & Metrics)
          ========================================================= */}
      <section className="vacancies-dashboard-card" aria-labelledby="vacancies-dashboard-title">
        <div className="vacancies-dashboard-header">
          <div>
            <span className="vacancies-dashboard-eyebrow">Recruitment overview</span>
            <h2 id="vacancies-dashboard-title">Job Vacancies Dashboard</h2>
            <p>A comprehensive overview of your corporate requisitions, open roles, and talent pipeline.</p>
          </div>
          <div className="vacancies-dashboard-header-actions">
            <span className="vacancies-dashboard-live">
              <span /> Live recruitment
            </span>
            <button
              type="button"
              className="btn-primary vacancies-create-btn"
              onClick={handleOpenCreate}
            >
              <PlusIcon />
              <span>Create New Job</span>
            </button>
          </div>
        </div>

        <div className="vacancies-summary-grid">
          <article className="vacancies-summary-card summary-total">
            <div className="summary-icon"><Briefcase size={22} /></div>
            <div>
              <span>Total vacancies</span>
              <strong>{vacancies.length}</strong>
              <small>All corporate positions</small>
            </div>
          </article>
          <article className="vacancies-summary-card summary-active">
            <div className="summary-icon"><SparkleIcon /></div>
            <div>
              <span>Active positions</span>
              <strong>{activeCount}</strong>
              <small>Open for applications</small>
            </div>
          </article>
          <article className="vacancies-summary-card summary-draft">
            <div className="summary-icon"><ClockIcon /></div>
            <div>
              <span>Draft & Closed</span>
              <strong>{draftCount + closedCount}</strong>
              <small>{draftCount} draft • {closedCount} closed</small>
            </div>
          </article>
          <article className="vacancies-summary-card summary-applicants">
            <div className="summary-icon"><UsersIcon /></div>
            <div>
              <span>Total applicants</span>
              <strong>{totalApplicants}</strong>
              <small>Candidates in pipeline</small>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          2. FILTER & SEARCH CONTROLS PANEL
          (Matches Candidate Technical Assessments Filter Toolbar)
          ========================================================= */}
      <section className="vacancies-filter-panel" aria-label="Vacancy filters">
        <div className="vacancies-filter-heading">
          <div>
            <span className="filter-eyebrow">Vacancy workspace</span>
            <h2>Find and manage positions</h2>
          </div>
          <span className="filter-result-count">
            {filteredVacancies.length} of {vacancies.length} shown
          </span>
        </div>

        <div className="vacancies-toolbar">
          {/* Status Tabs */}
          <div className="vacancies-tabs">
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All Vacancies ({vacancies.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'Draft' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Draft')}
            >
              Draft ({draftCount})
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'Closed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Closed')}
            >
              Closed ({closedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="vacancies-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by job title, department, or keyword..."
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
          <div className="vacancies-select-group">
            <label htmlFor="vacancies-dept-filter">Department</label>
            <select
              id="vacancies-dept-filter"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type Select */}
          <div className="vacancies-select-group">
            <label htmlFor="vacancies-type-filter">Job Type</label>
            <select
              id="vacancies-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {employmentTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All types' : t}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div className="vacancies-select-group">
            <label htmlFor="vacancies-sort-filter">Sort by</label>
            <select
              id="vacancies-sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="applicants">Most applicants</option>
              <option value="title">Title (A - Z)</option>
            </select>
          </div>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="vacancies-clear-filters"
              onClick={clearFilters}
            >
              <XIcon /> Clear filters
            </button>
          )}
        </div>
      </section>

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
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={6} hasAvatar />
                ))
              ) : filteredVacancies.length > 0 ? (
                filteredVacancies.map((job) => (
                  <tr key={job.id} className="vacancies-table-row">
                    {/* Job Title Column */}
                    <td>
                      <div className="job-title-col">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(job)}
                          className="job-title-clickable-btn"
                          title="Edit Job Vacancy"
                        >
                          <span className="job-name-text">{job.title}</span>
                        </button>
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
                      <button
                        type="button"
                        onClick={() => setSelectedJobForApplicants({
                          id: job.id,
                          companyId: '',
                          title: job.title,
                          department: job.department,
                          location: job.location,
                          employmentType: job.type,
                          experienceLevel: job.experienceLevel || '',
                          salaryRange: job.salaryRange,
                          status: job.status,
                          description: job.description || '',
                          whatWeOffer: job.benefits,
                          tags: job.tags,
                          applicantsCount: job.applicantsCount,
                          createdAt: job.postedDate,
                        })}
                        className="applicants-cell-box"
                        title="Click to view and review candidate applicants"
                      >
                        <div className="applicants-icon-wrap">
                          <UsersIcon />
                        </div>
                        <span className="applicants-count-num">
                          {job.applicantsCount} {job.applicantsCount === 1 ? 'Applicant' : 'Applicants'}
                        </span>
                      </button>
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
                      {job.deadline && (
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: new Date(job.deadline) < new Date() ? '#ef4444' : '#059669',
                            marginTop: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <span>{new Date(job.deadline) < new Date() ? 'Expired:' : 'Deadline:'}</span>
                          <span>
                            {new Date(job.deadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
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
                deadline: editingJob.deadline || '',
              }
            : null
        }
        isEditMode={!!editingJob}
      />

      {/* =========================================================
          6. CANDIDATES / APPLICANTS LIST MODAL
          ========================================================= */}
      <CandidatesListModal
        isOpen={Boolean(selectedJobForApplicants)}
        onClose={() => {
          setSelectedJobForApplicants(null);
          fetchJobs();
        }}
        job={selectedJobForApplicants}
      />
    </div>
  );
};
