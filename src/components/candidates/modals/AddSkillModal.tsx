import React, { useState } from 'react';
import { candidateCvApi, type SkillDto } from '../../../services/api';
import { AwardIcon, XIcon, CheckIcon } from '../../common/Icons';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (skill: SkillDto) => void;
}

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('Languages & Core Stack');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    'Languages & Core Stack',
    'Frameworks & Libraries',
    'Cloud, DevOps & Databases',
    'Architecture & Practices',
    'Soft Skills & Leadership',
    'Other Technical Skills',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!skillName.trim()) {
      setErrorMsg('Please enter a skill name.');
      return;
    }

    setLoading(true);
    try {
      const created = await candidateCvApi.addSkill({
        skillName: skillName.trim(),
        category: category.trim(),
      });

      onSuccess(created);
      onClose();
      // Reset form
      setSkillName('');
      setCategory('Languages & Core Stack');
    } catch (err: any) {
      console.error('Failed to add skill:', err);
      setErrorMsg(err.message || 'Unable to save skill. Please try again.');
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
              <AwardIcon />
            </div>
            <div className="candidate-modal-title-text">
              <h2>Add Skill or Competency</h2>
              <p>Highlight technical skills, tools, and proficiencies</p>
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
              Skill / Technology Name <span className="settings-label required-star">*</span>
            </label>
            <div className="settings-input-wrapper">
              <input
                type="text"
                required
                placeholder="e.g. Next.js, Kubernetes, PostgreSQL, System Design"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px' }}
                autoFocus
              />
            </div>
          </div>

          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <label className="settings-label">
              Skill Classification / Category
            </label>
            <div className="settings-input-wrapper">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="settings-input-field"
                style={{ paddingLeft: '16px', cursor: 'pointer' }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
              <span>{loading ? 'Saving...' : 'Add Skill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
