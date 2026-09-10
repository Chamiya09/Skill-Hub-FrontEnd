import { useState, useMemo } from 'react';
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

const initialVacancies: JobVacancyItem[] = [
  {
    id: 'vac-1',
    title: 'Senior Full Stack Engineer (React / .NET Core)',
    department: 'Engineering',
    location: 'Remote (APAC)',
    type: 'Full-time',
    status: 'Active',
    experienceLevel: 'Senior Level (5+ Yrs)',
    salaryRange: '$135,000 - $175,000 USD / yr',
    applicantsCount: 42,
    aiMatchScore: 96,
    postedDate: '2026-09-08',
    description: 'Lead architecture and development of scalable cloud microservices and responsive React web applications.',
    benefits: 'Remote flexibility, health insurance, equity options, and annual learning allowance.',
  },
  {
    id: 'vac-2',
    title: 'Staff AI / ML Infrastructure Architect',
    department: 'AI Research',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    status: 'Active',
    experienceLevel: 'Lead / Staff (7+ Yrs)',
    salaryRange: '$220,000 - $280,000 USD / yr',
    applicantsCount: 28,
    aiMatchScore: 92,
    postedDate: '2026-09-06',
    description: 'Design distributed model training pipelines, vector databases, and real-time LLM inference clusters.',
    benefits: 'Top-tier base salary, founding-tier equity, and dual RTX workstations.',
  },
  {
    id: 'vac-3',
    title: 'Lead Product Designer (Enterprise Design Systems)',
    department: 'Product Design',
    location: 'London, UK (Remote)',
    type: 'Full-time',
    status: 'Active',
    experienceLevel: 'Senior Level (5+ Yrs)',
    salaryRange: '£95,000 - £125,000 GBP / yr',
    applicantsCount: 35,
    aiMatchScore: 88,
    postedDate: '2026-09-03',
    description: 'Own the unified design system, enterprise UI components, and end-to-end recruitment UX workflows.',
    benefits: 'Generous pension, private medical cover, and full home office budget.',
  },
  {
    id: 'vac-4',
    title: 'Principal Cloud Security & DevOps Engineer',
    department: 'Infrastructure',
    location: 'Remote (Global)',
    type: 'Contract',
    status: 'Active',
    experienceLevel: 'Principal / Executive (10+ Yrs)',
    salaryRange: '$110 - $145 USD / hr',
    applicantsCount: 19,
    aiMatchScore: 94,
    postedDate: '2026-08-30',
    description: 'Manage multi-region AWS/GCP clusters, SOC-2 compliance automation, and zero-trust perimeter security.',
    benefits: 'Competitive rolling contract rate with annual retention bonuses.',
  },
  {
    id: 'vac-5',
    title: 'Senior Technical Product Manager - ATS Platforms',
    department: 'Product',
    location: 'New York, NY',
    type: 'Full-time',
    status: 'Draft',
    experienceLevel: 'Senior Level (5+ Yrs)',
    salaryRange: '$160,000 - $200,000 USD / yr',
    applicantsCount: 0,
    aiMatchScore: 0,
    postedDate: '2026-09-09',
    description: 'Define product vision and roadmap for next-generation automated candidate matching and interview orchestration.',
    benefits: 'Comprehensive healthcare, 401(k) matching, and parental leave.',
  },
  {
    id: 'vac-6',
    title: 'Junior QA Automation Engineer',
    department: 'Engineering',
    location: 'Austin, TX',
    type: 'Full-time',
    status: 'Closed',
    experienceLevel: 'Entry Level (0-2 Yrs)',
    salaryRange: '$75,000 - $95,000 USD / yr',
    applicantsCount: 64,
    aiMatchScore: 85,
    postedDate: '2026-08-15',
    description: 'Position successfully filled by Skill Hub AI matching engine candidate.',
    benefits: 'Mentorship program, learning stipend, and paid leave.',
  },
];

export const JobVacancies = () => {
  const [vacancies, setVacancies] = useState<JobVacancyItem[]>(initialVacancies);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Multi-Step Modal State
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobVacancyItem | null>(null);

  // Modal states for Direct Delete
  const [vacancyToDelete, setVacancyToDelete] = useState<JobVacancyItem | null>(null);

  // Departments list dynamically computed
  const departments = useMemo(() => {
    const set = new Set(vacancies.map((v) => v.department));
    return ['All', ...Array.from(set)];
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

  const handleJobModalSubmit = (data: JobFormData) => {
    if (editingJob) {
      // Update existing
      setVacancies((prev) =>
        prev.map((v) =>
          v.id === editingJob.id
            ? {
                ...v,
                title: data.title,
                department: data.department,
                location: data.location,
                type: data.type,
                status: data.status,
                experienceLevel: data.experienceLevel,
                salaryRange: data.salaryRange,
                description: data.description,
                benefits: data.benefits,
              }
            : v
        )
      );
      showToast(`Vacancy "${data.title}" updated successfully.`);
    } else {
      // Create new
      const newJob: JobVacancyItem = {
        id: `vac-${Date.now()}`,
        title: data.title,
        department: data.department,
        location: data.location,
        type: data.type,
        status: data.status,
        experienceLevel: data.experienceLevel,
        salaryRange: data.salaryRange,
        applicantsCount: 0,
        aiMatchScore: 92,
        postedDate: new Date().toISOString().split('T')[0],
        description: data.description,
        benefits: data.benefits,
      };
      setVacancies([newJob, ...vacancies]);
      showToast(`New vacancy "${data.title}" published successfully.`);
    }
    setIsJobModalOpen(false);
  };

  // Direct Physical Deletion Handler
  const handleConfirmDirectDelete = () => {
    if (!vacancyToDelete) return;
    const deletedTitle = vacancyToDelete.title;
    setVacancies((prev) => prev.filter((v) => v.id !== vacancyToDelete.id));
    setVacancyToDelete(null);
    showToast(`Vacancy "${deletedTitle}" permanently deleted.`);
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
            Manage your corporate requisitions, monitor AI applicant pipelines, and post new engineering roles.
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
          2. SEARCH & FILTER CONTROLS BAR (GLOBAL UI CONSISTENCY)
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
              {filteredVacancies.length > 0 ? (
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
                          {job.applicantsCount} {job.applicantsCount === 1 ? 'Applicant' : 'Applicants'}
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
                        No requisitions matched your search query or filter selection.
                      </p>
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
              This will perform a direct physical deletion of the vacancy and remove it from active matching pools.
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setVacancyToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                onClick={handleConfirmDirectDelete}
              >
                Delete Permanently
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
        initialData={
          editingJob
            ? {
                title: editingJob.title,
                department: editingJob.department,
                location: editingJob.location,
                type: editingJob.type,
                status: editingJob.status,
                experienceLevel: editingJob.experienceLevel || 'Senior Level (5+ Yrs)',
                salaryRange: editingJob.salaryRange || '$130,000 - $170,000 USD / yr',
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
