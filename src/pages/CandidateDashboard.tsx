import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Search,
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventsApi, type CandidateInterviewDto } from '../services/api';

export function CandidateDashboard() {
  const { currentUser } = useAuth();
  const [interviews, setInterviews] = useState<CandidateInterviewDto[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState<boolean>(true);
  const [interviewsError, setInterviewsError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        weekday: 'long',
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
    return formatted.join(' - ');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* 1. Welcome Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {currentUser?.firstName || 'Candidate'}
          </h1>
          <p className="mt-2 text-slate-600">
            Track your scheduled interviews, technical assessments, and job application milestones.
          </p>
        </div>
      </div>

      {/* 2. Top Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Find Jobs</h3>
          <p className="text-slate-600 mb-6 flex-grow">
            Browse our latest open vacancies and discover new career opportunities.
          </p>
          <Link
            to="/jobs"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Explore Jobs
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <BriefcaseBusiness className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">My Applications</h3>
          <p className="text-slate-600 mb-6 flex-grow">
            Track the status, recruitment stages, and AI feedback on your job applications.
          </p>
          <Link
            to="/candidate/applications"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
          >
            View Applications
          </Link>
        </div>
      </div>

      {/* 3. My Interviews Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">My Interviews</h2>
                {!loadingInterviews && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {interviews.length} Scheduled
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upcoming and confirmed technical interview sessions coordinated by HR.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchMyInterviews}
            disabled={loadingInterviews}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            title="Refresh interviews list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingInterviews ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Section Content */}
        <div className="pt-6">
          {loadingInterviews ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm font-medium">Checking for scheduled interviews...</p>
            </div>
          ) : interviewsError ? (
            <div className="py-8 px-6 rounded-xl bg-rose-50 border border-rose-200 text-center">
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
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No Interviews Scheduled Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                When HR reviews your technical assessments and confirms your interview slot, your appointment date, time, mode (Online/Physical), and place will appear here.
              </p>
              <Link
                to="/candidate/interview-prep"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-sm hover:from-emerald-700 hover:to-teal-700 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Prepare with AI Interview Guide</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {interviews.map((interview) => {
                const isOnline = interview.meetingMode?.toLowerCase() === 'online';
                const isUrl = interview.location?.startsWith('http://') || interview.location?.startsWith('https://');

                return (
                  <div
                    key={interview.id}
                    className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges Bar */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOnline
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isOnline ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                          <span>{isOnline ? 'Online Interview' : 'Physical / In-Person'}</span>
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            interview.status === 'Completed'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5'
                          }`}
                        >
                          {interview.status !== 'Completed' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          <span>{interview.status}</span>
                        </span>
                      </div>

                      {/* Job Title & Company */}
                      <h4 className="text-base font-extrabold text-slate-900 leading-snug mb-1">
                        {interview.jobTitle || interview.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 flex-wrap">
                        <div className="flex items-center gap-1 font-medium text-slate-600">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{interview.companyName || 'Skill-Hub Tech'}</span>
                        </div>
                        {interview.department && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-medium">{interview.department}</span>
                          </>
                        )}
                      </div>

                      {/* Schedule Info Box */}
                      <div className="bg-slate-100/70 border border-slate-200/80 rounded-lg p-3 space-y-2 mb-4 text-xs">
                        {/* Date */}
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-900">
                            {formatDisplayDate(interview.eventDate)}
                          </span>
                        </div>

                        {/* Time Slot */}
                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800">
                            {formatTimeSlot(interview.eventTime)}
                          </span>
                        </div>

                        {/* Place / Venue or Meeting Link */}
                        <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
                          {isOnline ? (
                            <Video className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                          ) : (
                            <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-grow min-w-0">
                            <span className="font-bold text-slate-700 block">
                              {isOnline ? 'Meeting Link / Platform:' : 'Interview Place / Venue:'}
                            </span>
                            <span className="text-slate-900 font-medium break-all select-all">
                              {interview.location || (isOnline ? 'Google Meet (Link will be emailed)' : 'Company Office')}
                            </span>
                          </div>
                          {interview.location && (
                            <button
                              type="button"
                              onClick={() => handleCopyLink(interview.location || '', interview.id)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-white transition cursor-pointer"
                              title="Copy Place / Link"
                            >
                              {copiedId === interview.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                      <Link
                        to="/candidate/interview-prep"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Interview Prep</span>
                      </Link>

                      {isOnline && isUrl ? (
                        <a
                          href={interview.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
                        >
                          <span>Join Meeting</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {isOnline ? 'Online Session' : 'Please arrive 10m early'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
