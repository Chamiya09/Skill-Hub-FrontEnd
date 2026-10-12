import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  Link as LinkIcon,
  Copy,
  MapPin,
  CheckCircle2,
  CalendarCheck,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  type JobDto,
  eventsApi,
  jobsApi,
  assessmentsApi,
  type ScheduleProposalResponseDto,
  type ConfirmInterviewScheduleDto,
  type AlreadyScheduledCandidateDto,
} from '../services/api';
import './AiInterviewSchedulerModal.css';

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
  const [commonLocationInput, setCommonLocationInput] = useState<string>('');
  const [alreadyScheduledCandidates, setAlreadyScheduledCandidates] = useState<AlreadyScheduledCandidateDto[]>([]);
  const [isLoadingAlreadyScheduled, setIsLoadingAlreadyScheduled] = useState<boolean>(false);
  const [isAlreadyScheduledExpanded, setIsAlreadyScheduledExpanded] = useState<boolean>(true);
  const [isProposalAlreadyScheduledExpanded, setIsProposalAlreadyScheduledExpanded] = useState<boolean>(true);

  // Active list of already-scheduled candidates (combines fetched & proposal-detected candidates)
  const currentAlreadyScheduled =
    scheduleProposal?.alreadyScheduledCandidates && scheduleProposal.alreadyScheduledCandidates.length > 0
      ? scheduleProposal.alreadyScheduledCandidates
      : alreadyScheduledCandidates;
  const alreadyScheduledCount =
    scheduleProposal?.summary?.alreadyScheduledCount ?? currentAlreadyScheduled.length;

  // Live count derived from HR's manual checkbox selections
  const liveScheduledCount = selectedProposedSlotIds.length;
  const liveUnscheduledCount = scheduleProposal
    ? Math.max(0, scheduleProposal.summary.totalCandidates - liveScheduledCount)
    : 0;

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setAiSchedulerError(null);
      setScheduleProposal(null);
      setSelectedProposedSlotIds([]);
      setSlotConfigs({});
      setCommonMeetingLinkInput('');
      setAlreadyScheduledCandidates([]);

      if (availableJobs && availableJobs.length > 0) {
        const activeJobs = availableJobs.filter((j) => j.status?.toLowerCase() !== 'deleted');
        setVacancies(activeJobs);
        if (initialJobVacancyId && activeJobs.some((v) => v.id === initialJobVacancyId)) {
          setSelectedVacancyId(initialJobVacancyId);
        } else if (activeJobs.length > 0) {
          setSelectedVacancyId((prev) => (prev && activeJobs.some((v) => v.id === prev) ? prev : activeJobs[0].id));
        }
      }
    }
  }

  useEffect(() => {
    let ignore = false;
    if (isOpen && (!availableJobs || availableJobs.length === 0)) {
      jobsApi.getJobs()
        .then((jobs) => {
          if (ignore) return;
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
        })
        .catch((err) => {
          if (ignore) return;
          console.warn('Could not load company vacancies for AI scheduler:', err);
        })
        .finally(() => {
          if (!ignore) {
            setVacanciesLoading(false);
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [isOpen, availableJobs, initialJobVacancyId]);

  // Query already-scheduled candidates for the chosen job vacancy
  useEffect(() => {
    let ignore = false;
    if (isOpen && selectedVacancyId) {
      setIsLoadingAlreadyScheduled(true);
      assessmentsApi
        .getInterviewSelections(selectedVacancyId)
        .then((selections) => {
          if (ignore) return;
          const scheduled = (selections || [])
            .filter((s) =>
              Boolean(
                s.scheduledEventId ||
                s.scheduledDate ||
                s.status === 'Ready for Interview' ||
                s.status?.toLowerCase().includes('ready')
              )
            )
            .map((s) => ({
              candidateId: s.candidateId,
              candidateName: s.candidateName || 'Candidate',
              candidateEmail: s.candidateEmail || '',
              date: s.scheduledDate || '',
              timeSlot: s.scheduledTime || '',
              meetingMode: s.scheduledMeetingMode || 'Online',
              location: s.scheduledLocation || (s.scheduledMeetingMode === 'Physical' ? 'Company Office' : 'Online'),
              status: s.status || 'Ready for Interview',
            }));
          setAlreadyScheduledCandidates(scheduled);
        })
        .catch((err) => {
          if (ignore) return;
          console.warn('Could not load already-scheduled candidates for vacancy:', err);
          setAlreadyScheduledCandidates([]);
        })
        .finally(() => {
          if (!ignore) {
            setIsLoadingAlreadyScheduled(false);
          }
        });
    } else if (!isOpen) {
      setAlreadyScheduledCandidates([]);
      setIsLoadingAlreadyScheduled(false);
    }

    return () => {
      ignore = true;
    };
  }, [isOpen, selectedVacancyId]);

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
      if (proposal.alreadyScheduledCandidates && proposal.alreadyScheduledCandidates.length > 0) {
        setAlreadyScheduledCandidates((prev) => {
          const map = new Map<string, AlreadyScheduledCandidateDto>();
          (proposal.alreadyScheduledCandidates || []).forEach((c) => map.set(c.candidateId, c));
          prev.forEach((c) => {
            if (!map.has(c.candidateId)) map.set(c.candidateId, c);
          });
          return Array.from(map.values());
        });
      }
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
        const hasExisting =
          (proposal.alreadyScheduledCandidates && proposal.alreadyScheduledCandidates.length > 0) ||
          alreadyScheduledCandidates.length > 0;
        if (hasExisting) {
          setAiSchedulerError(
            `All candidates for this requisition already have confirmed interview dates. See the "Already Scheduled Candidates" list below.`
          );
        } else {
          setAiSchedulerError(
            'No candidate interview slots could be generated. Ensure candidates are shortlisted or selected for interview for this role.'
          );
        }
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

  const handleApplyCommonLocationToSelected = () => {
    const trimmed = commonLocationInput.trim();
    if (!trimmed) {
      setAiSchedulerError('Please enter a physical venue or office location to apply.');
      return;
    }
    if (selectedProposedSlotIds.length === 0) {
      setAiSchedulerError('Please select at least one candidate (tick the checkbox) to apply the physical location.');
      return;
    }

    setAiSchedulerError(null);
    setSlotConfigs((prev) => {
      const next = { ...prev };
      selectedProposedSlotIds.forEach((slotId) => {
        next[slotId] = {
          ...(next[slotId] || {}),
          meetingMode: 'Physical',
          location: trimmed,
          meetingLink: 'Physical',
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
      className="ai-scheduler-backdrop"
      onClick={() => !isGeneratingSchedule && !isConfirmingSchedule && onClose()}
    >
      <div
        className={`ai-scheduler-card ${scheduleProposal ? 'is-proposal-view' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="ai-scheduler-header">
          <div className="ai-scheduler-header-title">
            <div className="ai-scheduler-bot-icon">
              <Bot size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3>AI Interview Slot Generator</h3>
                <span className="ai-scheduler-tag">
                  <Sparkles size={11} />
                  AI Agent • Orchestration
                </span>
              </div>
              <p>
                Meeting Orchestration • Automated clash-free scheduling with forward-search overflow
              </p>
            </div>
          </div>

          {!isGeneratingSchedule && !isConfirmingSchedule && (
            <button
              type="button"
              className="ai-scheduler-close-btn"
              onClick={onClose}
              title="Close"
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
          <form onSubmit={handleGenerateSchedule} className="ai-scheduler-form">
            {/* Vacancy Selector */}
            <div className="ai-scheduler-field">
              <label>
                Target Job Vacancy <span className="req">*</span>
              </label>
              <select
                value={selectedVacancyId}
                onChange={(e) => setSelectedVacancyId(e.target.value)}
                required
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
              <p className="ai-scheduler-field-helper">
                The AI agent will fetch candidates in "Interview Selection" (or Shortlisted) for this requisition.
              </p>
            </div>

            {/* Already Scheduled Candidates Information Card (View A: Configuration) */}
            <div className="ai-already-scheduled-section">
              <div
                className="ai-already-scheduled-header"
                onClick={() => setIsAlreadyScheduledExpanded((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsAlreadyScheduledExpanded((prev) => !prev);
                  }
                }}
              >
                <div className="ai-already-header-left">
                  <div className="ai-already-icon-box">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <div className="ai-already-title">
                      Already Scheduled Candidates
                      <span className="ai-already-count-badge">
                        {alreadyScheduledCandidates.length} Scheduled
                      </span>
                    </div>
                    <p className="ai-already-subtitle">
                      {alreadyScheduledCandidates.length === 0
                        ? 'No candidates scheduled yet for this requisition'
                        : `${alreadyScheduledCandidates.length} candidate(s) currently have interview bookings`}
                    </p>
                  </div>
                </div>

                <div className="ai-already-header-right">
                  {isLoadingAlreadyScheduled ? (
                    <RefreshCw size={14} className="animate-spin text-emerald-600" />
                  ) : (
                    <button
                      type="button"
                      className="ai-already-toggle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAlreadyScheduledExpanded((prev) => !prev);
                      }}
                      title={isAlreadyScheduledExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isAlreadyScheduledExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {isAlreadyScheduledExpanded && (
                <div className="ai-already-content">
                  {isLoadingAlreadyScheduled ? (
                    <div className="ai-already-loading">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Checking calendar bookings for this vacancy...</span>
                    </div>
                  ) : alreadyScheduledCandidates.length === 0 ? (
                    <div className="ai-already-empty">
                      <CalendarCheck size={14} color="#059669" />
                      <span>
                        All shortlisted candidates are eligible for new slot assignment. Zero previous interview bookings found.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="ai-already-note">
                        <Sparkles size={13} color="#059669" />
                        <span>
                          The AI Scheduler automatically detects these existing appointments and avoids double-booking their calendar slots.
                        </span>
                      </div>
                      <div className="ai-already-table-wrap">
                        <table className="ai-already-table">
                          <thead>
                            <tr>
                              <th>Candidate</th>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Mode</th>
                              <th>Venue / Link</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {alreadyScheduledCandidates.map((c) => (
                              <tr key={c.candidateId}>
                                <td>
                                  <div className="c-name">{c.candidateName}</div>
                                  <div className="c-email">{c.candidateEmail}</div>
                                </td>
                                <td className="nowrap">{c.date || 'TBD'}</td>
                                <td className="nowrap time-cell">{c.timeSlot ? formatSingleTime(c.timeSlot) : 'TBD'}</td>
                                <td>
                                  <span className={`ai-mode-chip ${c.meetingMode?.toLowerCase() === 'physical' ? 'is-physical' : 'is-online'}`}>
                                    {c.meetingMode || 'Online'}
                                  </span>
                                </td>
                                <td>
                                  {c.meetingMode?.toLowerCase() === 'physical' ? (
                                    <span className="loc-text">{c.location || 'Company Office'}</span>
                                  ) : c.location && c.location.startsWith('http') ? (
                                    <a
                                      href={c.location}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="link-anchor"
                                      title="Open meeting link"
                                    >
                                      <LinkIcon size={12} />
                                      <span>Meeting Link</span>
                                    </a>
                                  ) : (
                                    <span className="loc-text">{c.location || 'Online Meet'}</span>
                                  )}
                                </td>
                                <td>
                                  <span className="ai-status-chip is-confirmed">
                                    <CheckCircle2 size={11} />
                                    <span>Confirmed</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Date Window */}
            <div className="ai-scheduler-grid-2">
              <div className="ai-scheduler-field">
                <label>
                  Start Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  value={aiStartDate}
                  onChange={(e) => setAiStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="ai-scheduler-field">
                <label>
                  Target End Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  value={aiEndDate}
                  onChange={(e) => setAiEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Interview Duration */}
            <div className="ai-scheduler-field">
              <label>Interview Duration</label>
              <select
                value={aiDuration}
                onChange={(e) => setAiDuration(Number(e.target.value))}
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            {/* Working Hours */}
            <div className="ai-scheduler-grid-2">
              <div className="ai-scheduler-field">
                <label>Working Hours Start</label>
                <input
                  type="time"
                  value={aiWorkStart}
                  onChange={(e) => setAiWorkStart(e.target.value)}
                />
              </div>

              <div className="ai-scheduler-field">
                <label>Working Hours End</label>
                <input
                  type="time"
                  value={aiWorkEnd}
                  onChange={(e) => setAiWorkEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Info Card on Agent Intelligence */}
            <div className="ai-scheduler-info-card">
              <div className="info-title">
                <Sparkles size={15} color="#059669" />
                <span>Multi-Agent Constraint Solving:</span>
              </div>
              The AI agent queries all company calendar events saved in the database to prevent clashes, prioritizes your selected interview dates, and automatically applies forward-search overflow (up to 14 days) if candidates exceed the target window.
            </div>

            {/* Form Buttons */}
            <div className="ai-scheduler-footer">
              <button
                type="button"
                className="ai-scheduler-btn-cancel"
                onClick={onClose}
                disabled={isGeneratingSchedule}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ai-scheduler-btn-submit"
                disabled={isGeneratingSchedule || vacancies.length === 0}
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
          <div className="ai-proposal-view">
            {/* Metric Summary Cards */}
            <div className="ai-proposal-metrics ai-proposal-metrics-4">
              <div className="ai-proposal-metric-card card-total">
                <span>Candidates</span>
                <strong>{scheduleProposal.summary.totalCandidates}</strong>
              </div>

              <div className="ai-proposal-metric-card card-already-scheduled">
                <span>Already Scheduled</span>
                <strong>{alreadyScheduledCount}</strong>
              </div>

              <div className="ai-proposal-metric-card card-scheduled">
                <span>Proposed Slots</span>
                <strong>{liveScheduledCount}</strong>
              </div>

              <div className="ai-proposal-metric-card card-unscheduled">
                <span>Unscheduled</span>
                <strong>{liveUnscheduledCount}</strong>
              </div>
            </div>

            {/* Forward-Search Notification Banner */}
            {scheduleProposal.summary.forwardDaysExtended > 0 && (
              <div className="ai-proposal-banner-overflow">
                <Sparkles size={20} color="#b45309" />
                <div>
                  <span className="overflow-title">
                    Forward Search Overflow Extension:
                  </span>{' '}
                  <span className="overflow-desc">
                    The AI agent automatically extended the schedule by {scheduleProposal.summary.forwardDaysExtended} day(s)
                    (effective window: {scheduleProposal.summary.effectiveDateRange}) to avoid clashes and schedule all candidates.
                  </span>
                </div>
              </div>
            )}

            {/* Already Scheduled Candidates Panel (View B: Review & Protection) */}
            {currentAlreadyScheduled.length > 0 && (
              <div className="ai-already-scheduled-section is-proposal-card">
                <div
                  className="ai-already-scheduled-header"
                  onClick={() => setIsProposalAlreadyScheduledExpanded((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsProposalAlreadyScheduledExpanded((prev) => !prev);
                    }
                  }}
                >
                  <div className="ai-already-header-left">
                    <div className="ai-already-icon-box">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <div className="ai-already-title">
                        Already Scheduled Candidates
                        <span className="ai-already-count-badge">
                          {currentAlreadyScheduled.length} Confirmed
                        </span>
                        <span className="ai-already-shield-badge">
                          <CheckCircle2 size={11} />
                          No Action Required
                        </span>
                      </div>
                      <p className="ai-already-subtitle">
                        These candidates already have confirmed interview dates and were preserved without conflict
                      </p>
                    </div>
                  </div>

                  <div className="ai-already-header-right">
                    <button
                      type="button"
                      className="ai-already-toggle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProposalAlreadyScheduledExpanded((prev) => !prev);
                      }}
                      title={isProposalAlreadyScheduledExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isProposalAlreadyScheduledExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isProposalAlreadyScheduledExpanded && (
                  <div className="ai-already-content">
                    <div className="ai-already-note">
                      <Bot size={14} color="#059669" />
                      <span>
                        The AI Agent safely protected these existing appointments. They are excluded from the approval list below so they won't be overwritten.
                      </span>
                    </div>

                    <div className="ai-already-table-wrap">
                      <table className="ai-already-table">
                        <thead>
                          <tr>
                            <th>Candidate</th>
                            <th>Interview Date</th>
                            <th>Time Slot</th>
                            <th>Delivery Mode</th>
                            <th>Venue / Meeting Link</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentAlreadyScheduled.map((c) => (
                            <tr key={c.candidateId}>
                              <td>
                                <div className="c-name">{c.candidateName}</div>
                                <div className="c-email">{c.candidateEmail}</div>
                              </td>
                              <td className="nowrap font-medium">{c.date || 'TBD'}</td>
                              <td className="nowrap time-cell">{c.timeSlot ? formatSingleTime(c.timeSlot) : 'TBD'}</td>
                              <td>
                                <span className={`ai-mode-chip ${c.meetingMode?.toLowerCase() === 'physical' ? 'is-physical' : 'is-online'}`}>
                                  {c.meetingMode || 'Online'}
                                </span>
                              </td>
                              <td>
                                {c.meetingMode?.toLowerCase() === 'physical' ? (
                                  <span className="loc-text">{c.location || 'Company Office'}</span>
                                ) : c.location && c.location.startsWith('http') ? (
                                  <a
                                    href={c.location}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="link-anchor"
                                    title="Open meeting link"
                                  >
                                    <LinkIcon size={12} />
                                    <span>Meeting Link</span>
                                  </a>
                                ) : (
                                  <span className="loc-text">{c.location || 'Online Meet'}</span>
                                )}
                              </td>
                              <td>
                                <span className="ai-status-chip is-confirmed">
                                  <CheckCircle2 size={11} />
                                  <span>Confirmed</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
            <div className="ai-proposal-rationale">
              <div className="rationale-header">
                <Bot size={16} color="#059669" />
                <span>Agent Rationale & Stated Assumptions:</span>
              </div>
              <ul>
                {scheduleProposal.summary.assumptionsMade.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
                {scheduleProposal.summary.aiValidationNotes.map((n, i) => (
                  <li key={`v-${i}`} className="validation-note">{n}</li>
                ))}
              </ul>
            </div>

            {/* Proposed Slots Table */}
            <div>
              <div className="ai-proposal-toolbar" style={{ marginBottom: '12px' }}>
                {/* Left side: Bulk Apply Tools (Link & Location) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Bulk Apply Common Link */}
                  <div className="ai-proposal-bulk-group">
                    <LinkIcon size={14} color="#059669" />
                    <input
                      type="text"
                      placeholder="Paste common meeting link here..."
                      value={commonMeetingLinkInput}
                      onChange={(e) => setCommonMeetingLinkInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="ai-proposal-bulk-btn-link"
                      onClick={handleApplyCommonLinkToSelected}
                      title="Apply this common meeting link to all currently checked candidates"
                    >
                      <Copy size={12} />
                      <span>Apply Same Link to Selected</span>
                    </button>
                  </div>

                  {/* Bulk Apply Common Location */}
                  <div className="ai-proposal-bulk-group">
                    <MapPin size={14} color="#0f766e" />
                    <input
                      type="text"
                      placeholder="Enter common venue / location..."
                      value={commonLocationInput}
                      onChange={(e) => setCommonLocationInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="ai-proposal-bulk-btn-loc"
                      onClick={handleApplyCommonLocationToSelected}
                      title="Apply this common interview venue/location to all currently checked candidates"
                    >
                      <MapPin size={12} />
                      <span>Apply Same Location to Selected</span>
                    </button>
                  </div>
                </div>

                {/* Right side: Count & Selection info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                    Proposed New Appointments ({scheduleProposal.proposedSlots.length})
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

              <div className="ai-slots-table-shell">
                <table className="ai-slots-table">
                  <thead>
                    <tr>
                      <th style={{ width: '38px', textAlign: 'center' }}>
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
                      <th style={{ minWidth: '150px' }}>Candidate</th>
                      <th style={{ minWidth: '95px' }}>Date</th>
                      <th style={{ minWidth: '110px' }}>Time Slot</th>
                      <th style={{ minWidth: '120px' }}>Delivery Mode</th>
                      <th style={{ minWidth: '170px' }}>Location</th>
                      <th style={{ minWidth: '220px' }}>Meeting Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleProposal.proposedSlots.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b' }}>
                          <CheckCircle2 size={24} color="#059669" style={{ margin: '0 auto 8px' }} />
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            All candidates for this vacancy already have scheduled interviews.
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>
                            Zero pending candidates require new interview slots.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      scheduleProposal.proposedSlots.map((slot) => {
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
                          className={isChecked ? 'is-selected' : ''}
                        >
                          {/* Checkbox */}
                          <td style={{ textAlign: 'center' }}>
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
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{slot.candidateName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{slot.candidateEmail}</div>
                          </td>

                          {/* Date */}
                          <td style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                            {slot.date}
                          </td>

                          {/* Time Slot */}
                          <td style={{ color: '#059669', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {formatSingleTime(slot.startTime)} - {formatSingleTime(slot.endTime)}
                          </td>

                          {/* Delivery Mode Dropdown Selector */}
                          <td>
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
                              className={`ai-slots-mode-select ${cfg.meetingMode === 'Online' ? 'is-online' : 'is-physical'}`}
                              style={{
                                cursor: isChecked ? 'pointer' : 'not-allowed',
                              }}
                            >
                              <option value="Online">Online</option>
                              <option value="Physical">Physical</option>
                            </select>
                          </td>

                          {/* Location Column */}
                          <td>
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
                          <td>
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
                                value="Physical Venue"
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
                    }))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Review Action Buttons */}
            <div className="ai-proposal-footer">
              <button
                type="button"
                className="ai-scheduler-btn-cancel"
                onClick={() => setScheduleProposal(null)}
                disabled={isConfirmingSchedule}
              >
                ← Modify Parameters
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="ai-scheduler-btn-cancel"
                  onClick={onClose}
                  disabled={isConfirmingSchedule}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="ai-proposal-btn-confirm"
                  onClick={handleConfirmSchedule}
                  disabled={isConfirmingSchedule || selectedProposedSlotIds.length === 0}
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
