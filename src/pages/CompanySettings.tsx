import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  companyProfileApi,
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
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState<UpdateCompanyProfilePayload>({
    companyName: '',
    logoUrl: '',
    website: '',
    location: '',
    industry: '',
    about: '',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch company profile on load
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await companyProfileApi.getProfile();
        setFormData({
          companyName: profile.companyName || currentUser?.companyName || '',
          logoUrl: profile.logoUrl || '',
          website: profile.website || '',
          location: profile.location || '',
          industry: profile.industry || '',
          about: profile.about || '',
        });
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setErrorMessage('Unable to load company profile. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

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

      await companyProfileApi.updateProfile(formData);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', minHeight: '380px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #00b074', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Loading Employer Profile...
        </p>
      </div>
    );
  }

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
