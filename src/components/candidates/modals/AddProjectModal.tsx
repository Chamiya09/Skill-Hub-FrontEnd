import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { candidateCvApi, type ProjectDto } from '../../../services/api';
import { XIcon, CheckIcon, SparkleIcon } from '../../common/Icons';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: ProjectDto) => void;
  initialData?: ProjectDto | null;
}

const CodeFolderIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <path d="m10 13-2 2 2 2" />
    <path d="m14 17 2-2-2-2" />
  </svg>
);

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

const quillFormats = [
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
];

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [projectName, setProjectName] = useState('');
  const [role, setRole] = useState('');
  const [techTags, setTechTags] = useState<string[]>(['React', 'TypeScript', 'Node.js']);
  const [tagInput, setTagInput] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setProjectName(initialData.projectName || '');
      // If role contains bullet/stack breakdown (e.g. "Lead • React, C#"), extract
      if (initialData.role) {
        if (initialData.role.includes('•')) {
          const parts = initialData.role.split('•');
          setRole(parts[0].trim());
          const tags = parts[1].split(',').map((t) => t.trim()).filter(Boolean);
          setTechTags(tags);
        } else {
          setRole(initialData.role);
          setTechTags([]);
        }
      } else {
        setRole('');
        setTechTags([]);
      }
      setLink(initialData.link || '');
      setDescription(initialData.description || '');
      setTagInput('');
    } else {
      setProjectName('');
      setRole('');
      setTechTags(['React', 'TypeScript', 'Node.js']);
      setTagInput('');
      setLink('');
      setDescription('');
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (tagStr: string) => {
    const clean = tagStr.trim().replace(/^,+|,+$/g, '');
    if (!clean) return;
    if (!techTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTechTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && techTags.length > 0) {
      setTechTags((prev) => prev.slice(0, prev.length - 1));
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTechTags((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!projectName.trim()) {
      setErrorMsg('Please enter the project name.');
      return;
    }

    setLoading(true);
    try {
      const combinedRole = role.trim()
        ? techTags.length > 0
          ? `${role.trim()} • ${techTags.join(', ')}`
          : role.trim()
        : techTags.length > 0
        ? techTags.join(', ')
        : undefined;

      let saved: ProjectDto;
      const payload = {
        projectName: projectName.trim(),
        role: combinedRole,
        link: link.trim() || undefined,
        description: description.trim() || undefined,
      };

      if (initialData?.id) {
        saved = await candidateCvApi.updateProject(initialData.id, payload);
      } else {
        saved = await candidateCvApi.addProject(payload);
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      console.error('Failed to save project:', err);
      setErrorMsg(err.message || 'Unable to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialData?.id;

  return (
    <div className="candidate-modal-backdrop" onClick={onClose}>
      <div className="candidate-modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="candidate-modal-header">
          <div className="candidate-modal-title-box">
            <div className="candidate-icon-box">
              <CodeFolderIcon />
            </div>
            <div className="candidate-modal-title-text">
              <h2>{isEditing ? 'Edit Project & Portfolio' : 'Add Project & Portfolio'}</h2>
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
                Your Role / Position
              </label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. Lead Architect / Creator"
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

          {/* Tech Stack Tag Chips Input */}
          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label className="settings-label" style={{ margin: 0 }}>
                Technologies & Tech Stack
              </label>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Press <strong>Enter</strong> or <strong>Comma</strong> to add
              </span>
            </div>

            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '8px 12px',
                background: '#ffffff',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                minHeight: '44px',
              }}
            >
              {techTags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: '#e6f9f2',
                    color: '#008759',
                    border: '1px solid #b7eedc',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#008759',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                type="text"
                placeholder={techTags.length === 0 ? 'Type tech and press Enter (e.g. C#, Redis, Docker)...' : 'Add tag...'}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  minWidth: '130px',
                  fontSize: '13.5px',
                  color: '#0f172a',
                  background: 'transparent',
                }}
              />
            </div>
          </div>

          {/* Rich Text Editor for Project Description */}
          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="settings-label" style={{ margin: 0 }}>
                Project Highlights & Outcomes
              </label>
              <span style={{ fontSize: '11px', color: '#009e67', fontWeight: 700, background: '#e6f9f2', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <SparkleIcon />
                <span>Rich Text</span>
              </span>
            </div>
            <div className="candidate-quill-wrapper">
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                modules={quillModules}
                formats={quillFormats}
                placeholder="• Engineered asynchronous concurrency layer with sub-millisecond latency...&#10;• Implemented automated CI/CD pipeline and integration test suite..."
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
              <span>{loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


