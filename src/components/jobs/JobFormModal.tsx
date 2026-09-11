import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  BriefcaseIcon,
  BuildingIcon,
  MapPinIcon,
  DollarSignIcon,
  CheckIcon,
  XIcon,
  SparkleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  AwardIcon,
  ShieldCheckIcon,
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

export interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => void | Promise<void>;
  initialData?: Partial<JobFormData> | null;
  isEditMode?: boolean;
  isSubmitting?: boolean;
}

const defaultJobData: JobFormData = {
  title: '',
  department: 'Engineering',
  location: '',
  type: 'Full-time',
  experienceLevel: 'Senior Level (5+ Yrs)',
  status: 'Active',
  salaryRange: '',
  description: `<h2>Role Overview</h2><p>Provide a comprehensive overview of the role, team mission, and impact...</p><h3>Key Responsibilities</h3><ul><li>Architect and build scalable web microservices.</li><li>Collaborate with cross-functional engineering teams.</li></ul><h3>Required Qualifications</h3><ul><li>3+ years of production experience in relevant tech stack.</li><li>Strong problem-solving and communication abilities.</li></ul>`,
  benefits: `<h3>What We Offer</h3><ul><li>Competitive base compensation + equity options.</li><li>100% remote flexibility with home office stipend.</li><li>Comprehensive health, dental, and vision insurance.</li></ul>`,
};

