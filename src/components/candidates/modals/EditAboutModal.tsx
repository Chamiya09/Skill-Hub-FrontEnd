import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  candidateCvApi,
  type CandidateAboutDto,
  type CandidateHighlightDto,
} from '../../../services/api';
import {
  SparkleIcon,
  XIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
} from '../../common/Icons';

interface EditAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: CandidateAboutDto) => void;
  initialSummary?: string;
  initialHighlights?: CandidateHighlightDto[];
}

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

export const EditAboutModal: React.FC<EditAboutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSummary = '',
  initialHighlights = [],
}) => {
  const [summary, setSummary] = useState('');
  const [highlights, setHighlights] = useState<CandidateHighlightDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSummary(initialSummary || '');
      setHighlights(
        initialHighlights && initialHighlights.length > 0
          ? initialHighlights.map((h) => ({ ...h }))
          : []
      );
      setErrorMsg(null);
    }
  }, [isOpen, initialSummary, initialHighlights]);

  if (!isOpen) return null;

  const handleAddHighlight = () => {
    if (highlights.length >= 3) return;
    setHighlights((prev) => [
      ...prev,
      { category: '', value: '', subtext: '' },
    ]);
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHighlightChange = (
    index: number,
    field: keyof CandidateHighlightDto,
    val: string
  ) => {
    setHighlights((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setLoading(true);
    try {
      // Filter out empty highlight rows
      const cleanedHighlights = highlights
        .map((h) => ({
          category: (h.category || '').trim(),
          value: (h.value || '').trim(),
          subtext: (h.subtext || '').trim(),
        }))
        .filter((h) => h.category || h.value || h.subtext);

      const saved = await candidateCvApi.updateAbout({
        summary: summary.trim(),
        keyHighlights: cleanedHighlights,
      });

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      console.error('Failed to save about & summary:', err);
      setErrorMsg(err.message || 'Unable to save changes. Please try again.');
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
              <SparkleIcon />
            </div>
            <div className="candidate-modal-title-text">
              <h2>Edit About & Executive Summary</h2>
              <p>Showcase your career highlights, narrative, and key metrics</p>
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
          {/* Field 1: Rich Text Summary */}
          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <label className="settings-label" style={{ margin: 0 }}>
                Executive Summary
              </label>
              <span
                style={{
                  fontSize: '11px',
                  color: '#009e67',
                  fontWeight: 700,
                  background: '#e6f9f2',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <SparkleIcon />
                <span>Rich Text</span>
              </span>
            </div>
            <div className="candidate-quill-wrapper">
              <ReactQuill
                theme="snow"
                value={summary}
                onChange={setSummary}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Share your executive summary, background, career highlights, and leadership profile..."
              />
            </div>
          </div>

          {/* Field 2: Key Highlights (Optional, up to 3) */}
          <div className="settings-form-group" style={{ marginBottom: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div>
                <label className="settings-label" style={{ margin: 0 }}>
                  Key Highlight Cards (Optional)
                </label>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Define up to 3 standout achievements or metrics displayed below your summary.
                </p>
              </div>
              {highlights.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="candidate-action-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#009e67',
                    background: '#e6f9f2',
                    border: '1px solid #b3eedb',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <PlusIcon />
                  <span>Add Highlight ({highlights.length}/3)</span>
                </button>
              )}
            </div>

            {highlights.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '10px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px',
                }}
              >
                <p style={{ margin: '0 0 8px', fontWeight: 500 }}>No highlight cards added yet.</p>
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#009e67',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <PlusIcon />
                  <span>+ Add First Highlight Box</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {highlights.map((highlight, index) => (
                  <div
                    key={index}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#475569',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Highlight #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(index)}
                        className="candidate-action-btn delete"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                        title="Remove highlight"
                      >
                        <TrashIcon />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748b',
                            marginBottom: '4px',
                          }}
                        >
                          Category / Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ARCHITECTURE or EXPERIENCE"
                          value={highlight.category}
                          onChange={(e) =>
                            handleHighlightChange(index, 'category', e.target.value)
                          }
                          className="settings-input-field"
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748b',
                            marginBottom: '4px',
                          }}
                        >
                          Main Value
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 4+ Years or 99.99% Uptime"
                          value={highlight.value}
                          onChange={(e) =>
                            handleHighlightChange(index, 'value', e.target.value)
                          }
                          className="settings-input-field"
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#64748b',
                          marginBottom: '4px',
                        }}
                      >
                        Subtext / Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Full-stack development or Enterprise AWS SLA"
                        value={highlight.subtext || ''}
                        onChange={(e) =>
                          handleHighlightChange(index, 'subtext', e.target.value)
                        }
                        className="settings-input-field"
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              <span>{loading ? 'Saving...' : 'Save Summary & Highlights'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
