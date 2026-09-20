import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  assessmentsApi,
  type CandidateAssessmentListItemDto,
  type SubmissionDetailDto,
} from '../services/api';
import {
  ClockIcon,
  CheckIcon,
  XIcon,
  TrophyIcon,
  ShieldCheckIcon,
  AwardIcon,
  ArrowRightIcon,
  SearchIcon,
} from '../components/common/Icons';
import './CandidateAssessments.css';

// SVG Icon for Code / Technical assessment
const CodeIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const PlayIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

type FilterTab = 'all' | 'pending' | 'completed' | 'expired';

export const CandidateAssessments: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState<CandidateAssessmentListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshIndex, setRefreshIndex] = useState<number>(0);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scorecard modal state
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [scorecardDetail, setScorecardDetail] = useState<SubmissionDetailDto | null>(null);
  const [scorecardLoading, setScorecardLoading] = useState<boolean>(false);
  const [scorecardError, setScorecardError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        let list: CandidateAssessmentListItemDto[] = [];
        try {
          list = await assessmentsApi.getMyAssessments();
        } catch {
          // Fallback to direct candidateId fetch if JWT claims differ
          if (currentUser?.id) {
            list = await assessmentsApi.getCandidateAssessments(currentUser.id);
          }
        }

        if (isMounted) {
          setAssessments(list || []);
          setError(null);
        }
      } catch (err: unknown) {
        console.error('Error fetching candidate assessments:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load assigned technical assessments.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [currentUser, refreshIndex]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRefreshIndex((prev) => prev + 1);
  };

  // Load submission detail when modal opens
  const handleOpenScorecard = async (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setScorecardLoading(true);
    setScorecardError(null);
    try {
      const detail = await assessmentsApi.getSubmissionDetail(submissionId);
      setScorecardDetail(detail);
    } catch (err: unknown) {
      setScorecardError(err instanceof Error ? err.message : 'Failed to retrieve assessment scorecard details.');
    } finally {
      setScorecardLoading(false);
    }
  };

  const handleCloseScorecard = () => {
    setSelectedSubmissionId(null);
    setScorecardDetail(null);
    setScorecardError(null);
  };

  // Helper functions for completion, expiration & blocked status
  const checkIsCompleted = (item: CandidateAssessmentListItemDto) =>
    item.status === 'Submitted' || item.status === 'Under_Review' || item.status === 'Graded' || item.status === 'Passed' || item.status === 'Rejected';

  const checkIsBlocked = (item: CandidateAssessmentListItemDto) => {
    if (checkIsCompleted(item)) return false;
    return Boolean(item.isBlocked) || item.status === 'Blocked' || item.status === 'Started' || item.status === 'In_Progress' || Boolean(item.startedAt);
  };

  const checkIsExpired = (item: CandidateAssessmentListItemDto) => {
    if (checkIsCompleted(item) || checkIsBlocked(item)) return false;
    return Boolean(item.isExpired) || (Boolean(item.expiresAt) && new Date(item.expiresAt!).getTime() < Date.now());
  };

  // Filtered assessments
  const filteredAssessments = assessments.filter((item) => {
    const isCompleted = checkIsCompleted(item);
    const isBlocked = checkIsBlocked(item);
    const isExpired = checkIsExpired(item);
    const isPending = !isCompleted && !isExpired && !isBlocked;

    if (activeTab === 'pending' && !isPending) return false;
    if (activeTab === 'completed' && !isCompleted) return false;
    if (activeTab === 'expired' && !isExpired) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchJob = item.jobTitle.toLowerCase().includes(q);
      const matchCompany = item.companyName.toLowerCase().includes(q);
      const matchTrack = item.assessmentTitle.toLowerCase().includes(q);
      return matchJob || matchCompany || matchTrack;
    }

    return true;
  });

  const pendingCount = assessments.filter((a) => !checkIsCompleted(a) && !checkIsExpired(a) && !checkIsBlocked(a)).length;
  const completedCount = assessments.filter((a) => checkIsCompleted(a)).length;
  const expiredCount = assessments.filter((a) => checkIsExpired(a)).length;

  return (
    <div className="candidate-assessments-page">
      {/* 1. Hero Header */}
      <section className="assessments-hero">
        <div>
          <div className="assessments-eyebrow">
            <CodeIcon />
            <span>TECHNICAL EVALUATION ENGINE</span>
          </div>
          <h1>Technical Assessments</h1>
          <p className="assessments-subtitle">
            Take real-world coding challenges and skill assessments dispatched directly to your profile by hiring teams.
          </p>
        </div>

        {/* Quick Stats Banner */}
        <div className="hero-stats-banner">
          <div className="hero-stat-item">
            <span className="hero-stat-val">{assessments.length}</span>
            <span className="hero-stat-lbl">Total Dispatched</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <span className="hero-stat-val active-val">{pendingCount}</span>
            <span className="hero-stat-lbl">Action Required</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <span className="hero-stat-val done-val">{completedCount}</span>
            <span className="hero-stat-lbl">Completed</span>
          </div>
        </div>
      </section>

      {/* 2. Controls & Search Toolbar */}
      <div className="assessments-toolbar">
        <div className="assessments-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Assessments ({assessments.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Action Required ({pendingCount})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({completedCount})
          </button>
          {expiredCount > 0 && (
            <button
              type="button"
              className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
              onClick={() => setActiveTab('expired')}
            >
              Expired ({expiredCount})
            </button>
          )}
        </div>

        <div className="assessments-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by job, track, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="assessments-alert-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* 3. Main Assessment Cards Grid */}
      {isLoading ? (
        <div className="assessments-state-card">
          <div className="assessments-spinner" />
          <p>Loading your technical assessments...</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="assessments-state-card assessments-empty">
          <div className="assessments-empty-icon">
            <CodeIcon />
          </div>
          <h2>
            {searchQuery
              ? 'No Matching Assessments Found'
              : activeTab === 'pending'
              ? 'No Pending Assessments'
              : activeTab === 'completed'
              ? 'No Completed Assessments Yet'
              : 'No Technical Assessments Assigned Yet'}
          </h2>
          <p>
            {searchQuery
              ? 'Try modifying your search criteria to find assigned technical tests.'
              : 'When employers review your job applications and shortlist you, coding assessments will be dispatched directly to this section.'}
          </p>
          <button
            type="button"
            className="assessments-primary-action"
            onClick={() => navigate('/candidate/applications')}
          >
            <span>View Job Applications</span>
            <ArrowRightIcon />
          </button>
        </div>
      ) : (
        <div className="assessments-grid">
          {filteredAssessments.map((item) => {
            const isCompleted = checkIsCompleted(item);
            const isBlocked = checkIsBlocked(item);
            const isExpired = checkIsExpired(item);
            const isUnderReview = item.status === 'Under_Review' || (item.status === 'Submitted' && item.examScore === 0);
            const isGraded = item.status === 'Graded' || item.status === 'Passed' || item.status === 'Rejected' || (item.status === 'Submitted' && item.examScore > 0);
            const isInProgress = !isExpired && !isBlocked && (item.status === 'In_Progress' || item.status === 'Started' || (!!item.startedAt && !isCompleted));
            const companyInitials = item.companyName
              ? item.companyName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              : 'CO';

            const assignedFormatted = item.assignedAt
              ? new Date(item.assignedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recently';

            return (
              <div
                key={item.submissionId}
                className="assessment-card"
                style={item.isSelectedForInterview ? { border: '1.5px solid #10b981', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)' } : undefined}
              >
                {/* Top Company & Status Row */}
                <div className="card-top-row">
                  <div className="company-badge-wrap">
                    <div className="company-logo-pill">{companyInitials}</div>
                    <div>
                      <span className="card-company-name">{item.companyName || 'Verified Employer'}</span>
                      <h3 className="card-job-title">{item.jobTitle}</h3>
                    </div>
                  </div>

                  {/* Status Pill */}
                  {isBlocked ? (
                    <span className="status-pill status-blocked" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                      <XIcon />
                      <span>Cannot Retake</span>
                    </span>
                  ) : isExpired ? (
                    <span className="status-pill" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                      <XIcon />
                      <span>Expired</span>
                    </span>
                  ) : isUnderReview ? (
                    <span className="status-pill" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                      <ClockIcon />
                      <span>Under Review</span>
                    </span>
                  ) : isGraded ? (
                    item.isSelectedForInterview ? (
                      <span className="status-pill" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 800 }}>
                        <TrophyIcon />
                        <span>Interview Selected ({item.examScore}%)</span>
                      </span>
                    ) : item.isPassed ? (
                      <span className="status-pill status-passed">
                        <TrophyIcon />
                        <span>Passed ({item.examScore}%)</span>
                      </span>
                    ) : (
                      <span className="status-pill status-completed">
                        <CheckIcon />
                        <span>Graded ({item.examScore}%)</span>
                      </span>
                    )
                  ) : isInProgress ? (
                    <span className="status-pill status-progress">
                      <ClockIcon />
                      <span>In Progress</span>
                    </span>
                  ) : (
                    <span className="status-pill status-assigned">
                      <ClockIcon />
                      <span>Action Required</span>
                    </span>
                  )}
                </div>

                {/* Track Title */}
                <div className="card-track-box">
                  <span className="track-label">CODING CHALLENGE TRACK</span>
                  <h4 className="track-title">{item.assessmentTitle}</h4>
                </div>

                {/* Interview Selected Callout or Under Review Notice */}
                {item.isSelectedForInterview && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AwardIcon />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#065f46' }}>Selected for Technical Interview!</div>
                      <p style={{ fontSize: '11.5px', color: '#047857', margin: 0 }}>HR evaluated your code and selected you for the interview stage.</p>
                    </div>
                  </div>
                )}

                {isUnderReview && !item.isSelectedForInterview && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClockIcon />
                    <span>Code submitted • Results will be published within <strong>3–4 working days</strong></span>
                  </div>
                )}

                {isGraded && !item.isSelectedForInterview && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Technical Score: <strong>{item.examScore}%</strong></span>
                    {item.reviewerFeedback ? (
                      <span style={{ color: '#64748b', fontStyle: 'italic', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reviewerFeedback}>
                        "{item.reviewerFeedback}"
                      </span>
                    ) : (
                      <span style={{ color: item.isPassed ? '#059669' : '#64748b', fontWeight: 600 }}>
                        {item.isPassed ? 'Passed Benchmark' : 'Below Benchmark'}
                      </span>
                    )}
                  </div>
                )}

                {/* Specs / Meta Details */}
                <div className="card-specs-row">
                  <div className="spec-badge">
                    <ClockIcon />
                    <span>{item.timeLimitMinutes} mins</span>
                  </div>
                  <div className="spec-badge">
                    <CodeIcon />
                    <span>{item.questionCount} {item.questionCount === 1 ? 'Problem' : 'Problems'}</span>
                  </div>
                  <div className="spec-badge">
                    <ShieldCheckIcon />
                    <span>Pass: {item.passingThreshold}%</span>
                  </div>
                  {item.expiresAt && (
                    <div
                      className="spec-badge"
                      style={
                        isExpired
                          ? { color: '#ef4444', borderColor: '#fecaca', background: '#fff5f5' }
                          : undefined
                      }
                    >
                      <ClockIcon />
                      <span>
                        {isExpired ? 'Expired' : 'Deadline'}:{' '}
                        {new Date(item.expiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Date & Action CTA */}
                <div className="card-footer-row">
                  <div className="card-timeline-info">
                    <span className="timeline-lbl">{isCompleted ? 'Submitted' : isBlocked ? 'Blocked' : isExpired ? 'Expired' : 'Assigned'}</span>
                    <span className="timeline-date">
                      {isExpired && item.expiresAt
                        ? new Date(item.expiresAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : assignedFormatted}
                    </span>
                  </div>

                  <div className="card-actions">
                    {isCompleted ? (
                      <button
                        type="button"
                        className="btn-view-scorecard"
                        onClick={() => handleOpenScorecard(item.submissionId)}
                      >
                        <span>{isUnderReview ? 'Check Status' : 'View Scorecard'}</span>
                      </button>
                    ) : isBlocked ? (
                      <button
                        type="button"
                        className="btn-start-exam btn-cannot-retake"
                        disabled
                        title="You cannot retake this assessment because the test session was closed or exited."
                      >
                        <XIcon />
                        <span>Cannot Retake</span>
                      </button>
                    ) : isExpired ? (
                      <button
                        type="button"
                        className="btn-start-exam"
                        style={{
                          background: '#f1f5f9',
                          color: '#94a3b8',
                          border: '1px solid #e2e8f0',
                          cursor: 'not-allowed',
                        }}
                        disabled
                        title="The deadline for this assessment has passed."
                      >
                        <span>Expired</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-start-exam"
                        onClick={() => navigate(`/exam/take/${item.submissionId}`)}
                      >
                        <PlayIcon />
                        <span>Start Assessment</span>
                      </button>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Scorecard Modal */}
      {selectedSubmissionId && (
        <div className="scorecard-modal-backdrop" onClick={handleCloseScorecard}>
          <div className="scorecard-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="scorecard-modal-close"
              onClick={handleCloseScorecard}
              aria-label="Close Scorecard"
            >
              <XIcon />
            </button>

            {scorecardLoading ? (
              <div className="scorecard-loading-state">
                <div className="assessments-spinner" />
                <p>Retrieving technical scorecard &amp; evaluation report...</p>
              </div>
            ) : scorecardError ? (
              <div className="scorecard-error-state">
                <p>{scorecardError}</p>
                <button type="button" onClick={handleCloseScorecard}>
                  Close
                </button>
              </div>
            ) : scorecardDetail ? (
              <>
                {/* Modal Header */}
                <div className="scorecard-header">
                  <div className="scorecard-avatar" style={scorecardDetail.isSelectedForInterview ? { background: '#ecfdf5', color: '#059669' } : undefined}>
                    <TrophyIcon />
                  </div>
                  <div className="scorecard-title-group">
                    <span className="scorecard-eyebrow">
                      {scorecardDetail.status === 'Under_Review' || (!scorecardDetail.gradedAt && scorecardDetail.examScore === 0)
                        ? 'ASSESSMENT SUBMISSION • UNDER REVIEW'
                        : 'ASSESSMENT SCORECARD & AUDIT'}
                    </span>
                    <h2>{scorecardDetail.assessmentTitle}</h2>
                    <p className="scorecard-sub">
                      {scorecardDetail.status === 'Under_Review' || (!scorecardDetail.gradedAt && scorecardDetail.examScore === 0)
                        ? `Submitted on ${scorecardDetail.submittedAt ? new Date(scorecardDetail.submittedAt).toLocaleString() : 'Recent date'} • Manual Evaluation in Progress`
                        : `Evaluated on ${scorecardDetail.gradedAt ? new Date(scorecardDetail.gradedAt).toLocaleDateString() : 'Recent date'}`}
                    </p>
                  </div>
                </div>

                {/* Under Review Notice */}
                {(scorecardDetail.status === 'Under_Review' || (!scorecardDetail.gradedAt && scorecardDetail.examScore === 0)) && (
                  <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ClockIcon />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#92400e' }}>
                        Submission Complete • Results In 3–4 Working Days
                      </h4>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#b45309', lineHeight: 1.5 }}>
                        Your solution code has been securely submitted to the hiring committee. Our technical evaluators are manually reviewing your code. Your final marks and assessment result will be published within <strong>3–4 working days</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Selected For Interview Banner */}
                {scorecardDetail.isSelectedForInterview && (
                  <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <AwardIcon />
                      <span style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Selected for Technical Interview
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', opacity: 0.95, lineHeight: 1.5 }}>
                      Congratulations! Based on your technical assessment score of <strong>{scorecardDetail.examScore}%</strong>, the hiring committee has selected you for the technical interview stage. The recruitment team will reach out with scheduling details.
                    </p>
                  </div>
                )}

                {/* Score Breakdown Bar */}
                <div className="scorecard-stats-grid">
                  <div className="scorecard-stat-card">
                    <span className="stat-card-lbl">EXAM SCORE</span>
                    {scorecardDetail.status === 'Under_Review' || (!scorecardDetail.gradedAt && scorecardDetail.examScore === 0) ? (
                      <span className="stat-card-val" style={{ color: '#d97706', fontSize: '1.2rem', marginTop: '6px' }}>
                        In Review
                      </span>
                    ) : (
                      <span className={`stat-card-val ${scorecardDetail.examScore >= scorecardDetail.passingThreshold ? 'score-pass' : 'score-warn'}`}>
                        {scorecardDetail.examScore}%
                      </span>
                    )}
                  </div>

                  <div className="scorecard-stat-card">
                    <span className="stat-card-lbl">PASSING BENCHMARK</span>
                    <span className="stat-card-val">{scorecardDetail.passingThreshold}%</span>
                  </div>

                  <div className="scorecard-stat-card">
                    <span className="stat-card-lbl">RESULT STATUS</span>
                    <span className="stat-card-val" style={{ fontSize: '1.15rem', marginTop: '6px' }}>
                      {scorecardDetail.status === 'Under_Review' || (!scorecardDetail.gradedAt && scorecardDetail.examScore === 0) ? (
                        <span style={{ color: '#d97706', fontWeight: 800 }}>UNDER REVIEW</span>
                      ) : scorecardDetail.isSelectedForInterview ? (
                        <span style={{ color: '#059669', fontWeight: 800 }}>SELECTED</span>
                      ) : scorecardDetail.examScore >= scorecardDetail.passingThreshold ? (
                        <span style={{ color: '#059669', fontWeight: 800 }}>PASSED</span>
                      ) : (
                        <span style={{ color: '#d97706', fontWeight: 800 }}>GRADED</span>
                      )}
                    </span>
                  </div>

                  <div className="scorecard-stat-card">
                    <span className="stat-card-lbl">PROCTOR AUDIT</span>
                    <span className="stat-card-val" style={{ fontSize: '1.1rem', marginTop: '6px' }}>
                      {scorecardDetail.proctorSummary?.tabSwitches === 0 ? (
                        <span style={{ color: '#059669', fontWeight: 700 }}>Clean (0 Flags)</span>
                      ) : (
                        <span style={{ color: '#d97706', fontWeight: 700 }}>
                          {scorecardDetail.proctorSummary?.tabSwitches} Tab Switch(es)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Reviewer Feedback if present */}
                {scorecardDetail.reviewerFeedback && (
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Evaluator Notes & Feedback:
                    </span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#1e293b', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{scorecardDetail.reviewerFeedback}"
                    </p>
                  </div>
                )}

                {/* Question Breakdown List */}
                {scorecardDetail.answers && scorecardDetail.answers.length > 0 && (
                  <div className="scorecard-questions-section">
                    <h4>Submitted Code Questions</h4>
                    <div className="scorecard-questions-list">
                      {scorecardDetail.answers.map((ans, idx) => (
                        <div key={ans.questionId || idx} className="question-eval-row">
                          <div className="q-num-tag">Problem #{idx + 1}</div>
                          <div className="q-lang-tag">{ans.language || 'Code'}</div>
                          <div className="q-test-results">
                            <span>Status:</span>
                            {scorecardDetail.status === 'Under_Review' || (!scorecardDetail.gradedAt && scorecardDetail.examScore === 0) ? (
                              <strong style={{ color: '#d97706' }}>Under Manual Evaluation</strong>
                            ) : (
                              <strong style={{ color: (ans.score ?? 0) > 0 ? '#059669' : '#64748b' }}>
                                {(ans.score ?? 0) > 0 ? 'Verified Solution' : 'Incomplete / Incorrect'}
                              </strong>
                            )}
                          </div>
                          <div className="q-score-badge">
                            <span>{scorecardDetail.status === 'Under_Review' || (!scorecardDetail.gradedAt && scorecardDetail.examScore === 0) ? '— pts' : `${ans.score ?? 0} pts`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Notice */}
                <div className="scorecard-notice">
                  <ShieldCheckIcon />
                  <p>
                    This score has been submitted directly to the hiring committee. Top 5 candidates on the leaderboard advance to final technical interview rounds.
                  </p>
                </div>

                {/* Actions */}
                <div className="scorecard-footer">
                  <button type="button" className="btn-close-modal" onClick={handleCloseScorecard}>
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
