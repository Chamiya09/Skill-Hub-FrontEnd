import React, { useState } from 'react';
import { candidateCvApi, type ExperienceDto } from '../../../services/api';
import { BriefcaseIcon, XIcon, CheckIcon } from '../../common/Icons';

interface AddExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (experience: ExperienceDto) => void;
}

export const AddExperienceModal: React.FC<AddExperienceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !company.trim() || !startDate.trim()) {
      setErrorMsg('Please enter job title, company name, and start date.');
      return;
    }

    setLoading(true);
    try {
      const created = await candidateCvApi.addExperience({
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || undefined,
        startDate: startDate.trim(),
        endDate: isCurrent ? undefined : endDate.trim() || undefined,
        isCurrent,
        description: description.trim() || undefined,
      });

      onSuccess(created);
      onClose();
      // Reset form
      setTitle('');
      setCompany('');
      setLocation('');
      setStartDate('');
      setEndDate('');
      setIsCurrent(false);
      setDescription('');
    } catch (err: any) {
      console.error('Failed to add experience:', err);
      setErrorMsg(err.message || 'Unable to save experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-modal-backdrop" onClick={onClose}>
      <div className="candidate-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="candidate-modal-header">
          <div className="candidate-modal-title-box">
            <div className="candidate-icon-box">
              <BriefcaseIcon />
            </div>
            <div className="candidate-modal-title-text">
              <h2>Add Work Experience</h2>
              <p>Document your career history, achievements, and impact</p>
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
                Job Title <span className="settings-label required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                  autoFocus
                />
              </div>
            </div>

            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                Company Name <span className="settings-label required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Cloud Corp"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>
          </div>

          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">Location / Workplace Type</label>
            <div className="settings-input-wrapper">
              <input
                type="text"
                placeholder="e.g. San Francisco, CA (Remote)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px' }}
              />
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                Start Date <span className="settings-label required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  required
                  placeholder="e.g. Jan 2022"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>

            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">End Date</label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  placeholder={isCurrent ? 'Present' : 'e.g. Present or Dec 2024'}
                  disabled={isCurrent}
                  value={isCurrent ? 'Present' : endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="isCurrentExp"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#00b074', cursor: 'pointer' }}
            />
            <label htmlFor="isCurrentExp" style={{ fontSize: '13px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
              I am currently working in this role
            </label>
          </div>

          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">Key Responsibilities & Deliveries</label>
            <textarea
              rows={3}
              placeholder="• Architected distributed cloud infrastructure...&#10;• Led sprint planning and performance optimizations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="settings-textarea-field"
            />
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
              <span>{loading ? 'Saving...' : 'Save Experience'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