// Rich Text Editor Toolbar Modules
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

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  isSubmitting = false,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<JobFormData>(defaultJobData);
  const [stepError, setStepError] = useState<string | null>(null);

  // Track previous open state to prevent modal state resets on re-render
  const prevIsOpenRef = useRef(false);

  // Sync state ONLY when the modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setCurrentStep(1);
      setStepError(null);
      if (initialData) {
        setFormData({
          ...defaultJobData,
          ...initialData,
        });
      } else {
        setFormData(defaultJobData);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (stepError) setStepError(null);
  };

  const handleDescriptionChange = (content: string) => {
    setFormData((prev) => ({ ...prev, description: content }));
  };

  const handleBenefitsChange = (content: string) => {
    setFormData((prev) => ({ ...prev, benefits: content }));
  };

  // Step Validation & Navigation
  const validateStep1 = () => {
    if (!formData.title.trim()) {
      setStepError('Please enter a Job Title before proceeding.');
      return false;
    }
    if (!formData.department.trim()) {
      setStepError('Please specify a Department.');
      return false;
    }
    if (!formData.location.trim()) {
      setStepError('Please specify a Location.');
      return false;
    }
    setStepError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.type) {
      setStepError('Please select an Employment Type.');
      return false;
    }
    setStepError(null);
    return true;
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setStepError(null);

    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setStepError(null);
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setCurrentStep(1);
      setStepError('Job title is required.');
      return;
    }
    onSubmit(formData);
  };

  const handleQuickSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setCurrentStep(1);
      setStepError('Job title is required.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div
      className="job-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="job-modal-card"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '46rem',
          position: 'relative',
          boxShadow: 'none',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '24px 28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            1. TOP NAVIGATION & CLOSE BUTTON
            ========================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon-wrap" style={{ width: '28px', height: '28px', borderRadius: '8px' }}>
              <SparkleIcon />
            </div>
            <span className="brand-name" style={{ fontSize: '18px' }}>
              Skill<span style={{ color: '#00b074' }}>Hub</span>
            </span>
          </div>

          {/* Close 'X' Button at Top Right */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            aria-label="Close modal"
          >
            <XIcon />
          </button>
        </div>

        {/* =========================================================
            2. HEADER BRANDING
            ========================================================= */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="badge-tag" style={{ display: 'inline-flex', marginBottom: '8px', padding: '4px 12px', fontSize: '11px' }}>
            <SparkleIcon />
            <span>{isEditMode ? 'UPDATE REQUISITION' : 'NEW REQUISITION WIZARD'}</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            {isEditMode ? 'Edit Job Vacancy' : 'Create Job Vacancy'}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
            {isEditMode
              ? 'Update your vacancy status, specifications, and requirements.'
              : 'Deploy a new role to activate AI-matched candidate pipelines and candidate tracking.'}
          </p>
        </div>

        {/* =========================================================
            3. STEPPER TABS
            ========================================================= */}
        <div className="wizard-stepper" style={{ marginBottom: '20px' }}>
          <div className="wizard-progress-track">
            <div
              className="wizard-progress-fill"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              }}
            />
          </div>

          {/* Step 1 Node */}
          <button
            type="button"
            className={`wizard-step-node ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setCurrentStep(1);
            }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div className="wizard-step-circle">
              {currentStep > 1 ? <CheckIcon /> : '1'}
            </div>
            <span className="wizard-step-label">Basic & Status</span>
          </button>

          {/* Step 2 Node */}
          <button
            type="button"
            className={`wizard-step-node ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              if (validateStep1()) setCurrentStep(2);
            }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div className="wizard-step-circle">
              {currentStep > 2 ? <CheckIcon /> : '2'}
            </div>
            <span className="wizard-step-label">Role Specs</span>
          </button>

          {/* Step 3 Node */}
          <button
            type="button"
            className={`wizard-step-node ${currentStep === 3 ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              if (validateStep1() && validateStep2()) setCurrentStep(3);
            }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div className="wizard-step-circle">3</div>
            <span className="wizard-step-label">Details</span>
          </button>
        </div>

        {/* Validation / Step Error Notice */}
        {stepError && (
          <div className="auth-alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️</span>
            <span>{stepError}</span>
          </div>
        )}

        {/* =========================================================
            4. ACTIVE STEP FORM BODY (SCROLLABLE)
            ========================================================= */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          <form onSubmit={handleSubmit} noValidate>
            {/* STEP 1: Basic Information & Prominent Vacancy Status */}
            {currentStep === 1 && (
              <div className="wizard-step-body" key="step1">
                <div className="wizard-step-header">
                  <div className="wizard-step-icon">
                    <BuildingIcon />
                  </div>
                  <div>
                    <h3 className="wizard-step-title">General Information & Status</h3>
                    <p className="wizard-step-desc">Configure vacancy title, department, location, and recruitment status</p>
                  </div>
                </div>

                {/* Job Title */}
                <div className="form-group-item">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Job Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="relative w-full auth-input-wrapper">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                      <BriefcaseIcon />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Full Stack Engineer (React / .NET Core)"
                      value={formData.title}
                      onChange={handleInputChange}
                      name="title"
                      className="input-field-standard pl-11 w-full"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Department, Location & Prominent Status Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {/* Department */}
                  <div className="form-group-item">
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Department <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div className="relative w-full auth-input-wrapper">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                        <BuildingIcon />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Engineering, AI Research"
                        value={formData.department}
                        onChange={handleInputChange}
                        name="department"
                        className="input-field-standard pl-11 w-full"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="form-group-item">
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Location <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div className="relative w-full auth-input-wrapper">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                        <MapPinIcon />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Remote (APAC) or San Francisco, CA"
                        value={formData.location}
                        onChange={handleInputChange}
                        name="location"
                        className="input-field-standard pl-11 w-full"
                      />
                    </div>
                  </div>

                  {/* Prominent Vacancy Status (Directly accessible on Step 1) */}
                  <div className="form-group-item">
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Vacancy Status <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="input-field-standard w-full"
                      style={{
                        cursor: 'pointer',
                        height: '42px',
                        fontWeight: 600,
                        backgroundColor: formData.status === 'Closed' ? '#f8fafc' : formData.status === 'Active' ? '#f0fdf4' : '#fffbeb',
                        borderColor: formData.status === 'Closed' ? '#cbd5e1' : formData.status === 'Active' ? '#86efac' : '#fde68a',
                        color: formData.status === 'Closed' ? '#475569' : formData.status === 'Active' ? '#166534' : '#92400e',
                      }}
                    >
                      <option value="Active">Active (Accepting Applications)</option>
                      <option value="Closed">Closed (Intake Ended / AI Screening Ready)</option>
                      <option value="Draft">Draft (Internal Requisition Review)</option>
                    </select>
                  </div>
                </div>

                {/* Status Explanation Helper Box */}
                <div
                  style={{
                    background: formData.status === 'Closed' ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${formData.status === 'Closed' ? '#bfdbfe' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '12.5px',
                    color: formData.status === 'Closed' ? '#1e40af' : '#475569',
                  }}
                >
                  <ShieldCheckIcon />
                  <div>
                    {formData.status === 'Closed' ? (
                      <span>
                        <strong>Closed Status:</strong> Applications are frozen. The batch AI Screening engine will be enabled to rank all applicants and shortlist candidates.
                      </span>
                    ) : (
                      <span>
                        <strong>Active Status:</strong> Candidates can actively submit applications. Marking as Closed once the deadline passes will unlock the AI Batch Screening.
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Row */}
                <div className="wizard-action-row" style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-wizard-back"
                    style={{ padding: '10px 18px' }}
                  >
                    <span>Cancel</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={handleQuickSave}
                        disabled={isSubmitting}
                        className="btn-secondary"
                        style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '13px' }}
                        title="Save changes and close without stepping through remaining steps"
                      >
                        <CheckIcon />
                        <span>{isSubmitting ? 'Saving...' : 'Quick Save'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleNext}
                      className="btn-wizard-next"
                      style={{ padding: '10px 22px', boxShadow: 'none' }}
                    >
                      <span>Continue to Role Specs</span>
                      <ArrowRightIcon />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Role Specifications */}
            {currentStep === 2 && (
              <div className="wizard-step-body" key="step2">
                <div className="wizard-step-header">
                  <div className="wizard-step-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <BriefcaseIcon />
                  </div>
                  <div>
                    <h3 className="wizard-step-title">Role Specifications</h3>
                    <p className="wizard-step-desc">Configure employment type, experience tier, and compensation</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {/* Employment Type */}
                  <div className="form-group-item">
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Employment Type <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="input-field-standard w-full"
                      style={{ cursor: 'pointer', height: '42px' }}
                      autoFocus
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div className="form-group-item">
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Experience Level <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleInputChange}
                      className="input-field-standard w-full"
                      style={{ cursor: 'pointer', height: '42px' }}
                    >
                      <option value="Entry Level (0-2 Yrs)">Entry Level (0-2 Yrs)</option>
                      <option value="Mid Level (3-5 Yrs)">Mid Level (3-5 Yrs)</option>
                      <option value="Senior Level (5+ Yrs)">Senior Level (5+ Yrs)</option>
                      <option value="Lead / Staff (7+ Yrs)">Lead / Staff (7+ Yrs)</option>
                      <option value="Principal / Executive (10+ Yrs)">Principal / Executive (10+ Yrs)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {/* Salary Range */}
                  <div className="form-group-item">
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Salary / Compensation Range
                    </label>
                    <div className="relative w-full auth-input-wrapper">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 auth-input-icon">
                        <DollarSignIcon />
                      </span>
                      <input
                        type="text"
                        name="salaryRange"
                        placeholder="e.g. $135,000 - $175,000 USD / yr"
                        value={formData.salaryRange}
                        onChange={handleInputChange}
                        className="input-field-standard pl-11 w-full"
                      />
                    </div>
                  </div>

                  {/* Status Indicator on Step 2 */}
                  <div className="form-group-item">
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Vacancy Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="input-field-standard w-full"
                      style={{ cursor: 'pointer', height: '42px' }}
                    >
                      <option value="Active">Active (Accepting Applications)</option>
                      <option value="Closed">Closed (Intake Ended / AI Screening Ready)</option>
                      <option value="Draft">Draft (Internal Requisition Review)</option>
                    </select>
                  </div>
                </div>

                {/* Helper Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12.5px',
                    color: '#475569',
                  }}
                >
                  <ShieldCheckIcon />
                  <span>Clear compensation ranges and role tiers improve candidate match accuracy by 45%.</span>
                </div>

                {/* Action Row */}
                <div className="wizard-action-row" style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-wizard-back"
                    style={{ padding: '10px 18px' }}
                  >
                    <ArrowLeftIcon />
                    <span>Back</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={handleQuickSave}
                        disabled={isSubmitting}
                        className="btn-secondary"
                        style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '13px' }}
                      >
                        <CheckIcon />
                        <span>{isSubmitting ? 'Saving...' : 'Quick Save'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleNext}
                      className="btn-wizard-next"
                      style={{ padding: '10px 22px', boxShadow: 'none' }}
                    >
                      <span>Continue to Details</span>
                      <ArrowRightIcon />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Deep Details (Rich Text Editors) */}
            {currentStep === 3 && (
              <div className="wizard-step-body" key="step3">
                <div className="wizard-step-header">
                  <div className="wizard-step-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <AwardIcon />
                  </div>
                  <div>
                    <h3 className="wizard-step-title">Role Details & Value Proposition</h3>
                    <p className="wizard-step-desc">Enter comprehensive responsibilities and candidate perks</p>
                  </div>
                </div>

                {/* Role Description & Requirements */}
                <div className="form-group-item">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', margin: 0 }}>
                      Job Description & Requirements <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '11px', color: '#009e67', fontWeight: 700, background: '#e6f9f2', padding: '2px 8px', borderRadius: '6px' }}>
                      Rich Text Enabled
                    </span>
                  </div>
                  <div className="rich-editor-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <ReactQuill
                      theme="snow"
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Enter overview, key responsibilities, and required technical qualifications..."
                    />
                  </div>
                </div>

                {/* What We Offer (Benefits & Perks) */}
                <div className="form-group-item">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <AwardIcon />
                      <span>What We Offer (Benefits, Equity & Perks)</span>
                    </label>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Candidate Value Proposition
                    </span>
                  </div>
                  <div className="rich-editor-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <ReactQuill
                      theme="snow"
                      value={formData.benefits}
                      onChange={handleBenefitsChange}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Highlight company perks, remote stipends, health insurance, and learning allowances..."
                    />
                  </div>
                </div>

                {/* Action Row */}
                <div className="wizard-action-row" style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-wizard-back"
                    style={{ padding: '10px 18px' }}
                    disabled={isSubmitting}
                  >
                    <ArrowLeftIcon />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-wizard-next"
                    style={{ padding: '10px 24px', boxShadow: 'none' }}
                  >
                    {isSubmitting ? (
                      <span>{isEditMode ? 'Saving Changes...' : 'Publishing Job...'}</span>
                    ) : (
                      <>
                        <CheckIcon />
                        <span>{isEditMode ? 'Save Changes' : 'Publish Job Vacancy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
