import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  MapPinIcon,
  DollarSignIcon,
  CheckIcon,
  SparkleIcon,
  AwardIcon,
} from '../common/Icons';

export interface JobFormData {
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Contract' | 'Part-time' | 'Remote';
  experienceLevel: string;
  status: 'Active' | 'Draft' | 'Closed';
  salaryRange: string;
  description: string;
  benefits: string;
}

export interface JobFormProps {
  initialData?: Partial<JobFormData>;
  onSubmit: (data: JobFormData) => void | Promise<void>;
  isEditMode?: boolean;
  isSubmitting?: boolean;
  onCancel?: () => void;
  formTitle: string;
  formSubtitle: string;
  backLinkUrl: string;
  backLinkLabel?: string;
  badgeText?: string;
}

const defaultFormData: JobFormData = {
  title: '',
  department: 'Engineering',
  location: '',
  type: 'Full-time',
  experienceLevel: 'Senior Level (5+ Yrs)',
  status: 'Active',
  salaryRange: '',
  description: '',
  benefits: '',
};

// Rich Text Editor Toolbar Configuration
const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote'],
    ['link', 'clean'],
  ],
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
  'blockquote',
  'link',
];

export const JobForm: React.FC<JobFormProps> = ({
  initialData,
  onSubmit,
  isEditMode = false,
  isSubmitting = false,
  onCancel,
  formTitle,
  formSubtitle,
  backLinkUrl,
  backLinkLabel = 'Back',
  badgeText = 'REQUISITION MANAGEMENT',
}) => {
  const [formData, setFormData] = useState<JobFormData>({
    ...defaultFormData,
    ...initialData,
  });

  // Sync if initialData changes (e.g., after loading)
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      description: value,
    }));
  };

  const handleBenefitsChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="job-form-wrapper">
      <div className="job-form-inner-container">
        {/* =========================================================
            1. NAVIGATION BAR
            ========================================================= */}
        <div className="job-form-top-nav">
          <Link to={backLinkUrl} className="job-back-link-btn">
            <ArrowLeftIcon />
            <span>{backLinkLabel}</span>
          </Link>

          <div className="job-breadcrumb-tags">
            <span className="breadcrumb-muted">Dashboard</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-muted">Vacancies</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">{formTitle}</span>
          </div>
        </div>

        {/* =========================================================
            2. CENTRALIZED REUSABLE FORM CARD
            ========================================================= */}
        <div className="job-form-card-container">
          {/* Form Header */}
          <div className="job-form-card-header">
            <div className="job-form-header-badge">
              <SparkleIcon />
              <span>{badgeText}</span>
            </div>
            <h1 className="job-form-page-title">{formTitle}</h1>
            <p className="job-form-page-subtitle">{formSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="job-form-main-body">
            {/* SECTION 1: GENERAL INFORMATION */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <span className="section-step-num">1</span>
                <span>General Information</span>
              </h2>

              {/* Job Title */}
              <div className="form-group-item">
                <label htmlFor="formJobTitle" className="form-label-standard">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <BriefcaseIcon />
                  </span>
                  <input
                    id="formJobTitle"
                    name="title"
                    type="text"
                    required
                    placeholder="e.g., Senior Full Stack Engineer (React / .NET Core)"
                    value={formData.title}
                    onChange={handleChange}
                    className="input-field-standard pl-11 w-full"
                  />
                </div>
              </div>

              {/* Department & Location Grid */}
              <div className="job-form-two-col">
                <div className="form-group-item">
                  <label htmlFor="formJobDept" className="form-label-standard">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative w-full auth-input-wrapper">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <BuildingIcon />
                    </span>
                    <input
                      id="formJobDept"
                      name="department"
                      type="text"
                      required
                      placeholder="e.g., Engineering, AI Research, Product"
                      value={formData.department}
                      onChange={handleChange}
                      className="input-field-standard pl-11 w-full"
                    />
                  </div>
                </div>

                <div className="form-group-item">
                  <label htmlFor="formJobLocation" className="form-label-standard">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative w-full auth-input-wrapper">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <MapPinIcon />
                    </span>
                    <input
                      id="formJobLocation"
                      name="location"
                      type="text"
                      required
                      placeholder="e.g., Remote (APAC) or San Francisco, CA"
                      value={formData.location}
                      onChange={handleChange}
                      className="input-field-standard pl-11 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: ROLE SPECIFICATIONS & COMPENSATION */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <span className="section-step-num">2</span>
                <span>Role Specifications & Status</span>
              </h2>

              <div className="job-form-three-col">
                {/* Employment Type */}
                <div className="form-group-item">
                  <label htmlFor="formJobType" className="form-label-standard">
                    Employment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="formJobType"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="select-field-standard w-full"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                {/* Experience Level */}
                <div className="form-group-item">
                  <label htmlFor="formJobExp" className="form-label-standard">
                    Experience Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="formJobExp"
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    className="select-field-standard w-full"
                  >
                    <option value="Entry Level (0-2 Yrs)">Entry Level (0-2 Yrs)</option>
                    <option value="Mid Level (3-5 Yrs)">Mid Level (3-5 Yrs)</option>
                    <option value="Senior Level (5+ Yrs)">Senior Level (5+ Yrs)</option>
                    <option value="Lead / Staff (7+ Yrs)">Lead / Staff (7+ Yrs)</option>
                    <option value="Principal / Executive (10+ Yrs)">Principal / Executive (10+ Yrs)</option>
                  </select>
                </div>

                {/* Vacancy Status */}
                <div className="form-group-item">
                  <label htmlFor="formJobStatus" className="form-label-standard">
                    Vacancy Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="formJobStatus"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="select-field-standard w-full"
                  >
                    <option value="Active">Active (Accepting Applicants)</option>
                    <option value="Draft">Draft (Internal Review)</option>
                    <option value="Closed">Closed (Position Filled)</option>
                  </select>
                </div>
              </div>

              {/* Salary Range */}
              <div className="form-group-item" style={{ marginTop: '16px' }}>
                <label htmlFor="formJobSalary" className="form-label-standard">
                  Salary / Compensation Range
                </label>
                <div className="relative w-full auth-input-wrapper">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <DollarSignIcon />
                  </span>
                  <input
                    id="formJobSalary"
                    name="salaryRange"
                    type="text"
                    placeholder="e.g., $135,000 - $175,000 USD / yr or $90 - $120 / hr"
                    value={formData.salaryRange}
                    onChange={handleChange}
                    className="input-field-standard pl-11 w-full"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: RICH TEXT JOB DESCRIPTION & REQUIREMENTS */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <span className="section-step-num">3</span>
                <span>Job Description & Requirements</span>
              </h2>

              <div className="form-group-item">
                <label className="form-label-standard">
                  Role Overview, Key Responsibilities & Qualifications <span className="text-red-500">*</span>
                </label>
                <div className="rich-editor-wrapper">
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter the role overview, responsibilities, and required qualifications. Use the toolbar above to add bold headings and bullet points..."
                  />
                </div>
                <span className="form-helper-note">
                  Use heading formats (H2/H3) and bullet lists to structure responsibilities and qualifications cleanly.
                </span>
              </div>
            </div>

            {/* SECTION 4: RICH TEXT WHAT WE OFFER (BENEFITS & PERKS) */}
            <div className="job-form-section">
              <div className="section-header-flex">
                <h2 className="job-form-section-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <span className="section-step-num">4</span>
                  <span>What We Offer (Benefits & Perks)</span>
                </h2>
                <span className="perks-badge-tag">
                  <AwardIcon />
                  <span>CANDIDATE VALUE PROPOSITION</span>
                </span>
              </div>

              <div className="form-group-item" style={{ marginTop: '12px' }}>
                <label className="form-label-standard">
                  Benefits, Flexibility, Equity & Wellness Highlights
                </label>
                <div className="rich-editor-wrapper">
                  <ReactQuill
                    theme="snow"
                    value={formData.benefits}
                    onChange={handleBenefitsChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Highlight company perks, remote flexibility, health coverage, conference budgets, and equity packages..."
                  />
                </div>
                <span className="form-helper-note">
                  Attract top candidates by highlighting remote stipends, healthcare, learning allowances, and bonus structures.
                </span>
              </div>
            </div>

            {/* =========================================================
                5. FORM ACTION BUTTONS FOOTER
                ========================================================= */}
            <div className="job-form-footer-actions">
              {onCancel ? (
                <button
                  type="button"
                  className="btn-secondary job-cancel-btn"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              ) : (
                <Link to={backLinkUrl} className="btn-secondary job-cancel-btn">
                  Cancel
                </Link>
              )}

              <button
                type="submit"
                className="btn-primary job-save-btn"
                disabled={isSubmitting}
              >
                <CheckIcon />
                <span>
                  {isSubmitting
                    ? isEditMode
                      ? 'Saving Changes...'
                      : 'Publishing Job...'
                    : isEditMode
                    ? 'Save Changes'
                    : 'Publish Job Vacancy'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
