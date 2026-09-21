import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  interviewPrepApi,
  type InterviewPrepGuideDto,
  type StudyFocusAreaDto,
} from '../services/api';
import './CandidateStudyDashboard.css';

// Crisp inline SVG icons matching design system
const ArrowLeftIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const SparkleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
  </svg>
);

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

const ClockIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronDownIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const PrinterIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect width="12" height="8" x="6" y="14" />
  </svg>
);

export const CandidateStudyDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [guide, setGuide] = useState<InterviewPrepGuideDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active study section tabs (Strictly NO direct interview questions)
  // Sections: 'Key Theoretical Areas', 'Technical Core Concepts', 'Practical Implementation Focus', 'Career Coach Strategies'
  const [activeTab, setActiveTab] = useState<'theory' | 'core' | 'practical' | 'coach'>('theory');

  // Accordion expansion state per focus area
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let data: InterviewPrepGuideDto | null = null;

        if (id) {
          data = await interviewPrepApi.getById(id);
        } else {
          // Check cached guide ID from recent generation
          const cachedId = localStorage.getItem('skillhub_last_guide_id');
          if (cachedId) {
            try {
              data = await interviewPrepApi.getById(cachedId);
            } catch {
              // fallback to latest API
            }
          }
          if (!data) {
            try {
              data = await interviewPrepApi.getLatest();
            } catch {
              // no latest guide
            }
          }
        }

        if (!data) {
          setError('No study guide has been generated yet. Visit the Interview Prep Hub to create your personalized guideline.');
          setIsLoading(false);
          return;
        }

        setGuide(data);
        if (data.id) {
          localStorage.setItem('skillhub_last_guide_id', data.id);
        }

        // Auto-expand the first item of each section
        const initialExpanded: Record<string, boolean> = {};
        if (data.keyTheoreticalAreas?.length) {
          initialExpanded[data.keyTheoreticalAreas[0].id] = true;
        }
        if (data.technicalCoreConcepts?.length) {
          initialExpanded[data.technicalCoreConcepts[0].id] = true;
        }
        if (data.practicalImplementationFocus?.length) {
          initialExpanded[data.practicalImplementationFocus[0].id] = true;
        }
        setExpandedCards(initialExpanded);
      } catch (err: any) {
        setError(err?.message || 'Failed to load interview preparation guide.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuide();
  }, [id]);

  const toggleAccordion = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const toggleChecklist = (idx: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (isLoading) {
    return (
      <div className="study-dashboard-container">
        <div className="study-loading-state">
          <div className="prep-spinner-wrap" style={{ width: '56px', height: '56px', margin: '0 auto 20px' }}>
            <div className="prep-spinner" style={{ width: '56px', height: '56px' }} />
            <div className="prep-spinner-icon">
              <SparkleIcon />
            </div>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Loading Technical Career Coach Study Guideline...
          </h2>
          <p style={{ color: '#64748b' }}>
            Retrieving theoretical focus areas, core concepts, and practical priorities.
          </p>
        </div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="study-dashboard-container">
        <div className="study-error-state">
          <h2>Could Not Load Study Guide</h2>
          <p>{error || 'The requested study guide was not found or has expired.'}</p>
          <button
            type="button"
            className="btn-back-hub"
            style={{ margin: '0 auto' }}
            onClick={() => navigate('/candidate/interview-prep')}
          >
            <ArrowLeftIcon />
            <span>Back to Preparation Hub</span>
          </button>
        </div>
      </div>
    );
  }

  // Helper renderer for a single Focus Area card
  const renderFocusAreaCard = (item: StudyFocusAreaDto) => {
    const isExpanded = !!expandedCards[item.id];
    const priorityClass = item.priority ? item.priority.toLowerCase().replace(/\s+/g, '-') : 'high-priority';

    return (
      <div key={item.id} className="study-card">
        <div
          className="study-card-header"
          onClick={() => toggleAccordion(item.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleAccordion(item.id)}
        >
          <div style={{ flex: 1 }}>
            <div className="study-meta-row">
              <span className={`study-diff-badge ${priorityClass}`}>
                {item.priority || 'High Priority'}
              </span>
              <span className="study-time-badge">
                <ClockIcon />
                <span>{item.estimatedStudyTime || '30-45 mins'}</span>
              </span>
              <span className="study-cat-badge">{item.section}</span>
            </div>
            <h3 className="study-question-title">{item.title}</h3>
            {item.overview && (
              <p className="study-focus-overview">{item.overview}</p>
            )}
          </div>
          <div className={`study-accordion-arrow ${isExpanded ? 'open' : ''}`}>
            <ChevronDownIcon />
          </div>
        </div>

        {isExpanded && (
          <div className="study-card-body">
            {/* Concepts to Brush Up On */}
            {item.conceptsToReview && item.conceptsToReview.length > 0 && (
              <div className="study-block">
                <div className="study-block-title">
                  <BookOpenIcon />
                  <span>Key Concepts & Principles to Brush Up On</span>
                </div>
                <div className="study-concepts-list">
                  {item.conceptsToReview.map((concept, idx) => (
                    <div key={idx} className="study-concept-row">
                      <div className="study-concept-dot">&bull;</div>
                      <div className="study-concept-text">{concept}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Implementation & Architectural Application */}
            {item.practicalApplication && (
              <div className="study-block">
                <div className="study-block-title">
                  <WrenchIcon />
                  <span>Practical Implementation Focus & Scenarios</span>
                </div>
                <div className="study-practical-box">
                  {item.practicalApplication}
                </div>
              </div>
            )}

            {/* Career Coach Pro Tip */}
            {item.coachTip && (
              <div className="study-protip-box">
                <LightbulbIcon />
                <span><strong>Career Coach Advice:</strong> {item.coachTip}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="study-dashboard-container">
      {/* 1. Top Navigation Bar */}
      <nav className="study-top-nav">
        <button
          type="button"
          className="btn-back-hub"
          onClick={() => navigate('/candidate/interview-prep')}
        >
          <ArrowLeftIcon />
          <span>Back to Hub</span>
        </button>

        <div className="study-nav-actions">
          <button
            type="button"
            className="btn-study-action"
            onClick={() => window.print()}
            title="Print or Save PDF"
          >
            <PrinterIcon />
            <span>Print Study Guide</span>
          </button>
        </div>
      </nav>

      {/* 2. Hero Header Card */}
      <div className="study-hero-card">
        <div className="study-hero-badge">
          <SparkleIcon />
          <span>Technical Career Coach &bull; Study Guideline</span>
        </div>
        <h1 className="study-hero-title">{guide.targetRole || guide.jobTitle}</h1>
        <div className="study-hero-meta">
          <span>Target Role: {guide.jobTitle}</span>
          <span>&bull;</span>
          <span>Generated: {new Date(guide.createdAt).toLocaleDateString()}</span>
          <span>&bull;</span>
          <span style={{ color: '#34d399', fontWeight: 600 }}>Stage: Interview Unlocked</span>
        </div>
        {guide.roleOverviewSummary && (
          <p className="study-hero-summary">{guide.roleOverviewSummary}</p>
        )}
      </div>

      {/* 3. Distinct Navigation Tabs (UI Sections) */}
      <div className="study-tabs-bar">
        <button
          type="button"
          className={`study-tab-btn ${activeTab === 'theory' ? 'active' : ''}`}
          onClick={() => setActiveTab('theory')}
        >
          <BookOpenIcon />
          <span>Key Theoretical Areas</span>
          <span className="study-tab-count">{guide.keyTheoreticalAreas?.length || 0}</span>
        </button>

        <button
          type="button"
          className={`study-tab-btn ${activeTab === 'core' ? 'active' : ''}`}
          onClick={() => setActiveTab('core')}
        >
          <CpuIcon />
          <span>Technical Core Concepts</span>
          <span className="study-tab-count">{guide.technicalCoreConcepts?.length || 0}</span>
        </button>

        <button
          type="button"
          className={`study-tab-btn ${activeTab === 'practical' ? 'active' : ''}`}
          onClick={() => setActiveTab('practical')}
        >
          <WrenchIcon />
          <span>Practical Implementation Focus</span>
          <span className="study-tab-count">{guide.practicalImplementationFocus?.length || 0}</span>
        </button>

        <button
          type="button"
          className={`study-tab-btn ${activeTab === 'coach' ? 'active' : ''}`}
          onClick={() => setActiveTab('coach')}
        >
          <LightbulbIcon />
          <span>Coach Strategies & Checklist</span>
          <span className="study-tab-count">{guide.proTips?.length || 0}</span>
        </button>
      </div>

      {/* 4. Tab 1: Key Theoretical Areas */}
      {activeTab === 'theory' && (
        <div className="study-tab-panel">
          <div className="study-section-lead">
            <h2 className="study-section-heading">Key Theoretical Areas to Brush Up On</h2>
            <p className="study-section-desc">
              Foundational software engineering theories, architectural patterns, and algorithmic principles relevant to the {guide.targetRole || 'role'}.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {guide.keyTheoreticalAreas && guide.keyTheoreticalAreas.length > 0 ? (
              guide.keyTheoreticalAreas.map(renderFocusAreaCard)
            ) : (
              <p style={{ color: '#64748b' }}>No theoretical focus areas available for this role.</p>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Technical Core Concepts */}
      {activeTab === 'core' && (
        <div className="study-tab-panel">
          <div className="study-section-lead">
            <h2 className="study-section-heading">Technical Core Concepts Deep Dive</h2>
            <p className="study-section-desc">
              In-depth technical mechanisms, runtime execution models, and query optimization pipelines expected of senior practitioners.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {guide.technicalCoreConcepts && guide.technicalCoreConcepts.length > 0 ? (
              guide.technicalCoreConcepts.map(renderFocusAreaCard)
            ) : (
              <p style={{ color: '#64748b' }}>No technical core concepts recorded for this role.</p>
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Practical Implementation Focus */}
      {activeTab === 'practical' && (
        <div className="study-tab-panel">
          <div className="study-section-lead">
            <h2 className="study-section-heading">Practical Implementation Focus</h2>
            <p className="study-section-desc">
              Hands-on implementation workflows, resilient distributed communication patterns, and production diagnostics.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {guide.practicalImplementationFocus && guide.practicalImplementationFocus.length > 0 ? (
              guide.practicalImplementationFocus.map(renderFocusAreaCard)
            ) : (
              <p style={{ color: '#64748b' }}>No practical implementation areas recorded for this role.</p>
            )}
          </div>
        </div>
      )}

      {/* 7. Tab 4: Coach Strategies & Readiness */}
      {activeTab === 'coach' && (
        <div className="study-tab-panel">
          <div className="study-section-lead">
            <h2 className="study-section-heading">Career Coach Strategic Pro Tips</h2>
            <p className="study-section-desc">
              Communication strategies and behavioral guidance to articulate technical maturity during candidate interviews.
            </p>
          </div>

          <div className="study-protips-grid">
            {guide.proTips?.map((tip, idx) => (
              <div key={idx} className="study-protip-card">
                <div className="study-protip-icon">
                  <LightbulbIcon />
                </div>
                <div className="study-protip-body">
                  <h4>Strategy #{idx + 1}</h4>
                  <p>{tip}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Day-of-Interview Checklist */}
          {guide.preparationChecklist && guide.preparationChecklist.length > 0 && (
            <div className="study-checklist-card">
              <h3>
                <CheckIcon />
                <span>Interview Day Readiness Checklist</span>
              </h3>
              <div>
                {guide.preparationChecklist.map((item, idx) => {
                  const isChecked = !!checkedItems[idx];
                  return (
                    <div
                      key={idx}
                      className={`study-check-item ${isChecked ? 'checked' : ''}`}
                      onClick={() => toggleChecklist(idx)}
                    >
                      <div className="study-checkbox">
                        {isChecked && <CheckIcon />}
                      </div>
                      <span className="study-check-label">{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. Mandatory Disclaimer Footer (Prominent Warning/Info Theme at the very bottom) */}
      <footer className="study-disclaimer-card" role="note">
        <div className="study-disclaimer-icon-wrap">
          <span className="study-disclaimer-emoji">⚠️</span>
        </div>
        <div className="study-disclaimer-content">
          <p className="study-disclaimer-text">
            ⚠️ Note: This preparation guide is AI-generated to assist your studies. It is not 100% accurate or a definitive syllabus. Please use it strictly as a supplementary assistance tool.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CandidateStudyDashboard;
