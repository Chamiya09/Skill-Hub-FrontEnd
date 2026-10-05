import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  SearchIcon,
  UsersIcon,
  CheckIcon,
  SparkleIcon,
  XIcon,
  ClockIcon,
} from '../components/common/Icons';
import {
  Briefcase,
  CalendarPlus,
  CalendarClock,
  Video,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Trash2,
  Building,
  MapPin,
  Clock,
  Award,
} from 'lucide-react';
import {
  assessmentsApi,
  eventsApi,
  jobsApi,
  type SubmissionDetailDto,
  type JobDto,
  type EventResponseDto,
} from '../services/api';
import { TableRowSkeleton, SkeletonStatValue, SkeletonStatLabel } from '../components/common/SkeletonCard';
import { AiInterviewSchedulerModal } from '../components/AiInterviewSchedulerModal';
import './InterviewSelectionFull.css';

export const InterviewSelection: React.FC = () => {
  const [interviewSelections, setInterviewSelections] = useState<SubmissionDetailDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Scheduled' | 'Hired'>('All');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'top' | 'high' | 'passed'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'Online' | 'Physical' | 'Unscheduled'>('all');
  const [integrityFilter, setIntegrityFilter] = useState<'all' | 'clean' | 'flagged'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score-desc' | 'score-asc' | 'name'>('newest');

  // Single Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [schedulingCandidate, setSchedulingCandidate] = useState<SubmissionDetailDto | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleStartTime, setScheduleStartTime] = useState<string>('09:00');
  const [scheduleEndTime, setScheduleEndTime] = useState<string>('09:30');
  const [scheduleMeetingMode, setScheduleMeetingMode] = useState<'Online' | 'Physical'>('Online');
  const [scheduleMeetingLink, setScheduleMeetingLink] = useState<string>('https://meet.google.com/interview-room');
  const [scheduleLocation, setScheduleLocation] = useState<string>('Skill-Hub Corporate HQ, Interview Room 1');
  const [scheduleNotes, setScheduleNotes] = useState<string>('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState<boolean>(false);
  const [existingCalendarEvents, setExistingCalendarEvents] = useState<EventResponseDto[]>([]);

  // Hire Confirmation Modal state
  const [hiringCandidate, setHiringCandidate] = useState<SubmissionDetailDto | null>(null);
  const [isHiringSubmitting, setIsHiringSubmitting] = useState<boolean>(false);

  // Batch Scheduling Modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchDeptFilter, setBatchDeptFilter] = useState<string>('all');
  const [batchDate, setBatchDate] = useState<string>('');
  const [commonMeetingLinkInput, setCommonMeetingLinkInput] = useState<string>('');
  const [commonLocationInput, setCommonLocationInput] = useState<string>('');
  const [batchCandidatesMap, setBatchCandidatesMap] = useState<
    Record<
      string,
      {
        selected: boolean;
        startTime: string;
        endTime: string;
        meetingMode: 'Online' | 'Physical';
        meetingLink: string;
        location: string;
      }
    >
  >({});
  const [isSubmittingBatch, setIsSubmittingBatch] = useState<boolean>(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // AI Interview Scheduler Modal state
  const [isAiInterviewSchedulerModalOpen, setIsAiInterviewSchedulerModalOpen] = useState<boolean>(false);

  // Toast Helper
  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [selectionsData, jobsData] = await Promise.all([
        assessmentsApi.getInterviewSelections(),
        jobsApi.getJobs().catch(() => []),
      ]);
      setInterviewSelections(selectionsData || []);
      setJobs(jobsData || []);
    } catch (err: any) {
      console.error('Error fetching interview selections:', err);
      setErrorMessage(err.message || 'Failed to load interview selections.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute metrics
  const totalSelected = interviewSelections.length;
  const scheduledCount = useMemo(
    () =>
      interviewSelections.filter(
        (s) =>
          s.scheduledEventId ||
          s.status === 'Ready for Interview' ||
          s.status?.toLowerCase().includes('ready')
      ).length,
    [interviewSelections]
  );
  const pendingCount = useMemo(
    () =>
      interviewSelections.filter(
        (s) =>
          !s.isHired &&
          s.status !== 'Hired' &&
          !s.scheduledEventId &&
          s.status !== 'Ready for Interview' &&
          !s.status?.toLowerCase().includes('ready')
      ).length,
    [interviewSelections]
  );
  const hiredCount = useMemo(
    () => interviewSelections.filter((s) => s.isHired || s.status === 'Hired').length,
    [interviewSelections]
  );

  const scheduledOnlineCount = useMemo(
    () =>
      interviewSelections.filter(
        (s) => s.scheduledEventId && s.scheduledMeetingMode !== 'Physical'
      ).length,
    [interviewSelections]
  );
  const scheduledPhysicalCount = useMemo(
    () =>
      interviewSelections.filter(
        (s) => s.scheduledEventId && s.scheduledMeetingMode === 'Physical'
      ).length,
    [interviewSelections]
  );

  // Check filter active
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    jobFilter !== 'all' ||
    scoreFilter !== 'all' ||
    modeFilter !== 'all' ||
    integrityFilter !== 'all' ||
    sortBy !== 'newest';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setJobFilter('all');
    setScoreFilter('all');
    setModeFilter('all');
    setIntegrityFilter('all');
    setSortBy('newest');
  };

  // Filter and sort candidates
  const filteredSelections = useMemo(() => {
    return interviewSelections
      .filter((sub) => {
        // 1. Status Filter
        if (statusFilter === 'Scheduled') {
          const isReady =
            sub.scheduledEventId ||
            sub.status === 'Ready for Interview' ||
            sub.status?.toLowerCase().includes('ready');
          if (!isReady) return false;
        } else if (statusFilter === 'Pending') {
          const isPending =
            !sub.isHired &&
            sub.status !== 'Hired' &&
            !sub.scheduledEventId &&
            sub.status !== 'Ready for Interview' &&
            !sub.status?.toLowerCase().includes('ready');
          if (!isPending) return false;
        } else if (statusFilter === 'Hired') {
          if (!sub.isHired && sub.status !== 'Hired') return false;
        }

        // 2. Job Filter
        if (jobFilter !== 'all' && sub.jobVacancyId !== jobFilter) {
          return false;
        }

        // 3. Score Filter
        const score = sub.examScore ?? 0;
        if (scoreFilter === 'top' && score < 85) return false;
        if (scoreFilter === 'high' && score < 70) return false;
        if (scoreFilter === 'passed' && score < (sub.passingThreshold || 60)) return false;

        // 4. Mode Filter
        const isScheduled = Boolean(sub.scheduledEventId);
        const mode = sub.scheduledMeetingMode || 'Online';
        if (modeFilter === 'Online' && (!isScheduled || mode === 'Physical')) return false;
        if (modeFilter === 'Physical' && (!isScheduled || mode !== 'Physical')) return false;
        if (modeFilter === 'Unscheduled' && isScheduled) return false;

        // 5. Proctor Integrity Filter
        const tabSwitches = sub.proctorSummary?.tabSwitches ?? 0;
        if (integrityFilter === 'clean' && tabSwitches > 0) return false;
        if (integrityFilter === 'flagged' && tabSwitches === 0) return false;

        // 6. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = (sub.candidateName || '').toLowerCase().includes(q);
          const emailMatch = (sub.candidateEmail || '').toLowerCase().includes(q);
          const jobMatch = (sub.jobTitle || '').toLowerCase().includes(q);
          const deptMatch = (sub.department || '').toLowerCase().includes(q);
          const assessMatch = (sub.assessmentTitle || '').toLowerCase().includes(q);
          if (!nameMatch && !emailMatch && !jobMatch && !deptMatch && !assessMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.submittedAt || a.startedAt || 0).getTime() - new Date(b.submittedAt || b.startedAt || 0).getTime();
        }
        if (sortBy === 'score-desc') {
          return (b.examScore || 0) - (a.examScore || 0);
        }
        if (sortBy === 'score-asc') {
          return (a.examScore || 0) - (b.examScore || 0);
        }
        if (sortBy === 'name') {
          return (a.candidateName || '').localeCompare(b.candidateName || '');
        }
        // Default: newest
        return new Date(b.submittedAt || b.startedAt || 0).getTime() - new Date(a.submittedAt || a.startedAt || 0).getTime();
      });
  }, [
    interviewSelections,
    statusFilter,
    jobFilter,
    scoreFilter,
    modeFilter,
    integrityFilter,
    searchQuery,
    sortBy,
  ]);

  // Remove / Deselect candidate from Technical Interview
  const handleDeselectCandidate = async (sub: SubmissionDetailDto) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${sub.candidateName || 'this candidate'} from technical interview selection?`
      )
    ) {
      return;
    }
    try {
      if (sub.scheduledEventId) {
        try {
          await eventsApi.deleteEvent(sub.scheduledEventId);
        } catch (e) {
          console.warn('Could not delete scheduled event during interview deselection:', e);
        }
      }
      await assessmentsApi.reviewSubmission(sub.id, {
        examScore: sub.examScore,
        isSelectedForInterview: false,
        reviewerFeedback: sub.reviewerFeedback,
      });
      showToast(`✓ Removed ${sub.candidateName || 'candidate'} from interview selection.`);
      fetchData();
    } catch (err: any) {
      console.error('Failed to remove candidate:', err);
      alert(err.message || 'Failed to remove candidate from interview selection.');
    }
  };

  // Clash Checker
  const checkClash = (
    date: string,
    start: string,
    end: string,
    excludeId?: string,
    targetDepartment?: string,
    candidateId?: string
  ) => {
    if (!date || !start || !end) return null;
    const toMins = (t: string) => {
      const parts = t.trim().split(':');
      return parts.length >= 2 ? parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) : 0;
    };
    const sMin = toMins(start);
    const eMin = toMins(end);
    if (sMin >= eMin) return null;

    const parseEvRange = (tStr: string) => {
      if (!tStr) return null;
      const parts = tStr.split(/ - |-| to | – /);
      if (parts.length >= 2) {
        return { s: toMins(parts[0].trim()), e: toMins(parts[1].trim()) };
      }
      return null;
    };

    const cleanTargetDept = (targetDepartment || '').trim().toLowerCase();

    return existingCalendarEvents.find((ev) => {
      if (ev.eventDate !== date) return false;
      if (excludeId && ev.id === excludeId) return false;

      const evDept = (ev.department || '').trim().toLowerCase();
      const isSameCandidate = Boolean(candidateId && ev.candidateId && ev.candidateId === candidateId);
      const isSameDepartment = Boolean(cleanTargetDept && evDept && cleanTargetDept === evDept);
      const isCompanyWide = !evDept || evDept === 'all' || evDept === 'company' || evDept === 'general';

      if (cleanTargetDept && !isSameCandidate && !isSameDepartment && !isCompanyWide) {
        return false;
      }

      const range = parseEvRange(ev.eventTime);
      if (!range) return false;
      return sMin < range.e && eMin > range.s;
    });
  };

  // Open Schedule Modal
  const handleOpenScheduleModal = async (sub: SubmissionDetailDto) => {
    if (sub.status === 'Hired' || sub.isHired) {
      showToast('This candidate is already hired. Interview scheduling is no longer required.');
      return;
    }
    setSchedulingCandidate(sub);
    setScheduleError(null);

    try {
      const allEvents = await eventsApi.getEvents();
      setExistingCalendarEvents(allEvents || []);
    } catch {
      // ignore
    }

    if (sub.scheduledEventId && sub.scheduledDate) {
      setScheduleDate(sub.scheduledDate);
      if (sub.scheduledTime && sub.scheduledTime.includes('-')) {
        const [st, et] = sub.scheduledTime.split('-').map((x) => x.trim());
        setScheduleStartTime(st || '09:00');
        setScheduleEndTime(et || '09:30');
      } else {
        setScheduleStartTime('09:00');
        setScheduleEndTime('09:30');
      }
      const mode = sub.scheduledMeetingMode === 'Physical' ? 'Physical' : 'Online';
      setScheduleMeetingMode(mode);
      if (mode === 'Online') {
        setScheduleMeetingLink(sub.scheduledLocation || 'https://meet.google.com/interview-room');
        setScheduleLocation('Skill-Hub Corporate HQ, Interview Room 1');
      } else {
        setScheduleLocation(sub.scheduledLocation || 'Skill-Hub Corporate HQ, Interview Room 1');
        setScheduleMeetingLink('https://meet.google.com/interview-room');
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      setScheduleDate(dateStr);
      setScheduleStartTime('09:00');
      setScheduleEndTime('09:30');
      setScheduleMeetingMode('Online');
      setScheduleMeetingLink('https://meet.google.com/interview-room');
      setScheduleLocation('Skill-Hub Corporate HQ, Interview Room 1');
    }
    setScheduleNotes('');
    setIsScheduleModalOpen(true);
  };

  // Submit Single Schedule
  const handleApproveSchedule = async () => {
    if (!schedulingCandidate) return;
    if (!scheduleDate) {
      setScheduleError('Please select an interview date.');
      return;
    }
    if (!scheduleStartTime || !scheduleEndTime) {
      setScheduleError('Please select start and end times.');
      return;
    }
    if (scheduleStartTime >= scheduleEndTime) {
      setScheduleError('End time must be after start time (e.g., 09:00 to 09:30).');
      return;
    }
    if (scheduleMeetingMode === 'Online' && !scheduleMeetingLink.trim()) {
      setScheduleError('Please enter a meeting link URL (e.g. Google Meet or Zoom).');
      return;
    }
    if (scheduleMeetingMode === 'Physical' && !scheduleLocation.trim()) {
      setScheduleError('Please enter the physical meeting room or office location.');
      return;
    }

    const targetDept = schedulingCandidate.department;
    const clash = checkClash(
      scheduleDate,
      scheduleStartTime,
      scheduleEndTime,
      schedulingCandidate.scheduledEventId,
      targetDept,
      schedulingCandidate.candidateId
    );
    if (clash) {
      setScheduleError(
        `The time slot selected (${scheduleStartTime} - ${scheduleEndTime}) on ${scheduleDate} is already booked by "${clash.title}" (${clash.eventTime})${clash.department ? ` in ${clash.department}` : ''}. Please choose another slot.`
      );
      return;
    }

    try {
      setIsSubmittingSchedule(true);
      setScheduleError(null);

      await eventsApi.scheduleCandidateInterview({
        candidateId: schedulingCandidate.candidateId,
        jobVacancyId: schedulingCandidate.jobVacancyId,
        eventDate: scheduleDate,
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
        meetingMode: scheduleMeetingMode,
        location: scheduleMeetingMode === 'Online' ? scheduleMeetingLink.trim() : scheduleLocation.trim(),
        notes: scheduleNotes.trim() || undefined,
        existingEventId: schedulingCandidate.scheduledEventId || undefined,
      });

      showToast(
        schedulingCandidate.scheduledEventId
          ? `✓ Interview for ${schedulingCandidate.candidateName || 'Candidate'} rescheduled to ${scheduleDate} (${scheduleStartTime} - ${scheduleEndTime})!`
          : `✓ Interview for ${schedulingCandidate.candidateName || 'Candidate'} scheduled on ${scheduleDate} (${scheduleStartTime} - ${scheduleEndTime})!`
      );

      setIsScheduleModalOpen(false);
      setSchedulingCandidate(null);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to schedule interview:', err);
      setScheduleError(err?.message || 'Failed to schedule interview. Slot may be occupied.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  // Open Hire Confirmation Modal
  const handleOpenHireModal = (sub: SubmissionDetailDto) => {
    setHiringCandidate(sub);
  };

  // Confirm Hire Action
  const handleConfirmHire = async () => {
    if (!hiringCandidate) return;
    try {
      setIsHiringSubmitting(true);
      await assessmentsApi.hireCandidate(hiringCandidate.id);
      showToast(
        `🎉 Congratulations! ${hiringCandidate.candidateName || 'Candidate'} has been officially hired for ${hiringCandidate.jobTitle || 'the position'}!`
      );
      setInterviewSelections((prev) =>
        prev.map((item) =>
          item.id === hiringCandidate.id ? { ...item, status: 'Hired', isHired: true } : item
        )
      );
      setHiringCandidate(null);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to hire candidate:', err);
      showToast(err?.message || 'Failed to hire candidate. Please try again.');
    } finally {
      setIsHiringSubmitting(false);
    }
  };

  // Batch Scheduling Open
  const handleOpenBatchModal = async () => {
    try {
      const allEvents = await eventsApi.getEvents();
      setExistingCalendarEvents(allEvents || []);
    } catch {
      // ignore
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setBatchDate(dateStr);
    setBatchDeptFilter('all');
    setCommonMeetingLinkInput('');
    setCommonLocationInput('');
    setBatchError(null);

    const initialMap: Record<
      string,
      {
        selected: boolean;
        startTime: string;
        endTime: string;
        meetingMode: 'Online' | 'Physical';
        meetingLink: string;
        location: string;
      }
    > = {};

    interviewSelections
      .filter((s) => !(s.status === 'Hired' || s.isHired))
      .forEach((s, idx) => {
      const baseHour = 9 + Math.floor((idx * 30) / 60);
      const baseMin = (idx * 30) % 60;
      const endHour = 9 + Math.floor(((idx * 30) + 30) / 60);
      const endMin = ((idx * 30) + 30) % 60;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const defaultStart = `${pad(baseHour)}:${pad(baseMin)}`;
      const defaultEnd = `${pad(endHour)}:${pad(endMin)}`;

      const isPhysical = s.scheduledMeetingMode === 'Physical';
      const mode: 'Online' | 'Physical' = isPhysical ? 'Physical' : 'Online';

      let initialLink = isPhysical ? 'Physical' : s.scheduledLocation || '';
      if (!isPhysical && !initialLink) {
        const safeName = (s.candidateName || 'cand').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
        initialLink = `https://meet.google.com/int-${safeName || 'slot'}-${idx + 101}`;
      }

      const initialLoc = isPhysical
        ? s.scheduledLocation || 'Skill-Hub Corporate HQ, Boardroom 2'
        : 'Online';

      initialMap[s.id] = {
        selected: false,
        startTime: s.scheduledTime && s.scheduledTime.includes('-') ? s.scheduledTime.split('-')[0].trim() : defaultStart,
        endTime: s.scheduledTime && s.scheduledTime.includes('-') ? s.scheduledTime.split('-')[1].trim() : defaultEnd,
        meetingMode: mode,
        meetingLink: initialLink,
        location: initialLoc,
      };
    });

    setBatchCandidatesMap(initialMap);
    setIsBatchModalOpen(true);
  };

  const handleToggleCandidateSelect = (subId: string) => {
    setBatchCandidatesMap((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        selected: !prev[subId]?.selected,
      },
    }));
  };

  const handleSelectAllBatch = (selectAll: boolean) => {
    setBatchCandidatesMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = { ...next[k], selected: selectAll };
      });
      return next;
    });
  };

  const handleApplyCommonLink = () => {
    if (!commonMeetingLinkInput.trim()) return;
    setBatchCandidatesMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k].selected && next[k].meetingMode === 'Online') {
          next[k] = { ...next[k], meetingLink: commonMeetingLinkInput.trim() };
        }
      });
      return next;
    });
    showToast('Applied common meeting link to selected virtual candidates.');
  };

  const handleApplyCommonLocation = () => {
    if (!commonLocationInput.trim()) return;
    setBatchCandidatesMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k].selected && next[k].meetingMode === 'Physical') {
          next[k] = { ...next[k], location: commonLocationInput.trim() };
        }
      });
      return next;
    });
    showToast('Applied common physical location to selected in-person candidates.');
  };

  const handleConfirmBatchSchedule = async () => {
    const selectedIds = Object.keys(batchCandidatesMap).filter((k) => batchCandidatesMap[k]?.selected);
    if (selectedIds.length === 0) {
      setBatchError('Please select at least one candidate to schedule.');
      return;
    }
    if (!batchDate) {
      setBatchError('Please select an interview date for batch scheduling.');
      return;
    }

    try {
      setIsSubmittingBatch(true);
      setBatchError(null);

      let successCount = 0;
      for (const id of selectedIds) {
        const sub = interviewSelections.find((s) => s.id === id);
        const cfg = batchCandidatesMap[id];
        if (!sub || !cfg) continue;

        await eventsApi.scheduleCandidateInterview({
          candidateId: sub.candidateId,
          jobVacancyId: sub.jobVacancyId,
          eventDate: batchDate,
          startTime: cfg.startTime,
          endTime: cfg.endTime,
          meetingMode: cfg.meetingMode,
          location: cfg.meetingMode === 'Online' ? cfg.meetingLink.trim() : cfg.location.trim(),
          notes: 'Batch scheduled via Interview Selection Workspace',
          existingEventId: sub.scheduledEventId || undefined,
        });
        successCount++;
      }

      showToast(`✓ Successfully batch scheduled ${successCount} candidates for ${batchDate}!`);
      setIsBatchModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error('Failed batch schedule:', err);
      setBatchError(err?.message || 'Failed batch scheduling some candidates.');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  return (
    <div className="interview-selection-container">
      {/* Toast Notification Banner */}
      {successToast && (
        <div className="interview-toast-banner">
          <CheckIcon />
          <span>{successToast}</span>
        </div>
      )}

      {/* =========================================================
          1. TOP COMPONENT: INTERVIEW SELECTION DASHBOARD CARD
          (Designed identically to Job Vacancy Page Header & Metrics)
          ========================================================= */}
      <section className="interview-dashboard-card" aria-labelledby="interview-dashboard-title">
        <div className="interview-dashboard-header">
          <div>
            <span className="interview-dashboard-eyebrow">Talent acquisition & interview selection</span>
            <h2 id="interview-dashboard-title">Technical Interview Selection Dashboard</h2>
            <p>
              A comprehensive overview of shortlisted candidates evaluated from technical assessments,
              interview readiness, and scheduling coordination across corporate requisitions.
            </p>
          </div>
          <div className="interview-dashboard-header-actions">
            <span className="interview-dashboard-live">
              <span /> Live Interview Pipeline
            </span>

            <button
              type="button"
              className="interview-btn-primary"
              onClick={handleOpenBatchModal}
              title="Batch schedule selected candidates"
            >
              <CalendarPlus size={16} />
              <span>Schedule Selected</span>
            </button>

            <button
              type="button"
              className="interview-btn-ai"
              onClick={() => setIsAiInterviewSchedulerModalOpen(true)}
              title="AI Meeting Orchestration & Automatic Slot Generator"
            >
              <Sparkles size={16} />
              <span>AI Auto-Scheduler</span>
            </button>
          </div>
        </div>

        {/* 4-Card Summary Metrics Grid */}
        <div className="interview-summary-grid">
          <article className="interview-summary-card summary-total">
            <div className="summary-icon">
              <UsersIcon />
            </div>
            <div>
              <span>Total Shortlisted</span>
              <strong>{isLoading ? <SkeletonStatValue width="45px" /> : totalSelected}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="120px" /> : 'Candidates from exams'}</small>
            </div>
          </article>

          <article className="interview-summary-card summary-active">
            <div className="summary-icon">
              <SparkleIcon />
            </div>
            <div>
              <span>Ready / Scheduled</span>
              <strong>{isLoading ? <SkeletonStatValue width="40px" /> : scheduledCount}</strong>
              <small>
                {isLoading ? (
                  <SkeletonStatLabel width="140px" />
                ) : (
                  `${scheduledOnlineCount} online • ${scheduledPhysicalCount} physical`
                )}
              </small>
            </div>
          </article>

          <article className="interview-summary-card summary-draft">
            <div className="summary-icon">
              <ClockIcon />
            </div>
            <div>
              <span>Awaiting Scheduling</span>
              <strong>{isLoading ? <SkeletonStatValue width="40px" /> : pendingCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="125px" /> : 'Awaiting interview slot'}</small>
            </div>
          </article>

          <article className="interview-summary-card summary-hired">
            <div className="summary-icon">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span>Hired Finalists</span>
              <strong>{isLoading ? <SkeletonStatValue width="40px" /> : hiredCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="130px" /> : 'Offers extended & placed'}</small>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          2. FILTER & SEARCH CONTROLS PANEL
          (Directly matches Job Vacancy Page Filter Toolbar)
          ========================================================= */}
      <section className="interview-filter-panel" aria-label="Interview Candidate Filters">
        <div className="interview-filter-heading">
          <div>
            <span className="filter-eyebrow">Talent selection workspace</span>
            <h2>Filter and coordinate candidates</h2>
          </div>
          <span className="filter-result-count">
            {filteredSelections.length} of {interviewSelections.length} shown
          </span>
        </div>

        <div className="interview-toolbar">
          {/* Tier 1: Status Tabs & Search Box */}
          <div className="interview-toolbar-top">
            {/* Status Tabs */}
            <div className="interview-tabs">
              <button
                type="button"
                className={`tab-btn ${statusFilter === 'All' ? 'active' : ''}`}
                onClick={() => setStatusFilter('All')}
              >
                All Candidates ({interviewSelections.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('Pending')}
              >
                Awaiting Schedule ({pendingCount})
              </button>
              <button
                type="button"
                className={`tab-btn ${statusFilter === 'Scheduled' ? 'active' : ''}`}
                onClick={() => setStatusFilter('Scheduled')}
              >
                Ready / Scheduled ({scheduledCount})
              </button>
              <button
                type="button"
                className={`tab-btn ${statusFilter === 'Hired' ? 'active' : ''}`}
                onClick={() => setStatusFilter('Hired')}
              >
                Hired ({hiredCount})
              </button>
            </div>

            {/* Search Box */}
            <div className="interview-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search candidate name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <XIcon />
                </button>
              )}
            </div>
          </div>

          {/* Tier 2: Refined Filters Grid */}
          <div className="interview-toolbar-filters">
            {/* Job Requisition Select */}
            <div className="interview-select-group">
              <label htmlFor="interview-job-filter">
                <Briefcase size={12} />
                <span>Job Requisition</span>
              </label>
              <select
                id="interview-job-filter"
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
              >
                <option value="all">All Requisitions ({interviewSelections.length})</option>
                {jobs.map((j) => {
                  const count = interviewSelections.filter((s) => s.jobVacancyId === j.id).length;
                  return (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.department}) — {count}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Score Select */}
            <div className="interview-select-group">
              <label htmlFor="interview-score-filter">
                <Award size={12} />
                <span>Exam Score</span>
              </label>
              <select
                id="interview-score-filter"
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value as any)}
              >
                <option value="all">All exam scores</option>
                <option value="top">Top scores (85%+)</option>
                <option value="high">High scores (70%+)</option>
                <option value="passed">Passing score (60%+)</option>
              </select>
            </div>

            {/* Interview Mode Select */}
            <div className="interview-select-group">
              <label htmlFor="interview-mode-filter">
                <Video size={12} />
                <span>Delivery Mode</span>
              </label>
              <select
                id="interview-mode-filter"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as any)}
              >
                <option value="all">All delivery modes</option>
                <option value="Online">Online (Virtual)</option>
                <option value="Physical">Physical (In-Person)</option>
                <option value="Unscheduled">Not scheduled yet</option>
              </select>
            </div>

            {/* Proctor Integrity Select */}
            <div className="interview-select-group">
              <label htmlFor="interview-integrity-filter">
                <ShieldCheck size={12} />
                <span>Integrity</span>
              </label>
              <select
                id="interview-integrity-filter"
                value={integrityFilter}
                onChange={(e) => setIntegrityFilter(e.target.value as any)}
              >
                <option value="all">All proctor results</option>
                <option value="clean">Clean sessions (0 flags)</option>
                <option value="flagged">Flagged sessions</option>
              </select>
            </div>

            {/* Sort By Select */}
            <div className="interview-select-group">
              <label htmlFor="interview-sort-filter">
                <Clock size={12} />
                <span>Sort by</span>
              </label>
              <select
                id="interview-sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="newest">Newest selected</option>
                <option value="oldest">Oldest selected</option>
                <option value="score-desc">Highest score</option>
                <option value="score-asc">Lowest score</option>
                <option value="name">Candidate name (A - Z)</option>
              </select>
            </div>

            {/* Clear All Filters CTA */}
            {hasActiveFilters && (
              <button
                type="button"
                className="interview-clear-filters"
                onClick={clearFilters}
                title="Reset all active filters"
              >
                <XIcon />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Tier 3: Active Filter Micro-Chips */}
          {hasActiveFilters && (
            <div className="interview-chips-bar">
              <span className="interview-chips-label">Active Filters:</span>

              {statusFilter !== 'All' && (
                <span className="interview-chip">
                  <span>Status: {statusFilter}</span>
                  <button
                    type="button"
                    className="interview-chip-remove"
                    onClick={() => setStatusFilter('All')}
                    title="Remove status filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {searchQuery.trim() !== '' && (
                <span className="interview-chip">
                  <span>Search: "{searchQuery}"</span>
                  <button
                    type="button"
                    className="interview-chip-remove"
                    onClick={() => setSearchQuery('')}
                    title="Clear search query"
                  >
                    ✕
                  </button>
                </span>
              )}

              {jobFilter !== 'all' && (
                <span className="interview-chip">
                  <span>
                    Job: {jobs.find((j) => j.id === jobFilter)?.title || 'Selected'}
                  </span>
                  <button
                    type="button"
                    className="interview-chip-remove"
                    onClick={() => setJobFilter('all')}
                    title="Remove job filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {scoreFilter !== 'all' && (
                <span className="interview-chip">
                  <span>
                    Score:{' '}
                    {scoreFilter === 'top'
                      ? '85%+'
                      : scoreFilter === 'high'
                      ? '70%+'
                      : '60%+'}
                  </span>
                  <button
                    type="button"
                    className="interview-chip-remove"
                    onClick={() => setScoreFilter('all')}
                    title="Remove score filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {modeFilter !== 'all' && (
                <span className="interview-chip">
                  <span>Mode: {modeFilter}</span>
                  <button
                    type="button"
                    className="interview-chip-remove"
                    onClick={() => setModeFilter('all')}
                    title="Remove mode filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {integrityFilter !== 'all' && (
                <span className="interview-chip">
                  <span>
                    Integrity: {integrityFilter === 'clean' ? 'Clean' : 'Flagged'}
                  </span>
                  <button
                    type="button"
                    className="interview-chip-remove"
                    onClick={() => setIntegrityFilter('all')}
                    title="Remove integrity filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {sortBy !== 'newest' && (
                <span className="interview-chip">
                  <span>
                    Sort:{' '}
                    {sortBy === 'oldest'
                      ? 'Oldest'
                      : sortBy === 'score-desc'
                      ? 'Highest score'
                      : sortBy === 'score-asc'
                      ? 'Lowest score'
                      : 'Name'}
                  </span>
                  <button
                    type="button"
                    className="interview-chip-remove"
                    onClick={() => setSortBy('newest')}
                    title="Reset sort"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button
                type="button"
                className="interview-chip-clear-all"
                onClick={clearFilters}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="text-xs font-semibold text-red-800 underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* =========================================================
          3. DATA TABLE (CORPORATE EMERALD THEME)
          (Directly matches Job Vacancies Data Table)
          ========================================================= */}
      <div className="interview-table-card">
        <div className="interview-table-container">
          <table className="interview-data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '240px' }}>CANDIDATE & CONTACT</th>
                <th style={{ minWidth: '200px' }}>JOB REQUISITION</th>
                <th>EXAM SCORE & INTEGRITY</th>
                <th>INTERVIEW STATUS</th>
                <th>DELIVERY MODE & VENUE</th>
                <th>SCHEDULED DATE & TIME</th>
                <th style={{ textAlign: 'right', minWidth: '180px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={7} hasAvatar />
                ))
              ) : filteredSelections.length > 0 ? (
                filteredSelections.map((sub) => {
                  const initials = (sub.candidateName || 'Candidate')
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const matchedJob = jobs.find((j) => j.id === sub.jobVacancyId);
                  const jobTitle = sub.jobTitle || matchedJob?.title || 'Job Requisition';
                  const department = sub.department || matchedJob?.department || 'Engineering';

                  const isHired = sub.status === 'Hired' || sub.isHired;
                  const isScheduled =
                    Boolean(sub.scheduledEventId) ||
                    sub.status === 'Ready for Interview' ||
                    Boolean(sub.status?.toLowerCase().includes('ready'));
                  const isPhysical = sub.scheduledMeetingMode === 'Physical';

                  const score = sub.examScore ?? 0;
                  const infractions = sub.proctorSummary?.tabSwitches ?? 0;

                  return (
                    <tr key={sub.id} className="interview-table-row">
                      {/* Candidate Column */}
                      <td>
                        <div className="cand-avatar-col">
                          <div className="cand-avatar-circle">{initials}</div>
                          <div>
                            <div className="cand-name-text">
                              {sub.candidateName || 'Candidate'}
                            </div>
                            <div className="cand-email-text">{sub.candidateEmail || '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Job Requisition Column */}
                      <td>
                        <div className="cand-job-title">
                          <Briefcase size={14} color="#059669" />
                          <span>{jobTitle}</span>
                        </div>
                        <div className="cand-job-meta">
                          <Building size={11} color="#64748b" />
                          <span>{department}</span>
                        </div>
                      </td>

                      {/* Score & Integrity Column */}
                      <td>
                        <div className="cand-score-box">
                          <span
                            className={`cand-score-pill ${
                              score >= 80
                                ? 'score-green'
                                : score >= 60
                                ? 'score-blue'
                                : 'score-amber'
                            }`}
                          >
                            <Award size={12} />
                            {score}%
                          </span>
                          <span
                            className={`cand-proctor-pill ${
                              infractions === 0 ? 'proctor-clean' : 'proctor-flagged'
                            }`}
                          >
                            <ShieldCheck size={12} />
                            {infractions === 0 ? 'Clean Proctor' : `${infractions} Tab Switches`}
                          </span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td>
                        {isHired ? (
                          <span className="badge-pill badge-hired">
                            <Sparkles size={13} color="#059669" />
                            Hired
                          </span>
                        ) : isScheduled ? (
                          <span className="badge-pill badge-ready">
                            <span className="badge-dot-green"></span>
                            Ready for Interview
                          </span>
                        ) : (
                          <span className="badge-pill badge-pending">
                            <span className="badge-dot-purple"></span>
                            Selected / Pending
                          </span>
                        )}
                      </td>

                      {/* Delivery Mode & Venue */}
                      <td>
                        {sub.scheduledEventId ? (
                          <div>
                            <span
                              className={`mode-pill ${
                                isPhysical ? 'mode-physical' : 'mode-online'
                              }`}
                            >
                              {isPhysical ? (
                                <>
                                  <MapPin size={12} /> Physical
                                </>
                              ) : (
                                <>
                                  <Video size={12} /> Online
                                </>
                              )}
                            </span>
                            <div>
                              {!isPhysical && sub.scheduledLocation ? (
                                <a
                                  href={
                                    sub.scheduledLocation.startsWith('http')
                                      ? sub.scheduledLocation
                                      : `https://${sub.scheduledLocation}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="venue-link"
                                  title={`Open Meeting Link: ${sub.scheduledLocation}`}
                                >
                                  <ExternalLink size={10} />
                                  <span>
                                    {sub.scheduledLocation.replace(/^https?:\/\//, '')}
                                  </span>
                                </a>
                              ) : isPhysical ? (
                                <span
                                  className="venue-link"
                                  style={{ color: '#92400e', textDecoration: 'none' }}
                                  title={sub.scheduledLocation || 'HQ Interview Room'}
                                >
                                  <MapPin size={10} />
                                  <span>{sub.scheduledLocation || 'HQ Interview Room'}</span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                            Slot not assigned
                          </span>
                        )}
                      </td>

                      {/* Scheduled Date & Time */}
                      <td>
                        {sub.scheduledDate ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '12.5px' }}>
                              {new Date(sub.scheduledDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span
                              style={{
                                color: '#64748b',
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Clock size={11} />
                              {sub.scheduledTime || '09:00 - 09:30'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td>
                        <div className="interview-actions-cell">
                          {/* Schedule / Reschedule button (hidden if already hired) */}
                          {!isHired && (
                            sub.scheduledEventId ? (
                              <button
                                type="button"
                                className="btn-schedule-action reschedule"
                                onClick={() => handleOpenScheduleModal(sub)}
                                title="Reschedule interview date, time, or location"
                              >
                                <CalendarClock size={13} />
                                <span>Reschedule</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-schedule-action primary"
                                onClick={() => handleOpenScheduleModal(sub)}
                                title="Assign interview date, slot, and meeting details"
                              >
                                <CalendarPlus size={13} />
                                <span>Schedule</span>
                              </button>
                            )
                          )}

                          {/* Hire Button */}
                          {isHired ? (
                            <span className="btn-hired-confirmed" title="Officially hired">
                              <CheckCircle2 size={13} />
                              <span>Hired</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn-hire-action"
                              onClick={() => handleOpenHireModal(sub)}
                              title={`Confirm official hire offer for ${sub.candidateName}`}
                            >
                              <Sparkles size={13} />
                              <span>Hire</span>
                            </button>
                          )}

                          {/* Deselect / Remove Button */}
                          <button
                            type="button"
                            className="btn-remove-action"
                            onClick={() => handleDeselectCandidate(sub)}
                            title="Remove candidate from Interview Selection"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="interview-empty-card">
                      <div className="interview-empty-icon">
                        <UsersIcon />
                      </div>
                      <h4>No Candidates Found</h4>
                      <p>
                        {hasActiveFilters
                          ? 'No candidates match your selected filters. Try resetting the search or filter options.'
                          : 'No candidates have been shortlisted for technical interviews yet. Review exam submissions in the Performance Hub to promote candidates.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="interview-btn-secondary"
                          onClick={clearFilters}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          MODAL 1: SCHEDULE / RESCHEDULE INTERVIEW MODAL
          ========================================================= */}
      {isScheduleModalOpen && schedulingCandidate && (
        <div className="interview-modal-backdrop" onClick={() => !isSubmittingSchedule && setIsScheduleModalOpen(false)}>
          <div className="interview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="interview-modal-header">
              <div>
                <h3>
                  {schedulingCandidate.scheduledEventId ? 'Reschedule Interview' : 'Schedule Technical Interview'}
                </h3>
                <p>
                  Coordinate date, time slot, and delivery mode for{' '}
                  <strong>{schedulingCandidate.candidateName || 'Candidate'}</strong>.
                </p>
              </div>
              <button
                type="button"
                className="interview-modal-close"
                onClick={() => !isSubmittingSchedule && setIsScheduleModalOpen(false)}
              >
                <XIcon />
              </button>
            </div>

            <div className="interview-modal-body">
              {scheduleError && (
                <div className="clash-alert-box">
                  <AlertCircle size={16} />
                  <span>{scheduleError}</span>
                </div>
              )}

              {/* Delivery Mode Toggle */}
              <div className="modal-field">
                <label>Interview Delivery Mode</label>
                <div className="mode-toggle-group">
                  <button
                    type="button"
                    className={`mode-toggle-btn ${scheduleMeetingMode === 'Online' ? 'active' : ''}`}
                    onClick={() => setScheduleMeetingMode('Online')}
                  >
                    <Video size={16} />
                    <span>Virtual (Online Meet)</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-toggle-btn ${scheduleMeetingMode === 'Physical' ? 'active' : ''}`}
                    onClick={() => setScheduleMeetingMode('Physical')}
                  >
                    <MapPin size={16} />
                    <span>In-Person (HQ Office)</span>
                  </button>
                </div>
              </div>

              {/* Date & Time Slot Row */}
              <div className="modal-row-2">
                <div className="modal-field">
                  <label htmlFor="sched-date">Interview Date</label>
                  <input
                    id="sched-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label>Time Slot (Start – End)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="time"
                      value={scheduleStartTime}
                      onChange={(e) => setScheduleStartTime(e.target.value)}
                      style={{ width: '100%' }}
                    />
                    <span style={{ color: '#94a3b8' }}>–</span>
                    <input
                      type="time"
                      value={scheduleEndTime}
                      onChange={(e) => setScheduleEndTime(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Location or Meeting Link */}
              {scheduleMeetingMode === 'Online' ? (
                <div className="modal-field">
                  <label htmlFor="sched-link">Virtual Meeting Link (Google Meet / Teams / Zoom)</label>
                  <input
                    id="sched-link"
                    type="url"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={scheduleMeetingLink}
                    onChange={(e) => setScheduleMeetingLink(e.target.value)}
                  />
                </div>
              ) : (
                <div className="modal-field">
                  <label htmlFor="sched-loc">In-Person Location & Room</label>
                  <input
                    id="sched-loc"
                    type="text"
                    placeholder="Skill-Hub Corporate HQ, 4th Floor, Boardroom 1"
                    value={scheduleLocation}
                    onChange={(e) => setScheduleLocation(e.target.value)}
                  />
                </div>
              )}

              {/* Internal Notes */}
              <div className="modal-field">
                <label htmlFor="sched-notes">Internal Interview Notes / Instructions (Optional)</label>
                <textarea
                  id="sched-notes"
                  rows={2}
                  placeholder="e.g. Focus on system architecture and clean code principles..."
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="interview-modal-footer">
              <button
                type="button"
                className="interview-btn-secondary"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isSubmittingSchedule}
              >
                Cancel
              </button>
              <button
                type="button"
                className="interview-btn-primary"
                onClick={handleApproveSchedule}
                disabled={isSubmittingSchedule}
              >
                {isSubmittingSchedule ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CalendarCheckIcon />
                    <span>
                      {schedulingCandidate.scheduledEventId ? 'Confirm Reschedule' : 'Confirm & Schedule'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: HIRE CANDIDATE CONFIRMATION MODAL
          ========================================================= */}
      {hiringCandidate && (
        <div className="interview-modal-backdrop" onClick={() => !isHiringSubmitting && setHiringCandidate(null)}>
          <div className="interview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="interview-modal-header">
              <div>
                <h3>Confirm Candidate Hire</h3>
                <p>Extend formal job placement to candidate.</p>
              </div>
              <button
                type="button"
                className="interview-modal-close"
                onClick={() => !isHiringSubmitting && setHiringCandidate(null)}
              >
                <XIcon />
              </button>
            </div>

            <div className="interview-modal-body">
              <div
                style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                  border: '1px solid #a7f3d0',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: '#059669',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
                    {hiringCandidate.candidateName || 'Candidate'}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#047857' }}>
                    Role: <strong>{hiringCandidate.jobTitle || 'Corporate Position'}</strong> • Score:{' '}
                    <strong>{hiringCandidate.examScore ?? 0}%</strong>
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Confirming hire will update the candidate status to <strong>Hired</strong>, record placement
                in talent intelligence analytics, and finalize their application pipeline.
              </p>
            </div>

            <div className="interview-modal-footer">
              <button
                type="button"
                className="interview-btn-secondary"
                onClick={() => setHiringCandidate(null)}
                disabled={isHiringSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="interview-btn-primary"
                onClick={handleConfirmHire}
                disabled={isHiringSubmitting}
              >
                {isHiringSubmitting ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Confirm Official Placement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: BATCH CANDIDATE SCHEDULING MODAL
          ========================================================= */}
      {isBatchModalOpen && (
        <div className="interview-modal-backdrop" onClick={() => !isSubmittingBatch && setIsBatchModalOpen(false)}>
          <div className="interview-modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="interview-modal-header">
              <div>
                <h3>Batch Technical Interview Scheduler</h3>
                <p>Select multiple candidates and assign coordinated interview slots on a single date.</p>
              </div>
              <button
                type="button"
                className="interview-modal-close"
                onClick={() => !isSubmittingBatch && setIsBatchModalOpen(false)}
              >
                <XIcon />
              </button>
            </div>

            <div className="interview-modal-body">
              {batchError && (
                <div className="clash-alert-box">
                  <AlertCircle size={16} />
                  <span>{batchError}</span>
                </div>
              )}

              {/* Batch Controls Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div className="modal-field">
                  <label htmlFor="batch-date">Batch Interview Date</label>
                  <input
                    id="batch-date"
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                  />
                </div>

                <div className="modal-field">
                  <label>Department Filter</label>
                  <select
                    value={batchDeptFilter}
                    onChange={(e) => setBatchDeptFilter(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {Array.from(new Set(interviewSelections.map((s) => s.department).filter(Boolean))).map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Common Links Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div className="modal-field">
                  <label>Common Virtual Link (Apply to selected online)</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/company-round"
                      value={commonMeetingLinkInput}
                      onChange={(e) => setCommonMeetingLinkInput(e.target.value)}
                      style={{ width: '100%' }}
                    />
                    <button
                      type="button"
                      className="interview-btn-secondary"
                      onClick={handleApplyCommonLink}
                      style={{ padding: '0 12px', whiteSpace: 'nowrap' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="modal-field">
                  <label>Common Physical Venue (Apply to selected in-person)</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Skill-Hub HQ, Boardroom 2"
                      value={commonLocationInput}
                      onChange={(e) => setCommonLocationInput(e.target.value)}
                      style={{ width: '100%' }}
                    />
                    <button
                      type="button"
                      className="interview-btn-secondary"
                      onClick={handleApplyCommonLocation}
                      style={{ padding: '0 12px', whiteSpace: 'nowrap' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidates Batch Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
                    CANDIDATES TO SCHEDULE (
                    {Object.values(batchCandidatesMap).filter((v) => v.selected).length} selected)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleSelectAllBatch(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#059669',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Select All
                    </button>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllBatch(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <tbody>
                      {interviewSelections
                        .filter(
                          (s) =>
                            !(s.status === 'Hired' || s.isHired) &&
                            (batchDeptFilter === 'all' ||
                              s.department?.toLowerCase() === batchDeptFilter.toLowerCase())
                        )
                        .map((s) => {
                          const cfg = batchCandidatesMap[s.id] || {
                            selected: false,
                            startTime: '09:00',
                            endTime: '09:30',
                            meetingMode: 'Online',
                            meetingLink: '',
                            location: '',
                          };

                          return (
                            <tr
                              key={s.id}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                background: cfg.selected ? '#f0fdf4' : '#ffffff',
                              }}
                            >
                              <td style={{ padding: '8px 12px', width: '32px' }}>
                                <input
                                  type="checkbox"
                                  checked={cfg.selected}
                                  onChange={() => handleToggleCandidateSelect(s.id)}
                                />
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                  {s.candidateName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {s.jobTitle} • {s.department}
                                </div>
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input
                                    type="time"
                                    value={cfg.startTime}
                                    onChange={(e) =>
                                      setBatchCandidatesMap((prev) => ({
                                        ...prev,
                                        [s.id]: { ...prev[s.id], startTime: e.target.value },
                                      }))
                                    }
                                    style={{
                                      fontSize: '11.5px',
                                      padding: '4px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                    }}
                                  />
                                  <span>–</span>
                                  <input
                                    type="time"
                                    value={cfg.endTime}
                                    onChange={(e) =>
                                      setBatchCandidatesMap((prev) => ({
                                        ...prev,
                                        [s.id]: { ...prev[s.id], endTime: e.target.value },
                                      }))
                                    }
                                    style={{
                                      fontSize: '11.5px',
                                      padding: '4px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                    }}
                                  />
                                </div>
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <select
                                  value={cfg.meetingMode}
                                  onChange={(e) =>
                                    setBatchCandidatesMap((prev) => ({
                                      ...prev,
                                      [s.id]: {
                                        ...prev[s.id],
                                        meetingMode: e.target.value as any,
                                      },
                                    }))
                                  }
                                  style={{
                                    fontSize: '11.5px',
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                  }}
                                >
                                  <option value="Online">Online</option>
                                  <option value="Physical">Physical</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="interview-modal-footer">
              <button
                type="button"
                className="interview-btn-secondary"
                onClick={() => setIsBatchModalOpen(false)}
                disabled={isSubmittingBatch}
              >
                Cancel
              </button>
              <button
                type="button"
                className="interview-btn-primary"
                onClick={handleConfirmBatchSchedule}
                disabled={isSubmittingBatch}
              >
                {isSubmittingBatch ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Processing Batch...</span>
                  </>
                ) : (
                  <>
                    <CalendarPlus size={15} />
                    <span>Schedule Selected Candidates</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: AI INTERVIEW AUTO-SCHEDULER MODAL (Student 3)
          ========================================================= */}
      <AiInterviewSchedulerModal
        isOpen={isAiInterviewSchedulerModalOpen}
        onClose={() => setIsAiInterviewSchedulerModalOpen(false)}
        availableJobs={jobs}
        onSuccess={(msg) => {
          showToast(msg || 'AI Interview scheduling completed successfully!');
          fetchData();
        }}
      />
    </div>
  );
};

function CalendarCheckIcon() {
  return <CheckCircle2 size={15} />;
}
