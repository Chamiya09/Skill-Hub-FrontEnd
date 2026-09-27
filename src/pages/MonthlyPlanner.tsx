import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  User,
  Sparkles,
  CalendarDays,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Pencil,
  Globe,
  Building2,
  Briefcase,
  Search,
  RotateCcw,
} from 'lucide-react';
import {
  eventsApi,
  type EventResponseDto,
  type CreateEventPayload,
  jobsApi,
  type JobDto,
} from '../services/api';
import {
  googleCalendarService,
  type GoogleCalendarHoliday,
  HOLIDAY_CALENDARS,
  DEFAULT_HOLIDAY_CALENDAR,
} from '../services/googleCalendarService';
import { AiInterviewSchedulerModal } from '../components/AiInterviewSchedulerModal';
import './MonthlyPlannerFull.css';

// Days of week header
const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Format helpers
const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

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

const formatTimeDisplay = (timeStr: string): string => {
  if (!timeStr) return '';
  if (timeStr.includes(' - ')) {
    const [start, end] = timeStr.split(' - ');
    return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
  }
  if (timeStr.includes(' to ')) {
    const [start, end] = timeStr.split(' to ');
    return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
  }
  if (timeStr.includes('-')) {
    const [start, end] = timeStr.split('-');
    return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
  }
  return formatSingleTime(timeStr);
};

