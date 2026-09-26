import React, { useState, useEffect, useCallback } from "react";
import {
  jobsApi,
  assessmentsApi,
  eventsApi,
  type JobDto,
  type AssessmentResponseDto,
  type LeaderboardEntryDto,
  type CodingQuestionItemDto,
  type FinalizeTop5ResponseDto,
  type SubmissionDetailDto,
  type EventResponseDto,
} from "../services/api";
import {
  SparkleIcon,
  PlusIcon,
  BriefcaseIcon,
  ClockIcon,
  XIcon,
  TrophyIcon,
  CheckIcon,
  ShieldCheckIcon,
} from "../components/common/Icons";
import {
  Lock,
  AlertTriangle,
  CheckCircle,
  Pencil,
  Star,
  Filter,
  Search,
  RotateCw,
  Trash2,
  CalendarPlus,
  CalendarClock,
  Video,
  MapPin,
  AlertCircle,
  Link,
  Copy,
  Users,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { ProblemStatementViewer } from "../components/assessment";
import { AiInterviewSchedulerModal } from "../components/AiInterviewSchedulerModal";

const LANGUAGE_STARTER_TEMPLATES: Record<string, string> = {
  csharp: `using System;
using System.Collections.Generic;

public class Solution
{
    public static void Main(string[] args)
    {
        // Write your solution here
    }
}`,
  python: `def solution():
    # Write your solution here
    pass

if __name__ == "__main__":
    solution()`,
  javascript: `function solution() {
    // Write your solution here
}

// Call solution
solution();`,
  typescript: `function solution(): void {
    // Write your solution here
}

solution();`,
  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
  cpp: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
  go: `package main

import "fmt"

func main() {
    // Write your solution here
    fmt.Println("Solution output")
}`,
  sql: `-- Write your SQL query here
SELECT *
FROM table_name;`,
};

export interface TechnicalAssessmentsProps {
  activeSection?:
    | "templates"
    | "performance-hub"
    | "submissions"
    | "leaderboard"
    | "interview-selection";
  initialPerformanceTab?: "submissions" | "leaderboard";
}

export const TechnicalAssessments: React.FC<TechnicalAssessmentsProps> = ({
  activeSection = "templates",
  initialPerformanceTab = "submissions",
}) => {
  // 1. Requisition selection state
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDto | null>(null);
  const [, setLoadingJobs] = useState<boolean>(true);

  // 2. Active Section: 'templates' vs 'performance-hub' vs 'interview-selection'
  const isInterviewSelection = activeSection === "interview-selection";
  const isPerformanceHub =
    activeSection === "performance-hub" ||
    activeSection === "submissions" ||
    activeSection === "leaderboard";

  const targetPerfTab: "submissions" | "leaderboard" =
    activeSection === "leaderboard" || initialPerformanceTab === "leaderboard"
      ? "leaderboard"
      : "submissions";

  const [perfTab, setPerfTab] = useState<"submissions" | "leaderboard">(
    targetPerfTab,
  );
  const [prevTargetPerfTab, setPrevTargetPerfTab] = useState<
    "submissions" | "leaderboard"
  >(targetPerfTab);
  if (targetPerfTab !== prevTargetPerfTab) {
    setPrevTargetPerfTab(targetPerfTab);
    setPerfTab(targetPerfTab);
  }


  // 3. Assessments state
  const [assessments, setAssessments] = useState<AssessmentResponseDto[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState<boolean>(false);

  // 4. Submissions state
  const [submissions, setSubmissions] = useState<SubmissionDetailDto[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [submissionFilter, setSubmissionFilter] = useState<
    "all" | "pending" | "graded" | "interview"
  >("all");
  const [submissionSearch, setSubmissionSearch] = useState<string>("");

  // 5. Code Review Modal state
  const [reviewingSubmission, setReviewingSubmission] =
    useState<SubmissionDetailDto | null>(null);
  const [reviewExamScore, setReviewExamScore] = useState<number>(0);
  const [reviewIsSelectedForInterview, setReviewIsSelectedForInterview] =
    useState<boolean>(false);
  const [reviewFeedback, setReviewFeedback] = useState<string>("");
  const [questionEvaluations, setQuestionEvaluations] = useState<
    Record<string, { isCorrect: boolean; pointsEarned: number; notes: string }>
  >({});
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);

  // 6. Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDto[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  // 6b. Interview Selection state
  const [interviewSelections, setInterviewSelections] = useState<
    SubmissionDetailDto[]
  >([]);
  const [loadingInterviewSelections, setLoadingInterviewSelections] =
    useState<boolean>(false);
  const [interviewJobFilter, setInterviewJobFilter] = useState<string>("all");
  const [interviewSearch, setInterviewSearch] = useState<string>("");
  const [interviewScoreFilter, setInterviewScoreFilter] = useState<
    "all" | "top" | "high" | "passed"
  >("all");
  const [interviewIntegrityFilter, setInterviewIntegrityFilter] = useState<
    "all" | "clean" | "flagged"
  >("all");

  // 5. Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [previewAssessment, setPreviewAssessment] =
    useState<AssessmentResponseDto | null>(null);
  const [finalizedModalData, setFinalizedModalData] =
    useState<FinalizeTop5ResponseDto | null>(null);

  // 5b. AI Generation Modal & Workflow state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiFocusArea, setAiFocusArea] = useState<string>("");
  const [aiDifficulty, setAiDifficulty] = useState<string>("Medium");
  const [aiDraftResult, setAiDraftResult] =
    useState<AssessmentResponseDto | null>(null);

  const handleOpenAiGenerateModal = () => {
    setAiFocusArea("");
    setAiDifficulty("Medium");
    setAiDraftResult(null);
    setIsAiModalOpen(true);
  };

  const handleTriggerAiGeneration = async () => {
    if (!selectedJob) return;
    try {
      setIsGeneratingAi(true);
      const currentJob = await jobsApi.getJobById(selectedJob.id);
      setSelectedJob(currentJob);
      const res = await assessmentsApi.generateAi(currentJob.id, {
        focusArea: aiFocusArea.trim() || undefined,
        difficulty: aiDifficulty,
      });
      setAiDraftResult(res);
      // Immediately reflect newly created draft assessment in the active list
      setAssessments((prev) => [res, ...prev.filter((a) => a.id !== res.id)]);
      showToast(
        `AI question generated! Saved as Draft in database. Review and click Edit in Full Editor to set expiry date and publish.`,
      );
    } catch (err: unknown) {
      console.error("Failed to generate AI assessment:", err);
      const errorObj = err as { message?: string };
      const message = errorObj?.message || "";
      if (
        message.includes("404") ||
        message.toLowerCase().includes("not found")
      ) {
        try {
          const refreshedJobs = await jobsApi.getJobs();
          const activeJobs = (refreshedJobs || []).filter(
            (job) => (job.status || "Active").toLowerCase() !== "draft",
          );
          setJobs(activeJobs);
          setSelectedJob(activeJobs[0] || null);
          showToast(
            activeJobs.length > 0
              ? "The selected vacancy no longer exists. Please try again with the refreshed vacancy."
              : "The selected vacancy no longer exists, and no active vacancies are available.",
          );
        } catch {
          showToast(
            "The selected vacancy no longer exists. Refresh the vacancy list and try again.",
          );
        }
      } else {
        showToast(message || "Failed to generate AI assessment challenge.");
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCloseAiModal = () => {
    // Preserve the created draft in the database and list — do NOT delete!
    setIsAiModalOpen(false);
    setAiDraftResult(null);
  };

  const handleDiscardAiDraft = async () => {
    if (aiDraftResult) {
      try {
        await assessmentsApi.delete(aiDraftResult.id);
        setAssessments((prev) => prev.filter((a) => a.id !== aiDraftResult.id));
        showToast("AI draft challenge discarded.");
      } catch {
        // ignore
      }
    }
    setIsAiModalOpen(false);
    setAiDraftResult(null);
  };

  // 6. Manual creation form state
  const [manualTitle, setManualTitle] = useState<string>("");
  const [manualPassingThreshold, setManualPassingThreshold] =
    useState<number>(60);
  const [manualTimeLimit, setManualTimeLimit] = useState<number>(60);
  const [manualQuestions, setManualQuestions] = useState<
    CodingQuestionItemDto[]
  >([]);
  const [manualExpiresAt, setManualExpiresAt] = useState<string>("");
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentResponseDto | null>(null);
  const [isSavingManual, setIsSavingManual] = useState<boolean>(false);

  // Current question under edit in manual modal
  const [curQTitle, setCurQTitle] = useState<string>("");
  const [curQStatement, setCurQStatement] = useState<string>("");
  const [curQLanguage, setCurQLanguage] = useState<string>("csharp");
  const [curQDifficulty, setCurQDifficulty] = useState<string>("Medium");
  const [curQStarter, setCurQStarter] = useState<string>(
    LANGUAGE_STARTER_TEMPLATES["csharp"],
  );

  const handleLanguageChange = (lang: string) => {
    setCurQLanguage(lang);
    setCurQStarter(
      LANGUAGE_STARTER_TEMPLATES[lang] || LANGUAGE_STARTER_TEMPLATES["csharp"],
    );
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Jobs on mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoadingJobs(true);
        const data = await jobsApi.getJobs();
        const active = (data || []).filter(
          (j) => (j.status || "Active").toLowerCase() !== "draft",
        );
        setJobs(active);
        const savedJobId = sessionStorage.getItem(
          "skillhub_active_job_requisition_id",
        );
        const matched = savedJobId
          ? active.find((j) => j.id === savedJobId)
          : null;
        if (matched) {
          setSelectedJob(matched);
        } else if (active.length > 0) {
          setSelectedJob(active[0]);
          sessionStorage.setItem(
            "skillhub_active_job_requisition_id",
            active[0].id,
          );
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    };
    loadJobs();
  }, []);

  // Fetch assessments and leaderboard whenever selected job changes

  const loadJobLeaderboard = useCallback(async (jobId: string) => {
    try {
      const res = await assessmentsApi.getLeaderboard(jobId);
      setLeaderboard(res || []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  const loadJobSubmissions = useCallback(async (jobId: string) => {
    try {
      const res = await assessmentsApi.getSubmissionsByJob(jobId);
      setSubmissions(res || []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  const loadInterviewSelections = useCallback(async (jobId?: string) => {
    try {
      setLoadingInterviewSelections(true);
      const res = await assessmentsApi.getInterviewSelections(jobId);
      setInterviewSelections(res || []);
    } catch (err) {
      console.error("Failed to load interview selections:", err);
      setInterviewSelections([]);
    } finally {
      setLoadingInterviewSelections(false);
    }
  }, []);

  const handleDeselectFromInterview = async (sub: SubmissionDetailDto) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${sub.candidateName || "this candidate"} from technical interview selection?`
      )
    ) {
      return;
    }
    try {
      if (sub.scheduledEventId) {
        try {
          await eventsApi.deleteEvent(sub.scheduledEventId);
        } catch (e) {
          console.warn("Could not delete scheduled event during interview deselection:", e);
        }
      }
      await assessmentsApi.reviewSubmission(sub.id, {
        examScore: sub.examScore,
        isSelectedForInterview: false,
        reviewerFeedback: sub.reviewerFeedback,
      });
      showToast(
        `✓ Removed ${sub.candidateName || "candidate"} from interview selection.`
      );
      loadInterviewSelections();
      if (selectedJob) {
        loadJobSubmissions(selectedJob.id);
        loadJobLeaderboard(selectedJob.id);
      }
    } catch (err) {
      console.error("Failed to remove candidate from interview selection:", err);
      showToast("Failed to remove candidate from interview selection.");
    }
  };

  // ==========================================
  // CONNECT FOR INTERVIEW (MANUAL SCHEDULING)
  // ==========================================
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [schedulingCandidate, setSchedulingCandidate] = useState<SubmissionDetailDto | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleStartTime, setScheduleStartTime] = useState<string>("09:00");
  const [scheduleEndTime, setScheduleEndTime] = useState<string>("09:30");
  const [scheduleMeetingMode, setScheduleMeetingMode] = useState<"Online" | "Physical">("Online");
  const [scheduleMeetingLink, setScheduleMeetingLink] = useState<string>("https://meet.google.com/interview-room");
  const [scheduleLocation, setScheduleLocation] = useState<string>("Head Office, Interview Room 1");
  const [scheduleNotes, setScheduleNotes] = useState<string>("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState<boolean>(false);
  const [existingCalendarEvents, setExistingCalendarEvents] = useState<EventResponseDto[]>([]);

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
      const parts = t.trim().split(":");
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

    const cleanTargetDept = (targetDepartment || "").trim().toLowerCase();

    return existingCalendarEvents.find((ev) => {
      if (ev.eventDate !== date) return false;
      if (excludeId && ev.id === excludeId) return false;

      // Department scoping: Check if event is in the same department, company-wide, or for this specific candidate
      const evDept = (ev.department || "").trim().toLowerCase();
      const isSameCandidate = Boolean(candidateId && ev.candidateId && ev.candidateId === candidateId);
      const isSameDepartment = Boolean(cleanTargetDept && evDept && cleanTargetDept === evDept);
      const isCompanyWide = !evDept || evDept === "all" || evDept === "company" || evDept === "general";

      // If this candidate has a target department, events in other distinct departments do not clash
      if (cleanTargetDept && !isSameCandidate && !isSameDepartment && !isCompanyWide) {
        return false;
      }

      const range = parseEvRange(ev.eventTime);
      if (!range) return false;
      return sMin < range.e && eMin > range.s;
    });
  };

  const handleOpenScheduleModal = async (sub: SubmissionDetailDto) => {
    setSchedulingCandidate(sub);
    setScheduleError(null);

    // Fetch calendar events to detect overlaps
    try {
      const allEvents = await eventsApi.getEvents();
      setExistingCalendarEvents(allEvents || []);
    } catch {
      // ignore
    }

    if (sub.scheduledEventId && sub.scheduledDate) {
      setScheduleDate(sub.scheduledDate);
      if (sub.scheduledTime && sub.scheduledTime.includes("-")) {
        const [st, et] = sub.scheduledTime.split("-").map((x) => x.trim());
        setScheduleStartTime(st || "09:00");
        setScheduleEndTime(et || "09:30");
      } else {
        setScheduleStartTime("09:00");
        setScheduleEndTime("09:30");
      }
      const mode = sub.scheduledMeetingMode === "Physical" ? "Physical" : "Online";
      setScheduleMeetingMode(mode);
      if (mode === "Online") {
        setScheduleMeetingLink(sub.scheduledLocation || "https://meet.google.com/interview-room");
        setScheduleLocation("Head Office, Interview Room 1");
      } else {
        setScheduleLocation(sub.scheduledLocation || "Head Office, Interview Room 1");
        setScheduleMeetingLink("https://meet.google.com/interview-room");
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];
      setScheduleDate(dateStr);
      setScheduleStartTime("09:00");
      setScheduleEndTime("09:30");
      setScheduleMeetingMode("Online");
      setScheduleMeetingLink("https://meet.google.com/interview-room");
      setScheduleLocation("Head Office, Interview Room 1");
    }
    setScheduleNotes("");
    setIsScheduleModalOpen(true);
  };

  const handleApproveSchedule = async () => {
    if (!schedulingCandidate) return;
    if (!scheduleDate) {
      setScheduleError("Please select an interview date.");
      return;
    }
    if (!scheduleStartTime || !scheduleEndTime) {
      setScheduleError("Please select start and end times.");
      return;
    }
    if (scheduleStartTime >= scheduleEndTime) {
      setScheduleError("End time must be after start time (e.g., 09:00 to 09:30).");
      return;
    }
    if (scheduleMeetingMode === "Online" && !scheduleMeetingLink.trim()) {
      setScheduleError("Please enter a meeting link URL (e.g. Google Meet or Zoom).");
      return;
    }
    if (scheduleMeetingMode === "Physical" && !scheduleLocation.trim()) {
      setScheduleError("Please enter the physical meeting room or office location.");
      return;
    }

    const targetDept = schedulingCandidate.department || selectedJob?.department;
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
        `The time gap selected (${scheduleStartTime} - ${scheduleEndTime}) on ${scheduleDate} is already taken by "${clash.title}" (${clash.eventTime})${clash.department ? ` in ${clash.department}` : ""}. Please choose another time or date.`
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
        location: scheduleMeetingMode === "Online" ? scheduleMeetingLink.trim() : scheduleLocation.trim(),
        notes: scheduleNotes.trim() || undefined,
        existingEventId: schedulingCandidate.scheduledEventId || undefined,
      });

      showToast(
        schedulingCandidate.scheduledEventId
          ? `✓ Interview for ${schedulingCandidate.candidateName || "Candidate"} successfully rescheduled to ${scheduleDate} (${scheduleStartTime} - ${scheduleEndTime})!`
          : `✓ Interview for ${schedulingCandidate.candidateName || "Candidate"} approved & scheduled on ${scheduleDate} (${scheduleStartTime} - ${scheduleEndTime})!`
      );

      setIsScheduleModalOpen(false);
      setSchedulingCandidate(null);
      await loadInterviewSelections();
    } catch (err: unknown) {
      console.error("Failed to schedule interview:", err);
      const errObj = err as { message?: string };
      setScheduleError(errObj?.message || "Failed to schedule interview. The selected slot may already be booked.");
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  // ==========================================
  // HIRE CANDIDATE ACTION
  // ==========================================
  const [hiringCandidate, setHiringCandidate] = useState<SubmissionDetailDto | null>(null);
  const [isHiringSubmitting, setIsHiringSubmitting] = useState<boolean>(false);

  const handleOpenHireModal = (sub: SubmissionDetailDto) => {
    setHiringCandidate(sub);
  };

  const handleConfirmHire = async () => {
    if (!hiringCandidate) return;
    try {
      setIsHiringSubmitting(true);
      await assessmentsApi.hireCandidate(hiringCandidate.id);
      showToast(
        `🎉 Congratulations! ${hiringCandidate.candidateName || "Candidate"} has been officially hired for ${hiringCandidate.jobTitle || "the position"}!`
      );
      setInterviewSelections((prev) =>
        prev.map((item) =>
          item.id === hiringCandidate.id
            ? { ...item, status: "Hired", isHired: true }
            : item
        )
      );
      setHiringCandidate(null);
      await loadInterviewSelections();
    } catch (err: unknown) {
      console.error("Failed to hire candidate:", err);
      const errObj = err as { message?: string };
      showToast(errObj?.message || "Failed to hire candidate. Please try again.");
    } finally {
      setIsHiringSubmitting(false);
    }
  };

  // ==========================================
  // BATCH / MULTI-CANDIDATE SCHEDULING & AI SCHEDULING
  // ==========================================
  const [isAiInterviewSchedulerModalOpen, setIsAiInterviewSchedulerModalOpen] =
    useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchDeptFilter, setBatchDeptFilter] = useState<string>("all");
  const [batchDate, setBatchDate] = useState<string>("");
  const [commonMeetingLinkInput, setCommonMeetingLinkInput] = useState<string>("");
  const [commonLocationInput, setCommonLocationInput] = useState<string>("");
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

  const handleOpenBatchModal = async () => {
    try {
      const allEvents = await eventsApi.getEvents();
      setExistingCalendarEvents(allEvents || []);
    } catch {
      // ignore
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setBatchDate(dateStr);
    setBatchDeptFilter("all");
    setCommonMeetingLinkInput("");
    setCommonLocationInput("");
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
    interviewSelections.forEach((s, idx) => {
      const baseHour = 9 + Math.floor((idx * 30) / 60);
      const baseMin = (idx * 30) % 60;
      const endHour = 9 + Math.floor(((idx * 30) + 30) / 60);
      const endMin = ((idx * 30) + 30) % 60;
      const pad = (n: number) => n.toString().padStart(2, "0");
      const defaultStart = `${pad(baseHour)}:${pad(baseMin)}`;
      const defaultEnd = `${pad(endHour)}:${pad(endMin)}`;

      const isPhysical = s.scheduledMeetingMode === 'Physical';
      const mode: 'Online' | 'Physical' = isPhysical ? 'Physical' : 'Online';

      let initialLink = isPhysical ? 'Physical' : (s.scheduledLocation || "");
      if (!isPhysical && !initialLink) {
        const safeName = (s.candidateName || "cand").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
        initialLink = `https://meet.google.com/int-${safeName || "slot"}-${idx + 101}`;
      }

      const initialLoc = isPhysical
        ? (s.scheduledLocation || 'Skill-Hub HQ, 4th Floor, Boardroom 2, Colombo 03')
        : 'Online';

      initialMap[s.id] = {
        selected: false,
        startTime: (s.scheduledTime && s.scheduledTime.includes("-")) ? s.scheduledTime.split("-")[0].trim() : defaultStart,
        endTime: (s.scheduledTime && s.scheduledTime.includes("-")) ? s.scheduledTime.split("-")[1].trim() : defaultEnd,
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

  const handleUpdateCandidateConfig = (
    subId: string,
    field: "startTime" | "endTime" | "meetingLink" | "location" | "meetingMode",
    val: string
  ) => {
    setBatchCandidatesMap((prev) => {
      const current = prev[subId];
      if (!current) return prev;
      if (field === "meetingMode") {
        const newMode = val as "Online" | "Physical";
        return {
          ...prev,
          [subId]: {
            ...current,
            meetingMode: newMode,
            location:
              newMode === "Online"
                ? "Online"
                : current.location && current.location !== "Online"
                ? current.location
                : "Skill-Hub HQ, 4th Floor, Boardroom 2, Colombo 03",
            meetingLink:
              newMode === "Physical"
                ? "Physical"
                : current.meetingLink && current.meetingLink !== "Physical"
                ? current.meetingLink
                : "https://meet.google.com/interview-room",
          },
        };
      }
      return {
        ...prev,
        [subId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  const handleApplyCommonLinkToSelected = () => {
    const trimmed = commonMeetingLinkInput.trim();
    if (!trimmed) {
      showToast("Please enter a meeting link to apply.");
      return;
    }

    let count = 0;
    setBatchCandidatesMap((prev) => {
      const next = { ...prev };
      for (const id in next) {
        if (next[id]?.selected) {
          next[id] = {
            ...next[id],
            meetingMode: "Online",
            location: "Online",
            meetingLink: trimmed,
          };
          count++;
        }
      }
      return next;
    });

    if (count === 0) {
      showToast("No candidates are currently ticked. Please select candidates using the checkboxes first.");
    } else {
      showToast(`✓ Applied common meeting link to ${count} selected candidate${count > 1 ? "s" : ""}!`);
    }
  };

  const handleApplyCommonLocationToSelected = () => {
    const trimmed = commonLocationInput.trim();
    if (!trimmed) {
      showToast("Please enter an interview location or venue address to apply.");
      return;
    }

    let count = 0;
    setBatchCandidatesMap((prev) => {
      const next = { ...prev };
      for (const id in next) {
        if (next[id]?.selected) {
          next[id] = {
            ...next[id],
            meetingMode: "Physical",
            location: trimmed,
            meetingLink: "Physical",
          };
          count++;
        }
      }
      return next;
    });

    if (count === 0) {
      showToast("No candidates are currently ticked. Please select candidates using the checkboxes first.");
    } else {
      showToast(`✓ Applied common location "${trimmed}" to ${count} selected candidate${count > 1 ? "s" : ""}!`);
    }
  };

  const handleApproveBatch = async () => {
    const selected = interviewSelections.filter((s) => batchCandidatesMap[s.id]?.selected);
    if (selected.length === 0) {
      setBatchError("Please select at least one candidate to schedule.");
      return;
    }
    if (!batchDate) {
      setBatchError("Please select an interview date.");
      return;
    }

    for (const s of selected) {
      const cfg = batchCandidatesMap[s.id];
      if (!cfg.startTime || !cfg.endTime) {
        setBatchError(`Missing start or end time for ${s.candidateName || "Candidate"}.`);
        return;
      }
      if (cfg.meetingMode === "Online" && !cfg.meetingLink.trim()) {
        setBatchError(`Missing meeting link for ${s.candidateName || "Candidate"}.`);
        return;
      }
      if (
        cfg.meetingMode === "Physical" &&
        (!cfg.location.trim() || cfg.location.trim().toLowerCase() === "online")
      ) {
        setBatchError(`Missing interview venue/location for ${s.candidateName || "Candidate"}.`);
        return;
      }

      const targetDept = s.department || selectedJob?.department;
      const clash = checkClash(
        batchDate,
        cfg.startTime,
        cfg.endTime,
        s.scheduledEventId,
        targetDept,
        s.candidateId
      );
      if (clash) {
        setBatchError(
          `Schedule Conflict for ${s.candidateName || "Candidate"}: Time (${cfg.startTime} - ${cfg.endTime}) clashes with '${clash.title}' (${clash.eventTime})${clash.department ? ` in ${clash.department}` : ""} on Monthly Planner. Please select an available slot.`
        );
        return;
      }
    }

    try {
      setIsSubmittingBatch(true);
      setBatchError(null);

      for (const s of selected) {
        const cfg = batchCandidatesMap[s.id];
        const isOnline = (cfg.meetingMode || "Online") === "Online";
        await eventsApi.scheduleCandidateInterview({
          candidateId: s.candidateId,
          jobVacancyId: s.jobVacancyId,
          eventDate: batchDate,
          startTime: cfg.startTime,
          endTime: cfg.endTime,
          meetingMode: cfg.meetingMode || "Online",
          location: isOnline ? cfg.meetingLink.trim() : (cfg.location.trim() || "Skill-Hub HQ, 4th Floor, Colombo 03"),
          notes: `Batch scheduled interview for ${s.candidateName || "Candidate"}`,
          existingEventId: s.scheduledEventId || undefined,
        });
      }

      showToast(
        `✓ Successfully scheduled ${selected.length} interview${selected.length > 1 ? "s" : ""} on ${batchDate}! Details sent to candidate dashboards and Monthly Planner.`
      );
      setIsBatchModalOpen(false);
      await loadInterviewSelections();
    } catch (err: unknown) {
      console.error("Failed to batch schedule interviews:", err);
      const errObj = err as { message?: string };
      setBatchError(errObj?.message || "Failed to schedule candidate interviews. Please check time slots.");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  useEffect(() => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const [assessmentsData, submissionsData, leaderboardData, interviewData] =
          await Promise.all([
            assessmentsApi.getAssessmentsByJob(jobId),
            assessmentsApi.getSubmissionsByJob(jobId),
            assessmentsApi.getLeaderboard(jobId),
            assessmentsApi.getInterviewSelections(),
          ]);
        if (isMounted) {
          setAssessments(assessmentsData || []);
          setSubmissions(submissionsData || []);
          setLeaderboard(leaderboardData || []);
          setInterviewSelections(interviewData || []);
        }
      } catch (err) {
        console.error("Failed to load job assessment data:", err);
      } finally {
        if (isMounted) {
          setLoadingAssessments(false);
          setLoadingSubmissions(false);
          setLoadingLeaderboard(false);
          setLoadingInterviewSelections(false);
        }
      }
    };

    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [selectedJob]);

  useEffect(() => {
    if (isInterviewSelection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadInterviewSelections();
    }
  }, [isInterviewSelection, loadInterviewSelections]);

  const handleOpenReview = (sub: SubmissionDetailDto) => {
    setReviewingSubmission(sub);
    setReviewExamScore(sub.examScore || 0);
    setReviewIsSelectedForInterview(sub.isSelectedForInterview || false);
    setReviewFeedback(sub.reviewerFeedback || "");

    const qMap: Record<
      string,
      { isCorrect: boolean; pointsEarned: number; notes: string }
    > = {};
    (sub.answers || []).forEach((a) => {
      qMap[a.questionId] = {
        isCorrect: (a.testCasesPassed || 0) > 0,
        pointsEarned: a.score || 0,
        notes: "",
      };
    });
    setQuestionEvaluations(qMap);
  };

  const handleSaveReview = async () => {
    if (!reviewingSubmission) return;
    try {
      setIsSavingReview(true);
      const questionReviews = Object.entries(questionEvaluations).map(
        ([qId, val]) => ({
          questionId: qId,
          isCorrect: val.isCorrect,
          pointsEarned: val.pointsEarned,
          notes: val.notes,
        }),
      );

      await assessmentsApi.reviewSubmission(reviewingSubmission.id, {
        examScore: reviewExamScore,
        isSelectedForInterview: reviewIsSelectedForInterview,
        reviewerFeedback: reviewFeedback,
        questionReviews,
      });

      showToast(
        reviewIsSelectedForInterview
          ? `✓ Candidate marked as Selected for Interview and grade (${reviewExamScore}%) published to profile!`
          : `✓ Grade (${reviewExamScore}%) successfully saved and published to candidate profile!`,
      );

      setReviewingSubmission(null);
      loadInterviewSelections();
      if (selectedJob) {
        loadJobSubmissions(selectedJob.id);
        loadJobLeaderboard(selectedJob.id);
      }
    } catch (err: unknown) {
      console.error("Error saving review:", err);
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || "Failed to save candidate code review.");
    } finally {
      setIsSavingReview(false);
    }
  };

  // Handle Manual Question Add
  const handleAddQuestionToManual = () => {
    if (!curQTitle.trim() || !curQStatement.trim()) {
      showToast("Please provide a problem title and description.");
      return;
    }

    const newQ: CodingQuestionItemDto = {
      id: `q_${Date.now()}`,
      title: curQTitle.trim(),
      problemStatement: curQStatement.trim(),
      language: curQLanguage,
      difficulty: curQDifficulty,
      starterCode: curQStarter,
      sampleTestCases: [],
      points: 100,
      order: manualQuestions.length + 1,
    };

    setManualQuestions([...manualQuestions, newQ]);
    setCurQTitle("");
    setCurQStatement("");
    setCurQStarter(
      LANGUAGE_STARTER_TEMPLATES[curQLanguage] ||
        LANGUAGE_STARTER_TEMPLATES["csharp"],
    );
    showToast("✓ Coding problem added to assessment template!");
  };

  const handleOpenCreateModal = () => {
    setEditingAssessment(null);
    setManualTitle(`${selectedJob?.title || "Technical"} Skill Assessment`);
    setManualTimeLimit(60);
    setManualPassingThreshold(60);
    setManualQuestions([]);
    setManualExpiresAt("");
    setCurQTitle("");
    setCurQStatement("");
    setCurQLanguage("csharp");
    setCurQDifficulty("Medium");
    setCurQStarter(LANGUAGE_STARTER_TEMPLATES["csharp"]);
    setIsManualModalOpen(true);
  };

  const handleOpenEditModal = (track: AssessmentResponseDto) => {
    setEditingAssessment(track);
    setManualTitle(track.title);
    setManualTimeLimit(track.timeLimitMinutes || 60);
    setManualPassingThreshold(track.passingThreshold || 60);
    setManualQuestions([...track.finalQuestions]);
    setManualExpiresAt(
      track.expiresAt
        ? new Date(track.expiresAt).toISOString().slice(0, 16)
        : "",
    );
    setCurQTitle("");
    setCurQStatement("");
    setCurQLanguage("csharp");
    setCurQDifficulty("Medium");
    setCurQStarter(LANGUAGE_STARTER_TEMPLATES["csharp"]);
    setIsManualModalOpen(true);
  };

  // Save or Update Assessment
  const handleSaveManualAssessment = async (publish: boolean) => {
    if (!selectedJob) return;
    if (!manualTitle.trim()) {
      showToast("Please enter an assessment title.");
      return;
    }
    if (manualQuestions.length === 0) {
      showToast("Add at least one coding problem to the assessment.");
      return;
    }

    try {
      setIsSavingManual(true);
      const expiresAtIso = manualExpiresAt
        ? new Date(manualExpiresAt).toISOString()
        : null;

      if (editingAssessment) {
        let updated = await assessmentsApi.update(editingAssessment.id, {
          title: manualTitle.trim(),
          passingThreshold: manualPassingThreshold,
          timeLimitMinutes: manualTimeLimit,
          finalQuestions: manualQuestions,
          expiresAt: expiresAtIso,
        });

        if (publish && updated.status !== "Published") {
          updated = await assessmentsApi.publish(editingAssessment.id);
        }

        setAssessments((prev) => {
          const exists = prev.some((a) => a.id === updated.id);
          return exists
            ? prev.map((a) => (a.id === updated.id ? updated : a))
            : [updated, ...prev];
        });
        setIsManualModalOpen(false);
        setEditingAssessment(null);
        setManualTitle("");
        setManualQuestions([]);
        setManualExpiresAt("");
        showToast(
          publish
            ? `Assessment "${updated.title}" published successfully.`
            : `Assessment "${updated.title}" saved as draft.`,
        );
      } else {
        const created = await assessmentsApi.createManual({
          jobVacancyId: selectedJob.id,
          title: manualTitle.trim(),
          passingThreshold: manualPassingThreshold,
          timeLimitMinutes: manualTimeLimit,
          questions: manualQuestions,
          publishImmediately: publish,
          expiresAt: expiresAtIso,
        });

        setAssessments([created, ...assessments]);
        setIsManualModalOpen(false);
        setManualTitle("");
        setManualQuestions([]);
        setManualExpiresAt("");
        showToast(`Assessment "${created.title}" created successfully.`);
      }
    } catch (err: unknown) {
      console.error("Failed to save assessment:", err);
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || "Error saving assessment.");
    } finally {
      setIsSavingManual(false);
    }
  };

  // Delete Assessment
  const handleDeleteAssessment = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this assessment template?",
      )
    )
      return;
    try {
      await assessmentsApi.delete(id);
      setAssessments(assessments.filter((a) => a.id !== id));
      if (previewAssessment?.id === id) setPreviewAssessment(null);
      showToast("Assessment deleted.");
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || "Failed to delete assessment.");
    }
  };

  // Finalize Top 5 Candidates (Student 3 Handoff)
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const handleFinalizeTop5 = async () => {
    if (!selectedJob) return;
    if (leaderboard.length === 0) {
      showToast("No candidate submissions available to finalize.");
      return;
    }
    try {
      setIsFinalizing(true);
      const res = await assessmentsApi.finalizeTop5(selectedJob.id);
      setFinalizedModalData(res);
      await loadJobLeaderboard(selectedJob.id);
      showToast(`🏆 Top 5 finalized! Handed off to Student 3.`);
    } catch (err: unknown) {
      console.error("Failed to finalize Top 5:", err);
      const errorObj = err as { message?: string };
      showToast(errorObj?.message || "Error finalizing Top 5.");
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div
      className="pipeline-selector-container"
      style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}
    >
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#0f172a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="pipeline-selector-header"
        style={{ marginBottom: "24px" }}
      >
        <div className="pipeline-header-title-box">
          <div
            className="badge-tag"
            style={{
              background: isInterviewSelection
                ? "#f5f3ff"
                : !isPerformanceHub
                  ? "#ecfdf5"
                  : "#eff6ff",
              color: isInterviewSelection
                ? "#7c3aed"
                : !isPerformanceHub
                  ? "#059669"
                  : "#4338ca",
              border: isInterviewSelection
                ? "1px solid #ddd6fe"
                : !isPerformanceHub
                  ? "1px solid #a7f3d0"
                  : "1px solid #c7d2fe",
            }}
          >
            {isInterviewSelection ? (
              <Star size={13} fill="#7c3aed" />
            ) : (
              <SparkleIcon />
            )}
            <span>
              {isInterviewSelection
                ? "INTERVIEW SELECTION HUB"
                : !isPerformanceHub
                  ? "TECHNICAL ASSESSMENT ENGINE"
                  : "PERFORMANCE HUB"}
            </span>
          </div>
          <h1
            className="pipeline-page-title"
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#0f172a",
              marginTop: "8px",
            }}
          >
            {isInterviewSelection
              ? "Interview Selection"
              : !isPerformanceHub
                ? "Assessments"
                : "Performance Hub"}
          </h1>
          <p
            className="pipeline-page-subtitle"
            style={{ fontSize: "14px", color: "#64748b", maxWidth: "800px" }}
          >
            {isInterviewSelection
              ? "Review candidates shortlisted for technical interviews, examine their technical scores and proctoring trust ratings, and coordinate next steps across requisitions."
              : !isPerformanceHub
                ? "Design custom coding problem tracks, configure language starter code, and publish technical assessment benchmarks for active requisitions."
                : "Review candidate code solutions, inspect anti-cheat proctor telemetry, evaluate question performance, and promote the Top 5 finalists directly to Student 3's Meeting Orchestration Hub."}
          </p>
        </div>

        {/* Job Requisition Switcher (shown when not in Interview Selection) */}
        {!isInterviewSelection && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              minWidth: "320px",
            }}
          >
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
              }}
            >
              Active Job Requisition:
            </label>
            <select
              value={selectedJob?.id || ""}
              onChange={(e) => {
                const j = jobs.find((item) => item.id === e.target.value);
                if (j) {
                  setSelectedJob(j);
                  sessionStorage.setItem(
                    "skillhub_active_job_requisition_id",
                    j.id,
                  );
                }
              }}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#0f172a",
                background: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                outline: "none",
              }}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Section / Performance Hub Tabs */}
      {!isInterviewSelection && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            borderBottom: "2px solid #e2e8f0",
            marginBottom: "24px",
          }}
        >
          {!isPerformanceHub ? (
            <div
              style={{
                padding: "12px 20px",
                fontSize: "14.5px",
                fontWeight: 700,
                color: "#00b074",
                borderBottom: "3px solid #00b074",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "-2px",
              }}
            >
              <BriefcaseIcon />
              <span>Assessments ({assessments.length})</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPerfTab("submissions")}
                style={{
                  padding: "12px 20px",
                  fontSize: "14.5px",
                  fontWeight: 700,
                  color: perfTab === "submissions" ? "#00b074" : "#64748b",
                  borderBottom:
                    perfTab === "submissions"
                      ? "3px solid #00b074"
                      : "3px solid transparent",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "-2px",
                }}
              >
                <SparkleIcon />
                <span>
                  Candidate Submissions &amp; Review ({submissions.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPerfTab("leaderboard")}
                style={{
                  padding: "12px 20px",
                  fontSize: "14.5px",
                  fontWeight: 700,
                  color: perfTab === "leaderboard" ? "#00b074" : "#64748b",
                  borderBottom:
                    perfTab === "leaderboard"
                      ? "3px solid #00b074"
                      : "3px solid transparent",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "-2px",
                }}
              >
                <TrophyIcon />
                <span>Top 5 Leaderboard ({leaderboard.length})</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* =========================================================
          VIEW 1: ASSESSMENTS
          ========================================================= */}
      {!isPerformanceHub && !isInterviewSelection && (
        <div>
          {/* Action Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Coding Tracks for {selectedJob?.title || "Selected Role"}
              </h3>
              <p
                style={{
                  fontSize: "12.5px",
                  color: "#64748b",
                  margin: "2px 0 0 0",
                }}
              >
                Candidates will write and run code against these challenges when
                dispatched.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleOpenAiGenerateModal}
                className="btn-secondary"
                style={{
                  padding: "8px 18px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  fontWeight: 600,
                  borderRadius: "10px",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <SparkleIcon />
                <span>Generate with AI</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="btn-primary"
                style={{
                  padding: "8px 18px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <PlusIcon />
                <span>Create Coding Assessment</span>
              </button>
            </div>
          </div>

          {/* Templates Grid */}
          {loadingAssessments ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#64748b" }}
            >
              Loading assessment tracks...
            </div>
          ) : assessments.length === 0 ? (
            <div
              style={{
                background: "#f8fafc",
                border: "2px dashed #cbd5e1",
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#ecfdf5",
                  color: "#00b074",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <PlusIcon />
              </div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 6px 0",
                }}
              >
                No Technical Assessments Configured
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  maxWidth: "460px",
                  margin: "0 auto 20px auto",
                }}
              >
                Generate a calibrated technical assessment using the AI Agent or
                configure a challenge manually with automated test cases.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={handleOpenAiGenerateModal}
                  className="btn-secondary"
                  style={{
                    padding: "8px 18px",
                    fontSize: "13px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#f0fdf4",
                    color: "#16a34a",
                    border: "1px solid #bbf7d0",
                    fontWeight: 600,
                    borderRadius: "10px",
                  }}
                >
                  <SparkleIcon />
                  <span>Generate with AI</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="btn-primary"
                  style={{
                    padding: "8px 18px",
                    fontSize: "13px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <PlusIcon />
                  <span>Create Coding Assessment</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: "20px",
              }}
            >
              {assessments.map((track) => (
                <div
                  key={track.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background:
                            track.status === "Published"
                              ? "#dcfce7"
                              : track.status === "Draft"
                                ? "#fef3c7"
                                : "#f1f5f9",
                          color:
                            track.status === "Published"
                              ? "#16a34a"
                              : track.status === "Draft"
                                ? "#d97706"
                                : "#64748b",
                        }}
                      >
                        {track.status}
                      </span>
                      <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                        {track.totalSubmissions} candidate(s) evaluated
                      </span>
                    </div>

                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#0f172a",
                        margin: "0 0 10px 0",
                      }}
                    >
                      {track.title}
                    </h4>

                    <div
                      style={{
                        display: "flex",
                        gap: "14px",
                        fontSize: "12px",
                        color: "#64748b",
                        marginBottom: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <ClockIcon /> {track.timeLimitMinutes} mins
                      </span>
                      <span>•</span>
                      <span>{track.finalQuestions.length} Coding Problems</span>
                      <span>•</span>
                      <span>Pass: {track.passingThreshold}%</span>
                      {track.expiresAt && (
                        <>
                          <span>•</span>
                          <span
                            style={{
                              color:
                                // eslint-disable-next-line react-hooks/purity
                                new Date(track.expiresAt).getTime() < Date.now()
                                  ? "#dc2626"
                                  : "#b45309",
                              fontWeight: 600,
                            }}
                          >
                            Deadline:{" "}
                            {new Date(track.expiresAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Problem list preview */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        marginBottom: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "6px",
                        }}
                      >
                        Coding Challenges:
                      </span>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "16px",
                          fontSize: "12px",
                          color: "#334155",
                        }}
                      >
                        {track.finalQuestions.slice(0, 3).map((q, idx) => (
                          <li key={q.id || idx} style={{ marginBottom: "4px" }}>
                            <strong>{q.title}</strong> ({q.language} •{" "}
                            {q.difficulty})
                          </li>
                        ))}
                        {track.finalQuestions.length > 3 && (
                          <li style={{ color: "#64748b" }}>
                            +{track.finalQuestions.length - 3} more questions
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {(() => {
                    const hasActiveExam =
                      track.hasActiveCandidateExam ??
                      submissions.some(
                        (s) =>
                          s.assessmentId === track.id && s.status === "Started",
                      );
                    const isEditable =
                      track.canEdit !== undefined
                        ? track.canEdit
                        : !hasActiveExam;

                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: "1px solid #f1f5f9",
                          paddingTop: "14px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewAssessment(track)}
                          className="btn-secondary"
                          style={{ padding: "6px 14px", fontSize: "12px" }}
                        >
                          View Question Bank
                        </button>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {hasActiveExam ? (
                            <span
                              title="This assessment is currently dispatched to a candidate profile and exam is in-progress. Editing will be re-enabled once the candidate completes the assessment."
                              style={{
                                fontSize: "11px",
                                color: "#b45309",
                                background: "#fef3c7",
                                border: "1px solid #fde68a",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                cursor: "help",
                              }}
                            >
                              <Lock size={12} strokeWidth={2.2} />
                              <span>Locked (In Progress)</span>
                            </span>
                          ) : isEditable ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(track)}
                              className="btn-secondary"
                              style={{
                                padding: "6px 14px",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>Edit</span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleDeleteAssessment(track.id)}
                            disabled={hasActiveExam}
                            style={{
                              background: "none",
                              border: "none",
                              color: hasActiveExam ? "#cbd5e1" : "#ef4444",
                              cursor: hasActiveExam ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "6px 8px",
                            }}
                            title={
                              hasActiveExam
                                ? "Cannot delete while candidate exam is in progress"
                                : undefined
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          VIEW 2: CANDIDATE SUBMISSIONS & MANUAL CODE REVIEW
          ========================================================= */}
      {isPerformanceHub && perfTab === "submissions" && (
        <div>
          {/* Header & Filter Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Candidate Code Submissions (
                {selectedJob?.title || "Selected Requisition"})
              </h3>
              <p
                style={{
                  fontSize: "12.5px",
                  color: "#64748b",
                  margin: "2px 0 0 0",
                }}
              >
                Review candidate typed solutions, evaluate code correctness,
                assign marks, and select candidates for technical interview
                rounds.
              </p>
            </div>

            {/* Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "6px 12px",
                minWidth: "260px",
              }}
            >
              <span style={{ color: "#94a3b8", fontSize: "13px" }}>🔍</span>
              <input
                type="text"
                placeholder="Search candidate name or email..."
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "13px",
                  width: "100%",
                  color: "#0f172a",
                }}
              />
              {submissionSearch && (
                <button
                  type="button"
                  onClick={() => setSubmissionSearch("")}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setSubmissionFilter("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12.5px",
                fontWeight: 700,
                border: "1px solid",
                borderColor: submissionFilter === "all" ? "#00b074" : "#e2e8f0",
                background: submissionFilter === "all" ? "#ecfdf5" : "#ffffff",
                color: submissionFilter === "all" ? "#047857" : "#64748b",
                cursor: "pointer",
              }}
            >
              All Submissions ({submissions.length})
            </button>

            <button
              type="button"
              onClick={() => setSubmissionFilter("pending")}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12.5px",
                fontWeight: 700,
                border: "1px solid",
                borderColor:
                  submissionFilter === "pending" ? "#f59e0b" : "#e2e8f0",
                background:
                  submissionFilter === "pending" ? "#fffbeb" : "#ffffff",
                color: submissionFilter === "pending" ? "#b45309" : "#64748b",
                cursor: "pointer",
              }}
            >
              Pending Review (
              {
                submissions.filter(
                  (s) =>
                    s.status === "Under_Review" || s.status === "Submitted",
                ).length
              }
              )
            </button>

            <button
              type="button"
              onClick={() => setSubmissionFilter("graded")}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12.5px",
                fontWeight: 700,
                border: "1px solid",
                borderColor:
                  submissionFilter === "graded" ? "#10b981" : "#e2e8f0",
                background:
                  submissionFilter === "graded" ? "#ecfdf5" : "#ffffff",
                color: submissionFilter === "graded" ? "#047857" : "#64748b",
                cursor: "pointer",
              }}
            >
              Graded (
              {
                submissions.filter(
                  (s) => s.status === "Graded" || s.status === "Passed",
                ).length
              }
              )
            </button>

            <button
              type="button"
              onClick={() => setSubmissionFilter("interview")}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12.5px",
                fontWeight: 700,
                border: "1px solid",
                borderColor:
                  submissionFilter === "interview" ? "#8b5cf6" : "#e2e8f0",
                background:
                  submissionFilter === "interview" ? "#f5f3ff" : "#ffffff",
                color: submissionFilter === "interview" ? "#6d28d9" : "#64748b",
                cursor: "pointer",
              }}
            >
              Selected for Interview (
              {submissions.filter((s) => s.isSelectedForInterview).length})
            </button>
          </div>

          {/* Submissions Table / Empty State */}
          {loadingSubmissions ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                color: "#64748b",
                fontSize: "13.5px",
              }}
            >
              Loading candidate submissions...
            </div>
          ) : (
            (() => {
              const filtered = submissions.filter((s) => {
                if (
                  submissionFilter === "pending" &&
                  s.status !== "Under_Review" &&
                  s.status !== "Submitted"
                )
                  return false;
                if (
                  submissionFilter === "graded" &&
                  s.status !== "Graded" &&
                  s.status !== "Passed"
                )
                  return false;
                if (
                  submissionFilter === "interview" &&
                  !s.isSelectedForInterview
                )
                  return false;

                if (submissionSearch.trim()) {
                  const q = submissionSearch.toLowerCase();
                  const nameMatch = (s.candidateName || "")
                    .toLowerCase()
                    .includes(q);
                  const emailMatch = (s.candidateEmail || "")
                    .toLowerCase()
                    .includes(q);
                  return nameMatch || emailMatch;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "2px dashed #cbd5e1",
                      borderRadius: "16px",
                      padding: "48px 24px",
                      textAlign: "center",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#0f172a",
                        margin: "0 0 6px 0",
                      }}
                    >
                      {submissionSearch || submissionFilter !== "all"
                        ? "No Submissions Match Criteria"
                        : "No Candidate Submissions Yet"}
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        maxWidth: "480px",
                        margin: "0 auto",
                      }}
                    >
                      {submissionSearch || submissionFilter !== "all"
                        ? "Try clearing your search or switching filters."
                        : "When shortlisted candidates take and submit their coding challenges, their typed code and solutions will appear here for review."}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left",
                        fontSize: "13px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "#f8fafc",
                            borderBottom: "1px solid #e2e8f0",
                            color: "#475569",
                            fontWeight: 700,
                          }}
                        >
                          <th style={{ padding: "14px 18px" }}>Candidate</th>
                          <th style={{ padding: "14px 18px" }}>
                            Assessment Track
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "center",
                            }}
                          >
                            Submitted Date
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "center",
                            }}
                          >
                            Proctor Telemetry
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "center",
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "center",
                            }}
                          >
                            Exam Marks
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "center",
                            }}
                          >
                            Interview Status
                          </th>
                          <th
                            style={{ padding: "14px 18px", textAlign: "right" }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => {
                          const isUnderReview =
                            s.status === "Under_Review" ||
                            s.status === "Submitted";
                          const isGraded =
                            s.status === "Graded" || s.status === "Passed";
                          const dateFormatted = s.submittedAt
                            ? new Date(s.submittedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "Recent";

                          const infractions =
                            s.proctorSummary?.tabSwitches ?? 0;

                          return (
                            <tr
                              key={s.id}
                              style={{
                                borderBottom: "1px solid #f1f5f9",
                                background: s.isSelectedForInterview
                                  ? "#fdf4ff"
                                  : "transparent",
                              }}
                            >
                              <td style={{ padding: "14px 18px" }}>
                                <div
                                  style={{ fontWeight: 700, color: "#0f172a" }}
                                >
                                  {s.candidateName || "Candidate"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "11.5px",
                                    color: "#64748b",
                                  }}
                                >
                                  {s.candidateEmail}
                                </div>
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                <div
                                  style={{ fontWeight: 600, color: "#334155" }}
                                >
                                  {s.assessmentTitle}
                                </div>
                                <div
                                  style={{
                                    fontSize: "11.5px",
                                    color: "#94a3b8",
                                  }}
                                >
                                  {s.answers?.length || 0} Challenge(s)
                                </div>
                              </td>

                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "center",
                                  color: "#64748b",
                                  fontSize: "12px",
                                }}
                              >
                                {dateFormatted}
                              </td>

                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "center",
                                }}
                              >
                                {infractions > 0 ? (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      background: "#fee2e2",
                                      color: "#b91c1c",
                                      fontSize: "11.5px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    <AlertTriangle
                                      size={12}
                                      strokeWidth={2.2}
                                    />
                                    <span>{infractions} Alert(s)</span>
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      background: "#ecfdf5",
                                      color: "#059669",
                                      fontSize: "11.5px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <CheckIcon />
                                    <span>Clean (0)</span>
                                  </span>
                                )}
                              </td>

                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "center",
                                }}
                              >
                                {isUnderReview ? (
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "999px",
                                      background: "#fffbeb",
                                      color: "#b45309",
                                      border: "1px solid #fde68a",
                                      fontSize: "11.5px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Under Review
                                  </span>
                                ) : isGraded ? (
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "999px",
                                      background: "#ecfdf5",
                                      color: "#047857",
                                      border: "1px solid #a7f3d0",
                                      fontSize: "11.5px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Graded
                                  </span>
                                ) : s.status === "Blocked" ? (
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
                                    <span
                                      title="Candidate did not follow the rules: Closed browser tab, refreshed, or exited active test session."
                                      style={{
                                        padding: "3px 10px",
                                        borderRadius: "999px",
                                        background: "#fef2f2",
                                        color: "#b91c1c",
                                        border: "1px solid #fecaca",
                                        fontSize: "11.5px",
                                        fontWeight: 700,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      <AlertTriangle
                                        size={11}
                                        strokeWidth={2.2}
                                      />
                                      <span>Suspended</span>
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        color: "#dc2626",
                                        fontWeight: 500,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      (User did not follow the rules)
                                    </span>
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "999px",
                                      background: "#f1f5f9",
                                      color: "#475569",
                                      fontSize: "11.5px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {s.status}
                                  </span>
                                )}
                              </td>

                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "center",
                                  fontWeight: 800,
                                }}
                              >
                                {isGraded ? (
                                  <span
                                    style={{
                                      color:
                                        s.examScore >= s.passingThreshold
                                          ? "#16a34a"
                                          : "#ea580c",
                                      fontSize: "14px",
                                    }}
                                  >
                                    {s.examScore}%
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "12px",
                                    }}
                                  >
                                    Pending
                                  </span>
                                )}
                              </td>

                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "center",
                                }}
                              >
                                {s.isSelectedForInterview ? (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "4px 10px",
                                      borderRadius: "999px",
                                      background: "#f5f3ff",
                                      color: "#7c3aed",
                                      border: "1px solid #ddd6fe",
                                      fontSize: "11.5px",
                                      fontWeight: 800,
                                    }}
                                  >
                                    <TrophyIcon />
                                    <span>Selected</span>
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "12px",
                                    }}
                                  >
                                    —
                                  </span>
                                )}
                              </td>

                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "right",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenReview(s)}
                                  style={{
                                    padding: "7px 14px",
                                    borderRadius: "8px",
                                    fontSize: "12.5px",
                                    fontWeight: 750,
                                    border: isUnderReview
                                      ? "none"
                                      : "1px solid #cbd5e1",
                                    background: isUnderReview
                                      ? "#00b074"
                                      : "#ffffff",
                                    color: isUnderReview
                                      ? "#ffffff"
                                      : "#334155",
                                    cursor: "pointer",
                                    boxShadow: isUnderReview
                                      ? "0 2px 8px rgba(0,176,116,0.2)"
                                      : "none",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  {isUnderReview
                                    ? "Review Code & Grade"
                                    : "Edit Grade"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* =========================================================
          VIEW 3: TOP 5 LEADERBOARD & STUDENT 3 HANDOFF
          ========================================================= */}
      {isPerformanceHub && perfTab === "leaderboard" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Candidate Technical Exam Leaderboard
              </h3>
              <p
                style={{
                  fontSize: "12.5px",
                  color: "#64748b",
                  margin: "2px 0 0 0",
                }}
              >
                Candidates ranked by Technical Exam Score. Isolate Top 5 to
                authorize Student 3 interview scheduling.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinalizeTop5}
              disabled={isFinalizing || leaderboard.length === 0}
              className="btn-primary"
              style={{
                padding: "10px 20px",
                fontSize: "13.5px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #059669 0%, #00b074 100%)",
              }}
            >
              <TrophyIcon />
              <span>
                {isFinalizing ? "Finalizing..." : "Finalize Top 5 Candidates →"}
              </span>
            </button>
          </div>

          {loadingLeaderboard ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#64748b" }}
            >
              Loading candidate leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div
              style={{
                background: "#f8fafc",
                border: "2px dashed #cbd5e1",
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 6px 0",
                }}
              >
                No Exam Submissions Recorded Yet
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  maxWidth: "460px",
                  margin: "0 auto 16px auto",
                }}
              >
                Dispatch assessment tracks to shortlisted candidates from the{" "}
                <strong>Hiring Pipeline</strong> tab. As candidates complete
                their coding assessments, real-time scores and proctoring
                telemetry will populate here.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        color: "#475569",
                        fontWeight: 700,
                      }}
                    >
                      <th style={{ padding: "14px 18px", width: "70px" }}>
                        Rank
                      </th>
                      <th style={{ padding: "14px 18px" }}>Candidate</th>
                      <th style={{ padding: "14px 18px", textAlign: "center" }}>
                        CV Match
                      </th>
                      <th style={{ padding: "14px 18px", textAlign: "center" }}>
                        Technical Exam
                      </th>
                      <th style={{ padding: "14px 18px", textAlign: "center" }}>
                        Final Score
                      </th>
                      <th style={{ padding: "14px 18px", textAlign: "center" }}>
                        Proctor Telemetry
                      </th>
                      <th style={{ padding: "14px 18px", textAlign: "center" }}>
                        Status
                      </th>
                      <th style={{ padding: "14px 18px", textAlign: "center" }}>
                        Student 3 Eligibility
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row) => (
                      <tr
                        key={row.submissionId}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: row.isTop5 ? "#f0fdf4" : "transparent",
                        }}
                      >
                        <td style={{ padding: "14px 18px", fontWeight: 800 }}>
                          {row.rank <= 3 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                background:
                                  row.rank === 1
                                    ? "#fef08a"
                                    : row.rank === 2
                                      ? "#e2e8f0"
                                      : "#fed7aa",
                                color: "#854d0e",
                                fontSize: "12px",
                              }}
                            >
                              #{row.rank}
                            </span>
                          ) : (
                            <span style={{ color: "#64748b" }}>
                              #{row.rank}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {row.candidateName}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                            {row.candidateEmail}
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "14px 18px",
                            textAlign: "center",
                            fontWeight: 600,
                            color: "#0284c7",
                          }}
                        >
                          {row.cvScore}%
                        </td>

                        <td
                          style={{
                            padding: "14px 18px",
                            textAlign: "center",
                            fontWeight: 700,
                            color: row.examScore >= 60 ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {row.examScore}%
                        </td>

                        <td
                          style={{
                            padding: "14px 18px",
                            textAlign: "center",
                            fontWeight: 800,
                            fontSize: "14px",
                            color: "#0f172a",
                          }}
                        >
                          {row.finalWeightedScore}%
                        </td>

                        <td
                          style={{ padding: "14px 18px", textAlign: "center" }}
                        >
                          {row.proctorTabSwitches > 0 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                fontSize: "11.5px",
                                fontWeight: 700,
                              }}
                            >
                              <AlertTriangle size={12} strokeWidth={2.2} />
                              <span>
                                {row.proctorTabSwitches} tab switch(es)
                              </span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background: "#ecfdf5",
                                color: "#059669",
                                fontSize: "11.5px",
                                fontWeight: 600,
                              }}
                            >
                              <CheckIcon />
                              <span>Clean Session</span>
                            </span>
                          )}
                        </td>

                        <td
                          style={{ padding: "14px 18px", textAlign: "center" }}
                        >
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              background:
                                row.submissionStatus === "Passed"
                                  ? "#dcfce7"
                                  : "#fee2e2",
                              color:
                                row.submissionStatus === "Passed"
                                  ? "#15803d"
                                  : "#b91c1c",
                            }}
                          >
                            {row.submissionStatus}
                          </span>
                        </td>

                        <td
                          style={{ padding: "14px 18px", textAlign: "center" }}
                        >
                          {row.isTop5 ? (
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "12px",
                                background: "#fef08a",
                                color: "#854d0e",
                                fontSize: "11.5px",
                                fontWeight: 800,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <TrophyIcon />
                              <span>Top 5 Finalist</span>
                            </span>
                          ) : (
                            <span
                              style={{ color: "#94a3b8", fontSize: "12px" }}
                            >
                              Standard
                            </span>
                          )}
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

      {/* =========================================================
          VIEW 4: INTERVIEW SELECTION & REQUISITION FILTER
          ========================================================= */}
      {isInterviewSelection && (
        <div>
          {/* Section Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#f5f3ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#7c3aed",
                  }}
                >
                  <Star size={18} fill="#7c3aed" />
                </div>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Technical Interview Selection
                </h3>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: "#f5f3ff",
                    color: "#7c3aed",
                    border: "1px solid #ddd6fe",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {interviewSelections.length} Selected
                </span>
              </div>
              <p
                style={{
                  fontSize: "12.5px",
                  color: "#64748b",
                  margin: 0,
                }}
              >
                Candidates evaluated and explicitly selected by HR during assessment reviews for technical interview rounds.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadInterviewSelections()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
            >
              <RotateCw size={13} />
              <span>Refresh List</span>
            </button>
          </div>

          {/* Quick Metrics KPI Cards */}
          {(() => {
            const totalSelected = interviewSelections.length;
            const avgScore =
              totalSelected > 0
                ? (
                    interviewSelections.reduce(
                      (acc, s) => acc + (s.examScore || 0),
                      0,
                    ) / totalSelected
                  ).toFixed(1)
                : "0.0";
            const uniqueRoles = new Set(
              interviewSelections.map((s) => s.jobVacancyId).filter(Boolean),
            ).size;
            const cleanCount = interviewSelections.filter(
              (s) => (s.proctorSummary?.tabSwitches ?? 0) === 0,
            ).length;
            const cleanRate =
              totalSelected > 0
                ? Math.round((cleanCount / totalSelected) * 100)
                : 100;

            return (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "14px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      Selected Candidates
                    </span>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        background: "#f5f3ff",
                        color: "#7c3aed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Star size={15} fill="#7c3aed" />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.1,
                    }}
                  >
                    {totalSelected}
                  </div>
                  <span style={{ fontSize: "11.5px", color: "#7c3aed", fontWeight: 600 }}>
                    Promoted to interview round
                  </span>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      Avg. Technical Score
                    </span>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        background: "#ecfdf5",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TrophyIcon />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#047857",
                      lineHeight: 1.1,
                    }}
                  >
                    {avgScore}%
                  </div>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    Across all selected exams
                  </span>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      Job Roles Represented
                    </span>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <BriefcaseIcon />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.1,
                    }}
                  >
                    {uniqueRoles}
                  </div>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    Active requisitions with talent
                  </span>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      Integrity Compliance
                    </span>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        background: "#f0fdf4",
                        color: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ShieldCheckIcon />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#16a34a",
                      lineHeight: 1.1,
                    }}
                  >
                    {cleanRate}%
                  </div>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    {cleanCount} clean proctor sessions
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Filtering Controls Bar */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "14px 18px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            {/* Left Controls: Job Requisition Filter Dropdown */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Filter size={14} color="#64748b" />
                  Filter by Job:
                </span>
                <select
                  value={interviewJobFilter}
                  onChange={(e) => setInterviewJobFilter(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                    cursor: "pointer",
                    minWidth: "220px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <option value="all">
                    All Job Requisitions ({interviewSelections.length} candidates)
                  </option>
                  {jobs.map((j) => {
                    const count = interviewSelections.filter(
                      (s) => s.jobVacancyId === j.id,
                    ).length;
                    return (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.department}) — {count} selected
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Right Controls: Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "6px 12px",
                minWidth: "260px",
              }}
            >
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search candidate, email, or role..."
                value={interviewSearch}
                onChange={(e) => setInterviewSearch(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "13px",
                  width: "100%",
                  color: "#0f172a",
                }}
              />
              {interviewSearch && (
                <button
                  type="button"
                  onClick={() => setInterviewSearch("")}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Bar: Schedule Selected Candidates and AI Schedule Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handleOpenBatchModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 20px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #059669 0%, #00b074 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 176, 116, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              <CalendarPlus size={16} />
              <span>Schedule Selected Candidates</span>
            </button>

            {/* AI Schedule Button (Student 3 - Meeting Orchestration) */}
            <button
              type="button"
              onClick={() => setIsAiInterviewSchedulerModalOpen(true)}
              title="AI Interview Slot Generator (Student 3)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 20px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
                cursor: "pointer",
                border: "none",
                transition: "all 0.15s ease",
              }}
            >
              <Sparkles size={16} />
              <span>AI Schedule</span>
            </button>
          </div>

          {/* Table or Empty State */}
          {loadingInterviewSelections ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#64748b",
                fontSize: "13.5px",
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid #7c3aed",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px auto",
                }}
              />
              Loading candidate interview selections...
            </div>
          ) : (
            (() => {
              const filtered = interviewSelections.filter((s) => {
                // 1. Job requisition filter
                if (
                  interviewJobFilter !== "all" &&
                  s.jobVacancyId !== interviewJobFilter
                ) {
                  return false;
                }

                // 2. Score filter
                if (interviewScoreFilter === "top" && (s.examScore || 0) < 85)
                  return false;
                if (interviewScoreFilter === "high" && (s.examScore || 0) < 70)
                  return false;
                if (
                  interviewScoreFilter === "passed" &&
                  (s.examScore || 0) < (s.passingThreshold || 60)
                )
                  return false;

                // 3. Proctor filter
                const infractions = s.proctorSummary?.tabSwitches ?? 0;
                if (interviewIntegrityFilter === "clean" && infractions > 0)
                  return false;
                if (interviewIntegrityFilter === "flagged" && infractions === 0)
                  return false;

                // 4. Search query
                if (interviewSearch.trim()) {
                  const q = interviewSearch.toLowerCase();
                  const nameMatch = (s.candidateName || "")
                    .toLowerCase()
                    .includes(q);
                  const emailMatch = (s.candidateEmail || "")
                    .toLowerCase()
                    .includes(q);
                  const jobMatch = (s.jobTitle || "")
                    .toLowerCase()
                    .includes(q);
                  const deptMatch = (s.department || "")
                    .toLowerCase()
                    .includes(q);
                  const assessMatch = (s.assessmentTitle || "")
                    .toLowerCase()
                    .includes(q);
                  return (
                    nameMatch ||
                    emailMatch ||
                    jobMatch ||
                    deptMatch ||
                    assessMatch
                  );
                }

                return true;
              });

              if (interviewSelections.length === 0) {
                return (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "2px dashed #cbd5e1",
                      borderRadius: "16px",
                      padding: "60px 24px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "#f5f3ff",
                        color: "#7c3aed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px auto",
                      }}
                    >
                      <Star size={28} fill="#7c3aed" />
                    </div>
                    <h4
                      style={{
                        fontSize: "17px",
                        fontWeight: 700,
                        color: "#0f172a",
                        margin: "0 0 8px 0",
                      }}
                    >
                      No Candidates Selected for Technical Interview Yet
                    </h4>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "#64748b",
                        maxWidth: "520px",
                        margin: "0 auto 20px auto",
                        lineHeight: 1.5,
                      }}
                    >
                      When reviewing candidate code submissions in the{" "}
                      <strong>Candidate Submissions &amp; Review</strong> tab,
                      check the <strong>⭐ Select Candidate for Technical Interview</strong>{" "}
                      option. Shortlisted candidates will automatically appear in this section.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPerfTab("submissions")}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        background: "#00b074",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "13px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,176,116,0.25)",
                      }}
                    >
                      Go to Candidate Submissions
                    </button>
                  </div>
                );
              }

              if (filtered.length === 0) {
                return (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "2px dashed #cbd5e1",
                      borderRadius: "16px",
                      padding: "48px 24px",
                      textAlign: "center",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#0f172a",
                        margin: "0 0 6px 0",
                      }}
                    >
                      No Candidates Match Selected Criteria
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        maxWidth: "460px",
                        margin: "0 auto 16px auto",
                      }}
                    >
                      Try clearing the search query or selecting "All Job Requisitions".
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setInterviewJobFilter("all");
                        setInterviewSearch("");
                        setInterviewScoreFilter("all");
                        setInterviewIntegrityFilter("all");
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#334155",
                        fontWeight: 600,
                        fontSize: "12.5px",
                        cursor: "pointer",
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                );
              }

              return (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left",
                        fontSize: "13px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "#f8fafc",
                            borderBottom: "1px solid #e2e8f0",
                            color: "#475569",
                            fontWeight: 700,
                          }}
                        >
                          <th style={{ padding: "14px 18px" }}>Candidate</th>
                          <th style={{ padding: "14px 18px" }}>
                            Job Requisition &amp; Dept
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "center",
                            }}
                          >
                            Selected Date
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "center",
                            }}
                          >
                            Interview Status
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "center",
                            }}
                          >
                            Delivery Mode
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "left",
                            }}
                          >
                            Location
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "left",
                            }}
                          >
                            Meeting Link
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "center",
                            }}
                          >
                            Connect for Interview
                          </th>
                          <th
                            style={{
                              padding: "14px 18px",
                              textAlign: "right",
                            }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => {
                          const dateFormatted = s.gradedAt
                            ? new Date(s.gradedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : s.submittedAt
                              ? new Date(s.submittedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "Recent";

                          const matchedJob = jobs.find(
                            (j) => j.id === s.jobVacancyId,
                          );
                          const jobTitle =
                            s.jobTitle ||
                            matchedJob?.title ||
                            selectedJob?.title ||
                            "Job Requisition";
                          const department =
                            s.department ||
                            matchedJob?.department ||
                            selectedJob?.department ||
                            "General";

                          const initials = (s.candidateName || "Candidate")
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();

                          const isPhysical = s.scheduledMeetingMode === "Physical";

                          return (
                            <tr
                              key={s.id}
                              style={{
                                borderBottom: "1px solid #f1f5f9",
                                background: "#ffffff",
                                transition: "background 0.1s ease",
                              }}
                            >
                              {/* Candidate Info */}
                              <td style={{ padding: "14px 18px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "36px",
                                      height: "36px",
                                      borderRadius: "50%",
                                      background:
                                        "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                                      color: "#ffffff",
                                      fontSize: "12.5px",
                                      fontWeight: 800,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      boxShadow:
                                        "0 2px 4px rgba(124, 58, 237, 0.2)",
                                    }}
                                  >
                                    {initials}
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        fontSize: "13.5px",
                                      }}
                                    >
                                      {s.candidateName || "Candidate"}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "11.5px",
                                        color: "#64748b",
                                      }}
                                    >
                                      {s.candidateEmail}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Job Requisition & Dept */}
                              <td style={{ padding: "14px 18px" }}>
                                <div
                                  style={{
                                    fontWeight: 650,
                                    color: "#1e293b",
                                    fontSize: "13px",
                                  }}
                                >
                                  {jobTitle}
                                </div>
                                <div style={{ marginTop: "3px" }}>
                                  <span
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: "6px",
                                      background: "#f1f5f9",
                                      color: "#475569",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      border: "1px solid #e2e8f0",
                                    }}
                                  >
                                    {department}
                                  </span>
                                </div>
                              </td>

                              {/* Selected / Graded Date */}
                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "center",
                                  color: "#64748b",
                                  fontSize: "12px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {dateFormatted}
                              </td>

                              {/* Interview Status Badge */}
                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "center",
                                }}
                              >
                                {s.status === "Hired" || s.isHired ? (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      padding: "4px 12px",
                                      borderRadius: "999px",
                                      background: "#ecfdf5",
                                      color: "#059669",
                                      border: "1px solid #86efac",
                                      fontSize: "12px",
                                      fontWeight: 800,
                                      boxShadow:
                                        "0 1px 3px rgba(5, 150, 105, 0.15)",
                                    }}
                                  >
                                    <Sparkles size={13} color="#059669" />
                                    <span>Hired</span>
                                  </span>
                                ) : s.scheduledEventId || s.status === "Ready for Interview" || s.status?.toLowerCase().includes("ready") ? (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      padding: "4px 12px",
                                      borderRadius: "999px",
                                      background: "#ecfdf5",
                                      color: "#059669",
                                      border: "1px solid #a7f3d0",
                                      fontSize: "12px",
                                      fontWeight: 800,
                                      boxShadow:
                                        "0 1px 3px rgba(5, 150, 105, 0.1)",
                                    }}
                                  >
                                    <CheckCircle size={13} color="#059669" />
                                    <span>Ready for Interview</span>
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      padding: "4px 12px",
                                      borderRadius: "999px",
                                      background: "#f5f3ff",
                                      color: "#7c3aed",
                                      border: "1px solid #ddd6fe",
                                      fontSize: "12px",
                                      fontWeight: 800,
                                      boxShadow:
                                        "0 1px 3px rgba(124, 58, 237, 0.1)",
                                    }}
                                  >
                                    <Star size={13} fill="#7c3aed" color="#7c3aed" />
                                    <span>Selected</span>
                                  </span>
                                )}
                              </td>

                              {/* Delivery Mode */}
                              <td style={{ padding: "14px 18px", textAlign: "center" }}>
                                {s.scheduledEventId ? (
                                  isPhysical ? (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "4px 10px",
                                        borderRadius: "999px",
                                        background: "#fef3c7",
                                        color: "#b45309",
                                        border: "1px solid #fde68a",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                      }}
                                    >
                                      <MapPin size={12} color="#b45309" />
                                      <span>Physical</span>
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "4px 10px",
                                        borderRadius: "999px",
                                        background: "#e0f2fe",
                                        color: "#0369a1",
                                        border: "1px solid #bae6fd",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                      }}
                                    >
                                      <Video size={12} color="#0369a1" />
                                      <span>Online</span>
                                    </span>
                                  )
                                ) : (
                                  <span
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "12px",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    —
                                  </span>
                                )}
                              </td>

                              {/* Location */}
                              <td style={{ padding: "14px 18px" }}>
                                {s.scheduledEventId ? (
                                  !isPhysical ? (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "4px 9px",
                                        borderRadius: "6px",
                                        background: "#f1f5f9",
                                        border: "1px solid #e2e8f0",
                                        color: "#64748b",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                      }}
                                      title="Location is Online for virtual interviews"
                                    >
                                      <Video size={12} color="#64748b" />
                                      <span>Online</span>
                                    </span>
                                  ) : (
                                    <div
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        background: "#fffbeb",
                                        border: "1px solid #fde68a",
                                        padding: "4px 9px",
                                        borderRadius: "8px",
                                      }}
                                    >
                                      <MapPin size={13} color="#b45309" />
                                      <span
                                        title={s.scheduledLocation || "Skill-Hub HQ, Colombo"}
                                        style={{
                                          color: "#92400e",
                                          fontSize: "12px",
                                          fontWeight: 650,
                                          maxWidth: "180px",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          display: "inline-block",
                                        }}
                                      >
                                        {s.scheduledLocation || "Skill-Hub HQ, Colombo"}
                                      </span>
                                    </div>
                                  )
                                ) : (
                                  <span
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "12px",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    Not scheduled
                                  </span>
                                )}
                              </td>

                              {/* Meeting Link */}
                              <td style={{ padding: "14px 18px" }}>
                                {s.scheduledEventId ? (
                                  isPhysical ? (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "4px 9px",
                                        borderRadius: "6px",
                                        background: "#f1f5f9",
                                        border: "1px solid #e2e8f0",
                                        color: "#64748b",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                      }}
                                      title="Meeting link is not required for physical interviews"
                                    >
                                      <MapPin size={12} color="#64748b" />
                                      <span>Physical</span>
                                    </span>
                                  ) : s.scheduledLocation && (s.scheduledLocation.startsWith("http") || s.scheduledLocation.includes("meet.google.com") || s.scheduledLocation.includes("zoom.us") || s.scheduledLocation.includes("teams.")) ? (
                                    <div
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        background: "#f0fdf4",
                                        border: "1px solid #bbf7d0",
                                        padding: "4px 8px",
                                        borderRadius: "8px",
                                      }}
                                    >
                                      <Video size={13} color="#16a34a" />
                                      <a
                                        href={
                                          s.scheduledLocation.startsWith("http")
                                            ? s.scheduledLocation
                                            : `https://${s.scheduledLocation}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`Open meeting link: ${s.scheduledLocation}`}
                                        style={{
                                          color: "#15803d",
                                          textDecoration: "underline",
                                          fontSize: "12px",
                                          fontWeight: 650,
                                          maxWidth: "180px",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          display: "inline-block",
                                        }}
                                      >
                                        {s.scheduledLocation.replace(/^https?:\/\//, "")}
                                      </a>
                                    </div>
                                  ) : (
                                    <span
                                      style={{
                                        color: "#64748b",
                                        fontSize: "12px",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      {s.scheduledLocation || "Online"}
                                    </span>
                                  )
                                ) : (
                                  <span
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "12px",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    Not scheduled
                                  </span>
                                )}
                              </td>

                              {/* Connect for Interview (Schedule / Reschedule) */}
                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "center",
                                }}
                              >
                                {s.scheduledEventId ? (
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleOpenScheduleModal(s)}
                                      title="Reschedule this candidate's interview date, time, or location"
                                      style={{
                                        padding: "6px 14px",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        border: "1px solid #00b074",
                                        background: "#ecfdf5",
                                        color: "#059669",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        transition: "all 0.15s ease",
                                        boxShadow: "0 1px 3px rgba(5, 150, 105, 0.12)",
                                      }}
                                    >
                                      <CalendarClock size={13} />
                                      <span>Reschedule</span>
                                    </button>
                                    {s.scheduledDate && (
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          color: "#64748b",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {s.scheduledDate}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenScheduleModal(s)}
                                    title="Schedule interview date, time, mode, and location for this candidate"
                                    style={{
                                      padding: "6px 14px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      border: "1px solid #7c3aed",
                                      background: "#7c3aed",
                                      color: "#ffffff",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      transition: "all 0.15s ease",
                                      boxShadow: "0 2px 5px rgba(124, 58, 237, 0.2)",
                                    }}
                                  >
                                    <CalendarPlus size={13} />
                                    <span>Schedule</span>
                                  </button>
                                )}
                              </td>

                              {/* Actions */}
                              <td
                                style={{
                                  padding: "14px 18px",
                                  textAlign: "right",
                                }}
                              >
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  {s.status === "Hired" || s.isHired ? (
                                    <span
                                      style={{
                                        padding: "6px 14px",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        fontWeight: 750,
                                        border: "1px solid #86efac",
                                        background: "#ecfdf5",
                                        color: "#059669",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        boxShadow: "0 1px 3px rgba(5, 150, 105, 0.12)",
                                      }}
                                      title="Candidate is officially hired for this role"
                                    >
                                      <CheckCircle2 size={13} color="#059669" />
                                      <span>Hired</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenHireModal(s)}
                                      title={`Officially hire ${s.candidateName || "Candidate"} for ${s.jobTitle || "this position"}`}
                                      style={{
                                        padding: "6px 14px",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        fontWeight: 750,
                                        border: "1px solid #059669",
                                        background: "#059669",
                                        color: "#ffffff",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        transition: "all 0.15s ease",
                                        boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.background = "#047857";
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.background = "#059669";
                                      }}
                                    >
                                      <Sparkles size={13} />
                                      <span>Hire</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeselectFromInterview(s)}
                                    title="Remove from Technical Interview Selection"
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      border: "1px solid #fee2e2",
                                      background: "#fff1f2",
                                      color: "#b91c1c",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* =========================================================
          MODAL 1: OPTION 1 - MANUAL QUESTION CREATOR
          ========================================================= */}
      {isManualModalOpen && (
        <div
          className="popup-backdrop"
          style={{ zIndex: 1200 }}
          onClick={() => setIsManualModalOpen(false)}
        >
          <div
            className="popup-card"
            style={{
              maxWidth: "760px",
              width: "100%",
              padding: "26px",
              borderRadius: "18px",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "18px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "14px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      textTransform: "uppercase",
                    }}
                  >
                    Assessment Track Builder
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "#f1f5f9",
                      color: "#475569",
                    }}
                  >
                    Manual Question Authoring
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "19px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {editingAssessment
                    ? "Edit Coding Assessment"
                    : "Create Technical Assessment"}
                </h3>
                <p
                  style={{
                    fontSize: "12.5px",
                    color: "#64748b",
                    margin: "4px 0 0 0",
                  }}
                >
                  {editingAssessment
                    ? "Update assessment parameters, problem statements, and coding challenges for this track."
                    : "Configure custom coding problems, runtime environments, and passing benchmarks for candidates."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManualModalOpen(false);
                  setEditingAssessment(null);
                }}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "6px",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <XIcon />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              {/* General Parameters Card */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ marginBottom: "14px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Assessment Title <span style={{ color: "#ef4444" }}>*</span>
                    :
                  </label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g. Lead Full-Stack Engineer (AI & Enterprise Systems) Skill Assessment"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      color: "#0f172a",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1.2fr",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      Time Limit:
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        value={manualTimeLimit}
                        onChange={(e) =>
                          setManualTimeLimit(Number(e.target.value))
                        }
                        min={15}
                        max={240}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          color: "#0f172a",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "11.5px",
                          color: "#94a3b8",
                          fontWeight: 600,
                          pointerEvents: "none",
                        }}
                      >
                        Mins
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      Benchmark (%):
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        value={manualPassingThreshold}
                        onChange={(e) =>
                          setManualPassingThreshold(Number(e.target.value))
                        }
                        min={0}
                        max={100}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          color: "#0f172a",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "12px",
                          color: "#94a3b8",
                          fontWeight: 700,
                          pointerEvents: "none",
                        }}
                      >
                        %
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      Expiration Date (Deadline):
                    </label>
                    <input
                      type="datetime-local"
                      value={manualExpiresAt}
                      onChange={(e) => setManualExpiresAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        color: "#0f172a",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Added Questions List */}
              {manualQuestions.length > 0 && (
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      Configured Problems ({manualQuestions.length}):
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      Candidate will solve these questions in sequence
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {manualQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#ffffff",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "12.5px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "6px",
                              background: "#0f172a",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <strong style={{ color: "#0f172a" }}>
                              {q.title}
                            </strong>
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                marginTop: "2px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                }}
                              >
                                {q.language}
                              </span>
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  fontWeight: 600,
                                  background:
                                    q.difficulty === "Easy"
                                      ? "#ecfdf5"
                                      : q.difficulty === "Hard"
                                        ? "#fef2f2"
                                        : "#fffbeb",
                                  color:
                                    q.difficulty === "Easy"
                                      ? "#047857"
                                      : q.difficulty === "Hard"
                                        ? "#b91c1c"
                                        : "#b45309",
                                }}
                              >
                                {q.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setCurQTitle(q.title);
                              setCurQStatement(q.problemStatement);
                              setCurQLanguage(q.language);
                              setCurQDifficulty(q.difficulty);
                              setCurQStarter(q.starterCode);
                              setManualQuestions(
                                manualQuestions.filter(
                                  (item) => item.id !== q.id,
                                ),
                              );
                              showToast(
                                `Loaded "${q.title}" into editor below.`,
                              );
                            }}
                            style={{
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              color: "#1d4ed8",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              cursor: "pointer",
                              fontSize: "11.5px",
                              fontWeight: 700,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setManualQuestions(
                                manualQuestions.filter(
                                  (item) => item.id !== q.id,
                                ),
                              )
                            }
                            style={{
                              background: "#fee2e2",
                              border: "1px solid #fecaca",
                              color: "#ef4444",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              cursor: "pointer",
                              fontSize: "11.5px",
                              fontWeight: 700,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Coding Question Sub-Form */}
              <div
                style={{
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "12px",
                  padding: "18px",
                  background: "#fcfcfd",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "6px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PlusIcon />
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 800,
                        color: "#0f172a",
                        display: "block",
                      }}
                    >
                      Add Coding Problem
                    </span>
                    <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                      Write the problem statement and starter template for
                      candidates
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#334155",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Problem Title <span style={{ color: "#ef4444" }}>*</span>:
                    </label>
                    <input
                      type="text"
                      value={curQTitle}
                      onChange={(e) => setCurQTitle(e.target.value)}
                      placeholder="e.g. Reverse Linked List, LRU Cache, Distributed Lock"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12.5px",
                        color: "#0f172a",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#334155",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Problem Description &amp; Requirements{" "}
                      <span style={{ color: "#ef4444" }}>*</span>:
                    </label>
                    <textarea
                      rows={4}
                      value={curQStatement}
                      onChange={(e) => setCurQStatement(e.target.value)}
                      placeholder="Describe the task, expected inputs/outputs, performance constraints, and edge cases..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12.5px",
                        color: "#0f172a",
                        fontFamily: "inherit",
                        lineHeight: 1.5,
                      }}
                    />
                  </div>

                  {/* Language and Difficulty (Points field removed!) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#334155",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Programming Language{" "}
                        <span style={{ color: "#ef4444" }}>*</span>:
                      </label>
                      <select
                        value={curQLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#0f172a",
                          background: "#ffffff",
                        }}
                      >
                        <option value="csharp">C# (.NET)</option>
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript (Node.js)</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="go">Go</option>
                        <option value="sql">SQL</option>
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#334155",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Difficulty Level{" "}
                        <span style={{ color: "#ef4444" }}>*</span>:
                      </label>
                      <select
                        value={curQDifficulty}
                        onChange={(e) => setCurQDifficulty(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#0f172a",
                          background: "#ffffff",
                        }}
                      >
                        <option value="Easy">🟢 Easy</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Hard">🔴 Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Starter Code Stub (Auto-populated on Language Selection) */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#334155",
                        }}
                      >
                        Starter Code Stub (Auto-populated for{" "}
                        {curQLanguage.toUpperCase()}):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCurQStarter(
                            LANGUAGE_STARTER_TEMPLATES[curQLanguage] ||
                              LANGUAGE_STARTER_TEMPLATES["csharp"],
                          );
                          showToast(
                            `✓ Reset code template for ${curQLanguage.toUpperCase()}`,
                          );
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2563eb",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        ↺ Reset Template
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={curQStarter}
                      onChange={(e) => setCurQStarter(e.target.value)}
                      spellCheck={false}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                        backgroundColor: "#0f172a",
                        color: "#4ade80",
                        fontSize: "12px",
                        fontFamily:
                          '"Fira Code", Consolas, Monaco, "Courier New", monospace',
                        lineHeight: 1.5,
                        tabSize: 4,
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Sample Input & Expected Output sections REMOVED as requested */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      paddingTop: "4px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleAddQuestionToManual}
                      className="btn-primary"
                      style={{
                        padding: "8px 18px",
                        fontSize: "12.5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        borderRadius: "8px",
                      }}
                    >
                      <PlusIcon />
                      <span>Add Problem to Assessment</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "16px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Problems Configured: <strong>{manualQuestions.length}</strong>
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualModalOpen(false);
                    setEditingAssessment(null);
                  }}
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Cancel
                </button>

                {editingAssessment ? (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleSaveManualAssessment(false)}
                      disabled={isSavingManual}
                      className="btn-secondary"
                      style={{ padding: "8px 16px", fontSize: "13px" }}
                    >
                      {isSavingManual ? "Saving..." : "Save Draft"}
                    </button>
                    {editingAssessment.status === "Draft" ? (
                      <button
                        type="button"
                        onClick={() => handleSaveManualAssessment(true)}
                        disabled={isSavingManual}
                        className="btn-primary"
                        style={{
                          padding: "8px 20px",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#00b074",
                        }}
                      >
                        <CheckIcon />
                        <span>
                          {isSavingManual
                            ? "Publishing..."
                            : "Publish Assessment"}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveManualAssessment(false)}
                        disabled={isSavingManual}
                        className="btn-primary"
                        style={{
                          padding: "8px 20px",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <CheckIcon />
                        <span>
                          {isSavingManual ? "Saving..." : "Save Changes"}
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveManualAssessment(false)}
                      disabled={isSavingManual}
                      className="btn-secondary"
                      style={{ padding: "8px 16px", fontSize: "13px" }}
                    >
                      {isSavingManual ? "Saving..." : "Save as Draft"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveManualAssessment(true)}
                      disabled={isSavingManual}
                      className="btn-primary"
                      style={{
                        padding: "8px 20px",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <CheckIcon />
                      <span>
                        {isSavingManual
                          ? "Publishing..."
                          : "Publish Assessment"}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: PREVIEW QUESTION BANK
          ========================================================= */}
      {previewAssessment && (
        <div
          className="popup-backdrop"
          style={{ zIndex: 1200 }}
          onClick={() => setPreviewAssessment(null)}
        >
          <div
            className="popup-card"
            style={{
              maxWidth: "720px",
              width: "100%",
              padding: "24px",
              borderRadius: "16px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {previewAssessment.title}
                </h3>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                  Status: <strong>{previewAssessment.status}</strong> • Pass:{" "}
                  <strong>{previewAssessment.passingThreshold}%</strong> • Time:{" "}
                  <strong>{previewAssessment.timeLimitMinutes} min</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAssessment(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <XIcon />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              {previewAssessment.finalQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "16px",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14.5px",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {idx + 1}. {q.title}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#0284c7",
                      }}
                    >
                      {q.difficulty} • {q.language}
                    </span>
                  </div>

                  <div style={{ margin: "0 0 14px 0" }}>
                    <ProblemStatementViewer
                      content={q.problemStatement}
                      theme="light"
                      compact={true}
                    />
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      Starter Code:
                    </span>
                    <pre
                      style={{
                        background: "#0f172a",
                        color: "#38bdf8",
                        padding: "10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        overflowX: "auto",
                        margin: "4px 0 0 0",
                      }}
                    >
                      {q.starterCode}
                    </pre>
                  </div>

                  {q.sampleTestCases && q.sampleTestCases.length > 0 && (
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                        }}
                      >
                        Sample Test Case:
                      </span>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#475569",
                          background: "#ffffff",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          marginTop: "4px",
                        }}
                      >
                        <div>
                          <strong>Input:</strong> {q.sampleTestCases[0].input}
                        </div>
                        <div>
                          <strong>Expected Output:</strong>{" "}
                          {q.sampleTestCases[0].expectedOutput}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewAssessment(null)}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: MANUAL CANDIDATE CODE REVIEW & MARKS
          ========================================================= */}
      {reviewingSubmission && (
        <div
          className="popup-backdrop"
          style={{ zIndex: 1240 }}
          onClick={() => setReviewingSubmission(null)}
        >
          <div
            className="popup-card"
            style={{
              maxWidth: "880px",
              width: "100%",
              padding: "24px",
              borderRadius: "16px",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      textTransform: "uppercase",
                    }}
                  >
                    Candidate Code Review
                  </span>
                  {reviewingSubmission.status === "Graded" ||
                  reviewingSubmission.status === "Passed" ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "#ecfdf5",
                        color: "#047857",
                      }}
                    >
                      Graded ({reviewingSubmission.examScore}%)
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "#fffbeb",
                        color: "#b45309",
                      }}
                    >
                      Pending Manual Evaluation
                    </span>
                  )}
                </div>
                <h3
                  style={{
                    fontSize: "19px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 4px 0",
                  }}
                >
                  {reviewingSubmission.candidateName || "Candidate Submission"}
                </h3>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                  Email: <strong>{reviewingSubmission.candidateEmail}</strong> •
                  Assessment:{" "}
                  <strong>{reviewingSubmission.assessmentTitle}</strong>
                  {reviewingSubmission.submittedAt &&
                    ` • Submitted: ${new Date(reviewingSubmission.submittedAt).toLocaleString()}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingSubmission(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <XIcon />
              </button>
            </div>

            {/* Proctor Alert */}
            {reviewingSubmission.proctorSummary?.tabSwitches > 0 ? (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <div style={{ fontSize: "12.5px", color: "#991b1b" }}>
                  <strong>Proctor Warning:</strong> The candidate switched
                  browser tabs / windows{" "}
                  <strong>
                    {reviewingSubmission.proctorSummary.tabSwitches} times
                  </strong>{" "}
                  during the exam session.
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ShieldCheckIcon />
                <span
                  style={{
                    fontSize: "12.5px",
                    color: "#166534",
                    fontWeight: 500,
                  }}
                >
                  Proctor Clean: Zero browser tab switches or window blurs
                  detected during examination.
                </span>
              </div>
            )}

            {/* Answers List */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0f172a",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  Submitted Code Solutions (
                  {reviewingSubmission.answers?.length || 0} Questions)
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    fontWeight: 400,
                  }}
                >
                  Review candidate code and assign question score
                </span>
              </div>

              {(!reviewingSubmission.answers ||
                reviewingSubmission.answers.length === 0) && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px",
                    color: "#94a3b8",
                    fontSize: "13px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                  }}
                >
                  No answer entries found for this submission.
                </div>
              )}

              {reviewingSubmission.answers?.map((ans, idx) => {
                const qEval = questionEvaluations[ans.questionId] || {
                  isCorrect: false,
                  pointsEarned: 0,
                  notes: "",
                };
                const currentTemplate = assessments.find(
                  (a) => a.id === reviewingSubmission.assessmentId,
                );
                const questionDef = currentTemplate?.finalQuestions?.find(
                  (q) => q.id === ans.questionId,
                );

                return (
                  <div
                    key={ans.questionId || idx}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      overflow: "hidden",
                      background: "#ffffff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Question Header */}
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "12px 16px",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            background: "#0f172a",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          Q{idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: "13.5px",
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {questionDef?.title || `Coding Question #${idx + 1}`}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "#e0e7ff",
                            color: "#3730a3",
                            fontWeight: 600,
                          }}
                        >
                          {ans.language || questionDef?.language || "Code"}
                        </span>
                        {questionDef?.difficulty && (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: "#f1f5f9",
                              color: "#475569",
                            }}
                          >
                            {questionDef.difficulty}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Max Weight:{" "}
                        <strong>{questionDef?.points || 100} pts</strong>
                      </div>
                    </div>

                    {/* Question Problem Statement Rendered Cleanly for HR Review */}
                    {questionDef?.problemStatement && (
                      <div
                        style={{
                          padding: "16px 20px",
                          background: "#fcfcfd",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Problem Specification & Guidelines
                          </span>
                        </div>
                        <ProblemStatementViewer
                          content={questionDef.problemStatement}
                          theme="light"
                          compact={true}
                        />
                      </div>
                    )}

                    {/* Candidate Typed Code */}
                    <div
                      style={{ padding: "14px 16px", background: "#0f172a" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "11px",
                            fontFamily: "monospace",
                          }}
                        >
                          CANDIDATE TYPED CODE ({ans.language || "text"}):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              ans.submittedCode || "",
                            );
                            showToast("✓ Code copied to clipboard");
                          }}
                          style={{
                            background: "#1e293b",
                            border: "1px solid #334155",
                            color: "#94a3b8",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <pre
                        style={{
                          color: "#f8fafc",
                          background: "#020617",
                          padding: "12px",
                          borderRadius: "6px",
                          fontSize: "12.5px",
                          fontFamily:
                            'Consolas, Monaco, "Courier New", monospace',
                          margin: 0,
                          maxHeight: "260px",
                          overflowY: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          lineHeight: "1.5",
                        }}
                      >
                        {ans.submittedCode ||
                          "// No code submitted for this question."}
                      </pre>
                    </div>

                    {/* Evaluator Controls for this question */}
                    <div
                      style={{
                        padding: "14px 16px",
                        background: "#f8fafc",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#334155",
                          }}
                        >
                          Solution Verdict:
                        </span>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12.5px",
                            cursor: "pointer",
                            color: qEval.isCorrect ? "#15803d" : "#475569",
                            fontWeight: qEval.isCorrect ? 700 : 400,
                          }}
                        >
                          <input
                            type="radio"
                            name={`verdict_${ans.questionId}`}
                            checked={qEval.isCorrect}
                            onChange={() => {
                              const maxPts = questionDef?.points || 100;
                              setQuestionEvaluations((prev) => ({
                                ...prev,
                                [ans.questionId]: {
                                  ...qEval,
                                  isCorrect: true,
                                  pointsEarned: maxPts,
                                },
                              }));
                            }}
                          />
                          Correct
                        </label>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12.5px",
                            cursor: "pointer",
                            color: !qEval.isCorrect ? "#b91c1c" : "#475569",
                            fontWeight: !qEval.isCorrect ? 700 : 400,
                          }}
                        >
                          <input
                            type="radio"
                            name={`verdict_${ans.questionId}`}
                            checked={!qEval.isCorrect}
                            onChange={() => {
                              setQuestionEvaluations((prev) => ({
                                ...prev,
                                [ans.questionId]: {
                                  ...qEval,
                                  isCorrect: false,
                                  pointsEarned: 0,
                                },
                              }));
                            }}
                          />
                          Incorrect / Incomplete
                        </label>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#334155",
                          }}
                        >
                          Marks Awarded:
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={questionDef?.points || 100}
                          value={qEval.pointsEarned}
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              Math.min(
                                questionDef?.points || 100,
                                Number(e.target.value),
                              ),
                            );
                            setQuestionEvaluations((prev) => ({
                              ...prev,
                              [ans.questionId]: {
                                ...qEval,
                                pointsEarned: val,
                                isCorrect: val > 0,
                              },
                            }));
                          }}
                          style={{
                            width: "70px",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            textAlign: "center",
                          }}
                        />
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          / {questionDef?.points || 100} pts
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Evaluation Summary Card */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                padding: "18px",
                marginBottom: "20px",
              }}
            >
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 14px 0",
                }}
              >
                Overall Assessment Scoring & Decision
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Total Exam Score (0 - 100%):
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={reviewExamScore}
                      onChange={(e) =>
                        setReviewExamScore(Number(e.target.value))
                      }
                      style={{
                        width: "100px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "15px",
                        fontWeight: 800,
                        textAlign: "center",
                        color: "#0f172a",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      %
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const totalAwarded = Object.values(
                          questionEvaluations,
                        ).reduce((sum, q) => sum + (q.pointsEarned || 0), 0);
                        const totalPossible =
                          reviewingSubmission.answers?.reduce((sum, a) => {
                            const currentTemplate = assessments.find(
                              (t) => t.id === reviewingSubmission.assessmentId,
                            );
                            const qDef = currentTemplate?.finalQuestions?.find(
                              (q) => q.id === a.questionId,
                            );
                            return sum + (qDef?.points || 100);
                          }, 0) || 100;
                        const pct = Math.round(
                          (totalAwarded / (totalPossible || 1)) * 100,
                        );
                        setReviewExamScore(Math.min(100, Math.max(0, pct)));
                        showToast(
                          `Calculated score: ${pct}% based on question points.`,
                        );
                      }}
                      style={{
                        background: "#e2e8f0",
                        border: "none",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#334155",
                        cursor: "pointer",
                      }}
                    >
                      Auto-sum Questions
                    </button>
                  </div>
                  <span
                    style={{
                      fontSize: "11.5px",
                      color: "#64748b",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    Passing Threshold: {reviewingSubmission.passingThreshold}%
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Reviewer Feedback / Comments for Candidate:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Provide constructive feedback on coding style, algorithm efficiency, and architecture..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12.5px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              {/* ⭐ Select Candidate for Technical Interview Checkbox */}
              <div
                style={{
                  background: reviewIsSelectedForInterview
                    ? "#ecfdf5"
                    : "#ffffff",
                  border: reviewIsSelectedForInterview
                    ? "1.5px solid #10b981"
                    : "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onClick={() =>
                  setReviewIsSelectedForInterview(!reviewIsSelectedForInterview)
                }
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={reviewIsSelectedForInterview}
                    onChange={(e) =>
                      setReviewIsSelectedForInterview(e.target.checked)
                    }
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 700,
                        color: reviewIsSelectedForInterview
                          ? "#065f46"
                          : "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>⭐ Select Candidate for Technical Interview</span>
                      {reviewIsSelectedForInterview && (
                        <span
                          style={{
                            fontSize: "11px",
                            background: "#10b981",
                            color: "#ffffff",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontWeight: 700,
                          }}
                        >
                          SELECTED
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: reviewIsSelectedForInterview
                          ? "#047857"
                          : "#64748b",
                        margin: "2px 0 0 0",
                      }}
                    >
                      When checked, the candidate will be marked as selected for
                      an interview, and a prominent celebration notice will
                      appear on their profile.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "16px",
              }}
            >
              <button
                type="button"
                onClick={() => setReviewingSubmission(null)}
                className="btn-secondary"
                style={{ padding: "9px 18px", fontSize: "13px" }}
                disabled={isSavingReview}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                className="btn-primary"
                style={{
                  padding: "9px 22px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                disabled={isSavingReview}
              >
                {isSavingReview ? (
                  <>Saving Review...</>
                ) : (
                  <>
                    <CheckIcon />
                    Save & Publish Grade to Candidate Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: TOP 5 FINALIZED (STUDENT 3 OUTGOING CONTRACT)
          ========================================================= */}
      {finalizedModalData && (
        <div
          className="popup-backdrop"
          style={{ zIndex: 1250 }}
          onClick={() => setFinalizedModalData(null)}
        >
          <div
            className="popup-card"
            style={{
              maxWidth: "640px",
              width: "100%",
              padding: "24px",
              borderRadius: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#fef08a",
                  color: "#854d0e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrophyIcon />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Top 5 Candidates Finalized!
                </h3>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                  Transferred to Student 3 (Meeting Orchestration)
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "10px",
                padding: "14px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "#065f46",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {finalizedModalData.message}
              </p>
              <div
                style={{ fontSize: "12px", color: "#047857", marginTop: "6px" }}
              >
                • <strong>{finalizedModalData.top5PromotedCount}</strong>{" "}
                candidates promoted to <strong>"Assessment Passed"</strong>
                <br />• <strong>{finalizedModalData.rejectedCount}</strong>{" "}
                non-qualifying candidates updated to <strong>"Rejected"</strong>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#475569",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Outgoing JSON Contract (Student 3 Payload):
              </span>
              <pre
                style={{
                  background: "#0f172a",
                  color: "#4ade80",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  maxHeight: "180px",
                  overflowY: "auto",
                  fontFamily: "monospace",
                }}
              >
                {JSON.stringify(
                  finalizedModalData.outgoingTop5Payload,
                  null,
                  2,
                )}
              </pre>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(
                      finalizedModalData.outgoingTop5Payload,
                      null,
                      2,
                    ),
                  );
                  showToast(
                    "✓ Student 3 contract payload copied to clipboard!",
                  );
                }}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Copy JSON Payload
              </button>
              <button
                type="button"
                onClick={() => setFinalizedModalData(null)}
                className="btn-primary"
                style={{ padding: "8px 18px", fontSize: "13px" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 5: AI QUESTION GENERATION & HITL REVIEW DRAWER
          ========================================================= */}
      {isAiModalOpen && (
        <div
          className="popup-backdrop"
          style={{ zIndex: 1250 }}
          onClick={() => !isGeneratingAi && handleCloseAiModal()}
        >
          <div
            className="popup-card"
            style={{
              maxWidth: "780px",
              width: "100%",
              padding: "28px",
              borderRadius: "16px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SparkleIcon />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    {aiDraftResult
                      ? "AI Generated Challenge Review"
                      : "AI Question Generation"}
                  </h3>
                  <p
                    style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}
                  >
                    {aiDraftResult
                      ? "Review or customize the AI-generated coding challenge for this requisition."
                      : "Single autonomous AI agent analyzes job requirements and generates calibrated coding problems."}
                  </p>
                </div>
              </div>

              {!isGeneratingAi && (
                <button
                  type="button"
                  onClick={handleCloseAiModal}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <XIcon />
                </button>
              )}
            </div>

            {/* Content Mode 1: Configuration & Trigger */}
            {!aiDraftResult && (
              <div>
                {/* Target Requisition Info */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "18px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Target Job Requisition (Database Tool Scope)
                  </span>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "6px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {selectedJob?.title || "Selected Requisition"}
                      </h4>
                      <p
                        style={{
                          fontSize: "12.5px",
                          color: "#64748b",
                          margin: 0,
                        }}
                      >
                        {selectedJob?.department} •{" "}
                        {selectedJob?.experienceLevel} •{" "}
                        {selectedJob?.employmentType}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "#ecfdf5",
                        color: "#059669",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      Single Agent Architecture
                    </span>
                  </div>
                </div>

                {/* Question Difficulty Level */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Question Difficulty Level
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    disabled={isGeneratingAi}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      color: "#0f172a",
                      backgroundColor: "#ffffff",
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: isGeneratingAi ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="Easy">Easy — Fundamental logic & straightforward data manipulation</option>
                    <option value="Medium">Medium — Moderate complexity, standard data structures & edge cases</option>
                    <option value="Hard">Hard — Advanced algorithmic optimization & complex edge cases</option>
                  </select>
                </div>

                {/* Optional Focus Area */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Technical Focus or Specific Emphasis (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Focus on data manipulation, string parsing, sliding window, or backend API performance..."
                    value={aiFocusArea}
                    onChange={(e) => setAiFocusArea(e.target.value)}
                    disabled={isGeneratingAi}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11.5px",
                      color: "#64748b",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    The AI agent will calibrate problem difficulty to consistent{" "}
                    <strong>{aiDifficulty}</strong> level with full sample and hidden edge
                    test cases.
                  </span>
                </div>

                {/* Execution Limitations Note */}
                <div
                  style={{
                    background: "#f1f5f9",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "22px",
                    fontSize: "12px",
                    color: "#475569",
                  }}
                >
                  <strong>Execution Sandbox Guarantee:</strong> Code is
                  generated specifically for Judge0 sandbox execution. Python
                  questions use only pre-installed libraries (numpy, pandas,
                  requests, scipy, scikit-learn). All other languages are
                  strictly standard library compliant.
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    disabled={isGeneratingAi}
                    className="btn-secondary"
                    style={{ padding: "8px 18px", fontSize: "13px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerAiGeneration}
                    disabled={isGeneratingAi}
                    className="btn-primary"
                    style={{
                      padding: "8px 22px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: isGeneratingAi ? "#94a3b8" : "#00b074",
                      cursor: isGeneratingAi ? "not-allowed" : "pointer",
                    }}
                  >
                    {isGeneratingAi ? (
                      <>
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid #ffffff",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                        <span>AI Agent Generating Challenge...</span>
                      </>
                    ) : (
                      <>
                        <SparkleIcon />
                        <span>Generate Assessment Challenge</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Content Mode 2: Draft Review & HITL Actions */}
            {aiDraftResult && (
              <div>
                {/* Quarantine Warning Banner */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <CheckCircle size={18} color="#16a34a" />
                  <p
                    style={{
                      fontSize: "12.5px",
                      color: "#166534",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    <strong>Challenge Generated:</strong> Review the challenge below, then click "Edit in Full Editor" to set the expiration date, adjust time limits, and publish the assessment.
                  </p>
                </div>

                {/* Challenge Summary Card */}
                {(() => {
                  const q =
                    aiDraftResult.finalQuestions[0] ||
                    aiDraftResult.generatedQuestions[0];
                  return (
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "18px",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              fontSize: "17px",
                              fontWeight: 700,
                              color: "#0f172a",
                              margin: "0 0 6px 0",
                            }}
                          >
                            {q?.title || aiDraftResult.title}
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "#dbeafe",
                                color: "#1e40af",
                              }}
                            >
                              Language: {q?.language}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "#fef3c7",
                                color: "#d97706",
                              }}
                            >
                              Difficulty: {q?.difficulty || "Medium"}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "#ecfdf5",
                                color: "#059669",
                              }}
                            >
                              Points: {q?.points || 100}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Problem Statement Preview */}
                      <div style={{ marginBottom: "14px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#64748b",
                            textTransform: "uppercase",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Problem Statement:
                        </span>
                        <div
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "12px 14px",
                            maxHeight: "260px",
                            overflowY: "auto",
                          }}
                        >
                          <ProblemStatementViewer
                            content={q?.problemStatement}
                            theme="light"
                            compact={true}
                          />
                        </div>
                      </div>

                      {/* Starter Code Preview */}
                      <div style={{ marginBottom: "14px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#64748b",
                            textTransform: "uppercase",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Starter Stub (Provided to Candidate):
                        </span>
                        <pre
                          style={{
                            background: "#0f172a",
                            color: "#f8fafc",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            fontSize: "11.5px",
                            maxHeight: "120px",
                            overflowY: "auto",
                            margin: 0,
                            fontFamily: "monospace",
                          }}
                        >
                          {q?.starterCode}
                        </pre>
                      </div>

                      {/* Test Cases Count Preview */}
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                          fontSize: "12px",
                          color: "#475569",
                          background: "#f1f5f9",
                          padding: "10px 14px",
                          borderRadius: "8px",
                        }}
                      >
                        <span>
                          • <strong>{q?.sampleTestCases?.length || 2}</strong>{" "}
                          Sample Test Cases (Candidate Visible)
                        </span>
                        <span>
                          • <strong>{q?.hiddenTestCases?.length || 3}</strong>{" "}
                          Hidden Edge Cases (Grading Sandbox)
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* HITL Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={handleCloseAiModal}
                      className="btn-secondary"
                      style={{ padding: "8px 16px", fontSize: "13px" }}
                    >
                      Close (Keep as Draft)
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardAiDraft}
                      style={{
                        padding: "8px 14px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#ef4444",
                        background: "none",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Discard Draft
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const track = aiDraftResult;
                        setIsAiModalOpen(false);
                        setAiDraftResult(null);
                        handleOpenEditModal(track);
                      }}
                      className="btn-primary"
                      style={{
                        padding: "8px 20px",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#00b074",
                        cursor: "pointer",
                      }}
                    >
                      <Pencil size={15} />
                      <span>Edit in Full Editor</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          CONFIRM HIRE CANDIDATE MODAL
          ========================================================= */}
      {hiringCandidate && (
        <div
          className="popup-backdrop"
          style={{
            zIndex: 1350,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isHiringSubmitting) {
              setHiringCandidate(null);
            }
          }}
        >
          <div
            className="popup-card"
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.25)",
              maxWidth: "520px",
              width: "100%",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              animation: "scaleIn 0.2s ease-out",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "22px 24px",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "#ffffff",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={22} color="#fde047" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#ffffff" }}>
                    Confirm Candidate Hiring
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "#a7f3d0", fontWeight: 500 }}>
                    Official job offer & hire placement decision
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isHiringSubmitting && setHiringCandidate(null)}
                style={{
                  position: "absolute",
                  top: "18px",
                  right: "18px",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#ffffff",
                }}
              >
                <XIcon />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Candidate</span>
                  <span style={{ fontSize: "13.5px", color: "#0f172a", fontWeight: 750 }}>
                    {hiringCandidate.candidateName || "Candidate"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Email</span>
                  <span style={{ fontSize: "12.5px", color: "#334155", fontWeight: 600 }}>
                    {hiringCandidate.candidateEmail || "—"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Target Role</span>
                  <span style={{ fontSize: "13px", color: "#059669", fontWeight: 750 }}>
                    {hiringCandidate.jobTitle || selectedJob?.title || "Position"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Technical Score</span>
                  <span style={{ fontSize: "13px", color: "#0f172a", fontWeight: 750 }}>
                    {hiringCandidate.examScore ?? 0}%
                  </span>
                </div>
              </div>

              {/* Celebratory Notice / Explanation */}
              <div
                style={{
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: "#d1fae5",
                    padding: "6px",
                    borderRadius: "8px",
                    color: "#059669",
                    marginTop: "2px",
                  }}
                >
                  <TrophyIcon />
                </div>
                <div style={{ fontSize: "12.5px", color: "#065f46", lineHeight: 1.55 }}>
                  <strong>Candidate Dashboard Notification:</strong> Upon clicking <strong>Confirm & Hire</strong>, this candidate's <em>My Interviews</em> section will immediately display an official congratulatory hiring card with onboarding next steps.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setHiringCandidate(null)}
                disabled={isHiringSubmitting}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmHire}
                disabled={isHiringSubmitting}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 750,
                  cursor: isHiringSubmitting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
                  opacity: isHiringSubmitting ? 0.7 : 1,
                }}
              >
                {isHiringSubmitting ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Processing Hire...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} color="#fde047" />
                    <span>Confirm & Hire Candidate 🎉</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: CONNECT FOR INTERVIEW - SCHEDULE / RESCHEDULE
          ========================================================= */}
      {isScheduleModalOpen && schedulingCandidate && (
        <div
          className="popup-backdrop"
          style={{
            zIndex: 1300,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => {
            if (!isSubmittingSchedule) setIsScheduleModalOpen(false);
          }}
        >
          <div
            className="popup-card"
            style={{
              maxWidth: "600px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)",
              maxHeight: "92vh",
              overflowY: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: schedulingCandidate.scheduledEventId ? "#ecfdf5" : "#f5f3ff",
                    color: schedulingCandidate.scheduledEventId ? "#059669" : "#7c3aed",
                    border: `1px solid ${schedulingCandidate.scheduledEventId ? "#a7f3d0" : "#ddd6fe"}`,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  {schedulingCandidate.scheduledEventId ? (
                    <CalendarClock size={12} />
                  ) : (
                    <CalendarPlus size={12} />
                  )}
                  <span>
                    {schedulingCandidate.scheduledEventId
                      ? "Reschedule Interview"
                      : "Connect for Interview"}
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {schedulingCandidate.scheduledEventId
                    ? `Reschedule: ${schedulingCandidate.candidateName || "Candidate"}`
                    : `Schedule Interview: ${schedulingCandidate.candidateName || "Candidate"}`}
                </h2>
                <p
                  style={{
                    fontSize: "12.5px",
                    color: "#64748b",
                    margin: "4px 0 0 0",
                  }}
                >
                  Coordinate candidate interview date, timing, and meeting mode. Approved interviews sync with Monthly Planner and candidate's dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isSubmittingSchedule}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <XIcon />
              </button>
            </div>

            {/* Candidate & Role Summary Pill */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                  {schedulingCandidate.candidateName || "Candidate"}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {schedulingCandidate.candidateEmail}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#334155",
                    display: "block",
                  }}
                >
                  {schedulingCandidate.jobTitle || selectedJob?.title || "Requisition"}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    display: "inline-block",
                    marginTop: "2px",
                  }}
                >
                  {schedulingCandidate.department || selectedJob?.department || "General"}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Date */}
              <div>
                <label
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#334155",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Interview Date <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    color: "#0f172a",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Timing (Start & End) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: "#334155",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Start Time <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      color: "#0f172a",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: "#334155",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    End Time <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      color: "#0f172a",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Quick Duration Buttons */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748b" }}>
                  Quick Interval:
                </span>
                {[
                  { label: "30 Min", mins: 30 },
                  { label: "45 Min", mins: 45 },
                  { label: "1 Hour", mins: 60 },
                ].map((dur) => (
                  <button
                    key={dur.label}
                    type="button"
                    onClick={() => {
                      if (!scheduleStartTime) return;
                      const [h, m] = scheduleStartTime.split(":").map(Number);
                      const totalMins = (h || 9) * 60 + (m || 0) + dur.mins;
                      const newH = Math.floor(totalMins / 60) % 24;
                      const newM = totalMins % 60;
                      setScheduleEndTime(
                        `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`
                      );
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    +{dur.label}
                  </button>
                ))}
              </div>

              {/* Meeting Mode Selector */}
              <div>
                <label
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#334155",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Meeting Mode <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setScheduleMeetingMode("Online")}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border:
                        scheduleMeetingMode === "Online"
                          ? "2px solid #2563eb"
                          : "1px solid #cbd5e1",
                      background: scheduleMeetingMode === "Online" ? "#eff6ff" : "#ffffff",
                      color: scheduleMeetingMode === "Online" ? "#1e40af" : "#475569",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontWeight: 700,
                      fontSize: "13px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Video size={16} />
                    <span>Online (Video Call)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleMeetingMode("Physical")}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border:
                        scheduleMeetingMode === "Physical"
                          ? "2px solid #00b074"
                          : "1px solid #cbd5e1",
                      background: scheduleMeetingMode === "Physical" ? "#ecfdf5" : "#ffffff",
                      color: scheduleMeetingMode === "Physical" ? "#047857" : "#475569",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontWeight: 700,
                      fontSize: "13px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <MapPin size={16} />
                    <span>Physical (In-Person)</span>
                  </button>
                </div>
              </div>

              {/* Conditional Location / Link Input */}
              {scheduleMeetingMode === "Online" ? (
                <div>
                  <label
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: "#334155",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Meeting Link URL <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={scheduleMeetingLink}
                    onChange={(e) => setScheduleMeetingLink(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      color: "#0f172a",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11.5px",
                      color: "#64748b",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    Candidate will receive this meeting link directly in their Candidate Dashboard "My Interviews" section.
                  </span>
                </div>
              ) : (
                <div>
                  <label
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: "#334155",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Interview Place / Room Address <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Head Office, Conference Room B, 3rd Floor"
                    value={scheduleLocation}
                    onChange={(e) => setScheduleLocation(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      color: "#0f172a",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11.5px",
                      color: "#64748b",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    Candidate will see this venue address in their Candidate Dashboard "My Interviews" section.
                  </span>
                </div>
              )}

              {/* Optional Notes */}
              <div>
                <label
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#334155",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Notes / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring photo ID, prepare 5-min project presentation..."
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    color: "#0f172a",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Live Clash Warning Alert */}
              {(() => {
                const targetDept = schedulingCandidate.department || selectedJob?.department;
                const clash = checkClash(
                  scheduleDate,
                  scheduleStartTime,
                  scheduleEndTime,
                  schedulingCandidate.scheduledEventId,
                  targetDept,
                  schedulingCandidate.candidateId
                );
                if (clash) {
                  return (
                    <div
                      style={{
                        background: "#fff1f2",
                        border: "1px solid #fecaca",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        color: "#991b1b",
                        fontSize: "12.5px",
                        lineHeight: 1.4,
                      }}
                    >
                      <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <div style={{ fontWeight: 800 }}>Schedule Clash Detected</div>
                        <div>
                          The selected time slot ({scheduleStartTime} - {scheduleEndTime}) on {scheduleDate} is already booked for:
                          <strong style={{ marginLeft: "4px" }}>
                            "{clash.title}" ({clash.eventTime})
                          </strong>
                          {clash.department ? ` (${clash.department})` : ""}.
                          Please select an available time slot.
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Error Alert */}
              {scheduleError && (
                <div
                  style={{
                    background: "#fff1f2",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#b91c1c",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{scheduleError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "24px",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "16px",
              }}
            >
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isSubmittingSchedule}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApproveSchedule}
                disabled={
                  isSubmittingSchedule ||
                  Boolean(
                    checkClash(
                      scheduleDate,
                      scheduleStartTime,
                      scheduleEndTime,
                      schedulingCandidate.scheduledEventId,
                      schedulingCandidate.department || selectedJob?.department,
                      schedulingCandidate.candidateId
                    )
                  )
                }
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: schedulingCandidate.scheduledEventId
                    ? "linear-gradient(135deg, #059669 0%, #00b074 100%)"
                    : "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor:
                    isSubmittingSchedule ||
                    Boolean(
                      checkClash(
                        scheduleDate,
                        scheduleStartTime,
                        scheduleEndTime,
                        schedulingCandidate.scheduledEventId,
                        schedulingCandidate.department || selectedJob?.department,
                        schedulingCandidate.candidateId
                      )
                    )
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    isSubmittingSchedule ||
                    Boolean(
                      checkClash(
                        scheduleDate,
                        scheduleStartTime,
                        scheduleEndTime,
                        schedulingCandidate.scheduledEventId,
                        schedulingCandidate.department || selectedJob?.department,
                        schedulingCandidate.candidateId
                      )
                    )
                      ? 0.6
                      : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                }}
              >
                {schedulingCandidate.scheduledEventId ? (
                  <CalendarClock size={15} />
                ) : (
                  <CheckCircle size={15} />
                )}
                <span>
                  {isSubmittingSchedule
                    ? "Saving Interview..."
                    : schedulingCandidate.scheduledEventId
                      ? "Approve & Update Schedule"
                      : "Approve & Schedule Interview"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* BATCH CANDIDATE INTERVIEWS SCHEDULING MODAL */}
      {/* ========================================== */}
      {isBatchModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => {
            if (!isSubmittingBatch) setIsBatchModalOpen(false);
          }}
        >
          <div
            className="popup-card"
            style={{
              maxWidth: "1180px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)",
              maxHeight: "92vh",
              overflowY: "auto",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "16px",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#f5f3ff",
                    color: "#7c3aed",
                    border: "1px solid #ddd6fe",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  <Users size={12} />
                  <span>Batch Candidate Scheduling</span>
                </div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  Schedule Candidate Interviews
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: "4px 0 0 0",
                  }}
                >
                  Select candidates with ticks, assign interview slots, and dispatch meeting links directly to candidate dashboards and the Monthly Planner.
                </p>
              </div>

              {/* Top Right Corner Feature: Apply Same Link or Location to Selected Candidates */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {/* Apply Common Link Tool */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "4px 8px 4px 12px",
                  }}
                >
                  <Link size={14} color="#7c3aed" />
                  <input
                    type="text"
                    placeholder="Paste common meeting link..."
                    value={commonMeetingLinkInput}
                    onChange={(e) => setCommonMeetingLinkInput(e.target.value)}
                    style={{
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "12px",
                      width: "190px",
                      color: "#0f172a",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCommonLinkToSelected}
                    title="Apply this common meeting link to all currently checked candidates"
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#7c3aed",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 4px rgba(124, 58, 237, 0.2)",
                    }}
                  >
                    <Copy size={12} />
                    <span>Apply Same Link to Selected</span>
                  </button>
                </div>

                {/* Apply Common Location Tool */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "4px 8px 4px 12px",
                  }}
                >
                  <MapPin size={14} color="#059669" />
                  <input
                    type="text"
                    placeholder="Enter common venue / location..."
                    value={commonLocationInput}
                    onChange={(e) => setCommonLocationInput(e.target.value)}
                    style={{
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "12px",
                      width: "190px",
                      color: "#0f172a",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCommonLocationToSelected}
                    title="Apply this common interview venue/location to all currently checked candidates"
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#059669",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
                    }}
                  >
                    <MapPin size={12} />
                    <span>Apply Same Location to Selected</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  disabled={isSubmittingBatch}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filter and Date Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "12px 18px",
                border: "1px solid #e2e8f0",
                marginBottom: "16px",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              {/* Department Dropdown Selection */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Filter size={14} color="#64748b" />
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                  Filter Department:
                </label>
                <select
                  value={batchDeptFilter}
                  onChange={(e) => setBatchDeptFilter(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "12.5px",
                    color: "#0f172a",
                    fontWeight: 600,
                    outline: "none",
                  }}
                >
                  <option value="all">
                    All Departments ({interviewSelections.length})
                  </option>
                  {Array.from(
                    new Set(
                      interviewSelections
                        .map((s) => s.department || "General")
                        .filter(Boolean)
                    )
                  ).map((d) => (
                    <option key={d} value={d}>
                      {d} (
                      {
                        interviewSelections.filter(
                          (s) => (s.department || "General") === d
                        ).length
                      }
                      )
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Interview Date */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ClockIcon />
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                  Interview Date:
                </label>
                <input
                  type="date"
                  value={batchDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setBatchDate(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "12.5px",
                    color: "#0f172a",
                    fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Candidates Table in Form */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                overflow: "hidden",
                marginBottom: "20px",
              }}
            >
              <div style={{ overflowX: "auto", maxHeight: "48vh" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "12.5px",
                  }}
                >
                  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <tr
                      style={{
                        background: "#f1f5f9",
                        borderBottom: "1px solid #cbd5e1",
                        color: "#334155",
                        fontWeight: 700,
                      }}
                    >
                      {/* Checkbox Header */}
                      <th style={{ padding: "10px 14px", width: "36px", textAlign: "center" }}>
                        {(() => {
                          const visible = interviewSelections.filter(
                            (s) =>
                              batchDeptFilter === "all" ||
                              (s.department || "General") === batchDeptFilter
                          );
                          const allChecked =
                            visible.length > 0 &&
                            visible.every((s) => batchCandidatesMap[s.id]?.selected);
                          return (
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={(e) => {
                                const checkVal = e.target.checked;
                                setBatchCandidatesMap((prev) => {
                                  const next = { ...prev };
                                  visible.forEach((s) => {
                                    if (next[s.id]) {
                                      next[s.id] = { ...next[s.id], selected: checkVal };
                                    }
                                  });
                                  return next;
                                });
                              }}
                              style={{
                                cursor: "pointer",
                                width: "16px",
                                height: "16px",
                                accentColor: "#7c3aed",
                              }}
                            />
                          );
                        })()}
                      </th>
                      <th style={{ padding: "10px 14px" }}>Candidate</th>
                      <th style={{ padding: "10px 14px" }}>Job Requisition &amp; Dept</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Interview Status</th>
                      <th style={{ padding: "10px 14px", width: "130px" }}>Start Time</th>
                      <th style={{ padding: "10px 14px", width: "130px" }}>End Time</th>
                      <th style={{ padding: "10px 14px", width: "120px" }}>Delivery Mode</th>
                      <th style={{ padding: "10px 14px", minWidth: "150px" }}>Location</th>
                      <th style={{ padding: "10px 14px", minWidth: "180px" }}>Meeting Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const visible = interviewSelections.filter(
                        (s) =>
                          batchDeptFilter === "all" ||
                          (s.department || "General") === batchDeptFilter
                      );

                      if (visible.length === 0) {
                        return (
                          <tr>
                            <td
                              colSpan={9}
                              style={{
                                padding: "36px",
                                textAlign: "center",
                                color: "#64748b",
                              }}
                            >
                              No shortlisted candidates found for this department.
                            </td>
                          </tr>
                        );
                      }

                      return visible.map((s) => {
                        const cfg = batchCandidatesMap[s.id] || {
                          selected: false,
                          startTime: "09:00",
                          endTime: "09:30",
                          meetingMode: "Online",
                          meetingLink: "",
                          location: "Online",
                        };
                        const isSelected = Boolean(cfg.selected);
                        const targetDept = s.department || selectedJob?.department;
                        const clash = checkClash(
                          batchDate,
                          cfg.startTime,
                          cfg.endTime,
                          s.scheduledEventId,
                          targetDept,
                          s.candidateId
                        );

                        return (
                          <tr
                            key={s.id}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background: isSelected ? "#faf5ff" : "#ffffff",
                              transition: "background 0.1s ease",
                            }}
                          >
                            {/* Checkbox / Tick */}
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleCandidateSelect(s.id)}
                                style={{
                                  cursor: "pointer",
                                  width: "16px",
                                  height: "16px",
                                  accentColor: "#7c3aed",
                                }}
                              />
                            </td>

                            {/* Candidate */}
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                {s.candidateName || "Candidate"}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                {s.candidateEmail}
                              </div>
                            </td>

                            {/* Job Requisition & Dept */}
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 650, color: "#1e293b" }}>
                                {s.jobTitle || "Job Requisition"}
                              </div>
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  background: "#f1f5f9",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  color: "#475569",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                {s.department || "General"}
                              </span>
                            </td>

                            {/* Interview Status */}
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              {s.scheduledEventId || s.status === "Ready for Interview" || s.status?.toLowerCase().includes("ready") ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "3px 8px",
                                    borderRadius: "999px",
                                    background: "#ecfdf5",
                                    color: "#059669",
                                    border: "1px solid #a7f3d0",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                  }}
                                >
                                  <CheckCircle size={11} color="#059669" />
                                  <span>Ready for Interview</span>
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "3px 8px",
                                    borderRadius: "999px",
                                    background: "#f5f3ff",
                                    color: "#7c3aed",
                                    border: "1px solid #ddd6fe",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                  }}
                                >
                                  <Star size={11} fill="#7c3aed" color="#7c3aed" />
                                  <span>Selected</span>
                                </span>
                              )}
                            </td>

                            {/* Start Time */}
                            <td style={{ padding: "12px 14px" }}>
                              <input
                                type="time"
                                value={cfg.startTime}
                                disabled={!isSelected}
                                onChange={(e) =>
                                  handleUpdateCandidateConfig(s.id, "startTime", e.target.value)
                                }
                                style={{
                                  padding: "6px 8px",
                                  borderRadius: "6px",
                                  border: `1px solid ${isSelected && clash ? "#ef4444" : "#cbd5e1"}`,
                                  background: isSelected ? "#ffffff" : "#f8fafc",
                                  fontSize: "12px",
                                  outline: "none",
                                  width: "100%",
                                  boxSizing: "border-box",
                                }}
                              />
                            </td>

                            {/* End Time */}
                            <td style={{ padding: "12px 14px" }}>
                              <input
                                type="time"
                                value={cfg.endTime}
                                disabled={!isSelected}
                                onChange={(e) =>
                                  handleUpdateCandidateConfig(s.id, "endTime", e.target.value)
                                }
                                style={{
                                  padding: "6px 8px",
                                  borderRadius: "6px",
                                  border: `1px solid ${isSelected && clash ? "#ef4444" : "#cbd5e1"}`,
                                  background: isSelected ? "#ffffff" : "#f8fafc",
                                  fontSize: "12px",
                                  outline: "none",
                                  width: "100%",
                                  boxSizing: "border-box",
                                }}
                              />
                              {isSelected && clash && (
                                <div
                                  style={{
                                    color: "#dc2626",
                                    fontSize: "10.5px",
                                    fontWeight: 700,
                                    marginTop: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                >
                                  <AlertTriangle size={11} color="#dc2626" />
                                  <span>Clash: '{clash.title}' ({clash.eventTime})</span>
                                </div>
                              )}
                            </td>

                            {/* Delivery Mode Dropdown */}
                            <td style={{ padding: "12px 14px" }}>
                              <select
                                value={cfg.meetingMode || "Online"}
                                disabled={!isSelected}
                                onChange={(e) =>
                                  handleUpdateCandidateConfig(
                                    s.id,
                                    "meetingMode",
                                    e.target.value
                                  )
                                }
                                style={{
                                  padding: "6px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "12px",
                                  fontWeight: 650,
                                  color:
                                    (cfg.meetingMode || "Online") === "Online"
                                      ? "#0369a1"
                                      : "#b45309",
                                  background:
                                    (cfg.meetingMode || "Online") === "Online"
                                      ? "#e0f2fe"
                                      : "#fef3c7",
                                  outline: "none",
                                  cursor: isSelected ? "pointer" : "not-allowed",
                                  width: "100%",
                                  boxSizing: "border-box",
                                }}
                              >
                                <option value="Online">Online</option>
                                <option value="Physical">Physical</option>
                              </select>
                            </td>

                            {/* Location Column */}
                            <td style={{ padding: "12px 14px" }}>
                              {(cfg.meetingMode || "Online") === "Online" ? (
                                <input
                                  type="text"
                                  value="Online"
                                  disabled
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    background: "#f1f5f9",
                                    color: "#64748b",
                                    fontSize: "12px",
                                    width: "100%",
                                    boxSizing: "border-box",
                                    cursor: "not-allowed",
                                    fontWeight: 600,
                                  }}
                                  title="Location is Online for virtual interviews"
                                />
                              ) : (
                                <input
                                  type="text"
                                  placeholder="e.g. Skill-Hub HQ, 4th Floor..."
                                  value={cfg.location}
                                  disabled={!isSelected}
                                  onChange={(e) =>
                                    handleUpdateCandidateConfig(
                                      s.id,
                                      "location",
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    background: isSelected ? "#ffffff" : "#f8fafc",
                                    color: "#0f172a",
                                    fontSize: "12px",
                                    width: "100%",
                                    boxSizing: "border-box",
                                    outline: "none",
                                  }}
                                />
                              )}
                            </td>

                            {/* Meeting Link */}
                            <td style={{ padding: "12px 14px" }}>
                              {(cfg.meetingMode || "Online") === "Physical" ? (
                                <input
                                  type="text"
                                  value="Physical"
                                  disabled
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    background: "#f1f5f9",
                                    color: "#64748b",
                                    fontSize: "12px",
                                    width: "100%",
                                    boxSizing: "border-box",
                                    cursor: "not-allowed",
                                    fontWeight: 600,
                                  }}
                                  title="Meeting link is not required for physical interviews"
                                />
                              ) : (
                                <input
                                  type="text"
                                  placeholder="https://meet.google.com/..."
                                  value={cfg.meetingLink}
                                  disabled={!isSelected}
                                  onChange={(e) =>
                                    handleUpdateCandidateConfig(
                                      s.id,
                                      "meetingLink",
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    background: isSelected ? "#ffffff" : "#f8fafc",
                                    fontSize: "12px",
                                    width: "100%",
                                    boxSizing: "border-box",
                                    outline: "none",
                                  }}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Error Banner */}
            {batchError && (
              <div
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#991b1b",
                  fontSize: "12.5px",
                }}
              >
                <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{batchError}</span>
              </div>
            )}

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "16px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                <strong>
                  {interviewSelections.filter((s) => batchCandidatesMap[s.id]?.selected).length}
                </strong>{" "}
                candidate(s) ticked for interview scheduling on <strong>{batchDate}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  disabled={isSubmittingBatch}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApproveBatch}
                  disabled={
                    isSubmittingBatch ||
                    interviewSelections.filter((s) => batchCandidatesMap[s.id]?.selected).length === 0
                  }
                  style={{
                    padding: "9px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor:
                      isSubmittingBatch ||
                      interviewSelections.filter((s) => batchCandidatesMap[s.id]?.selected).length === 0
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      isSubmittingBatch ||
                      interviewSelections.filter((s) => batchCandidatesMap[s.id]?.selected).length === 0
                        ? 0.6
                        : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)",
                  }}
                >
                  <CheckCircle size={15} />
                  <span>
                    {isSubmittingBatch
                      ? "Scheduling Interviews..."
                      : `Approve (${
                          interviewSelections.filter((s) => batchCandidatesMap[s.id]?.selected).length
                        } Selected)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* AI INTERVIEW SLOT GENERATOR MODAL (STUDENT 3) */}
      {/* ========================================== */}
      <AiInterviewSchedulerModal
        isOpen={isAiInterviewSchedulerModalOpen}
        onClose={() => setIsAiInterviewSchedulerModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          loadInterviewSelections();
        }}
        initialJobVacancyId={
          interviewJobFilter !== "all" ? interviewJobFilter : selectedJob?.id
        }
        availableJobs={jobs}
      />
    </div>
  );
};
