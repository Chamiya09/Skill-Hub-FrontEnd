import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  interviewPrepApi,
  type InterviewPrepGuideDto,
} from '../services/api';
import {
  StudyDashboardHeader,
  StudyTabsNavigation,
  type StudyTabKey,
  StudyFocusAreaCard,
  StudyDisclaimerFooter,
} from '../components/interview-prep';
import { ArrowLeftIcon, SparkleIcon, CheckIcon } from '../components/common/Icons';
import './CandidateStudyDashboard.css';

const LightbulbIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const CandidateStudyDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [guide, setGuide] = useState<InterviewPrepGuideDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active study tab state:
  // Tab 1: 'theory' (Key Theoretical Areas)
  // Tab 2: 'core' (Technical Core Concepts)
  // Tab 3: 'practical' (Practical Implementation Focus)
  // Tab 4: 'coach' (Coach Strategies & Checklist)
  const [activeTab, setActiveTab] = useState<StudyTabKey>('theory');

  // Accordion expansion state per focus area
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;

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
              // fallback
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

        if (!isMounted) return;

        if (!data) {
          setError('No study guide has been generated yet. Please visit the Interview Prep Hub to create your personalized guideline.');
          setIsLoading(false);
          return;
        }

        setGuide(data);
        if (data.id) {
          localStorage.setItem('skillhub_last_guide_id', data.id);
        }

        // Auto-expand the first item in each section by default
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
        if (isMounted) {
          setError(err?.message || 'Failed to load the interview preparation guide.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchGuide();

    return () => {
      isMounted = false;
    };
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

  // Loading State View
  if (isLoading) {
    return (
      <div className="study-dashboard-page">
        <div className="study-loading-card">
          <div className="study-loading-spinner-wrap">
            <div className="study-loading-spinner" />
            <div className="study-loading-icon">
              <SparkleIcon />
            </div>
          </div>
          <h2 className="study-loading-title">
            Loading Technical Career Coach Study Guideline...
          </h2>
          <p className="study-loading-subtitle">
            Retrieving theoretical focus areas, core technical concepts, and practical priorities.
          </p>
        </div>
      </div>
    );
  }

  // Error / Not Found View
  if (error || !guide) {
    return (
      <div className="study-dashboard-page">
        <div className="study-error-card">
          <h2>Study Guide Not Found</h2>
          <p>{error || 'The requested study guide was not found or has expired.'}</p>
          <button
            type="button"
            className="btn-back-to-hub"
            onClick={() => navigate('/candidate/interview-prep')}
          >
            <ArrowLeftIcon />
            <span>Return to Interview Prep Hub</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-dashboard-page">
      {/* 1. Persistent Header (Job Title, Role, Back Button & Print Action) */}
      <StudyDashboardHeader guide={guide} />

      {/* 2. Interactive Horizontal Tabs Navigation */}
      <StudyTabsNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theoryCount={guide.keyTheoreticalAreas?.length || 0}
        coreCount={guide.technicalCoreConcepts?.length || 0}
        practicalCount={guide.practicalImplementationFocus?.length || 0}
        coachCount={(guide.proTips?.length || 0) + (guide.preparationChecklist?.length || 0)}
      />

      {/* 3. Tab Content Display Area (Only active tab content is rendered with smooth transition) */}
      <main className="study-content-area" role="tabpanel">
        {/* Tab 1: Key Theoretical Areas */}
        {activeTab === 'theory' && (
          <div className="study-tab-pane" key="tab-theory">
            <div className="study-section-banner">
              <div className="study-section-indicator">
                <span className="section-pill">TAB 1 • THEORETICAL FOUNDATIONS</span>
              </div>
              <h2 className="study-section-title">Key Theoretical Areas to Brush Up On</h2>
              <p className="study-section-description">
                Fundamental software engineering theories, architectural patterns, and algorithmic principles expected for the{' '}
                <strong>{guide.targetRole || guide.jobTitle}</strong> position.
              </p>
            </div>

            <div className="study-cards-column">
              {guide.keyTheoreticalAreas && guide.keyTheoreticalAreas.length > 0 ? (
                guide.keyTheoreticalAreas.map((item) => (
                  <StudyFocusAreaCard
                    key={item.id}
                    item={item}
                    isExpanded={!!expandedCards[item.id]}
                    onToggle={() => toggleAccordion(item.id)}
                  />
                ))
              ) : (
                <div className="study-empty-pane">
                  <p>No theoretical focus areas available for this role.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Technical Core Concepts */}
        {activeTab === 'core' && (
          <div className="study-tab-pane" key="tab-core">
            <div className="study-section-banner">
              <div className="study-section-indicator">
                <span className="section-pill">TAB 2 • CORE MECHANICS</span>
              </div>
              <h2 className="study-section-title">Technical Core Concepts Deep Dive</h2>
              <p className="study-section-description">
                In-depth runtime execution models, concurrency patterns, memory lifecycles, and database query optimization pipelines.
              </p>
            </div>

            <div className="study-cards-column">
              {guide.technicalCoreConcepts && guide.technicalCoreConcepts.length > 0 ? (
                guide.technicalCoreConcepts.map((item) => (
                  <StudyFocusAreaCard
                    key={item.id}
                    item={item}
                    isExpanded={!!expandedCards[item.id]}
                    onToggle={() => toggleAccordion(item.id)}
                  />
                ))
              ) : (
                <div className="study-empty-pane">
                  <p>No technical core concepts recorded for this role.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Practical Implementation Focus */}
        {activeTab === 'practical' && (
          <div className="study-tab-pane" key="tab-practical">
            <div className="study-section-banner">
              <div className="study-section-indicator">
                <span className="section-pill">TAB 3 • PRACTICAL WORKFLOWS</span>
              </div>
              <h2 className="study-section-title">Practical Implementation Focus</h2>
              <p className="study-section-description">
                Real-world coding workflows, resilient distributed communication patterns, schema migrations, and production diagnostics.
              </p>
            </div>

            <div className="study-cards-column">
              {guide.practicalImplementationFocus && guide.practicalImplementationFocus.length > 0 ? (
                guide.practicalImplementationFocus.map((item) => (
                  <StudyFocusAreaCard
                    key={item.id}
                    item={item}
                    isExpanded={!!expandedCards[item.id]}
                    onToggle={() => toggleAccordion(item.id)}
                  />
                ))
              ) : (
                <div className="study-empty-pane">
                  <p>No practical implementation areas recorded for this role.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Career Coach Strategies & Readiness */}
        {activeTab === 'coach' && (
          <div className="study-tab-pane" key="tab-coach">
            <div className="study-section-banner">
              <div className="study-section-indicator">
                <span className="section-pill">STRATEGIES &amp; READINESS</span>
              </div>
              <h2 className="study-section-title">Career Coach Strategic Insights</h2>
              <p className="study-section-description">
                Communication strategies, architecture trade-off discussions, and an interview day checklist.
              </p>
            </div>

            {/* Strategic Pro Tips */}
            {guide.proTips && guide.proTips.length > 0 && (
              <div className="study-coach-tips-grid">
                {guide.proTips.map((tip, idx) => (
                  <div key={idx} className="study-coach-tip-card">
                    <div className="coach-tip-badge-icon">
                      <LightbulbIcon />
                    </div>
                    <div className="coach-tip-card-content">
                      <h4>Strategic Guideline #{idx + 1}</h4>
                      <p>{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Interactive Day-of-Interview Checklist */}
            {guide.preparationChecklist && guide.preparationChecklist.length > 0 && (
              <div className="study-readiness-checklist-card">
                <div className="checklist-card-header">
                  <div className="checklist-icon-wrap">
                    <CheckIcon />
                  </div>
                  <div>
                    <h3>Interview Day Readiness Checklist</h3>
                    <p>Track your preparation steps prior to joining the candidate interview.</p>
                  </div>
                </div>

                <div className="checklist-items-list">
                  {guide.preparationChecklist.map((item, idx) => {
                    const isChecked = !!checkedItems[idx];
                    return (
                      <div
                        key={idx}
                        className={`checklist-item-row ${isChecked ? 'is-checked' : ''}`}
                        onClick={() => toggleChecklist(idx)}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleChecklist(idx)}
                      >
                        <div className="checklist-item-box">
                          {isChecked && <CheckIcon />}
                        </div>
                        <span className="checklist-item-text">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. Persistent Disclaimer Footer (Anchored permanently below all tab contents) */}
      <StudyDisclaimerFooter />
    </div>
  );
};

export default CandidateStudyDashboard;
