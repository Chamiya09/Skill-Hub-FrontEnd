import React, { useState, useEffect } from 'react';
import {
  candidateCvApi,
  type CertificationDto,
  type CreateCertificationPayload,
} from '../../../services/api';
import { AwardIcon, XIcon, CheckIcon } from '../../common/Icons';

interface AddCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (certification: CertificationDto) => void;
  initialData?: CertificationDto | null;
}

export const AddCertificationModal: React.FC<AddCertificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [issuingOrganization, setIssuingOrganization] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setIssuingOrganization(initialData.issuingOrganization || '');
      setIssueDate(initialData.issueDate || '');
      setCredentialUrl(initialData.credentialUrl || '');
    } else {
      setTitle('');
      setIssuingOrganization('');
      setIssueDate('');
      setCredentialUrl('');
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !issuingOrganization.trim()) {
      setErrorMsg('Please enter both the certification title and issuing organization.');
      return;
    }

    setLoading(true);
    try {
      let saved: CertificationDto;
      const payload: CreateCertificationPayload = {
        title: title.trim(),
        issuingOrganization: issuingOrganization.trim(),
        issueDate: issueDate.trim() || undefined,
        credentialUrl: credentialUrl.trim() || undefined,
      };

      if (initialData?.id) {
        saved = await candidateCvApi.updateCertification(initialData.id, payload);
      } else {
        saved = await candidateCvApi.addCertification(payload);
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      console.error('Failed to save certification:', err);
      setErrorMsg(err.message || 'Unable to save certification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialData?.id;

  return (
    <div className="candidate-modal-backdrop" onClick={onClose}>
      <div
        className="candidate-modal-card"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="candidate-modal-header">
          <div className="candidate-modal-title-box">
            <div className="candidate-icon-box">
              <AwardIcon />
            </div>
            <div className="candidate-modal-title-text">
              <h2>{isEditing ? 'Edit License / Certification' : 'Add License / Certification'}</h2>
              <p>Showcase your accredited industry certificates and badges</p>
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
              Certification Title <span className="settings-label required-star">*</span>
            </label>
            <div className="settings-input-wrapper">
              <input
                type="text"
                required
                placeholder="e.g. AWS Certified Solutions Architect - Associate"
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
              Issuing Organization <span className="settings-label required-star">*</span>
            </label>
            <div className="settings-input-wrapper">
              <input
                type="text"
                required
                placeholder="e.g. Amazon Web Services (AWS) or Google Cloud"
                value={issuingOrganization}
                onChange={(e) => setIssuingOrganization(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px' }}
              />
            </div>
          </div>

          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">Issue Date / Valid Period</label>
            <div className="settings-input-wrapper">
              <input
                type="text"
                placeholder="e.g. Aug 2023 or Issued Jan 2024"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px' }}
              />
            </div>
          </div>

          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">Credential Verification URL (Optional)</label>
            <div className="settings-input-wrapper">
              <input
                type="url"
                placeholder="e.g. https://www.credly.com/badges/your-id or certificate link"
                value={credentialUrl}
                onChange={(e) => setCredentialUrl(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px' }}
              />
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Direct link where recruiters can verify your license or badge.
            </span>
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
              <span>{loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Certification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
