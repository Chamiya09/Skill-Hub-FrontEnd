import React from 'react';
import type { CandidateApplicationItemDto } from '../../services/api';
import { BriefcaseIcon, ClockIcon } from '../common/Icons';

interface OtherApplicationsSectionProps {
  applications: CandidateApplicationItemDto[];
}

export const OtherApplicationsSection: React.FC<OtherApplicationsSectionProps> = ({
  applications,
}) => {
  if (applications.length === 0) return null;

  return (
    <section className="other-applications-section">
      <div className="other-applications-header">
        <div>
          <h3 className="other-applications-title">
            Other Active Applications ({applications.length})
          </h3>
          <p className="other-applications-subtitle">
            These roles are currently in earlier recruitment stages. Interview Preparation unlocks automatically once you advance to the Interview stage.
          </p>
        </div>
      </div>

      <div className="other-applications-grid">
        {applications.map((app) => {
          const status = (app.status || 'Applied').toLowerCase();
          const isRejected = status.includes('reject');
          const isAssessment = status.includes('assess');
          const isShortlisted = status.includes('shortlist');
          
          let stageLabel = 'Applied';
          let badgeClass = 'stage-applied';
          let hintText = 'Under review';

          if (isRejected) {
            stageLabel = 'Rejected';
            badgeClass = 'stage-rejected';
            hintText = 'Application closed';
          } else if (isAssessment) {
            stageLabel = 'Assessment';
            badgeClass = 'stage-assessment';
            hintText = 'Complete technical assessment';
          } else if (isShortlisted) {
            stageLabel = 'Shortlisted';
            badgeClass = 'stage-shortlisted';
            hintText = 'Awaiting interview scheduling';
          }

          const appliedDate = app.appliedDate
            ? new Date(app.appliedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recently';

          return (
            <div key={app.id} className="other-application-card">
              <div className="other-application-main">
                <h4 className="other-application-role" title={app.jobTitle}>
                  {app.jobTitle}
                </h4>
                <div className="other-application-meta">
                  <span className="other-meta-company">
                    <BriefcaseIcon />
                    <span>{app.companyName || 'Enterprise Partner'}</span>
                  </span>
                  <span className="other-meta-dot">•</span>
                  <span className="other-meta-date">
                    <ClockIcon />
                    <span>{appliedDate}</span>
                  </span>
                </div>
              </div>

              <div className="other-application-status">
                <span className={`other-status-pill ${badgeClass}`}>
                  <b />
                  <span>{stageLabel}</span>
                </span>
                <span className="other-status-note">{hintText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
