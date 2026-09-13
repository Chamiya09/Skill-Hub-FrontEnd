import React, { useState } from 'react';
import { candidateCvApi, type ProjectDto } from '../../../services/api';
import { XIcon, CheckIcon } from '../../common/Icons';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: ProjectDto) => void;
}

const CodeFolderIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <path d="m10 13-2 2 2 2" />
    <path d="m14 17 2-2-2-2" />
  </svg>
);

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [projectName, setProjectName] = useState('');
  const [role, setRole] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!projectName.trim()) {
      setErrorMsg('Please enter the project name.');
      return;
    }

    setLoading(true);
    try {
      const created = await candidateCvApi.addProject({
        projectName: projectName.trim(),
        role: role.trim() || undefined,
        link: link.trim() || undefined,
        description: description.trim() || undefined,
      });

      onSuccess(created);
      onClose();
      // Reset form
      setProjectName('');
      setRole('');
      setLink('');
      setDescription('');
    } catch (err: any) {
      console.error('Failed to add project:', err);
      setErrorMsg(err.message || 'Unable to save project. Please try again.');
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
              <CodeFolderIcon />
            </div>
            <div className="candidate-modal-title-text">
              <h2>Add Project & Portfolio</h2>
              <p>Showcase technical builds, open-source work, and live apps</p>
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
              Project Title <span className="settings-label required-star">*</span>
            </label>
            <div className="settings-input-wrapper">
              <input
                type="text"
                required
                placeholder="e.g. Distributed Cache & In-Memory Store"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px' }}
                autoFocus
              />
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                Your Role / Tech Stack
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. Lead Architect / C# & Redis"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>

            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">
                Live URL / GitHub Repo Link
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>
          </div>

          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">
              Project Description & Key Accomplishments
            </label>
            <textarea
              rows={3}
              placeholder="Describe the architecture, performance gains, technologies used, and outcomes..."
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
              <span>{loading ? 'Saving...' : 'Save Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
