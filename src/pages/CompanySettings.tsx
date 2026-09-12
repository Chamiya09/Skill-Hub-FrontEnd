import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  companyProfileApi,
  authStorage,
  type CompanyProfileDto,
  type UpdateCompanyProfilePayload,
} from '../services/api';
import {
  BuildingIcon,
  GlobeIcon,
  MapPinIcon,
  CheckIcon,
  SparkleIcon,
  InfoIcon,
  MailIcon,
  PhoneIcon,
  UsersIcon,
  CalendarIcon,
  LinkedInIcon,
  TwitterIcon,
  GitHubIcon,
  UserCheckIcon,
} from '../components/common/Icons';

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

  // Initialize immediately from cached user & local storage so page renders with ZERO blink
  const [formData, setFormData] = useState<UpdateCompanyProfilePayload>(() => {
    const cached = authStorage.getUser();
    let localProfile: Partial<CompanyProfileDto> = {};
    if (typeof window !== 'undefined') {
      try {
        const companyId = cached?.companyId || cached?.id || 'current';
        const stored =
          localStorage.getItem(`skillhub_company_profile_${companyId}`) ||
          localStorage.getItem(`skillhub_company_profile_current`);
        if (stored) localProfile = JSON.parse(stored);
      } catch {}
    }

    return {
      companyName: localProfile.companyName || cached?.companyName || '',
      adminName: localProfile.adminName || (cached as any)?.adminName || cached?.fullName || '',
      contactEmail: localProfile.contactEmail || (cached as any)?.contactEmail || cached?.email || '',
      phone: localProfile.phone || (cached as any)?.phone || '',
      companySize: localProfile.companySize || (cached as any)?.companySize || '51-200 Employees (Growth Stage)',
      foundedYear: localProfile.foundedYear || (cached as any)?.foundedYear || '2020',
      logoUrl: localProfile.logoUrl || cached?.logoUrl || '',
      website: localProfile.website || cached?.website || '',
      linkedinUrl: localProfile.linkedinUrl || (cached as any)?.linkedinUrl || '',
      twitterUrl: localProfile.twitterUrl || (cached as any)?.twitterUrl || '',
      githubUrl: localProfile.githubUrl || (cached as any)?.githubUrl || '',
      location: localProfile.location || cached?.location || '',
      industry: localProfile.industry || cached?.industry || 'Software Development & SaaS',
      about: localProfile.about || cached?.about || '',
    };
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Smooth background profile fetch once on component mount
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
          phone: profile.phone || prev.phone || '',
          companySize: profile.companySize || prev.companySize || '51-200 Employees (Growth Stage)',
          foundedYear: profile.foundedYear || prev.foundedYear || '2020',
          logoUrl: profile.logoUrl || prev.logoUrl || '',
          website: profile.website || prev.website || '',
          linkedinUrl: profile.linkedinUrl || prev.linkedinUrl || '',
          twitterUrl: profile.twitterUrl || prev.twitterUrl || '',
          githubUrl: profile.githubUrl || prev.githubUrl || '',
          location: profile.location || prev.location || '',
          industry: profile.industry || prev.industry || 'Software Development & SaaS',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // 1. Submit update to backend API & persist to company profile storage
      const updatedProfile = await companyProfileApi.updateProfile(formData);

      // 2. Overwrite and update Global Auth Context & LocalStorage / Session state
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          companyName: formData.companyName?.trim() || currentUser.companyName,
          adminName: formData.adminName?.trim() || currentUser.fullName,
          fullName: formData.adminName?.trim() || currentUser.fullName,
          email: formData.contactEmail?.trim() || currentUser.email,
          contactEmail: formData.contactEmail?.trim() || currentUser.email,
          phone: formData.phone?.trim() || '',
          companySize: formData.companySize?.trim() || '',
          foundedYear: formData.foundedYear?.trim() || '',
          logoUrl: formData.logoUrl?.trim() || '',
          website: formData.website?.trim() || '',
          linkedinUrl: formData.linkedinUrl?.trim() || '',
          twitterUrl: formData.twitterUrl?.trim() || '',
          githubUrl: formData.githubUrl?.trim() || '',
          location: formData.location?.trim() || '',
          industry: formData.industry?.trim() || '',
          about: formData.about?.trim() || '',
        };
        setUser(updatedUser);
        updateUser(updatedUser);
      }

      // 3. Trigger profile refresh and emit custom event for real-time reactivity across all components
      await refreshProfile().catch(() => {});

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('skillhub_company_profile_updated', {
            detail: { ...updatedProfile, ...formData },
          })
        );
      }

      setSuccessMessage('Company profile and account details successfully updated.');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4500);
    } catch (err: any) {
      console.error('Failed to update company profile:', err);
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate company initials for fallback preview
  const companyInitials =
    (formData.companyName || currentUser?.companyName || 'CO')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CO';

  return (
    <div className="company-settings-container">
      {/* Success Notification Alert */}
      {successMessage && (
        <div className="auth-alert-success" style={{ marginBottom: '24px' }}>
          <CheckIcon />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="auth-alert-error" style={{ justifyContent: 'space-between', marginBottom: '24px' }}>
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="settings-header-card">
        <div>
          <div className="settings-badge">
            <SparkleIcon />
            <span>Employer Profile & Account Settings</span>
          </div>
          <h1 className="settings-title">Company Profile & Account</h1>
          <p className="settings-subtitle">
            Manage your corporate identity, registration details, digital presence, and overview displayed to potential candidates on live job vacancies.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave}>
        {/* Section 1: Basic Brand Identity & Professional Details */}
        <div className="settings-section-card">
          <div className="settings-section-header">
            <div className="settings-section-title-box">
              <h2>Brand & Organization</h2>
              <p>Primary public identification and corporate structure</p>
            </div>
            <span className="settings-step-badge">Step 1 of 4</span>
          </div>

          {/* Company Logo and Live Preview Stack */}
          <div className="settings-form-group">
            <label className="settings-label">Company Logo</label>
            <div className="settings-logo-container">
              {/* Logo Preview Avatar Box */}
              <div className="settings-logo-preview-box">
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

              {/* Logo URL Input */}
              <div className="settings-logo-input-box">
                <div className="settings-input-wrapper">
                  <span className="settings-input-icon">
                    <GlobeIcon />
                  </span>
                  <input
                    type="url"
                    name="logoUrl"
                    id="companyLogoUrl"
                    placeholder="https://example.com/assets/logo.png"
                    value={formData.logoUrl || ''}
                    onChange={handleChange}
                    className="settings-input-field"
                  />
                </div>
                <div className="settings-helper-note">
                  <InfoIcon />
                  <span>Paste a direct image link (SVG, PNG, JPG). A stylized avatar will be rendered if left blank.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-form-grid" style={{ marginTop: '20px' }}>
            {/* Company Name */}
            <div className="settings-form-group settings-col-full">
              <label htmlFor="companyName" className="settings-label">
                <span>Company Name</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <BuildingIcon />
                </span>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  required
                  placeholder="e.g. Acme Corporation, TechNova Solutions"
                  value={formData.companyName || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>

            {/* Industry Dropdown */}
            <div className="settings-form-group">
              <label htmlFor="companyIndustry" className="settings-label">
                <span>Industry / Sector</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <BuildingIcon />
                </span>
                <select
                  name="industry"
                  id="companyIndustry"
                  required
                  value={formData.industry || 'Software Development & SaaS'}
                  onChange={handleChange}
                  className="settings-input-field"
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Company Size */}
            <div className="settings-form-group">
              <label htmlFor="companySize" className="settings-label">
                <span>Company Size</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <UsersIcon />
                </span>
                <select
                  name="companySize"
                  id="companySize"
                  value={formData.companySize || '51-200 Employees (Growth Stage)'}
                  onChange={handleChange}
                  className="settings-input-field"
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  {COMPANY_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Founded Year */}
            <div className="settings-form-group">
              <label htmlFor="foundedYear" className="settings-label">
                <span>Founded Year</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <CalendarIcon />
                </span>
                <input
                  type="text"
                  name="foundedYear"
                  id="foundedYear"
                  placeholder="e.g. 2018, 2021"
                  value={formData.foundedYear || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>

            {/* Headquarters Location */}
            <div className="settings-form-group">
              <label htmlFor="companyLocation" className="settings-label">
                <span>Headquarters Location</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <MapPinIcon />
                </span>
                <input
                  type="text"
                  name="location"
                  id="companyLocation"
                  required
                  placeholder="e.g. San Francisco, CA or Remote First"
                  value={formData.location || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Edit Registration / Account Administrator Details */}
        <div className="settings-section-card">
          <div className="settings-section-header">
            <div className="settings-section-title-box">
              <h2>Registration & Account Representative</h2>
              <p>Primary contact officer and billing administrator details</p>
            </div>
            <span className="settings-step-badge">Step 2 of 4</span>
          </div>

          <div className="settings-form-grid">
            {/* Representative Name */}
            <div className="settings-form-group">
              <label htmlFor="adminName" className="settings-label">
                <span>Administrator / Representative Name</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <UserCheckIcon />
                </span>
                <input
                  type="text"
                  name="adminName"
                  id="adminName"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.adminName || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>

            {/* Contact Email */}
            <div className="settings-form-group">
              <label htmlFor="contactEmail" className="settings-label">
                <span>Official / Contact Email</span>
                <span className="required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  name="contactEmail"
                  id="contactEmail"
                  required
                  placeholder="e.g. careers@company.com or admin@company.com"
                  value={formData.contactEmail || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="settings-form-group settings-col-full">
              <label htmlFor="phone" className="settings-label">
                <span>Direct Phone Number</span>
              </label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <PhoneIcon />
                </span>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  placeholder="e.g. +1 (555) 234-5678"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Online Presence & Social Media Links */}
        <div className="settings-section-card">
          <div className="settings-section-header">
            <div className="settings-section-title-box">
              <h2>Online Presence & Social Channels</h2>
              <p>Where candidates and talent can discover your company brand</p>
            </div>
            <span className="settings-step-badge">Step 3 of 4</span>
          </div>

          <div className="settings-form-grid">
            {/* Website */}
            <div className="settings-form-group">
              <label htmlFor="companyWebsite" className="settings-label">Official Website</label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <GlobeIcon />
                </span>
                <input
                  type="text"
                  name="website"
                  id="companyWebsite"
                  placeholder="https://acmecorp.com"
                  value={formData.website || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div className="settings-form-group">
              <label htmlFor="linkedinUrl" className="settings-label">LinkedIn Page</label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <LinkedInIcon />
                </span>
                <input
                  type="url"
                  name="linkedinUrl"
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/company/acmecorp"
                  value={formData.linkedinUrl || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>

            {/* Twitter / X */}
            <div className="settings-form-group">
              <label htmlFor="twitterUrl" className="settings-label">Twitter / X Profile</label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <TwitterIcon />
                </span>
                <input
                  type="url"
                  name="twitterUrl"
                  id="twitterUrl"
                  placeholder="https://x.com/acmecorp"
                  value={formData.twitterUrl || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>

            {/* GitHub */}
            <div className="settings-form-group">
              <label htmlFor="githubUrl" className="settings-label">GitHub Organization</label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <GitHubIcon />
                </span>
                <input
                  type="url"
                  name="githubUrl"
                  id="githubUrl"
                  placeholder="https://github.com/acmecorp"
                  value={formData.githubUrl || ''}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: About the Company */}
        <div className="settings-section-card">
          <div className="settings-section-header">
            <div className="settings-section-title-box">
              <h2>About the Company</h2>
              <p>Narrative summary of your mission, culture, and engineering values</p>
            </div>
            <span className="settings-step-badge">Step 4 of 4</span>
          </div>

          <div className="settings-form-group">
            <label htmlFor="companyAbout" className="settings-label">
              <span>Company Overview & Mission</span>
              <span className="required-star">*</span>
            </label>
            <textarea
              name="about"
              id="companyAbout"
              required
              rows={6}
              placeholder="Share your company's mission, engineering culture, tech stack highlights, and what makes your team unique..."
              value={formData.about || ''}
              onChange={handleChange}
              className="settings-textarea-field"
            />
            <div className="settings-textarea-footer">
              <span>Formatted cleanly as readable paragraphs on the public candidate profile.</span>
              <span>{(formData.about || '').length} characters</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="settings-actions-footer">
          <Link to="/dashboard" className="settings-btn-cancel">
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="settings-btn-save"
          >
            {isSaving ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <CheckIcon />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
