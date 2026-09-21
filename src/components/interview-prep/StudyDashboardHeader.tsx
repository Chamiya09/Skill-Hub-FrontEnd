import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  SparkleIcon,
  PrinterIcon,
  BriefcaseIcon,
  ClockIcon,
  MapPinIcon,
} from '../common/Icons';
import type { InterviewPrepGuideDto } from '../../services/api';

interface StudyDashboardHeaderProps {
  guide: InterviewPrepGuideDto;
}

export const StudyDashboardHeader: React.FC<StudyDashboardHeaderProps> = ({ guide }) => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  const companyName = guide.companyName || 'Enterprise Partner';
  const roleTitle = guide.targetRole || guide.jobTitle || 'Software Engineer';

  const companyInitials = companyName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'EP';

  const formattedAppliedDate = guide.appliedDate
    ? new Date(guide.appliedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const formattedGeneratedDate = guide.createdAt
    ? new Date(guide.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const formattedInterviewDate = guide.interviewDate
    ? new Date(guide.interviewDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <header className="study-persistent-header">
      {/* Top Navigation Row: Back Button & Print Actions */}
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

      {/* Hero Role Banner: Prominently identifies the specific interview */}
      <div className="study-hero-banner">
        <div className="study-hero-top-row">
          <div className="study-hero-eyebrow">
            <SparkleIcon />
            <span>TECHNICAL CAREER COACH • STUDY DASHBOARD</span>
          </div>

          <div className="study-header-badges-cluster">
            {/* Status Badge */}
            <span className="study-hero-status-pill">
              <span className="status-dot" />
              <span>Status: {guide.applicationStatus || 'Interview Stage'}</span>
            </span>

            {/* Date of Interview or Applied Date Badge */}
            <span className="study-hero-date-pill">
              <ClockIcon />
              <span>
                {formattedInterviewDate
                  ? `Interview: ${formattedInterviewDate}`
                  : formattedAppliedDate
                  ? `Applied: ${formattedAppliedDate}`
                  : `Guide Active: ${formattedGeneratedDate}`}
              </span>
            </span>
          </div>
        </div>

        {/* Prominently display Company Name and Job Role (e.g. 'Interview Guide: Software Engineer at LSEG') */}
        <div className="study-hero-identity-row">
          <div className="study-company-avatar-box">
            {companyInitials}
          </div>

          <div className="study-hero-titles-wrap">
            <h1 className="study-hero-role-title">
              Interview Guide: <span className="highlight-role">{roleTitle}</span> at <span className="highlight-company">{companyName}</span>
            </h1>

            <div className="study-hero-meta-strip">
              <span className="meta-strip-item">
                <BriefcaseIcon />
                <span>Role: <strong>{guide.jobTitle}</strong></span>
              </span>

              {guide.location && (
                <>
                  <span className="meta-strip-sep">•</span>
                  <span className="meta-strip-item">
                    <MapPinIcon />
                    <span>{guide.location}</span>
                  </span>
                </>
              )}

              {guide.employmentType && (
                <>
                  <span className="meta-strip-sep">•</span>
                  <span className="meta-strip-item">
                    <span>{guide.employmentType}</span>
                  </span>
                </>
              )}

              <span className="meta-strip-sep">•</span>
              <span className="meta-strip-item guideline-status">
                <span>Tailored for this Application</span>
              </span>
            </div>
          </div>
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
