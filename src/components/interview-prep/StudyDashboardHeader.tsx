import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, SparkleIcon, PrinterIcon, BriefcaseIcon, ClockIcon } from '../common/Icons';
import type { InterviewPrepGuideDto } from '../../services/api';

interface StudyDashboardHeaderProps {
  guide: InterviewPrepGuideDto;
}

export const StudyDashboardHeader: React.FC<StudyDashboardHeaderProps> = ({ guide }) => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = guide.createdAt
    ? new Date(guide.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <header className="study-persistent-header">
      {/* Top Navigation Row: Back Button & Actions */}
      <div className="study-top-nav-bar">
        <button
          type="button"
          className="btn-back-to-hub"
          onClick={() => navigate('/candidate/interview-prep')}
          aria-label="Back to Interview Prep Hub"
        >
          <ArrowLeftIcon />
          <span>Back to Prep Hub</span>
        </button>

        <div className="study-header-actions">
          <button
            type="button"
            className="btn-study-print"
            onClick={handlePrint}
            title="Print or Export PDF"
          >
            <PrinterIcon />
            <span>Print Guide</span>
          </button>
        </div>
      </div>

      {/* Hero Role Banner (Persistent at Top) */}
      <div className="study-hero-banner">
        <div className="study-hero-top-row">
          <div className="study-hero-eyebrow">
            <SparkleIcon />
            <span>AI TECHNICAL CAREER COACH • STUDY DASHBOARD</span>
          </div>
          <div className="study-hero-stage-badge">
            <span className="stage-dot" />
            <span>Interview Stage Unlocked</span>
          </div>
        </div>

        <h1 className="study-hero-role-title">
          {guide.targetRole || guide.jobTitle}
        </h1>

        <div className="study-hero-meta-strip">
          <span className="meta-strip-item">
            <BriefcaseIcon />
            <span>Role: <strong>{guide.jobTitle}</strong></span>
          </span>
          <span className="meta-strip-sep">•</span>
          <span className="meta-strip-item">
            <ClockIcon />
            <span>Generated: {formattedDate}</span>
          </span>
          <span className="meta-strip-sep">•</span>
          <span className="meta-strip-item guideline-status">
            <span>Career Coach Study Guidelines</span>
          </span>
        </div>

        {guide.roleOverviewSummary && (
          <p className="study-hero-summary-text">
            {guide.roleOverviewSummary}
          </p>
        )}
      </div>
    </header>
  );
};
