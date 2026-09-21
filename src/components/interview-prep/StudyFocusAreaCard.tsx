import React from 'react';
import type { StudyFocusAreaDto } from '../../services/api';
import { ClockIcon, ChevronDownIcon } from '../common/Icons';

interface StudyFocusAreaCardProps {
  item: StudyFocusAreaDto;
  isExpanded: boolean;
  onToggle: () => void;
}

const BookCheckIcon: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="m9 10 2 2 4-4" />
  </svg>
);

const CodeTerminalIcon: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const LightbulbIcon: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const StudyFocusAreaCard: React.FC<StudyFocusAreaCardProps> = ({
  item,
  isExpanded,
  onToggle,
}) => {
  const priorityClass = item.priority
    ? item.priority.toLowerCase().replace(/\s+/g, '-')
    : 'high-priority';

  return (
    <div className={`study-focus-card ${isExpanded ? 'is-expanded' : ''}`}>
      {/* Clickable Header Accordion Trigger */}
      <div
        className="study-focus-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
      >
        <div className="study-focus-title-group">
          <div className="study-focus-meta-strip">
            <span className={`study-priority-badge ${priorityClass}`}>
              <b />
              <span>{item.priority || 'High Priority'}</span>
            </span>

            <span className="study-time-pill">
              <ClockIcon />
              <span>{item.estimatedStudyTime || '30-45 mins study'}</span>
            </span>

            {item.section && (
              <span className="study-section-tag">
                {item.section}
              </span>
            )}
          </div>

          <h3 className="study-focus-heading">
            {item.title}
          </h3>

          {item.overview && (
            <p className="study-focus-summary">
              {item.overview}
            </p>
          )}
        </div>

        <div className={`study-expand-toggle ${isExpanded ? 'is-rotated' : ''}`} aria-hidden="true">
          <ChevronDownIcon />
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="study-focus-body">
          {/* 1. Concepts to Brush Up On */}
          {item.conceptsToReview && item.conceptsToReview.length > 0 && (
            <div className="study-detail-block">
              <div className="study-block-heading">
                <BookCheckIcon />
                <span>Core Theoretical Concepts &amp; Principles</span>
              </div>
              <ul className="study-concepts-bullets">
                {item.conceptsToReview.map((concept, idx) => (
                  <li key={idx} className="study-concept-bullet-item">
                    <span className="bullet-point-icon" />
                    <span className="bullet-point-text">{concept}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Practical Implementation Focus */}
          {item.practicalApplication && (
            <div className="study-detail-block">
              <div className="study-block-heading practical">
                <CodeTerminalIcon />
                <span>Practical Implementation &amp; Production Scenarios</span>
              </div>
              <div className="study-practical-callout">
                {item.practicalApplication}
              </div>
            </div>
          )}

          {/* 3. Career Coach Advice */}
          {item.coachTip && (
            <div className="study-detail-block">
              <div className="study-coach-tip-banner">
                <div className="coach-tip-icon">
                  <LightbulbIcon />
                </div>
                <div className="coach-tip-content">
                  <span className="coach-tip-label">TECHNICAL CAREER COACH ADVICE</span>
                  <p className="coach-tip-text">{item.coachTip}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
