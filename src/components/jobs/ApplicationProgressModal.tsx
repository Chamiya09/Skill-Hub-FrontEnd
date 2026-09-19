import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { CandidateApplicationItemDto } from '../../services/api';
import {
  ArrowRightIcon,
  BuildingIcon,
  ClockIcon,
  MapPinIcon,
  SparkleIcon,
} from '../common/Icons';

const STAGES = ['Applied', 'Under Review', 'Shortlisted', 'Assessment', 'Interview', 'Offer'] as const;

const getApplicationStage = (status?: string | null): number => {
  const value = (status || 'Applied').toLowerCase();
  if (value.includes('offer') || value.includes('accepted') || value.includes('hired')) return 5;
  if (value.includes('interview')) return 4;
  if (value.includes('assess') || value.includes('test') || value.includes('exam')) return 3;
  if (value.includes('shortlist')) return 2;
  if (value.includes('review') || value.includes('screen')) return 1;
  return 0;
};

const getCopilotMessage = (stage: number): string => [
  'Your application is submitted. Keep your Digital CV current while the hiring team begins its review.',
  'Your profile is being reviewed. Prepare two measurable examples that demonstrate impact in this role.',
  'You made the shortlist. A technical assessment may be dispatched by the hiring committee.',
  'Your technical assessment has been sent by HR. Head to Technical Assessments to take your coding challenge.',
  'Your interview stage is active. Rehearse concise STAR responses and questions for the hiring team.',
  'You reached the offer stage. Review the role scope, total package, and growth expectations carefully.',
][stage];

interface ApplicationProgressModalProps {
  application: CandidateApplicationItemDto;
  onClose: () => void;
}

export const ApplicationProgressModal: React.FC<ApplicationProgressModalProps> = ({
  application,
  onClose,
}) => {
  const currentStage = getApplicationStage(application.status);
  const initials = application.companyName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const appliedDate = new Date(application.appliedDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="progress-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="progress-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="progress-modal-close" onClick={onClose} aria-label="Close application progress">×</button>
        <header className="progress-modal-header">
          <div className="progress-company-avatar">{initials}</div>
          <div className="progress-modal-heading">
            <div className="progress-title-row">
              <h2 id="progress-modal-title">{application.jobTitle}</h2>
              <span className="application-status"><b />{STAGES[currentStage]}</span>
            </div>
            <div className="progress-modal-meta">
              <span><BuildingIcon /> {application.companyName}</span>
              <span><MapPinIcon /> {application.location}</span>
              <span><ClockIcon /> {application.employmentType}</span>
              <span>Applied {appliedDate}</span>
            </div>
          </div>
        </header>

        <div className="progress-modal-body">
          <div className="progress-section-label">APPLICATION JOURNEY</div>
          <div className="application-stepper" aria-label={`Current stage: ${STAGES[currentStage]}`}>
            {STAGES.map((stage, index) => (
              <div className={`application-step ${index <= currentStage ? 'is-complete' : ''} ${index === currentStage ? 'is-current' : ''}`} key={stage}>
                <div className="application-step-track">
                  <span className="application-step-dot">{index < currentStage ? '✓' : index + 1}</span>
                  {index < STAGES.length - 1 && <span className="application-step-line" />}
                </div>
                <span className="application-step-label">{stage}</span>
              </div>
            ))}
          </div>

          <div className="application-copilot">
            <span className="application-copilot-icon"><SparkleIcon /></span>
            <div><strong>AI COPILOT INSIGHT</strong><p>{getCopilotMessage(currentStage)}</p></div>
          </div>
        </div>

        <footer className="progress-modal-actions">
          <Link to={`/jobs/${application.jobId}`} className="application-view-link">
            View Job Details <ArrowRightIcon />
          </Link>
          {currentStage === 2 && (
            <Link to={`/candidate/mock-interview?jobId=${application.jobId}`} className="application-smart-action">
              <span>Practice Mock Interview</span>
              <ArrowRightIcon />
            </Link>
          )}
          {currentStage === 3 && (
            <Link to="/candidate/assessments" className="application-smart-action">
              <span>Go to Technical Assessments</span>
              <ArrowRightIcon />
            </Link>
          )}
        </footer>
      </section>
    </div>
  );
};
