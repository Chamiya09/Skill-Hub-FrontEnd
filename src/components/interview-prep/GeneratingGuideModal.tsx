import React from 'react';
import { SparkleIcon } from '../common/Icons';

interface GeneratingGuideModalProps {
  jobTitle?: string;
  companyName?: string;
}

export const GeneratingGuideModal: React.FC<GeneratingGuideModalProps> = ({
  jobTitle,
  companyName,
}) => {
  return (
    <div
      className="prep-generating-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Generating AI Prep Guide"
    >
      <div className="prep-generating-modal">
        <div className="prep-generating-spinner-wrap">
          <div className="prep-generating-spinner" />
          <div className="prep-generating-icon">
            <SparkleIcon />
          </div>
        </div>

        <div className="prep-generating-badge">
          <b />
          <span>AI TECHNICAL CAREER COACH</span>
        </div>

        <h2 className="prep-generating-title">
          AI is analyzing the job description and your CV...
        </h2>

        {jobTitle && (
          <p className="prep-generating-target">
            Preparing guideline for: <strong>{jobTitle}</strong>
            {companyName ? ` at ${companyName}` : ''}
          </p>
        )}

        <p className="prep-generating-desc">
          Formulating study focus guidelines across Key Theoretical Areas, Technical Core Concepts, and Practical Implementation priorities.
        </p>

        <div className="prep-generating-steps">
          <div className="prep-step-item is-active">
            <b />
            <span>Analyzing Vacancy Requirements</span>
          </div>
          <div className="prep-step-item is-active">
            <b />
            <span>Extracting Theoretical Areas</span>
          </div>
          <div className="prep-step-item is-active">
            <b />
            <span>Technical Core Concepts</span>
          </div>
          <div className="prep-step-item is-active">
            <b />
            <span>Practical Implementation Focus</span>
          </div>
        </div>
      </div>
    </div>
  );
};
