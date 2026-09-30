import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  companyProfileApi,
  authStorage,
  type UpdateCompanyProfilePayload,
} from '../services/api';
import {
  Building2,
  Globe,
  MapPin,
  Check,
  Sparkles,
  Info,
  Mail,
  Phone,
  Users,
  Calendar,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import {
  LinkedInIcon,
  TwitterIcon,
  GitHubIcon,
} from '../components/common/Icons';
import './CompanySettingsFull.css';

const INDUSTRY_OPTIONS = [
  'Software Development & SaaS',
  'Information Technology & Services',
  'Financial Technology (FinTech)',
  'Artificial Intelligence & Machine Learning',
  'Healthcare & Biotechnology',
  'E-Commerce & Digital Retail',
  'Cloud Infrastructure & DevOps',
  'Cybersecurity',
  'Telecommunications',
  'Education & EdTech',
  'Media & Entertainment',
  'Consulting & Professional Services',
  'Other',
];

const COMPANY_SIZE_OPTIONS = [
  '1-10 Employees (Seed Stage)',
  '11-50 Employees (Early Stage)',
  '51-200 Employees (Growth Stage)',
  '201-500 Employees (Scale-up)',
  '501-1000 Employees (Enterprise)',
  '1000+ Employees (Global Enterprise)',
];

export const CompanySettings: React.FC = () => {
  const { currentUser, setUser, updateUser, refreshProfile } = useAuth();

  // Initialize immediately from authenticated user context
  const [formData, setFormData] = useState<UpdateCompanyProfilePayload>(() => {
    const cached = authStorage.getUser();

    return {
      companyName: currentUser?.companyName || cached?.companyName || '',
      adminName: currentUser?.fullName || (currentUser as any)?.adminName || cached?.fullName || (cached as any)?.adminName || '',
      contactEmail: currentUser?.email || (currentUser as any)?.contactEmail || cached?.email || (cached as any)?.contactEmail || '',
      website: currentUser?.website || cached?.website || '',
      industry: currentUser?.industry || cached?.industry || '',
      phone: currentUser?.phone || (currentUser as any)?.phone || cached?.phone || (cached as any)?.phone || '',
      companySize: currentUser?.companySize || (currentUser as any)?.companySize || cached?.companySize || (cached as any)?.companySize || '',
      foundedYear: currentUser?.foundedYear || (currentUser as any)?.foundedYear || cached?.foundedYear || (cached as any)?.foundedYear || '',
      logoUrl: currentUser?.logoUrl || cached?.logoUrl || '',
      linkedinUrl: currentUser?.linkedinUrl || (currentUser as any)?.linkedinUrl || cached?.linkedinUrl || (cached as any)?.linkedinUrl || '',
      twitterUrl: currentUser?.twitterUrl || (currentUser as any)?.twitterUrl || cached?.twitterUrl || (cached as any)?.twitterUrl || '',
      githubUrl: currentUser?.githubUrl || (currentUser as any)?.githubUrl || cached?.githubUrl || (cached as any)?.githubUrl || '',
      location: currentUser?.location || cached?.location || '',
      about: currentUser?.about || cached?.about || '',
    };
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Smooth background profile fetch once on component mount from PostgreSQL database
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadProfile = async () => {
      try {
        const profile = await companyProfileApi.getProfile();
        setFormData((prev) => ({
          companyName: profile.companyName || prev.companyName || '',
          adminName: profile.adminName || prev.adminName || '',
          contactEmail: profile.contactEmail || prev.contactEmail || '',
          website: profile.website || prev.website || '',
          industry: profile.industry || prev.industry || '',
          phone: profile.phone || prev.phone || '',
          companySize: profile.companySize || prev.companySize || '',
          foundedYear: profile.foundedYear || prev.foundedYear || '',
          logoUrl: profile.logoUrl || prev.logoUrl || '',
          linkedinUrl: profile.linkedinUrl || prev.linkedinUrl || '',
          twitterUrl: profile.twitterUrl || prev.twitterUrl || '',
          githubUrl: profile.githubUrl || prev.githubUrl || '',
          location: profile.location || prev.location || '',
          about: profile.about || prev.about || '',
        }));
      } catch (err: any) {
        console.error('Failed to load company profile:', err);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payloadToSave: UpdateCompanyProfilePayload = {
        companyName: formData.companyName?.trim() || '',
        adminName: formData.adminName?.trim() || '',
        contactEmail: formData.contactEmail?.trim() || '',
        phone: formData.phone?.trim() || '',
        companySize: formData.companySize || '',
        foundedYear: formData.foundedYear?.trim() || '',
        logoUrl: formData.logoUrl?.trim() || '',
        website: formData.website?.trim() || '',
        linkedinUrl: formData.linkedinUrl?.trim() || '',
        twitterUrl: formData.twitterUrl?.trim() || '',
        githubUrl: formData.githubUrl?.trim() || '',
        location: formData.location?.trim() || '',
        industry: formData.industry || '',
        about: formData.about?.trim() || '',
      };

      const updatedProfile = await companyProfileApi.updateProfile(payloadToSave);

      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          companyName: payloadToSave.companyName || currentUser.companyName,
          adminName: payloadToSave.adminName || currentUser.fullName,
          fullName: payloadToSave.adminName || currentUser.fullName,
          email: payloadToSave.contactEmail || currentUser.email,
          contactEmail: payloadToSave.contactEmail || currentUser.email,
          phone: payloadToSave.phone || '',
          companySize: payloadToSave.companySize || '',
          foundedYear: payloadToSave.foundedYear || '',
          logoUrl: payloadToSave.logoUrl || '',
          website: payloadToSave.website || '',
          linkedinUrl: payloadToSave.linkedinUrl || '',
          twitterUrl: payloadToSave.twitterUrl || '',
          githubUrl: payloadToSave.githubUrl || '',
          location: payloadToSave.location || '',
          industry: payloadToSave.industry || '',
          about: payloadToSave.about || '',
        };
        setUser(updatedUser);
        updateUser(updatedUser);
      }

      await refreshProfile().catch(() => {});

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('skillhub_company_profile_updated', {
            detail: { ...updatedProfile, ...payloadToSave },
          })
        );
      }

      setSuccessMessage('Company profile and workspace identity successfully updated.');
      setTimeout(() => setSuccessMessage(null), 4500);
    } catch (err: any) {
      console.error('Failed to update company profile:', err);
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate company initials for fallback preview
  const companyInitials = useMemo(() => {
    return (
      (formData.companyName || currentUser?.companyName || 'CO')
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'CO'
    );
  }, [formData.companyName, currentUser?.companyName]);

  // Profile strength calculation
  const { completedFieldsCount, completionPercentage } = useMemo(() => {
    const fields = [
      formData.companyName,
      formData.adminName,
      formData.contactEmail,
      formData.website,
      formData.industry,
      formData.phone,
      formData.companySize,
      formData.foundedYear,
      formData.logoUrl,
      formData.linkedinUrl,
      formData.location,
      formData.about,
    ];
    const completed = fields.filter((f) => Boolean(f && f.toString().trim().length > 0)).length;
    return {
      completedFieldsCount: completed,
      completionPercentage: Math.round((completed / fields.length) * 100),
    };
  }, [formData]);

  return (
    <div className="company-settings-page">
      {/* Success Notification Alert */}
      {successMessage && (
        <div className="auth-alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="auth-alert-error" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#dc2626" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================
          1. TOP COMPONENT: SETTINGS DASHBOARD CARD (Mirrors Planner & Vacancies)
          ========================================================= */}
      <section className="settings-dashboard-card" aria-labelledby="settings-dashboard-title">
        <div className="settings-dashboard-header">
          <div>
            <span className="settings-dashboard-eyebrow">Corporate profile & workspace identity</span>
            <h2 id="settings-dashboard-title">Company Profile & Account Settings</h2>
            <p>
              Manage your corporate brand, key administrative stakeholders, global social channels, and public company profile displayed to candidates across job vacancies.
            </p>
          </div>
          <div className="settings-dashboard-header-actions">
            <span className="settings-dashboard-live">
              <span /> Live Profile
            </span>
            {formData.companyName && (
              <Link
                to={`/company/${encodeURIComponent(formData.companyName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="settings-btn-preview"
                title="Open public company profile in a new tab"
              >
                <ExternalLink size={15} />
                <span>View Public Profile</span>
              </Link>
            )}
            <button
              type="button"
              className="settings-btn-save-header"
              onClick={() => handleSave()}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="settings-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="settings-summary-grid">
          <article className="settings-summary-card summary-identity">
            <div className="summary-icon"><Building2 size={22} /></div>
            <div>
              <span>Organization</span>
              <strong>{formData.companyName || 'Not Set'}</strong>
              <small>{formData.industry || 'Industry not specified'}</small>
            </div>
          </article>
          <article className="settings-summary-card summary-size">
            <div className="summary-icon"><Users size={22} /></div>
            <div>
              <span>Company Size</span>
              <strong>{formData.companySize ? formData.companySize.split(' ')[0] : 'Not Set'}</strong>
              <small>{formData.companySize ? formData.companySize.replace(/^[0-9+-\s]+/, '') : 'Add employee scale'}</small>
            </div>
          </article>
          <article className="settings-summary-card summary-location">
            <div className="summary-icon"><MapPin size={22} /></div>
            <div>
              <span>Headquarters</span>
              <strong>{formData.location ? formData.location.split(',')[0] : 'Global / Remote'}</strong>
              <small>{formData.location || 'Location not specified'}</small>
            </div>
          </article>
          <article className="settings-summary-card summary-completion">
            <div className="summary-icon"><Sparkles size={22} /></div>
            <div>
              <span>Profile Strength</span>
              <strong>{completionPercentage}%</strong>
              <small>{completionPercentage === 100 ? 'All fields completed' : `${completedFieldsCount}/12 fields filled`}</small>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          2. MAIN WORKSPACE 2-COLUMN LAYOUT
          ========================================================= */}
      <form onSubmit={handleSave} className="settings-workspace-layout">
        {/* Left Column: Form Panels */}
        <div className="settings-form-column">
          {/* Panel 1: Brand & Organization */}
          <div className="settings-panel-card">
            <div className="settings-panel-header">
              <div className="settings-panel-title-box">
                <h3>Brand & Organization Identity</h3>
                <p>Primary public company identification, branding assets, and corporate scale</p>
              </div>
              <span className="settings-step-indicator">Step 1 of 4</span>
            </div>

            {/* Logo Preview & Input */}
            <div className="settings-field-group" style={{ marginBottom: '20px' }}>
              <label className="settings-field-label">Company Brand Logo</label>
              <div className="settings-logo-row">
                <div className="settings-logo-preview">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Company Logo Preview"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="settings-logo-initials">{companyInitials}</span>
                  )}
                </div>
                <div className="settings-logo-details">
                  <div className="settings-input-container">
                    <span className="settings-field-icon">
                      <Globe size={16} />
                    </span>
                    <input
                      type="url"
                      name="logoUrl"
                      id="companyLogoUrl"
                      placeholder="https://example.com/assets/logo.png"
                      value={formData.logoUrl || ''}
                      onChange={handleChange}
                      className="settings-input"
                    />
                  </div>
                  <div className="settings-helper-hint">
                    <Info size={14} color="#059669" />
                    <span>Paste a direct image link (SVG, PNG, JPG). A stylized avatar will be rendered if left blank.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-fields-grid">
              {/* Company Name */}
              <div className="settings-field-group settings-col-span-2">
                <label htmlFor="companyName" className="settings-field-label">
                  <span>Company Name</span>
                  <span className="settings-required-star">*</span>
                </label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <Building2 size={16} />
                  </span>
                  <input
                    type="text"
                    name="companyName"
                    id="companyName"
                    required
                    placeholder="e.g. Acme Corporation, TechNova Solutions"
                    value={formData.companyName || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>

              {/* Industry Dropdown */}
              <div className="settings-field-group">
                <label htmlFor="companyIndustry" className="settings-field-label">
                  <span>Industry / Sector</span>
                </label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <Briefcase size={16} />
                  </span>
                  <select
                    name="industry"
                    id="companyIndustry"
                    value={formData.industry || ''}
                    onChange={handleChange}
                    className="settings-select"
                  >
                    <option value="">Select Industry...</option>
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company Size Dropdown */}
              <div className="settings-field-group">
                <label htmlFor="companySize" className="settings-field-label">
                  <span>Company Size / Scale</span>
                </label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <Users size={16} />
                  </span>
                  <select
                    name="companySize"
                    id="companySize"
                    value={formData.companySize || ''}
                    onChange={handleChange}
                    className="settings-select"
                  >
                    <option value="">Select Company Size...</option>
                    {COMPANY_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Founded Year */}
              <div className="settings-field-group">
                <label htmlFor="foundedYear" className="settings-field-label">
                  <span>Founded Year</span>
                </label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <Calendar size={16} />
                  </span>
                  <input
                    type="text"
                    name="foundedYear"
                    id="foundedYear"
                    placeholder="e.g. 2018, 2021"
                    value={formData.foundedYear || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>

              {/* Headquarters Location */}
              <div className="settings-field-group">
                <label htmlFor="companyLocation" className="settings-field-label">
                  <span>Headquarters Location</span>
                </label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <MapPin size={16} />
                  </span>
                  <input
                    type="text"
                    name="location"
                    id="companyLocation"
                    placeholder="e.g. Colombo, Sri Lanka or New York, NY"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Contact & Administrative Representative */}
          <div className="settings-panel-card">
            <div className="settings-panel-header">
              <div className="settings-panel-title-box">
                <h3>Contact & Administrative Stakeholders</h3>
                <p>Primary corporate contact details and recruitment representative</p>
              </div>
              <span className="settings-step-indicator">Step 2 of 4</span>
            </div>

            <div className="settings-fields-grid">
              {/* Representative Name */}
              <div className="settings-field-group">
                <label htmlFor="adminName" className="settings-field-label">
                  <span>Representative / Admin Name</span>
                  <span className="settings-required-star">*</span>
                </label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <UserCheck size={16} />
                  </span>
                  <input
                    type="text"
                    name="adminName"
                    id="adminName"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.adminName || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>

              {/* Official Contact Email */}
              <div className="settings-field-group">
                <label htmlFor="contactEmail" className="settings-field-label">
                  <span>Official Contact Email</span>
                  <span className="settings-required-star">*</span>
                </label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="contactEmail"
                    id="contactEmail"
                    required
                    placeholder="e.g. careers@company.com"
                    value={formData.contactEmail || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>

              {/* Direct Phone Number */}
              <div className="settings-field-group settings-col-span-2">
                <label htmlFor="phone" className="settings-field-label">
                  <span>Direct Telephone / Phone Number</span>
                </label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    placeholder="e.g. +1 (555) 234-5678 or +94 11 234 5678"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Digital Presence & Social Footprint */}
          <div className="settings-panel-card">
            <div className="settings-panel-header">
              <div className="settings-panel-title-box">
                <h3>Online Presence & Social Channels</h3>
                <p>Public web presence where candidates discover your brand and engineering culture</p>
              </div>
              <span className="settings-step-indicator">Step 3 of 4</span>
            </div>

            <div className="settings-fields-grid">
              {/* Website */}
              <div className="settings-field-group">
                <label htmlFor="companyWebsite" className="settings-field-label">Official Website URL</label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <Globe size={16} />
                  </span>
                  <input
                    type="url"
                    name="website"
                    id="companyWebsite"
                    placeholder="https://acmecorp.com"
                    value={formData.website || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div className="settings-field-group">
                <label htmlFor="linkedinUrl" className="settings-field-label">LinkedIn Organization Page</label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <LinkedInIcon />
                  </span>
                  <input
                    type="url"
                    name="linkedinUrl"
                    id="linkedinUrl"
                    placeholder="https://linkedin.com/company/acmecorp"
                    value={formData.linkedinUrl || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>

              {/* Twitter / X */}
              <div className="settings-field-group">
                <label htmlFor="twitterUrl" className="settings-field-label">Twitter / X Profile</label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <TwitterIcon />
                  </span>
                  <input
                    type="url"
                    name="twitterUrl"
                    id="twitterUrl"
                    placeholder="https://x.com/acmecorp"
                    value={formData.twitterUrl || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>

              {/* GitHub */}
              <div className="settings-field-group">
                <label htmlFor="githubUrl" className="settings-field-label">GitHub Organization</label>
                <div className="settings-input-container">
                  <span className="settings-field-icon">
                    <GitHubIcon />
                  </span>
                  <input
                    type="url"
                    name="githubUrl"
                    id="githubUrl"
                    placeholder="https://github.com/acmecorp"
                    value={formData.githubUrl || ''}
                    onChange={handleChange}
                    className="settings-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel 4: About Company & Overview */}
          <div className="settings-panel-card">
            <div className="settings-panel-header">
              <div className="settings-panel-title-box">
                <h3>About the Company & Value Proposition</h3>
                <p>Narrative overview of your team's mission, work culture, and value proposition</p>
              </div>
              <span className="settings-step-indicator">Step 4 of 4</span>
            </div>

            <div className="settings-field-group">
              <label htmlFor="companyAbout" className="settings-field-label">
                <span>Company Overview & Mission Statement</span>
              </label>
              <textarea
                name="about"
                id="companyAbout"
                rows={6}
                placeholder="Share your company's mission, engineering culture, tech stack highlights, and what makes your team unique..."
                value={formData.about || ''}
                onChange={handleChange}
                className="settings-textarea"
              />
              <div className="settings-textarea-meta">
                <span>Formatted cleanly as readable paragraphs on the public candidate profile.</span>
                <span>{(formData.about || '').length} characters</span>
              </div>
            </div>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="settings-bottom-actions">
            <Link to="/dashboard" className="settings-btn-preview" style={{ padding: '10px 20px' }}>
              Back to Overview
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="settings-save-btn"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="settings-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Check size={17} strokeWidth={2.5} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Interactive Candidate View Card */}
        <aside className="settings-preview-column">
          <div className="settings-live-preview-card">
            <span className="settings-preview-tag">
              <Sparkles size={12} /> Live Candidate View
            </span>

            <div className="settings-preview-box">
              <div className="settings-preview-brand-row">
                <div className="settings-preview-avatar">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="settings-preview-avatar-text">{companyInitials}</span>
                  )}
                </div>
                <div className="settings-preview-title-wrap">
                  <span className="settings-preview-name" title={formData.companyName}>
                    {formData.companyName || 'Your Company Name'}
                  </span>
                  <span className="settings-preview-industry">
                    {formData.industry || 'Technology & Innovation'}
                  </span>
                </div>
              </div>

              <div className="settings-preview-meta-chips">
                <span className="settings-preview-chip">
                  <MapPin size={12} /> {formData.location ? formData.location.split(',')[0] : 'Global'}
                </span>
                <span className="settings-preview-chip">
                  <Users size={12} /> {formData.companySize ? formData.companySize.split(' ')[0] : '1-50'}
                </span>
                {formData.foundedYear && (
                  <span className="settings-preview-chip">
                    <Calendar size={12} /> Est. {formData.foundedYear}
                  </span>
                )}
              </div>

              <p className="settings-preview-about">
                {formData.about ||
                  'No company summary provided yet. Add your mission and values to help top talent understand why they should join your organization.'}
              </p>

              {formData.website ? (
                <a
                  href={formData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="settings-preview-link-out"
                >
                  <Globe size={14} />
                  <span>Visit Website</span>
                  <ExternalLink size={12} style={{ marginLeft: 'auto' }} />
                </a>
              ) : (
                <div className="settings-preview-link-out" style={{ opacity: 0.6, cursor: 'default' }}>
                  <Globe size={14} />
                  <span>Website Not Set</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Security & Access Card */}
          <div className="settings-tips-card">
            <span className="settings-tips-title">
              <ShieldCheck size={16} color="#059669" /> Workspace Security & Tips
            </span>
            <ul className="settings-tips-list">
              <li>Keep your primary contact email up-to-date for crucial ATS and assessment alerts.</li>
              <li>A direct company logo increases job vacancy click-through rate by up to 40%.</li>
              <li>To manage passwords and authentication, access the <strong>Security</strong> tab.</li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
};
