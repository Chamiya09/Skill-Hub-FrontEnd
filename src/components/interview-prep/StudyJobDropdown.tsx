import React from 'react';
import type { InterviewPrepGuideDto } from '../../services/api';
import { BriefcaseIcon, ChevronDownIcon, SparkleIcon } from '../common/Icons';

interface StudyJobDropdownProps {
  guides: InterviewPrepGuideDto[];
  selectedGuide: InterviewPrepGuideDto | null;
  onSelectGuide: (guide: InterviewPrepGuideDto) => void;
}

export const StudyJobDropdown: React.FC<StudyJobDropdownProps> = ({
  guides,
  selectedGuide,
  onSelectGuide,
}) => {
  if (guides.length === 0) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = guides.find((g) => g.id === e.target.value);
    if (found) {
      onSelectGuide(found);
    }
  };

  return (
    <div className="study-dropdown-banner">
      <div className="study-dropdown-left">
        <div className="study-dropdown-label-row">
          <span className="study-dropdown-icon">
            <BriefcaseIcon />
          </span>
          <span className="study-dropdown-label">Active Interview Preparation Guide</span>
          <span className="study-dropdown-counter">
            {guides.length} {guides.length === 1 ? 'Interview' : 'Interviews'} Available
          </span>
        </div>

        <div className="study-select-wrapper">
          <select
            id="interview-guide-select"
            className="study-select-control"
            value={selectedGuide?.id || ''}
            onChange={handleChange}
            aria-label="Select Interview Preparation Role"
          >
            {guides.map((guide) => {
              const company = guide.companyName || 'Enterprise Partner';
              const role = guide.targetRole || guide.jobTitle || 'Role';
              const label = `${company} - ${role}`;
              return (
                <option key={guide.id} value={guide.id}>
                  {label}
                </option>
              );
            })}
          </select>
          <div className="study-select-chevron" aria-hidden="true">
            <ChevronDownIcon />
          </div>
        </div>
      </div>

      <div className="study-dropdown-right">
        <div className="study-quick-switch-hint">
          <SparkleIcon />
          <span>Switch interview roles above to update study guidelines instantly.</span>
        </div>
      </div>
    </div>
  );
};
