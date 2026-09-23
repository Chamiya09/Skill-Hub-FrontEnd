import React from 'react';
import type { CandidateApplicationItemDto } from '../../services/api';
import {
  BriefcaseIcon,
  SparkleIcon,
  ArrowRightIcon,
  MapPinIcon,
  ClockIcon,
} from '../common/Icons';

interface EligibleJobCardProps {
  application: CandidateApplicationItemDto;
  isGenerating: boolean;
  savedGuideId?: string | null;
  onGenerateGuide: (application: CandidateApplicationItemDto) => void;
  onViewGuide?: (guideId: string) => void;
}

export const EligibleJobCard: React.FC<EligibleJobCardProps> = ({
  application,
  isGenerating,
  savedGuideId,
  onGenerateGuide,
  onViewGuide,
}) => {
  const companyInitials = (application.companyName || 'EP')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = application.appliedDate
    ? new Date(application.appliedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className="eligible-job-card">
      {/* Card Header: Avatar, Job Title, Company & Interview Stage Badge */}
      <div className="eligible-job-header">
        <div className="eligible-job-profile">
          <div className="table-company-avatar">
            {companyInitials}
          </div>
          <div className="eligible-job-details">
            <h3 className="eligible-job-title" title={application.jobTitle}>
              {application.jobTitle}
            </h3>
            <div className="eligible-job-company">
              <BriefcaseIcon />
              <span>{application.companyName || 'Enterprise Partner'}</span>
            </div>
          </div>
        </div>

        <div className="eligible-job-badge-wrap">
          {savedGuideId ? (
            <span className="eligible-stage-pill saved-ready-pill">
              <b />
              <span>Guide Ready</span>
            </span>
          ) : (
            <span className="eligible-stage-pill">
              <b />
              <span>Interview Stage</span>
            </span>
          )}
        </div>
      </div>

      {/* Meta details: Location, Date Applied, Workplace Type */}
      <div className="eligible-job-meta">
        {application.location && (
          <span className="eligible-meta-item">
            <MapPinIcon />
            <span>{application.location}</span>
          </span>
        )}
        <span className="eligible-meta-item">
          <ClockIcon />
          <span>Applied {formattedDate}</span>
        </span>
        {application.workplaceType && (
          <span className="eligible-meta-item">
            <span>• {application.workplaceType}</span>
          </span>
        )}
        {application.employmentType && (
          <span className="eligible-meta-item">
            <span>• {application.employmentType}</span>
          </span>
        )}
      </div>

      {/* Coach Guideline Focus Callout */}
      <div className="eligible-job-callout">
        <div className="eligible-job-callout-icon">
          <SparkleIcon />
        </div>
        <div className="eligible-job-callout-body">
          <strong>Technical Career Coach Guideline</strong>
          <p>
            {savedGuideId
              ? 'Your personalized interview preparation guidelines are saved in your Study Dashboard. Review core concepts and practical workflows anytime.'
              : 'Ready to generate targeted study focus areas covering Key Theoretical Areas, Technical Core Concepts, and Practical Implementation priorities.'}
          </p>
        </div>
      </div>

      {/* Card Actions: Primary Button */}
      <div className="eligible-job-footer">
        {savedGuideId ? (
          <button
            type="button"
            className="btn-generate-prep btn-view-prep"
            onClick={() => (onViewGuide ? onViewGuide(savedGuideId) : onGenerateGuide(application))}
          >
            <SparkleIcon />
            <span>View Saved Prep Guide</span>
            <ArrowRightIcon />
          </button>
        ) : (
          <button
            type="button"
            className="btn-generate-prep"
            onClick={() => onGenerateGuide(application)}
            disabled={isGenerating}
            aria-busy={isGenerating}
          >
            <SparkleIcon />
            <span>{isGenerating ? 'Analyzing Role & Generating...' : 'Generate AI Prep Guide'}</span>
            <ArrowRightIcon />
          </button>
        )}
      </div>
    </div>
  );
};