const calculateDurationText = (start: string, end: string): string | null => {
  if (!start || !end) return null;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return null;
  const startMins = sH * 60 + (sM || 0);
  const endMins = eH * 60 + (eM || 0);
  const diff = endMins - startMins;
  if (diff <= 0) return null;
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
  if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${mins} mins`;
};

export const MonthlyPlanner: React.FC = () => {
  // Current visible month navigation
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Selected date for detail view (defaults to today's date formatted as "YYYY-MM-DD")
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatDateOnlyString(new Date()));

  // Events state
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Add Event Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalDescription, setModalDescription] = useState<string>('');
  const [modalDate, setModalDate] = useState<string>(() => formatDateOnlyString(new Date()));
  const [modalStartTime, setModalStartTime] = useState<string>('09:00');
  const [modalEndTime, setModalEndTime] = useState<string>('10:00');
  const [modalDepartment, setModalDepartment] = useState<string>('');
  const [modalJobVacancyId, setModalJobVacancyId] = useState<string>('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Department & Requisition Filter State (matching Job Vacancies System UI)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [activeDepartments, setActiveDepartments] = useState<string[]>([]);
  const [, setDepartmentsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('All');
  const [eventTypeFilter, setEventTypeFilter] = useState<'All' | 'Interviews' | 'General' | 'Holidays'>('All');
  const [isAiInterviewSchedulerModalOpen, setIsAiInterviewSchedulerModalOpen] = useState<boolean>(false);

  // Company vacancies for event assignment
  const [vacancies, setVacancies] = useState<JobDto[]>([]);
  const [, setVacanciesLoading] = useState<boolean>(false);

  const fetchVacancies = useCallback(async () => {
    try {
      setVacanciesLoading(true);
      const jobs = await jobsApi.getJobs();
      const activeJobs = (jobs || []).filter((j) => j.status?.toLowerCase() !== 'deleted');
      setVacancies(activeJobs);
    } catch (err) {
      console.warn('Could not load company vacancies:', err);
    } finally {
      setVacanciesLoading(false);
    }
  }, []);

  const fetchActiveDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true);
      const depts = await eventsApi.getActiveDepartments();
      setActiveDepartments(depts || []);
    } catch (err) {
      console.error('Failed to load active departments for Monthly Planner:', err);
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActiveDepartments();
    fetchVacancies();
  }, [fetchActiveDepartments, fetchVacancies]);

  // Filter vacancies matching the active or modal department
  const departmentVacancies = useMemo(() => {
    const targetDept = modalDepartment || selectedDepartment;
    if (!targetDept) return vacancies;
    return vacancies.filter(
      (v) => v.department?.toLowerCase() === targetDept.toLowerCase()
    );
  }, [vacancies, modalDepartment, selectedDepartment]);

  // Load events from backend (filtered by selected department or across all vacancies if none selected)
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const params: { year: number; month: number; department?: string } = {
        year,
        month,
      };
      if (selectedDepartment) {
        params.department = selectedDepartment;
      }
      const data = await eventsApi.getEvents(params);
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setErrorMessage('Could not load events from database. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedDepartment]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Google Calendar & National Holidays State (Powered by ASP.NET Core Backend)
  const [holidays, setHolidays] = useState<GoogleCalendarHoliday[]>([]);
  const [, setHolidaysLoading] = useState<boolean>(false);
  const [holidaysError, setHolidaysError] = useState<string | null>(null);
  const [holidaysEnabled, setHolidaysEnabled] = useState<boolean>(() => googleCalendarService.isEnabled());
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(() => googleCalendarService.getSelectedCalendarId());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [settingsCalendarIdInput, setSettingsCalendarIdInput] = useState<string>(() => googleCalendarService.getSelectedCalendarId());

  // Load holidays from backend
  const fetchHolidays = useCallback(async () => {
    if (!holidaysEnabled) {
      setHolidays([]);
      setHolidaysError(null);
      return;
    }

    try {
      setHolidaysLoading(true);
      setHolidaysError(null);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await googleCalendarService.fetchHolidays({
        year,
        month,
        calendarId: selectedCalendarId,
      });
      setHolidays(data || []);
    } catch (err: unknown) {
      console.warn('Failed to load national holidays:', err);
      const msg = err instanceof Error ? err.message : 'Failed to fetch national holidays from server.';
      setHolidaysError(msg);
      setHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  }, [currentDate, selectedCalendarId, holidaysEnabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHolidays();
  }, [fetchHolidays]);

  // Group holidays by date string "YYYY-MM-DD"
  const holidaysByDate = useMemo(() => {
    const map = new Map<string, GoogleCalendarHoliday[]>();
    if (!holidaysEnabled) return map;
    for (const h of holidays) {
      const list = map.get(h.date) || [];
      list.push(h);
      map.set(h.date, list);
    }
    return map;
  }, [holidays, holidaysEnabled]);

  // Holidays on the currently selected date
  const selectedDayHolidays = useMemo(() => {
    return holidaysByDate.get(selectedDateStr) || [];
  }, [holidaysByDate, selectedDateStr]);

  const handleOpenSettingsModal = () => {
    setSettingsCalendarIdInput(selectedCalendarId);
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    googleCalendarService.setSelectedCalendarId(settingsCalendarIdInput);
    setSelectedCalendarId(settingsCalendarIdInput);
    googleCalendarService.clearCache();
    fetchHolidays();
    setIsSettingsModalOpen(false);
    showToast('Holiday region updated. Syncing national holidays...', 'success');
  };

  const handleToggleHolidays = () => {
    const nextVal = !holidaysEnabled;
    setHolidaysEnabled(nextVal);
    googleCalendarService.setEnabled(nextVal);
    if (!nextVal) {
      showToast('National holidays hidden from calendar.', 'success');
    } else {
      showToast('National holidays enabled.', 'success');
    }
  };

  const currentCalendarOption = useMemo(() => {
    return (
      HOLIDAY_CALENDARS.find(
        (c) =>
          c.code.toLowerCase() === selectedCalendarId.toLowerCase() ||
          c.id.toLowerCase() === selectedCalendarId.toLowerCase()
      ) || DEFAULT_HOLIDAY_CALENDAR
    );
  }, [selectedCalendarId]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(formatDateOnlyString(today));
  };

  // Check if an event is an interview / evaluation
  const isInterviewEvent = useCallback((ev: EventResponseDto) => {
    return (
      Boolean(ev.jobVacancyId) ||
      /interview|assessment|screening|technical|candidate|round/i.test(ev.title) ||
      /interview|assessment|screening|technical|candidate|round/i.test(ev.description || '')
    );
  }, []);

  const interviewCount = useMemo(() => {
    return events.filter(isInterviewEvent).length;
  }, [events, isInterviewEvent]);

  const generalCount = useMemo(() => {
    return Math.max(0, events.length - interviewCount);
  }, [events.length, interviewCount]);

  // Filtered Events according to Search Query, Vacancy, and Type Tabs
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = ev.title?.toLowerCase().includes(q);
        const matchesDesc = ev.description?.toLowerCase().includes(q);
        const matchesDept = ev.department?.toLowerCase().includes(q);
        const matchesTime = ev.eventTime?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesDept && !matchesTime) {
          return false;
        }
      }
      if (selectedVacancyId && selectedVacancyId !== 'All') {
        if (ev.jobVacancyId !== selectedVacancyId) {
          return false;
        }
      }
      if (eventTypeFilter === 'Interviews') {
        if (!isInterviewEvent(ev)) return false;
      } else if (eventTypeFilter === 'General') {
        if (isInterviewEvent(ev)) return false;
      } else if (eventTypeFilter === 'Holidays') {
        return false;
      }
      return true;
    });
  }, [events, searchQuery, selectedVacancyId, eventTypeFilter, isInterviewEvent]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedDepartment ||
    (selectedVacancyId && selectedVacancyId !== 'All') ||
    eventTypeFilter !== 'All'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('');
    setSelectedVacancyId('All');
    setEventTypeFilter('All');
  };

  // Group events by date string "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventResponseDto[]>();
    for (const ev of filteredEvents) {
      const list = map.get(ev.eventDate) || [];
      list.push(ev);
      map.set(ev.eventDate, list);
    }
    return map;
  }, [filteredEvents]);

  // Events on the currently selected date
  const selectedDayEvents = useMemo(() => {
    return eventsByDate.get(selectedDateStr) || [];
  }, [eventsByDate, selectedDateStr]);

  // Calendar matrix calculation for current month view
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday...

    // Total days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = formatDateOnlyString(new Date());

    // Leading days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = formatDateOnlyString(prevDate);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(year, month, d);
      const dateStr = formatDateOnlyString(currDate);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Trailing days to fill 35 or 42 grid cells (5 or 6 complete weeks)
    const totalCellsNeeded = cells.length <= 35 ? 35 : 42;
    const remaining = totalCellsNeeded - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = formatDateOnlyString(nextDate);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [currentDate]);

  // Open modal handler for adding new event
  const handleOpenAddEventModal = (targetDateStr?: string) => {
    setEditingEventId(null);
    setModalTitle('');
    setModalDescription('');
    setModalDate(targetDateStr || selectedDateStr || formatDateOnlyString(new Date()));
    setModalStartTime('09:00');
    setModalEndTime('10:00');
    setModalDepartment(selectedDepartment || (activeDepartments.length > 0 ? activeDepartments[0] : ''));
    setModalJobVacancyId('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal handler for editing existing event
  const handleOpenEditEventModal = (ev: EventResponseDto) => {
    setEditingEventId(ev.id);
    setModalTitle(ev.title);
    setModalDescription(ev.description || '');
    setModalDate(ev.eventDate);
    setModalDepartment(ev.department || selectedDepartment || '');
    setModalJobVacancyId(ev.jobVacancyId || '');

    if (ev.eventTime && ev.eventTime.includes(' - ')) {
      const [start, end] = ev.eventTime.split(' - ');
      setModalStartTime(start.trim());
      setModalEndTime(end.trim());
    } else if (ev.eventTime && ev.eventTime.includes(' to ')) {
      const [start, end] = ev.eventTime.split(' to ');
      setModalStartTime(start.trim());
      setModalEndTime(end.trim());
    } else {
      setModalStartTime(ev.eventTime || '09:00');
      setModalEndTime('10:00');
    }

    setFormError(null);
    setIsModalOpen(true);
  };

  // Helper when user changes start time: auto-adjust end time to maintain positive duration
  const handleStartTimeChange = (newStart: string) => {
    setModalStartTime(newStart);
    if (newStart && modalEndTime) {
      const [sH, sM] = newStart.split(':').map(Number);
      const [eH, eM] = modalEndTime.split(':').map(Number);
      if (!isNaN(sH) && !isNaN(eH)) {
        if (sH * 60 + (sM || 0) >= eH * 60 + (eM || 0)) {
          const nextH = Math.min(sH + 1, 23);
          const nextTime = `${String(nextH).padStart(2, '0')}:${String(sM || 0).padStart(2, '0')}`;
          setModalEndTime(nextTime);
        }
      }
    }
  };

  // Submit Add / Edit Event form
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      setFormError('Please enter an event title.');
      return;
    }
    if (!modalDate) {
      setFormError('Please select a date for the event.');
      return;
    }
    if (!modalStartTime) {
      setFormError('Please select a start time.');
      return;
    }
    if (!modalEndTime) {
      setFormError('Please select an end time.');
      return;
    }
    if (modalStartTime >= modalEndTime) {
      setFormError('End time must be after start time (e.g., 9:00 AM to 10:00 AM).');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const payload: CreateEventPayload = {
        title: modalTitle.trim(),
        description: modalDescription.trim() || undefined,
        eventDate: modalDate,
        eventTime: `${modalStartTime} - ${modalEndTime}`,
        department: modalDepartment || selectedDepartment || undefined,
        jobVacancyId: modalJobVacancyId || undefined,
      };

      let targetDate = modalDate;

      if (editingEventId) {
        const updated = await eventsApi.update(editingEventId, payload);
        targetDate = updated.eventDate;
        setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
        setSelectedDateStr(updated.eventDate);
        showToast(`Event "${updated.title}" updated successfully!`, 'success');
      } else {
        const created = await eventsApi.create(payload);
        targetDate = created.eventDate;
        setEvents((prev) => [...prev, created]);
        setSelectedDateStr(created.eventDate);
        showToast(`Event "${created.title}" scheduled successfully!`, 'success');
      }

      // If the event belongs to another month, navigate to it
      const eventDateObj = new Date(targetDate + 'T00:00:00');
      if (
        eventDateObj.getFullYear() !== currentDate.getFullYear() ||
        eventDateObj.getMonth() !== currentDate.getMonth()
      ) {
        setCurrentDate(new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), 1));
      }

      setIsModalOpen(false);
      setEditingEventId(null);
      await fetchEvents();
    } catch (err: unknown) {
      console.error('Failed to save event:', err);
      const errorObj = err as { message?: string };
      setFormError(errorObj?.message || 'Failed to save event to database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete event handler
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"? This will permanently remove it from the schedule.`)) {
      return;
    }

    try {
      await eventsApi.delete(eventId);
      // Remove from state — if this was the last event on that date, the highlight disappears immediately
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      showToast(`Event "${eventTitle}" removed from schedule.`, 'success');
    } catch (err) {
      console.error('Failed to delete event:', err);
      showToast('Failed to delete event from database.', 'error');
    }
  };

  // Selected date parsed as object for display
  const selectedDateObj = useMemo(() => {
    return new Date(selectedDateStr + 'T00:00:00');
  }, [selectedDateStr]);

  return (
    <div className="monthly-planner-page">
      {/* Toast Alert Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: toast.type === 'success' ? '#065f46' : '#991b1b',
            color: '#ffffff',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* =========================================================
          1. TOP COMPONENT: PLANNER DASHBOARD CARD
          (Matches Job Vacancies & Candidate Assessments Design System)
          ========================================================= */}
      <section className="planner-dashboard-card" aria-labelledby="planner-dashboard-title">
        <div className="planner-dashboard-header">
          <div>
            <span className="planner-dashboard-eyebrow">Corporate calendar & schedule</span>
            <h2 id="planner-dashboard-title">Monthly Planner Dashboard</h2>
            <p>Coordinate technical interviews, candidate evaluations, company events, and recruitment milestones with real-time monthly scheduling and Google Calendar holidays.</p>
          </div>
          <div className="planner-dashboard-header-actions">
            <span className="planner-dashboard-live">
              <span /> Live calendar
            </span>
            <button
              type="button"
              className="btn-primary planner-create-btn"
              onClick={() => handleOpenAddEventModal(selectedDateStr)}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Event</span>
            </button>
            <button
              type="button"
              className="planner-btn-ai"
              onClick={() => setIsAiInterviewSchedulerModalOpen(true)}
              title="AI Meeting Orchestration & Automatic Slot Generator"
            >
              <Sparkles size={16} />
              <span>AI Auto-Scheduler</span>
            </button>
          </div>
        </div>

        <div className="planner-summary-grid">
          <article className="planner-summary-card summary-total">
            <div className="summary-icon"><CalendarDays size={22} /></div>
            <div>
              <span>Total events</span>
              <strong>{events.length}</strong>
              <small>{currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} schedule</small>
            </div>
          </article>
          <article className="planner-summary-card summary-active">
            <div className="summary-icon"><Sparkles size={22} /></div>
            <div>
              <span>Interviews & Pipeline</span>
              <strong>{interviewCount}</strong>
              <small>Technical evaluations</small>
            </div>
          </article>
          <article className="planner-summary-card summary-holidays">
            <div className="summary-icon"><Globe size={22} /></div>
            <div>
              <span>{currentCalendarOption.code} Holidays</span>
              <strong>{holidaysEnabled ? holidays.length : 0}</strong>
              <small>{holidaysEnabled ? `${currentCalendarOption.country} synced` : 'Sync disabled'}</small>
            </div>
          </article>
          <article className="planner-summary-card summary-depts">
            <div className="summary-icon"><Building2 size={22} /></div>
            <div>
              <span>Active departments</span>
              <strong>{activeDepartments.length}</strong>
              <small>{vacancies.length} job requisitions</small>
            </div>
          </article>
        </div>
      </section>

      {/* Error state */}
      {errorMessage && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '12px 18px',
            borderRadius: '12px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchEvents}
            style={{
              background: 'none',
              border: 'none',
              color: '#b91c1c',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Holidays Error / Warning Banner */}
      {holidaysEnabled && holidaysError && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="#b45309" />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                National Holidays Notice:
              </span>{' '}
              <span style={{ fontSize: '12.5px', color: '#78350f' }}>
                {holidaysError}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchHolidays}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#b45309',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* =========================================================
          2. FILTER & SEARCH TOOLBAR PANEL
          (Directly matches Job Vacancies Filter Panel UI)
          ========================================================= */}
      <section className="planner-filter-panel" aria-label="Planner filters and controls">
        <div className="planner-filter-heading">
          <div>
            <span className="filter-eyebrow">Schedule workspace</span>
            <h2>Filter & Navigate Calendar</h2>
          </div>
          <div className="planner-filter-heading-meta">
            <span className="filter-result-count">
              {filteredEvents.length} of {events.length} events shown
            </span>
            {holidaysEnabled && (
              <span className="filter-holiday-count">
                {currentCalendarOption.flag} {holidays.length} holidays
              </span>
            )}
          </div>
        </div>

        {/* Row 1: Category / Status Tabs + Integrated Month Navigation */}
        <div className="planner-toolbar">
          <div className="planner-tabs">
            <button
              type="button"
              className={`tab-btn ${eventTypeFilter === 'All' ? 'active' : ''}`}
              onClick={() => setEventTypeFilter('All')}
            >
              All Events ({events.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${eventTypeFilter === 'Interviews' ? 'active' : ''}`}
              onClick={() => setEventTypeFilter('Interviews')}
            >
              Interviews ({interviewCount})
            </button>
            <button
              type="button"
              className={`tab-btn ${eventTypeFilter === 'General' ? 'active' : ''}`}
              onClick={() => setEventTypeFilter('General')}
            >
              General / Meetings ({generalCount})
            </button>
            <button
              type="button"
              className={`tab-btn ${eventTypeFilter === 'Holidays' ? 'active' : ''}`}
              onClick={() => setEventTypeFilter('Holidays')}
            >
              {currentCalendarOption.flag} Holidays ({holidays.length})
            </button>
          </div>

          {/* Month Navigation Controls */}
          <div className="planner-nav-group">
            <button
              type="button"
              onClick={handleToday}
              className="planner-nav-today-btn"
            >
              Today
            </button>
            <div className="planner-nav-arrows">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="planner-nav-arrow-btn"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="planner-nav-arrow-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="planner-month-display">
              <CalendarIcon size={16} />
              <span>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Search Input, Department Select, Job Vacancy Select, Holiday Toggle & Reset */}
        <div className="planner-controls-row">
          {/* Search Box */}
          <div className="planner-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by event title, candidate, notes, or time..."
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
                <X size={14} />
              </button>
            )}
          </div>

          {/* Department Select */}
          <div className="planner-select-group">
            <label htmlFor="planner-dept-filter">Department</label>
            <select
              id="planner-dept-filter"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments ({activeDepartments.length} Active)</option>
              {activeDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Linked Vacancy Select */}
          <div className="planner-select-group">
            <label htmlFor="planner-vacancy-filter">Job Vacancy</label>
            <select
              id="planner-vacancy-filter"
              value={selectedVacancyId}
              onChange={(e) => setSelectedVacancyId(e.target.value)}
            >
              <option value="All">All Vacancies ({vacancies.length})</option>
              {vacancies.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} ({v.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* National Holidays Sync Toggle & Region Selector */}
          <div className="planner-holiday-actions">
            <button
              type="button"
              onClick={handleToggleHolidays}
              className={`planner-holiday-toggle-btn ${holidaysEnabled ? 'is-active' : ''}`}
              title={holidaysEnabled ? 'Click to hide national holidays' : 'Click to show national holidays'}
            >
              <span>{currentCalendarOption.flag}</span>
              <span>{currentCalendarOption.country}</span>
              <span className="holiday-status-pill">
                {holidaysEnabled ? `${holidays.length} Synced` : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenSettingsModal}
              className="planner-holiday-region-btn"
              title="Select National Holiday Country / Region"
            >
              <Globe size={14} />
              <span>Region</span>
            </button>
          </div>

          {/* Reset / Clear All Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="planner-clear-filters-btn"
              onClick={handleResetFilters}
              title="Reset all search queries and filters"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Row 3: Active Filter Chips */}
        {hasActiveFilters && (
          <div className="planner-active-chips">
            <span className="chips-label">Active filters:</span>
            {searchQuery && (
              <span className="planner-chip">
                <span>Search: "{searchQuery}"</span>
                <button type="button" onClick={() => setSearchQuery('')} title="Remove search filter">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedDepartment && (
              <span className="planner-chip">
                <span>Dept: {selectedDepartment}</span>
                <button type="button" onClick={() => setSelectedDepartment('')} title="Remove department filter">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedVacancyId && selectedVacancyId !== 'All' && (
              <span className="planner-chip">
                <span>
                  Vacancy:{' '}
                  {vacancies.find((v) => v.id === selectedVacancyId)?.title || selectedVacancyId}
                </span>
                <button type="button" onClick={() => setSelectedVacancyId('All')} title="Remove vacancy filter">
                  <X size={12} />
                </button>
              </span>
            )}
            {eventTypeFilter !== 'All' && (
              <span className="planner-chip">
                <span>Category: {eventTypeFilter}</span>
                <button type="button" onClick={() => setEventTypeFilter('All')} title="Reset category tab">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* 4. Main Two-Column Layout (Calendar & Daily Schedule aligned at the exact same top level) */}
      <div
        className="monthly-planner-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2.4fr) minmax(360px, 1fr)',
          gap: '22px',
          alignItems: 'start',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT COLUMN: Calendar Component (Spacious Google Calendar-like Monthly Grid) */}
        <div
          className="monthly-planner-calendar-shell"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            minWidth: 0,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Unified Monthly Calendar Grid: Day Headers (Row 1) & Date Cells (Rows 2+) in ONE single 7-column CSS Grid */}
          <div
            className="monthly-planner-calendar-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              background: '#e2e8f0',
              gap: '1px', // Seamless 1px vertical and horizontal grid lines
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
              {/* Row 1: Day of Week Headers with continuous vertical separators */}
              {DAYS_OF_WEEK.map((day, idx) => (
                <div
                  key={day}
                  style={{
                    background: '#f8fafc',
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    color: idx === 0 || idx === 6 ? '#94a3b8' : '#475569',
                    letterSpacing: '0.5px',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  {day}
                </div>
              ))}

              {/* Rows 2+: Calendar Date Cells sharing the exact same column tracks */}
              {calendarCells.map((cell) => {
                const dayEvents = eventsByDate.get(cell.dateStr) || [];
                const dayHolidays = holidaysEnabled ? holidaysByDate.get(cell.dateStr) || [] : [];
                const hasEvents = dayEvents.length > 0;
                const hasHolidays = dayHolidays.length > 0;
                const isSelected = cell.dateStr === selectedDateStr;

                // Tooltip on hovering any date shows holidays and all event titles & times scheduled on that day
                const cellDate = new Date(cell.dateStr + 'T00:00:00');
                const cellFormattedDate = cellDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                const tooltipLines: string[] = [cellFormattedDate];
                if (hasHolidays) {
                  dayHolidays.forEach((h) => {
                    tooltipLines.push(`🌴 ${h.countryName} Holiday: ${h.title}${h.description ? ` (${h.description})` : ''}`);
                  });
                }
                if (hasEvents) {
                  dayEvents.forEach((ev) => {
                    tooltipLines.push(`• ${formatTimeDisplay(ev.eventTime)} - ${ev.title}`);
                  });
                }
                const cellTooltip = tooltipLines.join('\n');

                return (
                  <div
                    key={cell.dateStr}
                    className="monthly-planner-calendar-cell"
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    title={cellTooltip}
                    style={{
                      minHeight: 'clamp(110px, 12vh, 140px)',
                      minWidth: 0,
                      width: '100%',
                      overflow: 'hidden',
                      background: isSelected
                        ? '#f0fdf4'
                        : hasHolidays
                          ? '#fffdf5'
                          : hasEvents
                            ? '#fcfdfd'
                            : cell.isCurrentMonth
                              ? '#ffffff'
                              : '#f8fafc',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      border: isSelected ? '2px solid #00b074' : '2px solid transparent',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Top Row: Day Number + Event & Holiday Count / Indicator */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                        minWidth: 0,
                        width: '100%',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: cell.isToday || isSelected ? 800 : cell.isCurrentMonth ? 600 : 400,
                          color: cell.isToday
                            ? '#ffffff'
                            : isSelected
                              ? '#047857'
                              : cell.isCurrentMonth
                                ? '#0f172a'
                                : '#94a3b8',
                          width: cell.isToday ? '24px' : 'auto',
                          height: cell.isToday ? '24px' : 'auto',
                          borderRadius: cell.isToday ? '50%' : '0',
                          background: cell.isToday ? '#00b074' : 'transparent',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Visual Marker / Count Badge for Dates Containing Events & Holidays */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0, overflow: 'hidden' }}>
                        {hasHolidays && (
                          <span
                            title={dayHolidays.map((h) => h.title).join(', ')}
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '999px',
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              whiteSpace: 'nowrap',
                              flexShrink: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            <span>🌴</span>
                            <span>{dayHolidays.length > 1 ? `${dayHolidays.length}` : 'Holiday'}</span>
                          </span>
                        )}

                        {hasEvents && (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '999px',
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              whiteSpace: 'nowrap',
                              flexShrink: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preview Pills (Holidays + Events) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', overflow: 'hidden', minWidth: 0, width: '100%' }}>
                      {/* Holiday Pills */}
                      {dayHolidays.map((h) => (
                        <div
                          key={h.id}
                          title={`🌴 ${h.countryName} Holiday: ${h.title}`}
                          style={{
                            padding: '2.5px 6px',
                            borderRadius: '5px',
                            background: '#fef3c7',
                            color: '#78350f',
                            border: '1px solid #fde68a',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            minWidth: 0,
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <span style={{ fontSize: '10px', flexShrink: 0 }}>🌴</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{h.title}</span>
                        </div>
                      ))}

                      {/* Event Preview Pills (Handles multiple events gracefully) */}
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          title={`${formatTimeDisplay(ev.eventTime)} - ${ev.title}`}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '6px',
                            background: isSelected ? '#dcfce7' : '#f1f5f9',
                            color: isSelected ? '#065f46' : '#1e293b',
                            fontSize: '11px',
                            fontWeight: 650,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderLeft: '3px solid #00b074',
                            minWidth: 0,
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <span style={{ color: '#059669', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>
                            {formatTimeDisplay(ev.eventTime)}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{ev.title}</span>
                        </div>
                      ))}

                      {dayEvents.length > 2 && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#059669',
                            paddingLeft: '4px',
                          }}
                        >
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* RIGHT COLUMN: Detail View for Selected Date */}
        <div
          className="monthly-planner-daily-panel"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '22px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: '480px',
          }}
        >
          {/* Header of Detail View */}
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={18} color="#00b074" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Daily Schedule
                </span>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: selectedDayEvents.length > 0 ? '#ecfdf5' : '#f1f5f9',
                  color: selectedDayEvents.length > 0 ? '#059669' : '#64748b',
                }}
              >
                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {formatDisplayDate(selectedDateObj)}
            </h3>
          </div>

          {/* Events List for Selected Day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {/* National Holiday Card if selected date is a holiday */}
            {selectedDayHolidays.map((holiday) => (
              <div
                key={holiday.id}
                style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.08)',
                }}
              >
                <div style={{ fontSize: '24px', lineHeight: 1, marginTop: '2px' }}>
                  {currentCalendarOption.flag}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#b45309',
                        background: '#fef3c7',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #fde68a',
                      }}
                    >
                      Official Holiday • {currentCalendarOption.country}
                    </span>
                    {holiday.source && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: holiday.source === 'GoogleCalendar' ? '#15803d' : '#1d4ed8',
                          background: holiday.source === 'GoogleCalendar' ? '#dcfce7' : '#dbeafe',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {holiday.source === 'GoogleCalendar' ? 'Google Calendar API' : 'Sri Lanka Gazette'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#78350f' }}>
                    {holiday.title}
                  </div>
                  {holiday.description && (
                    <div style={{ fontSize: '12px', color: '#92400e', marginTop: '3px', lineHeight: 1.4 }}>
                      {holiday.description}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {selectedDayEvents.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    marginBottom: '12px',
                  }}
                >
                  <CalendarDays size={22} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  {selectedDayHolidays.length > 0 ? 'No internal company events' : 'No events on this day'}
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0', maxWidth: '240px' }}>
                  {selectedDayHolidays.length > 0
                    ? `This date is an official national holiday (${selectedDayHolidays.map((h) => h.title).join(', ')}). No interviews are scheduled.`
                    : `There are no interviews or meetings scheduled for ${selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${selectedDepartment ? ` under ${selectedDepartment}` : ''}.`}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAddEventModal(selectedDateStr)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #a7f3d0',
                    background: '#ecfdf5',
                    color: '#059669',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} />
                  <span>Schedule Event on this Date</span>
                </button>
              </div>
            ) : (
              selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#0f172a',
                          margin: '0 0 6px 0',
                          lineHeight: 1.3,
                        }}
                      >
                        {ev.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#ecfdf5',
                            color: '#059669',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          <Clock size={13} />
                          <span>{formatTimeDisplay(ev.eventTime)}</span>
                        </div>

                        {ev.jobVacancyTitle && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: '11px',
                              fontWeight: 700,
                              border: '1px solid #bfdbfe',
                            }}
                            title={`Vacancy: ${ev.jobVacancyTitle}`}
                          >
                            <Briefcase size={12} />
                            <span>{ev.jobVacancyTitle}</span>
                          </div>
                        )}

                        {ev.department && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              color: '#475569',
                              fontSize: '11px',
                              fontWeight: 700,
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <Building2 size={12} />
                            <span>{ev.department}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: Edit & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditEventModal(ev)}
                        title="Edit this event"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 650,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>

                      {/* Delete button (removes event from DB and clears highlight if last event) */}
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        title="Delete event from database"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #fee2e2',
                          background: '#fff5f5',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {ev.description ? (
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#475569',
                        lineHeight: 1.5,
                        background: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        marginTop: '8px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {ev.description}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        fontStyle: 'italic',
                        marginTop: '6px',
                      }}
                    >
                      No description provided.
                    </div>
                  )}

                  {/* Footer metadata: creator */}
                  {ev.creatorName && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginTop: '10px',
                        fontSize: '11px',
                        color: '#64748b',
                      }}
                    >
                      <User size={12} />
                      <span>Created by {ev.creatorName}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick button to add another event on this selected date */}
          {selectedDayEvents.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenAddEventModal(selectedDateStr)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px dashed #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: 'auto',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={15} />
              <span>Add Another Event on this Date</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================
          ADD EVENT MODAL
          ========================================================= */}
      {isModalOpen && (
        <div
          className="popup-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '20px',
          }}
          onClick={() => !isSaving && setIsModalOpen(false)}
        >
          <div
            className="popup-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px 26px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {editingEventId ? 'Edit Scheduled Event' : 'Schedule New Event'}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    {editingEventId
                      ? 'Update event details and persist changes to the calendar.'
                      : 'Save event to internal database and update the monthly calendar.'}
                  </p>
                </div>
              </div>

              {!isSaving && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

            {/* Error in form */}
            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Field 1: Title */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Event Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Technical Interview - Alex Johnson"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  disabled={isSaving}
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

              {/* Field 2: Description */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Round 2 System Architecture & Coding challenge evaluation..."
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '52px',
                  }}
                />
              </div>

              {/* Field 3: Date */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Event Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  disabled={isSaving}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Field 4: Time Duration (Start Time to End Time) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#334155',
                      margin: 0,
                    }}
                  >
                    Time Duration <span style={{ color: '#ef4444' }}>*</span>
                  </label>

                  {modalStartTime && modalEndTime && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: modalStartTime < modalEndTime ? '#059669' : '#dc2626',
                        background: modalStartTime < modalEndTime ? '#ecfdf5' : '#fef2f2',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${modalStartTime < modalEndTime ? '#a7f3d0' : '#fecaca'}`,
                      }}
                    >
                      {modalStartTime < modalEndTime
                        ? `${calculateDurationText(modalStartTime, modalEndTime)} (${formatSingleTime(modalStartTime)} - ${formatSingleTime(modalEndTime)})`
                        : 'Invalid: End time must be after start time'}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {/* Start Time */}
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#64748b',
                        marginBottom: '4px',
                      }}
                    >
                      Start Time
                    </span>
                    <input
                      type="time"
                      value={modalStartTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      disabled={isSaving}
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Divider text "to" */}
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textAlign: 'center',
                      paddingTop: '16px',
                    }}
                  >
                    to
                  </div>

                  {/* End Time */}
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#64748b',
                        marginBottom: '4px',
                      }}
                    >
                      End Time
                    </span>
                    <input
                      type="time"
                      value={modalEndTime}
                      onChange={(e) => setModalEndTime(e.target.value)}
                      disabled={isSaving}
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
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
              </div>

              {/* Field 5: Department */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Department
                </label>
                <select
                  value={modalDepartment}
                  onChange={(e) => {
                    setModalDepartment(e.target.value);
                    setModalJobVacancyId('');
                  }}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    outline: 'none',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">General / No Specific Department</option>
                  {activeDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 6: Associated Job Vacancy (Optional) */}
              {modalDepartment && departmentVacancies.length > 0 && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Associated Job Vacancy <span style={{ fontSize: '11px', color: '#64748b' }}>(Optional)</span>
                  </label>
                  <select
                    value={modalJobVacancyId}
                    onChange={(e) => setModalJobVacancyId(e.target.value)}
                    disabled={isSaving}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">None / Department-wide Event</option>
                    {departmentVacancies.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title} ({v.employmentType || v.experienceLevel || 'Vacancy'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 650,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isSaving
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #059669 0%, #00b074 100%)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isSaving ? 'none' : '0 2px 8px rgba(0, 176, 116, 0.3)',
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>{editingEventId ? 'Updating...' : 'Saving Event...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{editingEventId ? 'Update Event' : 'Save Event'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          NATIONAL HOLIDAY REGION SETTINGS MODAL
          ========================================================= */}
      {isSettingsModalOpen && (
        <div
          className="popup-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '20px',
          }}
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="popup-card"
            style={{
              maxWidth: '460px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Globe size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Holiday Region
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Select which country's public holidays to display on your planner.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
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
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Country Selector */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Country / Region
                </label>
                <select
                  value={settingsCalendarIdInput}
                  onChange={(e) => setSettingsCalendarIdInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    color: '#0f172a',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  {HOLIDAY_CALENDARS.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.flag} {cal.country} ({cal.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Backend Integration Info Notice */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#475569',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#00b074" />
                  <span>Secure Backend Integration</span>
                </div>
                Public and national holidays are fetched directly via your backend server. API keys and providers are configured securely in <code>appsettings.json</code>.
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
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
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #00b074 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0, 176, 116, 0.25)',
                  }}
                >
                  Save Region
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Interview Slot Generator Modal */}
      <AiInterviewSchedulerModal
        isOpen={isAiInterviewSchedulerModalOpen}
        onClose={() => {
          setIsAiInterviewSchedulerModalOpen(false);
          fetchEvents();
        }}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          fetchEvents();
        }}
      />
    </div>
  );
};
