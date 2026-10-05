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
import { TargetIcon } from '../components/common/Icons';
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
  const [isDeleting, setIsDeleting] = useState(false);
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

        // Strictly exclude any unapproved drafts or mock test data without real applications
        list = (list || []).filter((g) => {
          if (!g || !g.id) return false;
          if (g.approvalStatus && g.approvalStatus.toLowerCase() !== 'approved') {
            return false;
          }
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
                (!specific.approvalStatus || specific.approvalStatus.toLowerCase() === 'approved') &&
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

  // Handle Guide Deletion
  const handleDeleteGuide = async (guideId: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this interview preparation guide? You can regenerate it later from the Interview Prep Hub.'
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      setError(null);
      await interviewPrepApi.deleteGuide(guideId);

      const remainingGuides = guides.filter((g) => g.id !== guideId);
      setGuides(remainingGuides);

      if (remainingGuides.length > 0) {
        const nextGuide = remainingGuides[0];
        setSelectedGuide(nextGuide);
        localStorage.setItem('skillhub_last_guide_id', nextGuide.id);
        navigate(`/candidate/interview-prep/guide/${nextGuide.id}`, { replace: true });
      } else {
        setSelectedGuide(null);
        localStorage.removeItem('skillhub_last_guide_id');
        navigate('/candidate/interview-prep', { replace: true });
      }
    } catch (err: any) {
      console.error('Failed to delete interview prep guide:', err);
      setError(err?.message || 'Failed to delete interview preparation guide.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading State with rich skeleton layout
  if (isLoading) {
    return (
      <div className="study-dashboard-page" aria-busy="true" aria-label="Loading interview preparation guide">
        {/* Top selector banner skeleton */}
        <section className="study-guide-dashboard animate-pulse">
          <div className="study-guide-dashboard-heading">
            <div style={{ width: '100%' }}>
              <div style={{ width: 180, height: 14, background: '#e2e8f0', borderRadius: 6, marginBottom: 12 }} />
              <div style={{ width: '40%', height: 28, background: '#cbd5e1', borderRadius: 8, marginBottom: 8 }} />
              <div style={{ width: '60%', height: 16, background: '#e2e8f0', borderRadius: 6 }} />
            </div>
          </div>
          <div className="study-guide-filter-surface" style={{ pointerEvents: 'none' }}>
            <div className="study-guide-filter-copy">
              <div style={{ width: 90, height: 12, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
              <div style={{ width: 220, height: 18, background: '#cbd5e1', borderRadius: 6, marginBottom: 6 }} />
              <div style={{ width: 160, height: 12, background: '#e2e8f0', borderRadius: 4 }} />
            </div>
            <div style={{ width: 200, height: 42, background: '#e2e8f0', borderRadius: 10 }} />
          </div>
        </section>

        {/* Header Hero Banner Skeleton */}
        <div style={{ background: '#fff', border: '1px solid #dce7e3', borderRadius: 18, padding: 24 }} className="animate-pulse">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 90, height: 22, background: '#dcfce7', borderRadius: 999 }} />
                <div style={{ width: 110, height: 22, background: '#e0e7ff', borderRadius: 999 }} />
              </div>
              <div style={{ width: 340, height: 32, background: '#cbd5e1', borderRadius: 8, marginBottom: 10 }} />
              <div style={{ width: 200, height: 18, background: '#e2e8f0', borderRadius: 6 }} />
            </div>
            <div style={{ width: 140, height: 40, background: '#f1f5f9', borderRadius: 10 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <div style={{ width: 120, height: 26, background: '#f1f5f9', borderRadius: 6 }} />
            <div style={{ width: 150, height: 26, background: '#f1f5f9', borderRadius: 6 }} />
            <div style={{ width: 110, height: 26, background: '#f1f5f9', borderRadius: 6 }} />
          </div>
        </div>

        {/* View Switcher Pill Bar Skeleton */}
        <div className="study-sections-switcher-bar animate-pulse" style={{ pointerEvents: 'none' }}>
          <div className="switcher-label-group">
            <div style={{ width: 100, height: 14, background: '#cbd5e1', borderRadius: 4 }} />
          </div>
          <div className="switcher-buttons-cluster">
            <div style={{ width: 110, height: 34, background: '#00b074', opacity: 0.3, borderRadius: 20 }} />
            <div style={{ width: 110, height: 34, background: '#e2e8f0', borderRadius: 20 }} />
            <div style={{ width: 110, height: 34, background: '#e2e8f0', borderRadius: 20 }} />
            <div style={{ width: 110, height: 34, background: '#e2e8f0', borderRadius: 20 }} />
          </div>
        </div>

        {/* Detailed Focus Area Skeletons */}
        <div style={{ display: 'grid', gap: 20 }} className="animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #dce7e3', borderRadius: 18, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: '#ecfdf5', borderRadius: 10 }} />
                  <div>
                    <div style={{ width: 220, height: 20, background: '#cbd5e1', borderRadius: 6, marginBottom: 6 }} />
                    <div style={{ width: 140, height: 14, background: '#e2e8f0', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ width: 80, height: 26, background: '#f1f5f9', borderRadius: 6 }} />
              </div>

              <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: 18 }}>
                  <div style={{ width: '70%', height: 16, background: '#cbd5e1', borderRadius: 6, marginBottom: 12 }} />
                  <div style={{ width: '95%', height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: '85%', height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 14 }} />
                  <div style={{ width: '100%', height: 60, background: '#1e293b12', borderRadius: 8 }} />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: 18 }}>
                  <div style={{ width: '60%', height: 16, background: '#cbd5e1', borderRadius: 6, marginBottom: 12 }} />
                  <div style={{ width: '90%', height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: '80%', height: 14, background: '#e2e8f0', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))}
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
      {/* Study dashboard and job guide selector */}
      {guides.length > 0 && (
        <section className="study-guide-dashboard" aria-labelledby="study-dashboard-title">
          <div className="study-guide-dashboard-heading">
            <div>
              <span className="study-guide-dashboard-eyebrow">Interview preparation workspace</span>
              <h1 id="study-dashboard-title">Study Dashboard</h1>
              <p>Choose a job interview to open its tailored concepts, practical focus areas, and coaching guidance.</p>
            </div>
            <span className="study-guide-dashboard-status"><span /> {guides.length} {guides.length === 1 ? 'guide available' : 'guides available'}</span>
          </div>

          <div className="study-guide-filter-surface">
            <div className="study-guide-filter-copy">
              <span>Filter by job</span>
              <strong>{selectedGuide?.targetRole || selectedGuide?.jobTitle || 'Select an interview role'}</strong>
              <small>{selectedGuide?.companyName || 'Choose one of your approved interview guides'}</small>
            </div>
            <StudyJobDropdown
              guides={guides}
              selectedGuide={selectedGuide}
              onSelectGuide={handleSelectGuide}
            />
          </div>
        </section>
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
      {selectedGuide && (
        <StudyDashboardHeader
          guide={selectedGuide}
          onDeleteGuide={handleDeleteGuide}
          isDeleting={isDeleting}
        />
      )}

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
