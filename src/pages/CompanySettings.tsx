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
} from '../components/common/Icons';

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
      logoUrl: localProfile.logoUrl || cached?.logoUrl || '',
      website: localProfile.website || cached?.website || '',
      location: localProfile.location || cached?.location || '',
      industry: localProfile.industry || cached?.industry || '',
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
          logoUrl: profile.logoUrl || prev.logoUrl || '',
          website: profile.website || prev.website || '',
          location: profile.location || prev.location || '',
          industry: profile.industry || prev.industry || '',
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
          logoUrl: formData.logoUrl?.trim() || '',
          website: formData.website?.trim() || '',
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

      setSuccessMessage('Company profile successfully updated.');

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
            <span>Employer Profile</span>
          </div>
          <h1 className="settings-title">Company Profile Settings</h1>
          <p className="settings-subtitle">
            Update your corporate identity, logo, location, and overview displayed to potential candidates on live job vacancies.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave}>
        {/* Section 1: Basic Brand Identity */}
        <div className="settings-section-card">
          <div className="settings-section-header">
            <div className="settings-section-title-box">
              <h2>Brand & Organization</h2>
              <p>Primary public identification details</p>
            </div>
            <span className="settings-step-badge">Step 1 of 3</span>
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
                    value={formData.logoUrl}
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

          {/* Company Name */}
          <div className="settings-form-group" style={{ marginTop: '20px' }}>
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
                value={formData.companyName}
                onChange={handleChange}
                className="settings-input-field"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Online Presence & Location */}
        <div className="settings-section-card">
          <div className="settings-section-header">
            <div className="settings-section-title-box">
              <h2>Online Presence & Headquarters</h2>
              <p>Where your business operates and candidates can learn more</p>
            </div>
            <span className="settings-step-badge">Step 2 of 3</span>
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
                  value={formData.website}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>

            {/* Location */}
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
                  value={formData.location}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>

            {/* Industry */}
            <div className="settings-form-group settings-col-full">
              <label htmlFor="companyIndustry" className="settings-label">Industry / Sector</label>
              <div className="settings-input-wrapper">
                <span className="settings-input-icon">
                  <BuildingIcon />
                </span>
                <input
                  type="text"
                  name="industry"
                  id="companyIndustry"
                  placeholder="e.g. Enterprise SaaS & Cloud Computing"
                  value={formData.industry}
                  onChange={handleChange}
                  className="settings-input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: About the Company */}
        <div className="settings-section-card">
          <div className="settings-section-header">
            <div className="settings-section-title-box">
              <h2>About the Company</h2>
              <p>Narrative summary of your mission, culture, and engineering values</p>
            </div>
            <span className="settings-step-badge">Step 3 of 3</span>
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
              value={formData.about}
              onChange={handleChange}
              className="settings-textarea-field"
            />
            <div className="settings-textarea-footer">
              <span>Formatted cleanly as readable paragraphs on the candidate profile.</span>
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
