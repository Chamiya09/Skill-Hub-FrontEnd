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
}

const GraduationCapIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
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
    <div ref={containerRef} className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3 select-none">
      {/* Expanded Speed Dial Menu Options */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 mb-1 animate-fadeIn">
          {actions.map((action, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 group cursor-pointer"
              onClick={action.onClick}
            >
              {/* Floating Pill Label */}
              <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-sm opacity-95 group-hover:opacity-100 group-hover:border-[#00b074] group-hover:text-[#00b074] transition-all">
                {action.label}
              </span>

              {/* Action Button */}
              <button
                type="button"
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-200 group-hover:scale-105 cursor-pointer shadow-sm ${action.color}`}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl bg-[#00b074] hover:bg-[#009663] text-white flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/25 border border-emerald-600/30"
        aria-label="Add Section to Digital CV"
        title="Add to Digital CV"
      >
        <PlusIconLarge rotated={isOpen} />
      </button>
    </div>
  );
};
