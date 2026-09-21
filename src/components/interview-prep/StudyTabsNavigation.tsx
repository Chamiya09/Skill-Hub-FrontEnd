import React from 'react';

export type StudyTabKey = 'theory' | 'core' | 'practical' | 'coach';

interface StudyTabsNavigationProps {
  activeTab: StudyTabKey;
  onSelectTab: (tab: StudyTabKey) => void;
  theoryCount: number;
  coreCount: number;
  practicalCount: number;
  coachCount: number;
}

const BookOpenIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const CpuIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="16" x="4" y="4" rx="2" />
    <rect width="6" height="6" x="9" y="9" rx="1" />
    <path d="M15 2v2" />
    <path d="M15 20v2" />
    <path d="M2 15h2" />
    <path d="M2 9h2" />
    <path d="M20 15h2" />
    <path d="M20 9h2" />
    <path d="M9 2v2" />
    <path d="M9 20v2" />
  </svg>
);

const WrenchIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const LightbulbIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const StudyTabsNavigation: React.FC<StudyTabsNavigationProps> = ({
  activeTab,
  onSelectTab,
  theoryCount,
  coreCount,
  practicalCount,
  coachCount,
}) => {
  const tabs = [
    {
      key: 'theory' as StudyTabKey,
      label: 'Theoretical Main Concepts',
      icon: <BookOpenIcon />,
      count: theoryCount,
      badge: 'Tab 1',
    },
    {
      key: 'core' as StudyTabKey,
      label: 'Technical Core Concepts',
      icon: <CpuIcon />,
      count: coreCount,
      badge: 'Tab 2',
    },
    {
      key: 'practical' as StudyTabKey,
      label: 'Practical Implementation Guidelines',
      icon: <WrenchIcon />,
      count: practicalCount,
      badge: 'Tab 3',
    },
    {
      key: 'coach' as StudyTabKey,
      label: 'Coach Strategies',
      icon: <LightbulbIcon />,
      count: coachCount,
      badge: 'Strategies',
    },
  ];

  return (
    <nav className="study-tabs-container" aria-label="Study Guide Sections">
      <div className="study-tabs-track">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`study-interactive-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectTab(tab.key)}
            >
              <span className="tab-icon-wrap">{tab.icon}</span>
              <div className="tab-label-group">
                <span className="tab-badge-pill">{tab.badge}</span>
                <span className="tab-title-text">{tab.label}</span>
              </div>
              <span className="tab-count-pill">{tab.count}</span>
              {isActive && <span className="tab-active-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
