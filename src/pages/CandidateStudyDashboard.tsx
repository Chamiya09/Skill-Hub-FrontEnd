import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  interviewPrepApi,
  type InterviewPrepGuideDto,
} from '../services/api';
import {
  StudyDashboardHeader,
  StudyJobDropdown,
  StudyFocusAreaCard,
  StudyDisclaimerFooter,
} from '../components/interview-prep';
import { SparkleIcon, TargetIcon } from '../components/common/Icons';
import './CandidateStudyDashboard.css';

const LightbulbIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const BookCheckIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="m9 10 2 2 4-4" />
  </svg>
);

const CodeTerminalIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export const CandidateStudyDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // All available guides for the current candidate
  const [guides, setGuides] = useState<InterviewPrepGuideDto[]>([]);
  // Currently active selected guide (defaults to first available)
  const [selectedGuide, setSelectedGuide] = useState<InterviewPrepGuideDto | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active section filter: 'both' (default) | 'theory' | 'practical' | 'coach'
  const [activeSectionView, setActiveSectionView] = useState<'both' | 'theory' | 'practical' | 'coach'>('both');

  // Accordion expansion state per focus area
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // 1. Fetch all available interview preparation guides on mount
  useEffect(() => {
    let isMounted = true;

    const fetchAllGuides = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let list: InterviewPrepGuideDto[] = [];

        try {
          list = await interviewPrepApi.getAll();
        } catch (err: unknown) {
          console.warn('interviewPrepApi.getAll() failed:', err);
        }

        // Strictly exclude any mock / seed test data without real applications
        list = (list || []).filter((g) => {
          if (!g || !g.id) return false;
          if (
            g.id === 'bd215d1a-bd91-459e-9604-45d44fef40da' ||
            g.id.startsWith('mock-') ||
            g.id.startsWith('demo-')
          ) {
            return false;
          }
          if (!g.applicationId && (!g.jobId || g.companyName === 'Enterprise Partner')) {
            return false;
          }
          return true;
        });

        // If route has specific :id parameter, also fetch or locate that specific guide
        if (id) {
          const found = list.find((g) => g.id === id || g.applicationId === id);
          if (!found) {
            try {
              const specific = await interviewPrepApi.getById(id);
              if (
                specific &&
                (specific.applicationId || (specific.jobId && specific.companyName !== 'Enterprise Partner'))
              ) {
                list = [specific, ...list.filter((g) => g.id !== specific.id)];
              }
            } catch {
              // fallback
            }
          }
        }

        if (!isMounted) return;

        setGuides(list);

        if (list.length > 0) {
          // Default to matching ID from URL or first available in the list
          const target = (id && list.find((g) => g.id === id || g.applicationId === id)) || list[0];
          setSelectedGuide(target);
          localStorage.setItem('skillhub_last_guide_id', target.id);

          // Auto-expand the first item of each section for the active guide
          const initialExpanded: Record<string, boolean> = {};
          if (target.keyTheoreticalAreas?.length) {
            initialExpanded[target.keyTheoreticalAreas[0].id] = true;
          }
          if (target.practicalImplementationFocus?.length) {
            initialExpanded[target.practicalImplementationFocus[0].id] = true;
          }
          setExpandedCards(initialExpanded);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load interview preparation guides.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllGuides();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle instant dropdown selection change
  const handleSelectGuide = (guide: InterviewPrepGuideDto) => {
    setSelectedGuide(guide);
    localStorage.setItem('skillhub_last_guide_id', guide.id);

    // Auto-expand first item of each section for the newly selected guide
    const newExpanded: Record<string, boolean> = {};
    if (guide.keyTheoreticalAreas?.length) {
      newExpanded[guide.keyTheoreticalAreas[0].id] = true;
    }
    if (guide.practicalImplementationFocus?.length) {
      newExpanded[guide.practicalImplementationFocus[0].id] = true;
    }
    setExpandedCards(newExpanded);
  };

  const toggleAccordion = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // Loading State
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
            Loading Interview Preparation Guidelines...
          </h2>
          <p className="study-loading-subtitle">
            Retrieving interview roles, theoretical foundations, and practical implementation guidelines.
          </p>
        </div>
      </div>
    );
  }

  // Empty State: No interview guides available
  if (!isLoading && (!selectedGuide || guides.length === 0)) {
    return (
      <div className="study-dashboard-page">
        <div className="study-empty-state-card">
          <div className="study-empty-icon-box">
            <TargetIcon />
          </div>
          <span className="study-empty-pill">NO INTERVIEW GUIDES AVAILABLE</span>
          <h2 className="study-empty-heading">No Active Interview Guides Found</h2>
          <p className="study-empty-text">
            You currently have no interview preparation guidelines generated. Guides unlock automatically when your job application progresses to the Interview stage.
          </p>
          <div className="study-empty-actions-row">
            <button
              type="button"
              className="btn-study-print"
              onClick={() => navigate('/candidate/applications')}
            >
              <span>Track Applied Jobs</span>
            </button>
          </div>
        </div>

        {/* Persistent Disclaimer Footer */}
        <StudyDisclaimerFooter />
      </div>
    );
  }

  return (
    <div className="study-dashboard-page">
      {/* 1. Single-Page Dropdown Job Selector at Top of Dashboard */}
      {guides.length > 0 && (
        <StudyJobDropdown
          guides={guides}
          selectedGuide={selectedGuide}
          onSelectGuide={handleSelectGuide}
        />
      )}

      {/* Error Notice if any */}
      {error && (
        <div className="prep-error-alert" role="alert">
          <div className="prep-error-text">
            <strong>Notice:</strong> {error}
          </div>
          <button
            type="button"
            className="prep-error-dismiss"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Contextual Persistent Header identifying the Selected Interview */}
      {selectedGuide && <StudyDashboardHeader guide={selectedGuide} />}

      {/* View Switcher Pill Bar (View Both, Theoretical Only, Practical Only, Coach Tips) */}
      {selectedGuide && (
        <div className="study-sections-switcher-bar">
          <div className="switcher-label-group">
            <span className="switcher-label">STUDY SECTIONS:</span>
          </div>

          <div className="switcher-buttons-cluster">
            <button
              type="button"
              className={`switcher-btn ${activeSectionView === 'both' ? 'active' : ''}`}
              onClick={() => setActiveSectionView('both')}
            >
              <span>All Core Guidelines</span>
            </button>

            <button
              type="button"
              className={`switcher-btn ${activeSectionView === 'theory' ? 'active' : ''}`}
              onClick={() => setActiveSectionView('theory')}
            >
              <span>Theoretical Main Concepts</span>
              <span className="switcher-count">
                {selectedGuide.keyTheoreticalAreas?.length || 0}
              </span>
            </button>

            <button
              type="button"
              className={`switcher-btn ${activeSectionView === 'practical' ? 'active' : ''}`}
              onClick={() => setActiveSectionView('practical')}
            >
              <span>Practical Implementation Guidelines</span>
              <span className="switcher-count">
                {selectedGuide.practicalImplementationFocus?.length || 0}
              </span>
            </button>

            <button
              type="button"
              className={`switcher-btn ${activeSectionView === 'coach' ? 'active' : ''}`}
              onClick={() => setActiveSectionView('coach')}
            >
              <span>Coach Strategies</span>
              <span className="switcher-count">
                {selectedGuide.proTips?.length || 0}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Dynamic Content Rendering: Core Guideline Cards */}
      {selectedGuide && (
        <main className="study-content-area" key={selectedGuide.id}>
          {/* CORE CARD 1: Theoretical Main Concepts */}
          {(activeSectionView === 'both' || activeSectionView === 'theory') && (
            <section className="study-core-section-card">
              <div className="study-section-banner">
                <div className="study-section-header-row">
                  <div className="study-section-icon-box">
                    <BookCheckIcon />
                  </div>
                  <div className="study-section-header-titles">
                    <div className="study-section-indicator">
                      <span className="section-pill">CORE SECTION 1 • THEORETICAL MAIN CONCEPTS</span>
                      <span className="study-section-badge-counter">
                        {selectedGuide.keyTheoreticalAreas?.length || 0} Focus Areas
                      </span>
                    </div>
                    <h2 className="study-section-title">Theoretical Main Concepts to Master</h2>
                    <p className="study-section-description">
                      Foundational software engineering theories, architectural patterns, and computer science principles expected for{' '}
                      <strong>{selectedGuide.targetRole || selectedGuide.jobTitle}</strong> at{' '}
                      <strong>{selectedGuide.companyName || 'Enterprise Partner'}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="study-cards-column">
                {selectedGuide.keyTheoreticalAreas && selectedGuide.keyTheoreticalAreas.length > 0 ? (
                  selectedGuide.keyTheoreticalAreas.map((item) => (
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
            </section>
          )}

          {/* CORE CARD 2: Practical Implementation Guidelines */}
          {(activeSectionView === 'both' || activeSectionView === 'practical') && (
            <section className="study-core-section-card">
              <div className="study-section-banner practical-banner">
                <div className="study-section-header-row">
                  <div className="study-section-icon-box practical-icon-box">
                    <CodeTerminalIcon />
                  </div>
                  <div className="study-section-header-titles">
                    <div className="study-section-indicator">
                      <span className="section-pill practical-pill">CORE SECTION 2 • PRACTICAL IMPLEMENTATION GUIDELINES</span>
                      <span className="study-section-badge-counter practical-counter">
                        {selectedGuide.practicalImplementationFocus?.length || 0} Practical Topics
                      </span>
                    </div>
                    <h2 className="study-section-title">Practical Implementation Guidelines</h2>
                    <p className="study-section-description">
                      Real-world coding workflows, distributed communication patterns, database indexing, and production diagnostics for{' '}
                      <strong>{selectedGuide.targetRole || selectedGuide.jobTitle}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="study-cards-column">
                {selectedGuide.practicalImplementationFocus && selectedGuide.practicalImplementationFocus.length > 0 ? (
                  selectedGuide.practicalImplementationFocus.map((item) => (
                    <StudyFocusAreaCard
                      key={item.id}
                      item={item}
                      isExpanded={!!expandedCards[item.id]}
                      onToggle={() => toggleAccordion(item.id)}
                    />
                  ))
                ) : (
                  <div className="study-empty-pane">
                    <p>No practical implementation guidelines recorded for this role.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SECTION 3: Career Coach Strategies (Visible in 'both' or 'coach') */}
          {(activeSectionView === 'both' || activeSectionView === 'coach') && (
            <section className="study-core-section-card">
              <div className="study-section-banner coach-banner">
                <div className="study-section-header-row">
                  <div className="study-section-icon-box coach-icon-box">
                    <LightbulbIcon />
                  </div>
                  <div className="study-section-header-titles">
                    <div className="study-section-indicator">
                      <span className="section-pill coach-pill">CAREER COACH • STRATEGIES</span>
                      <span className="study-section-badge-counter coach-counter">
                        {selectedGuide.proTips?.length || 0} Strategies
                      </span>
                    </div>
                    <h2 className="study-section-title">Career Coach Strategic Insights</h2>
                    <p className="study-section-description">
                      Interview room strategies and structured communication frameworks to demonstrate senior engineering mastery.
                    </p>
                  </div>
                </div>
              </div>

              {/* Strategic Pro Tips */}
              {selectedGuide.proTips && selectedGuide.proTips.length > 0 && (
                <div className="study-coach-tips-grid">
                  {selectedGuide.proTips.map((tip, idx) => (
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
            </section>
          )}
        </main>
      )}

      {/* 4. Persistent Disclaimer Footer Anchored Permanently at Bottom */}
      <StudyDisclaimerFooter />
    </div>
  );
};

export default CandidateStudyDashboard;
