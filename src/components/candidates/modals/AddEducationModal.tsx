import React, { useState, useEffect } from 'react';
import { candidateCvApi, type EducationDto } from '../../../services/api';
import { XIcon, CheckIcon } from '../../common/Icons';

interface AddEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (education: EducationDto) => void;
  initialData?: EducationDto | null;
}

const GraduationCapIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

export const AddEducationModal: React.FC<AddEducationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDegree(initialData.degree || '');
      setInstitution(initialData.institution || '');
      setFieldOfStudy(initialData.fieldOfStudy || '');
      setStartYear(initialData.startYear || '');
      setEndYear(initialData.endYear || '');
      setDescription(initialData.description || '');
    } else {
      setDegree('');
      setInstitution('');
      setFieldOfStudy('');
      setStartYear('');
      setEndYear('');
      setDescription('');
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!degree.trim() || !institution.trim() || !startYear.trim()) {
      setErrorMsg('Please provide degree, institution name, and start year.');
      return;
    }

    setLoading(true);
    try {
      let saved: EducationDto;
      const payload = {
        degree: degree.trim(),
        institution: institution.trim(),
        fieldOfStudy: fieldOfStudy.trim() || undefined,
        startYear: startYear.trim(),
        endYear: endYear.trim() || undefined,
        description: description.trim() || undefined,
      };

      if (initialData?.id) {
        saved = await candidateCvApi.updateEducation(initialData.id, payload);
      } else {
        saved = await candidateCvApi.addEducation(payload);
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      console.error('Failed to save education:', err);
      setErrorMsg(err.message || 'Unable to save education. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialData?.id;

  return (
    <div className="candidate-modal-backdrop" onClick={onClose}>
      <div className="candidate-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="candidate-modal-header">
          <div className="candidate-modal-title-box">
            <div className="candidate-icon-box">
              <GraduationCapIcon />
            </div>
            <div className="candidate-modal-title-text">
              <h2>{isEditing ? 'Edit Education & Degree' : 'Add Education & Degree'}</h2>
              <p>Highlight your academic qualifications and credentials</p>
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
          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">
              Degree / Qualification <span className="settings-label required-star">*</span>
            </label>
            <div className="settings-input-wrapper">
              <input
                type="text"
                required
                placeholder="e.g. B.S. in Computer Science & Engineering"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px' }}
                autoFocus
              />
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                Institution / University <span className="settings-label required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>

            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                Field of Study / Major
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. Distributed Computing"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                Start Year <span className="settings-label required-star">*</span>
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  required
                  placeholder="e.g. 2018"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>

            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                Graduation / End Year
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. 2022 or Present"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>
          </div>

          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">
              Honors, Distinctions or Additional Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. First Class Honours, Dean's List, Research in Cloud Computing..."
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
              <span>{loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Education'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

