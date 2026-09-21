import React from 'react';
import { Link } from 'react-router-dom';
import { TargetIcon, ArrowRightIcon, CheckIcon, SearchIcon, BriefcaseIcon } from '../common/Icons';

export const EmptyStateMessage: React.FC = () => {
  return (
    <div className="prep-empty-card">
      <div className="prep-empty-icon-box">
        <TargetIcon />
      </div>

      <div className="prep-empty-badge">
        <b />
        <span>Gated Stage: Interview</span>
      </div>

      <h2 className="prep-empty-title">No Interview Stages Unlocked Yet</h2>

      <p className="prep-empty-desc">
        Interview Preparation will be unlocked once you are selected for an Interview. Candidates in Assessment, Screening, or Applied stages must complete their initial evaluation first.
      </p>

      {/* Visual 3-Stage Progress Indicator */}
      <div className="prep-empty-stepper-wrap">
        <div className="prep-empty-step is-complete">
          <div className="prep-empty-step-circle">
            <CheckIcon />
          </div>
          <span className="prep-empty-step-label">1. Applied</span>
        </div>

        <div className="prep-empty-step-connector" />

        <div className="prep-empty-step is-current">
          <div className="prep-empty-step-circle">2</div>
          <span className="prep-empty-step-label">2. Assessment &amp; Screening</span>
        </div>

        <div className="prep-empty-step-connector" />

        <div className="prep-empty-step is-locked">
          <div className="prep-empty-step-circle">3</div>
          <span className="prep-empty-step-label">3. Interview (Prep Unlocked)</span>
        </div>
      </div>

      <div className="prep-empty-actions">
        <Link to="/candidate/applications" className="prep-empty-btn-primary">
          <BriefcaseIcon />
          <span>Track Application Status</span>
          <ArrowRightIcon />
        </Link>
        <Link to="/jobs" className="prep-empty-btn-secondary">
          <SearchIcon />
          <span>Browse Open Positions</span>
        </Link>
      </div>
    </div>
  );
};
