import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  Link as LinkIcon,
  Copy,
} from 'lucide-react';
import {
  type JobDto,
  eventsApi,
  jobsApi,
  type ScheduleProposalResponseDto,
  type ConfirmInterviewScheduleDto,
} from '../services/api';

interface AiInterviewSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  initialJobVacancyId?: string;
  availableJobs?: JobDto[];
}

const formatDateOnlyString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatSingleTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (/(am|pm)$/i.test(trimmed)) return trimmed;

  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    }
  }
  return trimmed;
};

export const AiInterviewSchedulerModal: React.FC<AiInterviewSchedulerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialJobVacancyId,
  availableJobs,
}) => {
  const [vacancies, setVacancies] = useState<JobDto[]>(availableJobs || []);
  const [, setVacanciesLoading] = useState<boolean>(false);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>(initialJobVacancyId || '');
  const [aiStartDate, setAiStartDate] = useState<string>(() => formatDateOnlyString(new Date()));
  const [aiEndDate, setAiEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return formatDateOnlyString(d);
  });
  const [aiDuration, setAiDuration] = useState<number>(30);
  const [aiTracks] = useState<number>(1);
  const [aiWorkStart, setAiWorkStart] = useState<string>('09:00');
  const [aiWorkEnd, setAiWorkEnd] = useState<string>('17:00');
  const [aiBuffer] = useState<number>(0);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState<boolean>(false);
  const [aiSchedulerError, setAiSchedulerError] = useState<string | null>(null);
  const [scheduleProposal, setScheduleProposal] = useState<ScheduleProposalResponseDto | null>(null);
  const [isConfirmingSchedule, setIsConfirmingSchedule] = useState<boolean>(false);
  const [selectedProposedSlotIds, setSelectedProposedSlotIds] = useState<string[]>([]);
  const [slotConfigs, setSlotConfigs] = useState<
    Record<string, { meetingMode: 'Online' | 'Physical'; meetingLink: string; location: string }>
  >({});
  const [commonMeetingLinkInput, setCommonMeetingLinkInput] = useState<string>('');

  // Live count derived from HR's manual checkbox selections
  const liveScheduledCount = selectedProposedSlotIds.length;
  const liveUnscheduledCount = scheduleProposal
    ? Math.max(0, scheduleProposal.summary.totalCandidates - liveScheduledCount)
    : 0;

  const fetchVacancies = useCallback(async () => {
    try {
      setVacanciesLoading(true);
      const jobs = await jobsApi.getJobs();
      const activeJobs = (jobs || []).filter((j) => j.status?.toLowerCase() !== 'deleted');
      setVacancies(activeJobs);
      if (activeJobs.length > 0) {
        setSelectedVacancyId((prev) => {
          if (initialJobVacancyId && activeJobs.some((v) => v.id === initialJobVacancyId)) {
            return initialJobVacancyId;
          }
          return prev && activeJobs.some((v) => v.id === prev) ? prev : activeJobs[0].id;
        });
      }
    } catch (err) {
      console.warn('Could not load company vacancies for AI scheduler:', err);
    } finally {
      setVacanciesLoading(false);
    }
  }, [initialJobVacancyId]);

  useEffect(() => {
    if (isOpen) {
      setAiSchedulerError(null);
      setScheduleProposal(null);
      setSelectedProposedSlotIds([]);
      setSlotConfigs({});
      setCommonMeetingLinkInput('');

      if (availableJobs && availableJobs.length > 0) {
        const activeJobs = availableJobs.filter((j) => j.status?.toLowerCase() !== 'deleted');
        setVacancies(activeJobs);
        if (initialJobVacancyId && activeJobs.some((v) => v.id === initialJobVacancyId)) {
          setSelectedVacancyId(initialJobVacancyId);
        } else if (activeJobs.length > 0) {
          setSelectedVacancyId((prev) => (prev && activeJobs.some((v) => v.id === prev) ? prev : activeJobs[0].id));
        }
      } else {
        fetchVacancies();
      }
    }
  }, [isOpen, availableJobs, initialJobVacancyId, fetchVacancies]);

  if (!isOpen) return null;

  const handleGenerateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacancyId) {
      setAiSchedulerError('Please select a job vacancy to schedule interviews for.');
      return;
    }

    try {
      setIsGeneratingSchedule(true);
      setAiSchedulerError(null);
      const proposal = await eventsApi.generateInterviewSchedule({
        jobVacancyId: selectedVacancyId,
        startDate: aiStartDate,
        endDate: aiEndDate,
        interviewDurationMinutes: aiDuration,
        parallelTracks: aiTracks,
        workingHoursStart: aiWorkStart,
        workingHoursEnd: aiWorkEnd,
        bufferMinutes: aiBuffer,
      });

      setScheduleProposal(proposal);
      setSelectedProposedSlotIds((proposal.proposedSlots || []).map((s) => s.slotId));

      const initialConfigs: Record<
        string,
        { meetingMode: 'Online' | 'Physical'; meetingLink: string; location: string }
      > = {};
      (proposal.proposedSlots || []).forEach((s) => {
        initialConfigs[s.slotId] = {
          meetingMode: 'Online',
          meetingLink: 'https://meet.google.com/interview-room',
          location: 'Online',
        };
      });
      setSlotConfigs(initialConfigs);

      if (proposal.proposedSlots.length === 0) {
        setAiSchedulerError(
          'No candidate interview slots could be generated. Ensure candidates are shortlisted or selected for interview for this role.'
        );
      }
    } catch (err: unknown) {
      console.error('Failed to generate interview schedule proposal:', err);
      const msg = err instanceof Error ? err.message : 'Failed to generate interview schedule with AI Agent.';
      setAiSchedulerError(msg);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleApplyCommonLinkToSelected = () => {
    const trimmed = commonMeetingLinkInput.trim();
    if (!trimmed) {
      setAiSchedulerError('Please enter a common meeting link to apply.');
      return;
    }
    if (selectedProposedSlotIds.length === 0) {
      setAiSchedulerError('Please select at least one candidate (tick the checkbox) to apply the common link.');
      return;
    }

    setAiSchedulerError(null);
    setSlotConfigs((prev) => {
      const next = { ...prev };
      selectedProposedSlotIds.forEach((slotId) => {
        next[slotId] = {
          ...(next[slotId] || {}),
          meetingMode: 'Online',
          meetingLink: trimmed,
          location: 'Online',
        };
      });
      return next;
    });
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleProposal || scheduleProposal.proposedSlots.length === 0) return;

    const confirmedSlots = scheduleProposal.proposedSlots.filter((s) =>
      selectedProposedSlotIds.includes(s.slotId)
    );

    if (confirmedSlots.length === 0) {
      setAiSchedulerError('Please select at least one interview slot (tick the checkbox) to approve and schedule.');
      return;
    }

    for (const s of confirmedSlots) {
      const cfg = slotConfigs[s.slotId] || {
        meetingMode: 'Online',
        meetingLink: 'https://meet.google.com/interview-room',
        location: 'Online',
      };
      if (cfg.meetingMode === 'Online' && !cfg.meetingLink.trim()) {
        setAiSchedulerError(`Please enter a meeting link URL for candidate ${s.candidateName}.`);
        return;
      }
      if (
        cfg.meetingMode === 'Physical' &&
        (!cfg.location.trim() || cfg.location.trim().toLowerCase() === 'online')
      ) {
        setAiSchedulerError(
          `Please enter a physical office venue or interview place for candidate ${s.candidateName}.`
        );
        return;
      }
    }

    try {
      setIsConfirmingSchedule(true);
      const payload: ConfirmInterviewScheduleDto = {
        jobVacancyId: scheduleProposal.jobVacancyId,
        jobTitle: scheduleProposal.jobTitle,
        slots: confirmedSlots.map((s) => {
          const cfg = slotConfigs[s.slotId] || {
            meetingMode: 'Online',
            meetingLink: 'https://meet.google.com/interview-room',
            location: 'Online',
          };
          const isOnline = cfg.meetingMode === 'Online';
          return {
            candidateId: s.candidateId,
            candidateName: s.candidateName,
            candidateEmail: s.candidateEmail,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            trackNumber: s.trackNumber,
            trackName: s.trackName,
            meetingMode: cfg.meetingMode,
            location: isOnline ? cfg.meetingLink.trim() : cfg.location.trim(),
          };
        }),
      };

      const result = await eventsApi.confirmInterviewSchedule(payload);
      if (onSuccess) {
        onSuccess(result.message || `Successfully scheduled ${result.scheduledCount} interviews!`);
      }
      onClose();
    } catch (err: unknown) {
      console.error('Failed to confirm interview schedule:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save confirmed interview schedule.';
      setAiSchedulerError(msg);
    } finally {
      setIsConfirmingSchedule(false);
    }
  };

  return (
    <div
      className="popup-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
        padding: '20px',
      }}
      onClick={() => !isGeneratingSchedule && !isConfirmingSchedule && onClose()}
    >
      <div
        className="popup-card"
        style={{
          maxWidth: scheduleProposal ? '1060px' : '580px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                color: '#6d28d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(109, 40, 217, 0.15)',
              }}
            >
              <Bot size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  AI Interview Slot Generator
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#f3e8ff',
                    color: '#7e22ce',
                    border: '1px solid #d8b4fe',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  Student 3 Agent
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0' }}>
                Meeting Orchestration • Automated clash-free scheduling with forward-search overflow
              </p>
            </div>
          </div>

          {!isGeneratingSchedule && !isConfirmingSchedule && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Error Banner */}
        {aiSchedulerError && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} />
            <span>{aiSchedulerError}</span>
          </div>
        )}

        {/* VIEW A: Configuration Form */}
        {!scheduleProposal && (
          <form onSubmit={handleGenerateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Vacancy Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Target Job Vacancy <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedVacancyId}
                onChange={(e) => setSelectedVacancyId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                {vacancies.length === 0 ? (
                  <option value="">No active job vacancies found</option>
                ) : (
                  vacancies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} — {v.department} ({v.experienceLevel})
                    </option>
                  ))
                )}
              </select>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '4px 0 0 2px' }}>
                The AI agent will fetch candidates in "Interview Selection" (or Shortlisted) for this requisition.
              </p>
            </div>

            {/* Date Window */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Start Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={aiStartDate}
                  onChange={(e) => setAiStartDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Target End Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={aiEndDate}
                  onChange={(e) => setAiEndDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Interview Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Interview Duration
              </label>
              <select
                value={aiDuration}
                onChange={(e) => setAiDuration(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            {/* Working Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Working Hours Start
                </label>
                <input
                  type="time"
                  value={aiWorkStart}
                  onChange={(e) => setAiWorkStart(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Working Hours End
                </label>
                <input
                  type="time"
                  value={aiWorkEnd}
                  onChange={(e) => setAiWorkEnd(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Info Card on Agent Intelligence */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '13px 16px',
                fontSize: '12.5px',
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#7c3aed" />
                <span>Multi-Agent Constraint Solving:</span>
              </div>
              The AI agent queries all company calendar events saved in the database to prevent clashes, prioritizes your selected interview dates, and automatically applies forward-search overflow (up to 14 days) if candidates exceed the target window.
            </div>

            {/* Form Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isGeneratingSchedule}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '13.5px',
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isGeneratingSchedule || vacancies.length === 0}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                }}
              >
                {isGeneratingSchedule ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>AI Agent Generating Proposal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Clash-Free Schedule</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* VIEW B: Proposal Review & Confirmation (Human-In-The-Loop) */}
        {scheduleProposal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Metric Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Candidates
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {scheduleProposal.summary.totalCandidates}
                </div>
              </div>

              <div
                style={{
                  background: liveScheduledCount > 0 ? '#ecfdf5' : '#f8fafc',
                  border: liveScheduledCount > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: liveScheduledCount > 0 ? '#047857' : '#64748b', textTransform: 'uppercase' }}>
                  Scheduled
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: liveScheduledCount > 0 ? '#065f46' : '#0f172a', marginTop: '2px' }}>
                  {liveScheduledCount}
                </div>
              </div>

              <div
                style={{
                  background: liveUnscheduledCount > 0 ? '#fef2f2' : '#f8fafc',
                  border: liveUnscheduledCount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: liveUnscheduledCount > 0 ? '#b91c1c' : '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Unscheduled
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: liveUnscheduledCount > 0 ? '#dc2626' : '#0f172a',
                    marginTop: '2px',
                  }}
                >
                  {liveUnscheduledCount}
                </div>
              </div>
            </div>

            {/* Forward-Search Notification Banner */}
            {scheduleProposal.summary.forwardDaysExtended > 0 && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Sparkles size={20} color="#b45309" />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                    Forward Search Overflow Extension:
                  </span>{' '}
                  <span style={{ fontSize: '12.5px', color: '#78350f' }}>
                    The AI agent automatically extended the schedule by {scheduleProposal.summary.forwardDaysExtended} day(s)
                    (effective window: {scheduleProposal.summary.effectiveDateRange}) to avoid clashes and schedule all candidates.
                  </span>
                </div>
              </div>
            )}

            {/* Unscheduled Candidate Alert */}
            {scheduleProposal.unscheduledCandidates.length > 0 && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertCircle size={18} color="#dc2626" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>
                    {scheduleProposal.unscheduledCandidates.length} Candidate(s) Exceeded Search Limit
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#b91c1c' }}>
                  {scheduleProposal.unscheduledCandidates.map((u) => (
                    <li key={u.candidateId}>
                      <strong>{u.candidateName}</strong> ({u.candidateEmail}): {u.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notice for Candidates Unselected by HR */}
            {scheduleProposal.proposedSlots.length > selectedProposedSlotIds.length && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  color: '#92400e',
                }}
              >
                <AlertCircle size={16} color="#b45309" />
                <span>
                  <strong>{scheduleProposal.proposedSlots.length - selectedProposedSlotIds.length} candidate(s)</strong> unselected by HR. Their status will remain &quot;Selected&quot; until scheduled in future runs.
                </span>
              </div>
            )}

            {/* AI Assumptions & Validation Box */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '12.5px',
                color: '#334155',
              }}
            >
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bot size={15} color="#6366f1" />
                <span>Agent Rationale & Stated Assumptions:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                {scheduleProposal.summary.assumptionsMade.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
                {scheduleProposal.summary.aiValidationNotes.map((n, i) => (
                  <li key={`v-${i}`} style={{ color: '#059669', fontWeight: 600 }}>{n}</li>
                ))}
              </ul>
            </div>

            {/* Proposed Slots Table */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {/* Left side: Bulk Apply Common Link */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '4px 8px',
                  }}
                >
                  <LinkIcon size={14} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Paste common meeting link here..."
                    value={commonMeetingLinkInput}
                    onChange={(e) => setCommonMeetingLinkInput(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '12.5px',
                      width: '240px',
                      color: '#0f172a',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCommonLinkToSelected}
                    title="Apply this common meeting link to all currently checked candidates"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669 0%, #00b074 100%)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                    }}
                  >
                    <Copy size={12} />
                    <span>Apply Same Link to Selected</span>
                  </button>
                </div>

                {/* Right side: Count & Selection info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                    Proposed Appointments ({scheduleProposal.proposedSlots.length})
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: selectedProposedSlotIds.length > 0 ? '#059669' : '#64748b',
                      background: selectedProposedSlotIds.length > 0 ? '#ecfdf5' : '#f1f5f9',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      border: selectedProposedSlotIds.length > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                    }}
                  >
                    Selected: {selectedProposedSlotIds.length} of {scheduleProposal.proposedSlots.length}
                  </div>
                </div>
              </div>

              <div
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', width: '38px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={
                            scheduleProposal.proposedSlots.length > 0 &&
                            selectedProposedSlotIds.length === scheduleProposal.proposedSlots.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProposedSlotIds(scheduleProposal.proposedSlots.map((s) => s.slotId));
                            } else {
                              setSelectedProposedSlotIds([]);
                            }
                          }}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#059669' }}
                          title="Select All / Deselect All"
                        />
                      </th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, minWidth: '150px' }}>Candidate</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, minWidth: '95px' }}>Date</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, minWidth: '110px' }}>Time Slot</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, minWidth: '120px' }}>Delivery Mode</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, minWidth: '170px' }}>Location</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, minWidth: '220px' }}>Meeting Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleProposal.proposedSlots.map((slot) => {
                      const isChecked = selectedProposedSlotIds.includes(slot.slotId);
                      const cfg = slotConfigs[slot.slotId] || {
                        meetingMode: 'Online',
                        meetingLink: 'https://meet.google.com/interview-room',
                        location: 'Online',
                      };
                      const isOnline = cfg.meetingMode === 'Online';

                      return (
                        <tr
                          key={slot.slotId}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: isChecked ? '#fafffc' : '#ffffff',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProposedSlotIds((prev) => [...prev, slot.slotId]);
                                } else {
                                  setSelectedProposedSlotIds((prev) => prev.filter((id) => id !== slot.slotId));
                                }
                              }}
                              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#059669' }}
                            />
                          </td>

                          {/* Candidate */}
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{slot.candidateName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{slot.candidateEmail}</div>
                          </td>

                          {/* Date */}
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                            {slot.date}
                          </td>

                          {/* Time Slot */}
                          <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {formatSingleTime(slot.startTime)} - {formatSingleTime(slot.endTime)}
                          </td>

                          {/* Delivery Mode Dropdown Selector */}
                          <td style={{ padding: '10px 14px' }}>
                            <select
                              value={cfg.meetingMode}
                              disabled={!isChecked}
                              onChange={(e) => {
                                const newMode = e.target.value as 'Online' | 'Physical';
                                setSlotConfigs((prev) => ({
                                  ...prev,
                                  [slot.slotId]: {
                                    ...prev[slot.slotId],
                                    meetingMode: newMode,
                                    location:
                                      newMode === 'Online'
                                        ? 'Online'
                                        : prev[slot.slotId]?.location && prev[slot.slotId]?.location !== 'Online'
                                        ? prev[slot.slotId].location
                                        : 'Skill-Hub HQ, 4th Floor, Boardroom 2, Colombo 03',
                                    meetingLink:
                                      newMode === 'Physical'
                                        ? 'Physical'
                                        : prev[slot.slotId]?.meetingLink && prev[slot.slotId]?.meetingLink !== 'Physical'
                                        ? prev[slot.slotId].meetingLink
                                        : 'https://meet.google.com/interview-room',
                                  },
                                }));
                              }}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '7px',
                                border: '1px solid #cbd5e1',
                                fontSize: '12px',
                                fontWeight: 650,
                                color: cfg.meetingMode === 'Online' ? '#0369a1' : '#b45309',
                                background: cfg.meetingMode === 'Online' ? '#e0f2fe' : '#fef3c7',
                                cursor: isChecked ? 'pointer' : 'not-allowed',
                                outline: 'none',
                              }}
                            >
                              <option value="Online">Online</option>
                              <option value="Physical">Physical</option>
                            </select>
                          </td>

                          {/* Location Column */}
                          <td style={{ padding: '10px 14px' }}>
                            {isOnline ? (
                              <input
                                type="text"
                                value="Online"
                                disabled
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                  fontSize: '12px',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  cursor: 'not-allowed',
                                  fontWeight: 600,
                                }}
                                title="Location is Online for virtual interviews"
                              />
                            ) : (
                              <input
                                type="text"
                                value={cfg.location}
                                disabled={!isChecked}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSlotConfigs((prev) => ({
                                    ...prev,
                                    [slot.slotId]: {
                                      ...prev[slot.slotId],
                                      location: val,
                                    },
                                  }));
                                }}
                                placeholder="e.g. Skill-Hub HQ, 4th Floor..."
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: isChecked ? '#ffffff' : '#f8fafc',
                                  color: '#0f172a',
                                  fontSize: '12px',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  outline: 'none',
                                }}
                              />
                            )}
                          </td>

                          {/* Meeting Link Column */}
                          <td style={{ padding: '10px 14px' }}>
                            {isOnline ? (
                              <input
                                type="text"
                                value={cfg.meetingLink}
                                disabled={!isChecked}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSlotConfigs((prev) => ({
                                    ...prev,
                                    [slot.slotId]: {
                                      ...prev[slot.slotId],
                                      meetingLink: val,
                                    },
                                  }));
                                }}
                                placeholder="https://meet.google.com/..."
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: isChecked ? '#ffffff' : '#f8fafc',
                                  color: '#0f172a',
                                  fontSize: '12px',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  outline: 'none',
                                }}
                              />
                            ) : (
                              <input
                                type="text"
                                value="Physical"
                                disabled
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                  fontSize: '12px',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  cursor: 'not-allowed',
                                  fontWeight: 600,
                                }}
                                title="Meeting link is not applicable for Physical in-person interviews"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Review Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setScheduleProposal(null)}
              disabled={isConfirmingSchedule}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              ← Modify Parameters
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isConfirmingSchedule}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSchedule}
                disabled={isConfirmingSchedule || selectedProposedSlotIds.length === 0}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #00b074 100%)',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: selectedProposedSlotIds.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedProposedSlotIds.length === 0 ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                }}
              >
                {isConfirmingSchedule ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Confirming & Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>
                      Approve &amp; Confirm {selectedProposedSlotIds.length} Interview Appointment
                      {selectedProposedSlotIds.length === 1 ? '' : 's'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
