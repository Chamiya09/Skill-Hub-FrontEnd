import React, { useState, useRef, useEffect } from 'react';
import {
  BriefcaseIcon,
  AwardIcon,
} from '../common/Icons';

interface SpeedDialFabProps {
  onAddExperience: () => void;
  onAddEducation: () => void;
  onAddProject: () => void;
  onAddSkill: () => void;
  onAddCertification: () => void;
}

const GraduationCapIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const CertificateBadgeIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const CodeFolderIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <path d="m10 13-2 2 2 2" />
    <path d="m14 17 2-2-2-2" />
  </svg>
);

const PlusIconLarge: React.FC<{ rotated?: boolean }> = ({ rotated }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-300 ease-in-out ${rotated ? 'rotate-45' : 'rotate-0'}`}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const SpeedDialFab: React.FC<SpeedDialFabProps> = ({
  onAddExperience,
  onAddEducation,
  onAddProject,
  onAddSkill,
  onAddCertification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const actions = [
    {
      label: 'Add Skill',
      icon: <AwardIcon />,
      onClick: () => {
        setIsOpen(false);
        onAddSkill();
      },
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    },
    {
      label: 'Add Certification',
      icon: <CertificateBadgeIcon />,
      onClick: () => {
        setIsOpen(false);
        onAddCertification();
      },
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    },
    {
      label: 'Add Project',
      icon: <CodeFolderIcon />,
      onClick: () => {
        setIsOpen(false);
        onAddProject();
      },
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    },
    {
      label: 'Add Education',
      icon: <GraduationCapIcon />,
      onClick: () => {
        setIsOpen(false);
        onAddEducation();
      },
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    },
    {
      label: 'Add Experience',
      icon: <BriefcaseIcon />,
      onClick: () => {
        setIsOpen(false);
        onAddExperience();
      },
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    },
  ];

  return (
    <div ref={containerRef} className="candidate-speed-dial-container">
      {/* Expanded Speed Dial Menu Options - Expands Vertically Upwards */}
      {isOpen && (
        <div className="candidate-speed-dial-menu">
          {actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              className="candidate-speed-dial-item"
              onClick={action.onClick}
            >
              {/* Floating Pill Label on Left */}
              <span className="candidate-speed-dial-label">
                {action.label}
              </span>

              {/* Action Button on Right */}
              <div
                className="candidate-speed-dial-icon-btn"
                aria-label={action.label}
              >
                {action.icon}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="candidate-speed-dial-main-btn"
        aria-label="Add Section to Digital CV"
        title="Add to Digital CV"
      >
        <PlusIconLarge rotated={isOpen} />
      </button>
    </div>
  );
};

