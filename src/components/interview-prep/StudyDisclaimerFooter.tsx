import React from 'react';

export const StudyDisclaimerFooter: React.FC = () => {
  return (
    <footer className="study-disclaimer-persistent-footer" role="note" aria-label="AI Disclaimer">
      <div className="study-disclaimer-inner">
        <div className="study-disclaimer-icon-box">
          <span className="study-disclaimer-icon" role="img" aria-label="Warning">
            ⚠️
          </span>
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
