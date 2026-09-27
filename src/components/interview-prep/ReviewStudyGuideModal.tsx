import React, { useState } from 'react';
import type { InterviewPrepGuideDto, CandidateApplicationItemDto } from '../../services/api';
import {
  SparkleIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  BriefcaseIcon,
  MapPinIcon,
  TargetIcon,
} from '../common/Icons';

const RefreshCwIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
);

const LightbulbIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const BookCheckIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="m9 10 2 2 4-4" />
  </svg>
);

const TerminalIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

interface ReviewStudyGuideModalProps {
  guide: InterviewPrepGuideDto;
  application?: CandidateApplicationItemDto | null;
  isApproving: boolean;
  isRegenerating: boolean;
  onApprove: () => void;
  onRegenerate: () => void;
  onDiscard: () => void;
}

export const ReviewStudyGuideModal: React.FC<ReviewStudyGuideModalProps> = ({
  guide,
  application,
  isApproving,
  isRegenerating,
  onApprove,
  onRegenerate,
  onDiscard,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'theory' | 'practical' | 'tips'>('all');

  const theoreticalAreas = guide.keyTheoreticalAreas || [];
  const practicalFocus = guide.practicalImplementationFocus || [];
  const proTips = guide.proTips || [];
  const checklist = guide.preparationChecklist || [];

  return (
    <div className="review-guide-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="review-guide-title">
      <div className="review-guide-modal-container">
        {/* 1. Modal Header */}
        <div className="review-modal-header">
          <div className="review-modal-header-left">
            <div className="review-header-badge-row">
              <span className="review-coach-badge">
                <SparkleIcon />
                <span>AI Technical Career Coach</span>
              </span>
              <span className="review-approval-badge">
                <span className="review-pulse-dot" />
                <span>Human Approval Required</span>
              </span>
            </div>
            <h2 id="review-guide-title" className="review-modal-title">
              Review AI-Generated Study Guidelines
            </h2>
            <div className="review-modal-subtitle-row">
              <span className="review-meta-item">
                <BriefcaseIcon />
                <span>{guide.jobTitle || application?.jobTitle || 'Target Role'}</span>
              </span>
              {(guide.companyName || application?.companyName) && (
                <span className="review-meta-item">
                  <MapPinIcon />
                  <span>{guide.companyName || application?.companyName}</span>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="review-modal-close-btn"
            onClick={onDiscard}
            disabled={isApproving || isRegenerating}
            aria-label="Close review"
            title="Discard and close"
          >
            <XIcon />
          </button>
        </div>

        {/* 2. Review Instructions Banner */}
        <div className="review-info-banner">
          <div className="review-info-icon">
            <SparkleIcon />
          </div>
          <div className="review-info-content">
            <strong>Candidate Evaluation & Approval Workflow</strong>
            <p>
              Your AI Technical Career Coach has synthesized the requirements for this role.
              Review the study topics and hands-on preparation areas below. If you are satisfied with this roadmap,
              click <strong>Approve & Save</strong> to add it to your Study Dashboard. If you want an alternate set of guidelines, click <strong>Regenerate Guide</strong>.
            </p>
          </div>
        </div>

        {/* 3. Section Filter Tabs */}
        <div className="review-tab-nav" role="tablist">
          <button
            type="button"
            className={`review-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Guidelines ({theoreticalAreas.length + practicalFocus.length})
          </button>
          <button
            type="button"
            className={`review-tab-btn ${activeTab === 'theory' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('theory')}
          >
            Theoretical Focus ({theoreticalAreas.length})
          </button>
          <button
            type="button"
            className={`review-tab-btn ${activeTab === 'practical' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('practical')}
          >
            Practical Workflows ({practicalFocus.length})
          </button>
          <button
            type="button"
            className={`review-tab-btn ${activeTab === 'tips' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('tips')}
          >
            Pro Tips & Checklist ({proTips.length + checklist.length})
          </button>
        </div>

        {/* 4. Scrollable Guidelines Preview Body */}
        <div className="review-modal-body">
          {/* Role Overview Coaching Summary */}
          {guide.roleOverviewSummary && (activeTab === 'all' || activeTab === 'theory') && (
            <div className="review-overview-card">
              <div className="review-overview-header">
                <TargetIcon />
                <span>Coach Strategy & Role Overview</span>
              </div>
              <p className="review-overview-text">{guide.roleOverviewSummary}</p>
            </div>
          )}

          {/* Section: Key Theoretical Focus Areas */}
          {(activeTab === 'all' || activeTab === 'theory') && theoreticalAreas.length > 0 && (
            <div className="review-section-group">
              <div className="review-section-header">
                <div className="review-section-badge theory-badge">
                  <BookCheckIcon />
                  <span>Key Theoretical Focus Areas</span>
                </div>
                <span className="review-section-count">{theoreticalAreas.length} Topics</span>
              </div>

              <div className="review-cards-list">
                {theoreticalAreas.map((area, idx) => (
                  <div key={area.id || idx} className="review-focus-item">
                    <div className="review-focus-top">
                      <div className="review-focus-title-wrap">
                        <span className="review-focus-num">{idx + 1}</span>
                        <h4 className="review-focus-title">{area.title}</h4>
                      </div>
                      <div className="review-focus-badges">
                        <span className={`review-priority-tag priority-${(area.priority || '').toLowerCase().replace(/\s+/g, '-')}`}>
                          {area.priority || 'Core Topic'}
                        </span>
                        {area.estimatedStudyTime && (
                          <span className="review-time-tag">
                            <ClockIcon />
                            <span>{area.estimatedStudyTime}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {area.overview && (
                      <p className="review-focus-overview">{area.overview}</p>
                    )}

                    {area.conceptsToReview && area.conceptsToReview.length > 0 && (
                      <div className="review-concepts-block">
                        <span className="review-concepts-label">Concepts to Review:</span>
                        <div className="review-concepts-chips">
                          {area.conceptsToReview.map((concept, cIdx) => (
                            <span key={cIdx} className="review-concept-chip">
                              <CheckIcon />
                              <span>{concept}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {area.coachTip && (
                      <div className="review-coach-tip-callout">
                        <LightbulbIcon />
                        <div>
                          <strong>Coach Advice:</strong> {area.coachTip}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Practical Implementation Focus */}
          {(activeTab === 'all' || activeTab === 'practical') && practicalFocus.length > 0 && (
            <div className="review-section-group">
              <div className="review-section-header">
                <div className="review-section-badge practical-badge">
                  <TerminalIcon />
                  <span>Practical Implementation Priorities</span>
                </div>
                <span className="review-section-count">{practicalFocus.length} Workflows</span>
              </div>

              <div className="review-cards-list">
                {practicalFocus.map((area, idx) => (
                  <div key={area.id || idx} className="review-focus-item practical-item">
                    <div className="review-focus-top">
                      <div className="review-focus-title-wrap">
                        <span className="review-focus-num practical-num">{idx + 1}</span>
                        <h4 className="review-focus-title">{area.title}</h4>
                      </div>
                      <div className="review-focus-badges">
                        <span className="review-priority-tag priority-practical">
                          {area.priority || 'Hands-On Focus'}
                        </span>
                        {area.estimatedStudyTime && (
                          <span className="review-time-tag">
                            <ClockIcon />
                            <span>{area.estimatedStudyTime}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {area.overview && (
                      <p className="review-focus-overview">{area.overview}</p>
                    )}

                    {area.practicalApplication && (
                      <div className="review-practical-box">
                        <span className="review-box-title">System & Code Implementation Focus:</span>
                        <p>{area.practicalApplication}</p>
                      </div>
                    )}

                    {area.conceptsToReview && area.conceptsToReview.length > 0 && (
                      <div className="review-concepts-block">
                        <span className="review-concepts-label">Key Architectural Points:</span>
                        <div className="review-concepts-chips">
                          {area.conceptsToReview.map((concept, cIdx) => (
                            <span key={cIdx} className="review-concept-chip practical-chip">
                              <CheckIcon />
                              <span>{concept}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {area.coachTip && (
                      <div className="review-coach-tip-callout">
                        <LightbulbIcon />
                        <div>
                          <strong>Production Tip:</strong> {area.coachTip}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Pro Tips & Checklist */}
          {(activeTab === 'all' || activeTab === 'tips') && (
            <div className="review-tips-checklist-grid">
              {proTips.length > 0 && (
                <div className="review-tips-column">
                  <div className="review-subcard-header">
                    <LightbulbIcon />
                    <h4>Career Coach Pro Tips ({proTips.length})</h4>
                  </div>
                  <ul className="review-tips-list">
                    {proTips.map((tip, idx) => (
                      <li key={idx} className="review-tip-item">
                        <span className="review-bullet-num">{idx + 1}</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {checklist.length > 0 && (
                <div className="review-checklist-column">
                  <div className="review-subcard-header">
                    <BookCheckIcon />
                    <h4>Candidate Prep Checklist ({checklist.length})</h4>
                  </div>
                  <ul className="review-checklist-list">
                    {checklist.map((item, idx) => (
                      <li key={idx} className="review-checklist-item">
                        <span className="review-check-box">
                          <CheckIcon />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Sticky Footer Action Controls */}
        <div className="review-modal-footer">
          <div className="review-footer-left">
            <button
              type="button"
              className="btn-review-regenerate"
              onClick={onRegenerate}
              disabled={isApproving || isRegenerating}
              title="Regenerate an alternate study plan with AI Coach"
            >
              <RefreshCwIcon className={isRegenerating ? 'spin-icon' : ''} />
              <span>{isRegenerating ? 'AI Coach is Regenerating...' : 'Regenerate Guide'}</span>
            </button>
            <span className="review-regen-hint">Don't like this roadmap? Generate fresh guidelines.</span>
          </div>

          <div className="review-footer-right">
            <button
              type="button"
              className="btn-review-discard"
              onClick={onDiscard}
              disabled={isApproving || isRegenerating}
            >
              Discard Draft
            </button>

            <button
              type="button"
              className="btn-review-approve"
              onClick={onApprove}
              disabled={isApproving || isRegenerating}
            >
              {isApproving ? (
                <>
                  <span className="review-btn-spinner" />
                  <span>Approving & Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon />
                  <span>Approve & Save to Study Dashboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
