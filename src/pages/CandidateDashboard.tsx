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
  PartyPopper,
  Trophy,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import {
  eventsApi,
  type CandidateInterviewDto,
} from '../services/api';
import { SkeletonStatValue } from '../components/common/SkeletonCard';
import './CandidateDashboard.css';

type InterviewFilter = 'all' | 'upcoming' | 'completed';
type InterviewModeFilter = 'all' | 'online' | 'physical';
type InterviewSort = 'upcoming' | 'newest' | 'company';

export function CandidateDashboard() {
  const [interviews, setInterviews] = useState<CandidateInterviewDto[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState<boolean>(true);
  const [interviewsError, setInterviewsError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [interviewFilter, setInterviewFilter] = useState<InterviewFilter>('all');
  const [interviewModeFilter, setInterviewModeFilter] = useState<InterviewModeFilter>('all');
  const [interviewSearch, setInterviewSearch] = useState<string>('');
  const [interviewSort, setInterviewSort] = useState<InterviewSort>('upcoming');

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

  useEffect(() => {
    fetchMyInterviews();
  }, [fetchMyInterviews]);

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

  const isCompletedInterview = (interview: CandidateInterviewDto) => {
    const status = (interview.status || '').toLowerCase();
    return status === 'completed' || status === 'hired' || Boolean(interview.isHired);
  };

  const isUpcomingInterview = (interview: CandidateInterviewDto) => {
    if (isCompletedInterview(interview)) return false;
    if (!interview.eventDate) return true;
    const interviewDate = new Date(`${interview.eventDate}T23:59:59`);
    return !Number.isNaN(interviewDate.getTime()) && interviewDate.getTime() >= Date.now();
  };

  const upcomingInterviewsCount = interviews.filter(isUpcomingInterview).length;
  const onlineInterviewsCount = interviews.filter((item) => item.meetingMode?.toLowerCase() === 'online').length;
  const physicalInterviewsCount = interviews.filter((item) => item.meetingMode?.toLowerCase() !== 'online').length;
  const completedInterviewsCount = interviews.filter(isCompletedInterview).length;

  const filteredInterviews = interviews
    .filter((interview) => {
      const isOnline = interview.meetingMode?.toLowerCase() === 'online';
      const isCompleted = isCompletedInterview(interview);

      if (interviewFilter === 'upcoming' && !isUpcomingInterview(interview)) return false;
      if (interviewFilter === 'completed' && !isCompleted) return false;
      if (interviewModeFilter === 'online' && !isOnline) return false;
      if (interviewModeFilter === 'physical' && isOnline) return false;

      if (interviewSearch.trim()) {
        const query = interviewSearch.trim().toLowerCase();
        return [interview.jobTitle, interview.title, interview.companyName, interview.department, interview.location]
          .some((value) => (value || '').toLowerCase().includes(query));
      }

      return true;
    })
    .sort((a, b) => {
      if (interviewSort === 'company') return (a.companyName || '').localeCompare(b.companyName || '');
      const aDate = new Date(`${a.eventDate || '9999-12-31'}T${a.eventTime?.split(' - ')[0] || '00:00'}`).getTime();
      const bDate = new Date(`${b.eventDate || '9999-12-31'}T${b.eventTime?.split(' - ')[0] || '00:00'}`).getTime();
      return interviewSort === 'newest' ? bDate - aDate : aDate - bDate;
    });

  const hasInterviewFilters = interviewFilter !== 'all' || interviewModeFilter !== 'all' || interviewSearch.trim() !== '' || interviewSort !== 'upcoming';

  const clearInterviewFilters = () => {
    setInterviewFilter('all');
    setInterviewModeFilter('all');
    setInterviewSearch('');
    setInterviewSort('upcoming');
  };

  return (
    <div className="candidate-dashboard-container animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Interview Dashboard */}
      <section className="interview-dashboard-card" aria-labelledby="interview-dashboard-title">
        <div className="interview-dashboard-header">
          <div>
            <span className="interview-dashboard-eyebrow">Candidate schedule</span>
            <h1 id="interview-dashboard-title">My Interviews</h1>
            <p>Track scheduled sessions, meeting details, completed interviews, and hiring outcomes.</p>
          </div>
          <span className="interview-dashboard-live"><span /> Live schedule</span>
        </div>

        <div className="interview-summary-grid">
          <article className="interview-summary-card summary-total">
            <div className="interview-summary-icon"><CalendarCheck2 /></div>
            <div><span>Total interviews</span><strong>{loadingInterviews ? <SkeletonStatValue width="40px" /> : interviews.length}</strong><small>All confirmed sessions</small></div>
          </article>
          <article className="interview-summary-card summary-upcoming">
            <div className="interview-summary-icon"><Clock /></div>
            <div><span>Upcoming</span><strong>{loadingInterviews ? <SkeletonStatValue width="40px" /> : upcomingInterviewsCount}</strong><small>Sessions to attend</small></div>
          </article>
          <article className="interview-summary-card summary-online">
            <div className="interview-summary-icon"><Video /></div>
            <div><span>Online</span><strong>{loadingInterviews ? <SkeletonStatValue width="40px" /> : onlineInterviewsCount}</strong><small>Remote interview rooms</small></div>
          </article>
          <article className="interview-summary-card summary-completed">
            <div className="interview-summary-icon"><Trophy /></div>
            <div><span>Completed</span><strong>{loadingInterviews ? <SkeletonStatValue width="40px" /> : completedInterviewsCount}</strong><small>Finished or hired</small></div>
          </article>
        </div>
      </section>

      {/* 2. Standalone Interview Filters */}
      <section className="interviews-filter-panel" aria-label="Interview filters">
          <div className="interviews-filter-summary">
            <div>
              <span>Interview workspace</span>
              <h3>Find your interviews</h3>
            </div>
            <div className="interviews-filter-summary-actions">
              <strong>
                {loadingInterviews ? (
                  <span className="animate-pulse" style={{ display: 'inline-block', width: '90px', height: '14px', background: '#cbd5e1', borderRadius: '4px' }} />
                ) : (
                  `${filteredInterviews.length} of ${interviews.length} shown`
                )}
              </strong>
              <button
                type="button"
                onClick={fetchMyInterviews}
                disabled={loadingInterviews}
                className="interviews-refresh-btn"
                title="Refresh interviews list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingInterviews ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="interviews-filter-toolbar">
            <div className="interviews-filter-tabs" role="group" aria-label="Filter interviews by status">
            {([
              ['all', `All (${loadingInterviews ? '...' : interviews.length})`],
              ['upcoming', `Upcoming (${loadingInterviews ? '...' : upcomingInterviewsCount})`],
              ['completed', `Completed (${loadingInterviews ? '...' : completedInterviewsCount})`],
            ] as Array<[InterviewFilter, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`interviews-filter-tab ${interviewFilter === value ? 'active' : ''}`}
                onClick={() => setInterviewFilter(value)}
              >
                {label}
              </button>
            ))}
            </div>

          <div className="interviews-search-box">
            <Search className="w-4 h-4" />
            <input
              type="search"
              value={interviewSearch}
              onChange={(event) => setInterviewSearch(event.target.value)}
              placeholder="Search company, role, or location..."
              aria-label="Search interviews"
            />
            {interviewSearch && (
              <button type="button" onClick={() => setInterviewSearch('')} aria-label="Clear interview search">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="interviews-select-group">
            <label htmlFor="interview-mode-filter">Mode</label>
            <select
              id="interview-mode-filter"
              value={interviewModeFilter}
              onChange={(event) => setInterviewModeFilter(event.target.value as InterviewModeFilter)}
            >
              <option value="all">All modes</option>
              <option value="online">Online ({onlineInterviewsCount})</option>
              <option value="physical">Physical ({physicalInterviewsCount})</option>
            </select>
          </div>

          <div className="interviews-select-group">
            <label htmlFor="interview-sort">Sort by</label>
            <select
              id="interview-sort"
              value={interviewSort}
              onChange={(event) => setInterviewSort(event.target.value as InterviewSort)}
            >
              <option value="upcoming">Upcoming first</option>
              <option value="newest">Newest first</option>
              <option value="company">Company A–Z</option>
            </select>
          </div>

          {hasInterviewFilters && (
            <button type="button" className="interviews-clear-filters" onClick={clearInterviewFilters}>
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
          </div>
      </section>

      {/* 3. Interview Results */}
      {loadingInterviews ? (
        <div className="interviews-cards-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="scheduled-interview-card animate-pulse"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ width: '130px', height: '26px', borderRadius: '9999px', background: '#e2e8f0' }} />
                <span style={{ width: '80px', height: '22px', borderRadius: '9999px', background: '#f1f5f9' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '70%', height: '20px', borderRadius: '6px', background: '#cbd5e1' }} />
                <div style={{ width: '45%', height: '14px', borderRadius: '4px', background: '#e2e8f0' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ height: '52px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }} />
                <div style={{ height: '52px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }} />
              </div>
              <div style={{ height: '42px', borderRadius: '10px', background: '#f1f5f9', marginTop: 'auto' }} />
            </div>
          ))}
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
        ) : filteredInterviews.length === 0 ? (
          <div className="interviews-empty-state">
            <div className="interviews-empty-icon">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="interviews-empty-title">
              {hasInterviewFilters ? 'No Matching Interviews' : 'No Interviews Scheduled Yet'}
            </h3>
            <p className="interviews-empty-desc">
              {hasInterviewFilters
                ? 'Try changing your search, status, mode, or sorting options.'
                : 'When HR reviews your technical assessments and confirms your interview slot, your appointment date, time, mode, and place will appear here.'}
            </p>
            <Link
              to={hasInterviewFilters ? '#' : '/candidate/interview-prep'}
              className="btn-prep-hub-link"
              onClick={hasInterviewFilters ? (event) => { event.preventDefault(); clearInterviewFilters(); } : undefined}
            >
              {hasInterviewFilters ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{hasInterviewFilters ? 'Reset Interview Filters' : 'Prepare with AI Interview Guide'}</span>
            </Link>
          </div>
        ) : (
          <div className="interviews-grid">
            {filteredInterviews.map((interview) => {
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
                  <div className="interview-card-content">
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
                      <div className="hired-welcome-badge">
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
  );
}
export default CandidateDashboard;
