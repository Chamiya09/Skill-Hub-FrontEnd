import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Building,
  CalendarCheck2,
  Code,
  BookOpen,
  ArrowRight,
  PartyPopper,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  eventsApi,
  assessmentsApi,
  interviewPrepApi,
  type CandidateInterviewDto,
  type CandidateAssessmentListItemDto,
  type InterviewPrepGuideDto,
} from '../services/api';
import './CandidateDashboard.css';

export function CandidateDashboard() {
  const { currentUser } = useAuth();
  const [interviews, setInterviews] = useState<CandidateInterviewDto[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState<boolean>(true);
  const [interviewsError, setInterviewsError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Companion section data states
  const [assessmentsCount, setAssessmentsCount] = useState<number>(0);
  const [pendingAssessmentsCount, setPendingAssessmentsCount] = useState<number>(0);
  const [prepGuidesCount, setPrepGuidesCount] = useState<number>(0);

  const fetchMyInterviews = useCallback(async () => {
    try {
      setLoadingInterviews(true);
      setInterviewsError(null);
      const data = await eventsApi.getMyInterviews();
      setInterviews(data || []);
    } catch (err: unknown) {
      console.warn('Could not load candidate interviews:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch scheduled interviews.';
      setInterviewsError(msg);
    } finally {
      setLoadingInterviews(false);
    }
  }, []);

  const fetchCompanionStats = useCallback(async () => {
    try {
      // 1. Fetch assessments
      let assessmentsList: CandidateAssessmentListItemDto[] = [];
      try {
        assessmentsList = await assessmentsApi.getMyAssessments();
      } catch {
        if (currentUser?.id) {
          assessmentsList = await assessmentsApi.getCandidateAssessments(currentUser.id);
        }
      }
      if (Array.isArray(assessmentsList)) {
        setAssessmentsCount(assessmentsList.length);
        const pending = assessmentsList.filter((a) => {
          const s = a.status?.toLowerCase();
          return s === 'pending' || s === 'assigned' || s === 'in progress';
        }).length;
        setPendingAssessmentsCount(pending);
      }
    } catch (err) {
      console.warn('Could not load assessments count:', err);
    }

    try {
      // 2. Fetch prep guides
      const guides = await interviewPrepApi.getAll().catch(() => [] as InterviewPrepGuideDto[]);
      if (Array.isArray(guides)) {
        setPrepGuidesCount(guides.length);
      }
    } catch (err) {
      console.warn('Could not load prep guides count:', err);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchMyInterviews();
    fetchCompanionStats();
  }, [fetchMyInterviews, fetchCompanionStats]);

  const handleCopyLink = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.includes(' - ') ? timeStr.split(' - ') : [timeStr];
    const formatted = parts.map((p) => {
      const trimmed = p.trim();
      const sub = trimmed.split(':');
      if (sub.length >= 2) {
        const h = parseInt(sub[0], 10);
        const m = parseInt(sub[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 === 0 ? 12 : h % 12;
          return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
        }
      }
      return trimmed;
    });
    return formatted.join(' – ');
  };

  return (
    <div className="candidate-dashboard-container animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Candidate Welcome Header & Quick Pipeline Stats */}
      <div className="candidate-welcome-header">
        <div>
          <h1 className="candidate-welcome-title">
            Welcome back, {currentUser?.firstName || 'Candidate'}
          </h1>
          <p className="candidate-welcome-subtitle">
            Track your recruitment progress: technical assessments, confirmed interviews, and AI preparation guides.
          </p>
        </div>
        <div className="candidate-quick-stats-row">
          <div className="candidate-stat-pill">
            <span>Assessments:</span>
            <span className="candidate-stat-pill-num">{assessmentsCount}</span>
          </div>
          <div className="candidate-stat-pill">
            <span>Interviews:</span>
            <span className="candidate-stat-pill-num">{interviews.length}</span>
          </div>
          <div className="candidate-stat-pill">
            <span>AI Prep Guides:</span>
            <span className="candidate-stat-pill-num">{prepGuidesCount}</span>
          </div>
        </div>
      </div>

      {/* 2. STAGE 1: Technical Assessments Companion Card */}
      <div className="recruitment-companion-card">
        <div className="companion-card-left">
          <div className="companion-icon-box code-theme">
            <Code className="w-6 h-6" />
          </div>
          <div className="companion-card-info">
            <span className="companion-step-badge">Stage 1 • Coding Challenges</span>
            <h3 className="companion-card-title">Technical Assessments</h3>
            <p className="companion-card-desc">
              {pendingAssessmentsCount > 0
                ? `You have ${pendingAssessmentsCount} pending technical assessment(s) assigned by recruiters.`
                : assessmentsCount > 0
                ? `All ${assessmentsCount} assigned technical assessment(s) are completed. Review your scores and feedback.`
                : 'Complete assigned skill tests and algorithmic exams evaluated for your job applications.'}
            </p>
          </div>
        </div>
        <div className="companion-card-right">
          <Link
            to="/candidate/assessments"
            className="companion-action-btn btn-outline-green"
          >
            <span>View Assessments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 3. STAGE 2: My Interviews Section (In the Middle) */}
      <div className="interviews-section-card">
        {/* Section Header */}
        <div className="interviews-section-header">
          <div className="interviews-header-left">
            <div className="interviews-icon-wrap">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div className="interviews-title-group">
              <div className="interviews-title-row">
                <h2 className="interviews-main-title">My Interviews</h2>
                {!loadingInterviews && (
                  <span className="interviews-count-pill">
                    {interviews.length} Scheduled
                  </span>
                )}
              </div>
              <p className="interviews-subtitle">
                Upcoming and confirmed technical interview sessions coordinated by HR.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchMyInterviews();
              fetchCompanionStats();
            }}
            disabled={loadingInterviews}
            className="interviews-refresh-btn"
            title="Refresh interviews list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingInterviews ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Section Body */}
        {loadingInterviews ? (
          <div className="interviews-loading-wrap">
            <div className="interviews-loading-spinner" />
            <p>Checking for scheduled interviews...</p>
          </div>
        ) : interviewsError ? (
          <div className="py-8 px-6 rounded-xl bg-rose-50 border border-rose-200 text-center my-4">
            <p className="text-sm text-rose-700 font-semibold mb-2">{interviewsError}</p>
            <button
              type="button"
              onClick={fetchMyInterviews}
              className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        ) : interviews.length === 0 ? (
          <div className="interviews-empty-state">
            <div className="interviews-empty-icon">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="interviews-empty-title">No Interviews Scheduled Yet</h3>
            <p className="interviews-empty-desc">
              When HR reviews your technical assessments and confirms your interview slot, your appointment date, time, mode (Online/Physical), and place will appear here.
            </p>
            <Link
              to="/candidate/interview-prep"
              className="btn-prep-hub-link"
            >
              <Sparkles className="w-4 h-4" />
              <span>Prepare with AI Interview Guide</span>
            </Link>
          </div>
        ) : (
          <div className="interviews-grid">
            {interviews.map((interview) => {
              const isHired = Boolean(interview.isHired || interview.status?.toLowerCase() === 'hired');
              const isOnline = interview.meetingMode?.toLowerCase() === 'online';
              const hasUrl = Boolean(
                interview.location &&
                (interview.location.startsWith('http://') ||
                 interview.location.startsWith('https://') ||
                 interview.location.includes('meet.google.com') ||
                 interview.location.includes('zoom.us') ||
                 interview.location.includes('teams.microsoft.com'))
              );
              const joinUrl = hasUrl
                ? (interview.location?.startsWith('http') ? interview.location : `https://${interview.location}`)
                : undefined;

              return (
                <div
                  key={interview.id}
                  className={`scheduled-interview-card ${isHired ? 'is-hired' : ''} ${isOnline ? 'mode-online' : 'mode-physical'}`}
                >
                  {/* Top Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Hired Celebratory Banner */}
                    {isHired && (
                      <div className="hired-celebration-hero">
                        <div className="hired-celebration-ribbon">
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>OFFICIAL HIRING OFFER EXTENDED</span>
                          <PartyPopper className="w-4 h-4 text-amber-300" />
                        </div>
                        <h3 className="hired-celebration-title">
                          🎉 Congratulations! You Are Hired!
                        </h3>
                        <p className="hired-celebration-text">
                          {interview.hiredMessage ||
                            `We are thrilled to inform you that following your outstanding performance, the hiring committee has officially selected and hired you for the ${interview.jobTitle || 'Role'} position at ${interview.companyName || 'Skill-Hub'}!`}
                        </p>
                      </div>
                    )}

                    {/* Header Badges */}
                    <div className="card-header-badges">
                      {isHired ? (
                        <span
                          className="interview-mode-tag"
                          style={{
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                          }}
                        >
                          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hired & Selected</span>
                        </span>
                      ) : (
                        <span
                          className={`interview-mode-tag ${isOnline ? 'tag-online' : 'tag-physical'}`}
                        >
                          {isOnline ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                          <span>{isOnline ? 'Online Video Interview' : 'In-Person / Physical'}</span>
                        </span>
                      )}

                      <span className={`interview-status-tag ${isHired ? 'hired-tag' : ''}`}>
                        {!isHired && interview.status !== 'Completed' && (
                          <span className="status-dot-pulse" />
                        )}
                        <span>{isHired ? 'Officially Hired 🎉' : (interview.status || 'Confirmed')}</span>
                      </span>
                    </div>

                    {/* Job Title & Company */}
                    <div className="card-job-section">
                      <h4 className="interview-job-title">
                        {interview.jobTitle || interview.title || 'Technical Interview'}
                      </h4>
                      <div className="interview-company-meta">
                        <span className="company-name-span">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{interview.companyName || 'Skill-Hub Partner'}</span>
                        </span>
                        {interview.department && (
                          <span className="department-pill-span">{interview.department}</span>
                        )}
                      </div>
                    </div>

                    {/* Hired Next Steps / Onboarding Box */}
                    {isHired && (
                      <div className="hired-onboarding-box">
                        <div className="hired-onboarding-header">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Next Steps & Onboarding Process</span>
                        </div>
                        <p className="hired-onboarding-desc">
                          Our Human Resources and People Operations team will reach out directly to your registered email address with your formal offer letter, onboarding documentation, compensation details, and induction schedule. Welcome to the team!
                        </p>
                      </div>
                    )}

                    {/* Executive Schedule Tiles (Date & Time) - Only show for upcoming/pending interviews */}
                    {!isHired && (
                      <div className="schedule-tiles-row">
                        <div className="schedule-tile-box">
                          <div className="tile-icon-wrap">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="tile-text-content">
                            <span className="tile-label">Date</span>
                            <span className="tile-value" title={interview.eventDate}>
                              {formatDisplayDate(interview.eventDate)}
                            </span>
                          </div>
                        </div>

                        <div className="schedule-tile-box">
                          <div className="tile-icon-wrap">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="tile-text-content">
                            <span className="tile-label">Time Slot</span>
                            <span className="tile-value" title={interview.eventTime}>
                              {formatTimeSlot(interview.eventTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Meeting Platform or Physical Location Box - Only show for upcoming/pending interviews */}
                    {!isHired && interview.meetingMode !== 'Offer' && (
                      <div
                        className={`interview-location-block ${isOnline ? 'mode-online' : 'mode-physical'}`}
                      >
                        <div className="location-block-header">
                          <span className="location-label-wrap">
                            {isOnline ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                            <span>{isOnline ? 'Meeting Link / Platform' : 'Interview Place / Venue'}</span>
                          </span>

                          {interview.location && (
                            <button
                              type="button"
                              onClick={() => handleCopyLink(interview.location || '', interview.id)}
                              className={`copy-button ${copiedId === interview.id ? 'copied' : ''}`}
                              title={isOnline ? 'Copy Meeting Link' : 'Copy Venue Address'}
                            >
                              {copiedId === interview.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>{isOnline ? 'Copy Link' : 'Copy Address'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="location-value-text">
                          {interview.location || (isOnline ? 'Google Meet / Online Room (Link provided by HR)' : 'Company Office / Confirmed Venue')}
                        </div>

                        <p className="location-note-hint">
                          {isOnline
                            ? 'Please test your camera, microphone, and internet connection before joining.'
                            : 'Please arrive 10–15 minutes early at reception with your identification.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom CTAs */}
                  <div className="card-bottom-actions">
                    {isHired ? (
                      <div
                        className="hired-welcome-badge"
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          padding: '10px 18px',
                          fontSize: '13.5px',
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Welcome to {interview.companyName || 'BCD Company'}!</span>
                      </div>
                    ) : (
                      <>
                        <Link
                          to="/candidate/interview-prep"
                          className="btn-prep-hub-link"
                          title="Prepare for this interview with AI"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Interview Prep</span>
                        </Link>

                        {isOnline && joinUrl ? (
                          <a
                            href={joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-join-meeting-cta"
                          >
                            <span>Join Meeting</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="physical-venue-badge">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            <span>{isOnline ? 'Online Session' : 'Venue Confirmed'}</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. STAGE 3: Interview Prep Hub Companion Card */}
      <div className="recruitment-companion-card">
        <div className="companion-card-left">
          <div className="companion-icon-box prep-theme">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="companion-card-info">
            <span className="companion-step-badge">Stage 3 • AI-Powered Preparation</span>
            <h3 className="companion-card-title">Interview Prep Hub</h3>
            <p className="companion-card-desc">
              {prepGuidesCount > 0
                ? `You have ${prepGuidesCount} customized interview preparation guide(s) generated. Review questions and concepts.`
                : 'Generate tailored AI study guides, mock technical questions, and behavioral interview strategies.'}
            </p>
          </div>
        </div>
        <div className="companion-card-right">
          <Link
            to="/candidate/interview-prep"
            className="companion-action-btn btn-outline-purple"
          >
            <span>Launch Prep Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
export default CandidateDashboard;
