import React, { useState, useEffect } from 'react';
import { candidateAuthApi, type UserDto } from '../../../services/api';
import { EditIcon, XIcon, CheckIcon } from '../../common/Icons';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: UserDto) => void;
  initialData?: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedinUrl?: string;
    githubUrl?: string;
  };
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFirstName(initialData?.firstName || '');
      setLastName(initialData?.lastName || '');
      setHeadline(initialData?.headline || '');
      setPhone(initialData?.phone || '');
      setLocation(initialData?.location || '');
      setWebsite(initialData?.website || '');
      setLinkedinUrl(initialData?.linkedinUrl || '');
      setGithubUrl(initialData?.githubUrl || '');
      setErrorMsg(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setLoading(true);
    try {
      const updated = await candidateAuthApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        headline: headline.trim(),
        phone: phone.trim(),
        location: location.trim(),
        website: website.trim(),
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update candidate profile:', err);
      setErrorMsg(err.message || 'Unable to update profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-modal-backdrop" onClick={onClose}>
      <div
        className="candidate-modal-card"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="candidate-modal-header">
          <div className="candidate-modal-title-box">
            <div className="candidate-icon-box">
              <EditIcon />
            </div>
            <div className="candidate-modal-title-text">
              <h2>Edit Personal & Contact Details</h2>
              <p>Update your basic information, headline, and external profile links</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="candidate-modal-close-btn"
            aria-label="Close Modal"
          >
            <XIcon />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="candidate-alert-error" style={{ padding: '10px 14px', fontSize: '13px' }}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="candidate-modal-form">
          <div className="settings-form-grid">
            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                First Name <span className="settings-label required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                  autoFocus
                />
              </div>
            </div>

            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                Last Name <span className="settings-label required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  required
                  placeholder="e.g. Taylor"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>
          </div>

          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">
              Professional Headline / Target Role <span className="settings-label required-star">*</span>
            </label>
            <div className="settings-input-wrapper">
              <input
                type="text"
                required
                placeholder="e.g. Senior Full-Stack Cloud Architect • React & .NET Core"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px' }}
              />
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">Phone Number</label>
              <div className="settings-input-wrapper">
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 749-2041"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>

            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">Location & Work Preference</label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA (Open to Remote)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">Portfolio / Personal Website</label>
              <div className="settings-input-wrapper">
                <input
                  type="url"
                  placeholder="e.g. https://jessicataylor.dev"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>

            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">LinkedIn Profile URL</label>
              <div className="settings-input-wrapper">
                <input
                  type="url"
                  placeholder="e.g. https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>
          </div>

          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">GitHub Profile URL</label>
            <div className="settings-input-wrapper">
              <input
                type="url"
                placeholder="e.g. https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px' }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="candidate-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="settings-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="settings-btn-save"
            >
              <CheckIcon />
              <span>{loading ? 'Saving...' : 'Save Profile Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
