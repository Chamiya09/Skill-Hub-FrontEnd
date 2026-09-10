import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  SearchIcon,
  UsersIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  BriefcaseIcon,
  BuildingIcon,
  MapPinIcon,
  CheckIcon,
} from '../components/common/Icons';

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
}

const initialVacancies: JobVacancyItem[] = [
  {
    id: 'vac-1',
    title: 'Senior Full Stack Engineer (React / .NET Core)',
    department: 'Engineering',
    location: 'Remote (APAC)',
    type: 'Full-time',
    status: 'Active',
    applicantsCount: 42,
    aiMatchScore: 96,
    postedDate: '2026-09-08',
    description: 'Lead architecture and development of scalable cloud microservices and responsive React web applications.',
  },
  {
    id: 'vac-2',
    title: 'Staff AI / ML Infrastructure Architect',
    department: 'AI Research',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    status: 'Active',
    applicantsCount: 28,
    aiMatchScore: 92,
    postedDate: '2026-09-06',
    description: 'Design distributed model training pipelines, vector databases, and real-time LLM inference clusters.',
  },
  {
    id: 'vac-3',
    title: 'Lead Product Designer (Enterprise Design Systems)',
    department: 'Product Design',
    location: 'London, UK (Remote)',
    type: 'Full-time',
    status: 'Active',
    applicantsCount: 35,
    aiMatchScore: 88,
    postedDate: '2026-09-03',
    description: 'Own the unified design system, enterprise UI components, and end-to-end recruitment UX workflows.',
  },
  {
    id: 'vac-4',
    title: 'Principal Cloud Security & DevOps Engineer',
    department: 'Infrastructure',
    location: 'Remote (Global)',
    type: 'Contract',
    status: 'Active',
    applicantsCount: 19,
    aiMatchScore: 94,
    postedDate: '2026-08-30',
    description: 'Manage multi-region AWS/GCP clusters, SOC-2 compliance automation, and zero-trust perimeter security.',
  },
  {
    id: 'vac-5',
    title: 'Senior Technical Product Manager - ATS Platforms',
    department: 'Product',
    location: 'New York, NY',
    type: 'Full-time',
    status: 'Draft',
    applicantsCount: 0,
    aiMatchScore: 0,
    postedDate: '2026-09-09',
    description: 'Define product vision and roadmap for next-generation automated candidate matching and interview orchestration.',
  },
  {
    id: 'vac-6',
    title: 'Junior QA Automation Engineer',
    department: 'Engineering',
    location: 'Austin, TX',
    type: 'Full-time',
    status: 'Closed',
    applicantsCount: 64,
    aiMatchScore: 85,
    postedDate: '2026-08-15',
    description: 'Position successfully filled by Skill Hub AI matching engine candidate.',
  },
];

export const JobVacancies = () => {
  const [vacancies, setVacancies] = useState<JobVacancyItem[]>(initialVacancies);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

        <Link
          to="/dashboard/jobs/new"
          className="btn-primary vacancies-create-btn"
        >
          <PlusIcon />
          <span>Create New Job</span>
        </Link>
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
                        <Link
                          to={`/dashboard/jobs/${job.id}/edit`}
                          className="action-icon-btn edit-btn"
                          title="Edit Job Vacancy"
                          aria-label={`Edit ${job.title}`}
                        >
                          <EditIcon />
                        </Link>
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
                  <td colSpan={6} className="vacancies-empty-cell">
                    <div className="vacancies-empty-state">
                      <div className="empty-icon-circle">
                        <BriefcaseIcon />
                      </div>
                      <h3 className="empty-state-title">No job vacancies found</h3>
                      <p className="empty-state-desc">
                        No requisitions matched your search query or active filter selections.
                      </p>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ marginTop: '12px' }}
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
    </div>
  );
};
