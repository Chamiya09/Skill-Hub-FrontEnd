import React from 'react';

const AlertShieldIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const StudyDisclaimerFooter: React.FC = () => {
  return (
    <footer className="study-disclaimer-persistent-footer" role="note" aria-label="AI Disclaimer">
      <div className="study-disclaimer-inner">
        <div className="study-disclaimer-icon-box" aria-hidden="true">
          <AlertShieldIcon />
        </div>
        <div className="study-disclaimer-text-wrap">
          <span className="study-disclaimer-title">IMPORTANT CANDIDATE NOTICE</span>
          <p className="study-disclaimer-body">
            ⚠️ Note: This preparation guide is AI-generated to assist your studies. It is not 100% accurate or a definitive syllabus. Please use it strictly as a supplementary assistance tool.
          </p>
        </div>
      </div>
    </footer>
  );
};
