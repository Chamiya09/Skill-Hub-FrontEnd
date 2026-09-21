import React from 'react';
import { Link } from 'react-router-dom';
import { SparkleIcon, ArrowRightIcon } from '../common/Icons';

interface InterviewHubHeaderProps {
  eligibleCount: number;
}

export const InterviewHubHeader: React.FC<InterviewHubHeaderProps> = ({ eligibleCount }) => {
  return (
    <section className="prep-hub-hero">
      <div className="prep-hub-hero-content">
        <div className="prep-hub-eyebrow">
          <SparkleIcon />
          <span>TECHNICAL CAREER COACH • STUDENT 1 MODULE</span>
        </div>
        <h1 className="prep-hub-title">AI Interview Prep Hub</h1>
        <p className="prep-hub-subtitle">
          Personalized study guidelines crafted by our AI Technical Career Coach. Analyze role requirements to master Key Theoretical Areas, Technical Core Concepts, and Practical Implementation focus for your upcoming interviews.
        </p>
      </div>

      <div className="prep-hub-hero-actions">
        {eligibleCount > 0 ? (
          <div className="prep-hub-stat-pill">
            <span className="prep-hub-stat-dot" />
            <span className="prep-hub-stat-number">{eligibleCount}</span>
            <span className="prep-hub-stat-text">
              {eligibleCount === 1 ? 'Interview Role Unlocked' : 'Interview Roles Unlocked'}
            </span>
          </div>
        ) : (
          <Link to="/candidate/applications" className="prep-hub-secondary-action">
            <span>Track Applications</span>
            <ArrowRightIcon />
          </Link>
        )}
      </div>
    </section>
  );
};
