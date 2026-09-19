import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  assessmentsApi,
  type StartExamResponseDto,
  type CandidateCodingQuestionDto,
  type SubmissionDetailDto,
  type SubmittedAnswerItemDto,
  type RunCodeResponseDto,
} from '../services/api';
import {
  ClockIcon,
  CheckIcon,
  XIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '../components/common/Icons';

// Lazy-load Monaco Editor so it only loads when the assessment screen mounts
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

type ExamPhase = 'loading' | 'briefing' | 'in_progress' | 'submitting' | 'completed' | 'error';

interface SupportedRuntime {
  id: string;
  label: string;
  monacoLang: string;
  pistonLang: string;
  version: string;
}

const SUPPORTED_RUNTIMES: SupportedRuntime[] = [
  { id: 'python', label: 'Python (3.10.0)', monacoLang: 'python', pistonLang: 'python', version: '3.10.0' },
  { id: 'javascript', label: 'JavaScript Node.js (18.15.0)', monacoLang: 'javascript', pistonLang: 'javascript', version: '18.15.0' },
  { id: 'typescript', label: 'TypeScript (5.0.3)', monacoLang: 'typescript', pistonLang: 'typescript', version: '5.0.3' },
  { id: 'csharp', label: 'C# (.NET 5.0.201)', monacoLang: 'csharp', pistonLang: 'csharp.net', version: '5.0.201' },
  { id: 'java', label: 'Java (15.0.2)', monacoLang: 'java', pistonLang: 'java', version: '15.0.2' },
  { id: 'cpp', label: 'C++ GCC (10.2.0)', monacoLang: 'cpp', pistonLang: 'c++', version: '10.2.0' },
  { id: 'go', label: 'Go (1.16.2)', monacoLang: 'go', pistonLang: 'go', version: '1.16.2' },
];

const DEFAULT_STARTER_TEMPLATES: Record<string, string> = {
  python: `def solution():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solution()`,
  javascript: `function solution() {\n    // Write your solution here\n}\n\nsolution();`,
  typescript: `function solution(): void {\n    // Write your solution here\n}\n\nsolution();`,
  csharp: `using System;\n\npublic class Solution\n{\n    public static void Main(string[] args)\n    {\n        // Write your solution here\n    }\n}`,
  java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println("Solution")\n}`,
};

const PlayIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const TerminalIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const CodeIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const AlertTriangleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const CandidateExam: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  // Primary Exam State
  const [phase, setPhase] = useState<ExamPhase>(submissionId ? 'loading' : 'error');
  const [errorMessage, setErrorMessage] = useState<string | null>(
    submissionId ? null : 'No assessment submission ID provided in the URL.'
  );
  const [examPaper, setExamPaper] = useState<StartExamResponseDto | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);

  // Per-question answer and language tracking
  const [answers, setAnswers] = useState<Record<string, { code: string; language: string }>>({});
  const [finalResult, setFinalResult] = useState<SubmissionDetailDto | null>(null);

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Proctoring & Anti-cheat telemetry
  const [tabSwitches, setTabSwitches] = useState<number>(0);
  const [showCheatWarning, setShowCheatWarning] = useState<boolean>(false);
  const [cheatWarningMessage, setCheatWarningMessage] = useState<string>('');

  // Execution & Output State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [lastRunResult, setLastRunResult] = useState<RunCodeResponseDto | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<'console' | 'tests'>('console');

  // Submit confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Panel Resizing State (Adjustable Width & Height)
  // -------------------------------------------------------------
  // Left problem panel width in percentage (default: 32%)
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(32);
  // Code editor height in percentage of right column (default: 60%)
  const [codePanelHeight, setCodePanelHeight] = useState<number>(60);

  const isDraggingH = useRef<boolean>(false);
  const isDraggingV = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  // Handle Horizontal Resize (Width)
  const handleMouseDownH = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingH.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle Vertical Resize (Height)
  const handleMouseDownV = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingV.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingH.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        // Clamp left width between 20% and 55%
        if (newWidth >= 20 && newWidth <= 55) {
          setLeftPanelWidth(newWidth);
        }
      } else if (isDraggingV.current && rightColRef.current) {
        const rect = rightColRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        // Clamp code panel height between 30% and 80%
        if (newHeight >= 30 && newHeight <= 80) {
          setCodePanelHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingH.current || isDraggingV.current) {
        isDraggingH.current = false;
        isDraggingV.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // -------------------------------------------------------------
  // 1. Initial Load: Fetch Candidate Exam Paper
  // -------------------------------------------------------------
  useEffect(() => {
    if (!submissionId) return;

    const fetchPaper = async () => {
      try {
        const paper = await assessmentsApi.getExamPaper(submissionId);
        setExamPaper(paper);

        // Check localStorage for offline / recent backup
        let localDraft: { remainingSeconds?: number; answers?: Record<string, { code: string; language: string }> } | null = null;
        try {
          const cached = localStorage.getItem(`exam_draft_${submissionId}`);
          if (cached) localDraft = JSON.parse(cached);
        } catch {
          // ignore parsing error
        }

        // Map draft answers from backend if available
        const backendDraftMap: Record<string, { code: string; language: string }> = {};
        if (paper.draftAnswers && paper.draftAnswers.length > 0) {
          paper.draftAnswers.forEach((ans) => {
            if (ans.questionId) {
              backendDraftMap[ans.questionId] = {
                code: ans.submittedCode,
                language: ans.language || 'csharp',
              };
            }
          });
        }

        // Prepopulate code and language for each question (priority: localDraft > backendDraft > starterCode)
        const initialAnswers: Record<string, { code: string; language: string }> = {};
        paper.questions.forEach((q) => {
          const qLang = (q.language || 'csharp').toLowerCase();
          const runtime = SUPPORTED_RUNTIMES.find(
            (r) => r.id === qLang || r.monacoLang === qLang || r.pistonLang === qLang
          );
          const resolvedLangId = runtime ? runtime.id : 'csharp';
          const defaultCode = q.starterCode || DEFAULT_STARTER_TEMPLATES[resolvedLangId] || `// Solution for ${q.title}\n`;

          const savedCode = localDraft?.answers?.[q.id]?.code ?? backendDraftMap[q.id]?.code;
          const savedLang = localDraft?.answers?.[q.id]?.language ?? backendDraftMap[q.id]?.language;

          initialAnswers[q.id] = {
            code: savedCode !== undefined ? savedCode : defaultCode,
            language: savedLang || resolvedLangId,
          };
        });
        setAnswers(initialAnswers);

        // Determine if exam was already started
        const isAlreadyStarted = paper.status === 'Started' || paper.status === 'In_Progress' || !!paper.startedAt;

        if (isAlreadyStarted) {
          // Restore remaining time: priority: localDraft > paper.remainingSeconds > calculated from startedAt
          let secondsLeft: number;
          if (typeof localDraft?.remainingSeconds === 'number' && localDraft.remainingSeconds > 0) {
            secondsLeft = localDraft.remainingSeconds;
          } else if (typeof paper.remainingSeconds === 'number' && paper.remainingSeconds > 0) {
            secondsLeft = paper.remainingSeconds;
          } else if (paper.startedAt) {
            const startedTime = new Date(paper.startedAt).getTime();
            const elapsedSeconds = Math.floor((Date.now() - startedTime) / 1000);
            const totalLimitSeconds = paper.timeLimitMinutes * 60;
            secondsLeft = Math.max(0, totalLimitSeconds - elapsedSeconds);
          } else {
            secondsLeft = paper.timeLimitMinutes * 60;
          }

          setRemainingSeconds(secondsLeft);
          setPhase('in_progress');
        } else {
          setRemainingSeconds(paper.timeLimitMinutes * 60);
          setPhase('briefing');
        }
      } catch (err: unknown) {
        console.error('Failed to load exam paper:', err);
        const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
        setErrorMessage(
          errorObj?.response?.data?.message ||
            errorObj?.message ||
            'Could not load assessment paper. It may have expired or already been completed.'
        );
        setPhase('error');
      }
    };

    fetchPaper();
  }, [submissionId]);

  // -------------------------------------------------------------
  // 2. Proctoring Telemetry: Detect Tab Switches & Window Blurs
  // -------------------------------------------------------------
  const lastViolationTimeRef = useRef<number>(0);

  const logProctorViolation = useCallback(
    async (reason: string) => {
      if (phase !== 'in_progress' || !submissionId) return;

      // Deduplicate: browsers fire both 'blur' and 'visibilitychange' simultaneously on tab switch
      const now = Date.now();
      if (now - lastViolationTimeRef.current < 1200) return;
      lastViolationTimeRef.current = now;

      setTabSwitches((prev) => prev + 1);
      setCheatWarningMessage(reason);
      setShowCheatWarning(true);

      setTimeout(() => setShowCheatWarning(false), 6000);

      try {
        await assessmentsApi.logProctorEvent(submissionId, {
          eventType: 'TAB_SWITCH',
          timestamp: new Date().toISOString(),
          details: reason,
        });
      } catch (err) {
        console.warn('Failed to report proctor event:', err);
      }
    },
    [phase, submissionId]
  );

  useEffect(() => {
    if (phase !== 'in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logProctorViolation('Tab switched or minimized away from the exam window.');
      }
    };

    const handleWindowBlur = () => {
      logProctorViolation('Window focus lost. Please keep focus on the technical assessment.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [phase, logProctorViolation]);

  // -------------------------------------------------------------
  // 3. Countdown Timer & Draft Autosave Management
  // -------------------------------------------------------------
  const remainingSecondsRef = useRef(remainingSeconds);
  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const saveDraftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraftNow = useCallback(
    async (currentSec?: number, currentAns?: Record<string, { code: string; language: string }>) => {
      if (!submissionId || !examPaper) return;
      const sec = currentSec ?? remainingSecondsRef.current;
      const ans = currentAns ?? answersRef.current;

      // 1. Immediately save snapshot to localStorage for instantaneous recovery
      try {
        localStorage.setItem(
          `exam_draft_${submissionId}`,
          JSON.stringify({
            remainingSeconds: sec,
            answers: ans,
          })
        );
      } catch {
        // ignore quota errors
      }

      // 2. Persist to backend database
      try {
        const payloadAnswers: SubmittedAnswerItemDto[] = examPaper.questions.map((q) => ({
          questionId: q.id,
          submittedCode: ans[q.id]?.code || '',
          language: ans[q.id]?.language || q.language || 'csharp',
        }));

        await assessmentsApi.saveDraft(submissionId, {
          remainingSeconds: sec,
          answers: payloadAnswers,
        });
      } catch (err) {
        console.warn('Failed to save exam draft to backend:', err);
      }
    },
    [submissionId, examPaper]
  );

  const triggerDebouncedSaveDraft = useCallback(() => {
    if (!submissionId || phase !== 'in_progress' || !examPaper) return;

    // Instant local storage backup
    try {
      localStorage.setItem(
        `exam_draft_${submissionId}`,
        JSON.stringify({
          remainingSeconds: remainingSecondsRef.current,
          answers: answersRef.current,
        })
      );
    } catch {
      // ignore
    }

    if (saveDraftTimeoutRef.current) {
      clearTimeout(saveDraftTimeoutRef.current);
    }
    saveDraftTimeoutRef.current = setTimeout(() => {
      void saveDraftNow();
    }, 1500);
  }, [submissionId, phase, examPaper, saveDraftNow]);

  // Window unload / unmount hook: ensure last-second code and timer are captured
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (phase === 'in_progress' && submissionId) {
        try {
          localStorage.setItem(
            `exam_draft_${submissionId}`,
            JSON.stringify({
              remainingSeconds: remainingSecondsRef.current,
              answers: answersRef.current,
            })
          );
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (phase === 'in_progress') {
        handleBeforeUnload();
      }
    };
  }, [phase, submissionId]);

  const handleAutoSubmit = useCallback(async () => {
    if (phase !== 'in_progress' || !submissionId || !examPaper) return;
    setPhase('submitting');

    try {
      const payloadAnswers: SubmittedAnswerItemDto[] = examPaper.questions.map((q) => ({
        questionId: q.id,
        submittedCode: answers[q.id]?.code || '',
        language: answers[q.id]?.language || q.language || 'csharp',
      }));

      const res = await assessmentsApi.submitExam(submissionId, { answers: payloadAnswers });
      localStorage.removeItem(`exam_draft_${submissionId}`);
      setFinalResult(res);
      setPhase('completed');
    } catch (err: unknown) {
      console.error('Auto-submit error:', err);
      setErrorMessage('Assessment time expired. An error occurred while submitting answers.');
      setPhase('error');
    }
  }, [phase, submissionId, examPaper, answers]);

  useEffect(() => {
    if (phase !== 'in_progress') return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        const next = prev - 1;
        // Periodically sync remaining time to DB and localStorage every 15s
        if (next % 15 === 0) {
          void saveDraftNow(next);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, handleAutoSubmit, saveDraftNow]);

  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // 4. Action: Start Exam (from Briefing)
  // -------------------------------------------------------------
  const handleStartExam = async () => {
    if (!submissionId) return;
    try {
      setPhase('loading');
      const paper = await assessmentsApi.startExam(submissionId);
      setExamPaper(paper);
      const initialSec =
        typeof paper.remainingSeconds === 'number' && paper.remainingSeconds > 0
          ? paper.remainingSeconds
          : paper.timeLimitMinutes * 60;
      setRemainingSeconds(initialSec);
      setPhase('in_progress');
    } catch (err: unknown) {
      console.error('Failed to start exam:', err);
      setPhase('in_progress');
    }
  };

  // -------------------------------------------------------------
  // 5. Code Editor Helpers
  // -------------------------------------------------------------
  const currentQuestion: CandidateCodingQuestionDto | undefined = examPaper?.questions[currentQIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentCode = currentAnswer?.code ?? '';
  const currentLang = currentAnswer?.language ?? 'python';
  const currentRuntime = SUPPORTED_RUNTIMES.find((r) => r.id === currentLang) || SUPPORTED_RUNTIMES[0];

  const handleCodeChange = (newCode: string) => {
    if (!currentQuestion) return;
    const updated = {
      ...answers,
      [currentQuestion.id]: {
        code: newCode,
        language: answers[currentQuestion.id]?.language || currentLang,
      },
    };
    setAnswers(updated);
    answersRef.current = updated;
    triggerDebouncedSaveDraft();
  };

  const handleLanguageChange = (newLangId: string) => {
    if (!currentQuestion) return;
    const oldCode = answers[currentQuestion.id]?.code || '';
    const oldDefault = DEFAULT_STARTER_TEMPLATES[currentLang] || '';

    // If code is unchanged from default template, auto-replace with new language template
    const shouldReplaceTemplate = !oldCode.trim() || oldCode.trim() === oldDefault.trim();
    const newCode = shouldReplaceTemplate
      ? (DEFAULT_STARTER_TEMPLATES[newLangId] || `// Write your ${newLangId} solution here\n`)
      : oldCode;

    const updated = {
      ...answers,
      [currentQuestion.id]: {
        code: newCode,
        language: newLangId,
      },
    };
    setAnswers(updated);
    answersRef.current = updated;
    triggerDebouncedSaveDraft();
  };

  const handleResetStarterCode = () => {
    if (!currentQuestion) return;
    if (window.confirm('Reset code to starter template? Current edits will be lost.')) {
      const template = currentQuestion.starterCode || DEFAULT_STARTER_TEMPLATES[currentLang] || '// Solution\n';
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          code: template,
          language: currentLang,
        },
      }));
      setLastRunResult(null);
      setExecutionError(null);
    }
  };

  // -------------------------------------------------------------
  // 6. Action: "Run" (Execute against sample test case)
  // -------------------------------------------------------------
  const handleRunCode = async () => {
    if (!submissionId || !currentQuestion) return;
    setIsExecuting(true);
    setExecutionError(null);
    setActiveOutputTab('console');

    try {
      const res = await assessmentsApi.runCode(submissionId, {
        questionId: currentQuestion.id,
        code: currentCode,
        language: currentRuntime.pistonLang,
      });

      setLastRunResult(res);
      if (res.isRateLimited) {
        setExecutionError('Execution service is busy (HTTP 429). Please wait a few seconds and try again.');
      } else if (res.isError && res.errorMessage) {
        setExecutionError(res.errorMessage);
      }
    } catch (err: unknown) {
      console.error('Run code error:', err);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setExecutionError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to execute code in runtime sandbox.'
      );
    } finally {
      setIsExecuting(false);
    }
  };

  // -------------------------------------------------------------
  // 7. Action: "Submit" (Execute against all test cases & finalize)
  // -------------------------------------------------------------
  const handleConfirmSubmit = async () => {
    if (!submissionId || !examPaper) return;
    setShowSubmitModal(false);
    setPhase('submitting');

    try {
      const payloadAnswers: SubmittedAnswerItemDto[] = examPaper.questions.map((q) => ({
        questionId: q.id,
        submittedCode: answers[q.id]?.code || '',
        language: answers[q.id]?.language || q.language || 'csharp',
      }));

      const res = await assessmentsApi.submitExam(submissionId, { answers: payloadAnswers });
      localStorage.removeItem(`exam_draft_${submissionId}`);
      setFinalResult(res);
      setPhase('completed');
    } catch (err: unknown) {
      console.error('Failed to submit exam:', err);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Failed to submit assessment answers. Please try again.'
      );
      setPhase('in_progress');
    }
  };

  const answeredCount = examPaper
    ? examPaper.questions.filter((q) => {
        const item = answers[q.id];
        return item && item.code.trim().length > 15;
      }).length
    : 0;

  // =============================================================
  // RENDER PHASE: LOADING
  // =============================================================
  if (phase === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '4px solid #334155',
            borderTopColor: '#3b82f6',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px',
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Initializing Secure Assessment Environment...</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '8px' }}>
          Loading coding questions, Monaco Editor, and sandboxed runtimes.
        </p>
      </div>
    );
  }

  // =============================================================
  // RENDER PHASE: ERROR
  // =============================================================
  if (phase === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '36px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#ef444420',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <XIcon />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 12px' }}>Assessment Unavailable</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 24px' }}>
            {errorMessage || 'The assessment link is invalid, expired, or has already been completed.'}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Return to Skill Hub
          </button>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER PHASE: BRIEFING & INTEGRITY AGREEMENT
  // =============================================================
  if (phase === 'briefing' && examPaper) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
                flexShrink: 0,
              }}
            >
              <CodeIcon size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60a5fa', fontWeight: 700 }}>
                Candidate Technical Examination
              </span>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '2px 0 0', color: '#ffffff', letterSpacing: '-0.01em' }}>
                {examPaper.assessmentTitle}
              </h1>
            </div>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
            You have been invited to complete a technical coding assessment. Your solutions will be evaluated against automated test suites and reviewed by the technical hiring panel.
          </p>

          {/* 2-Column Clean Meta Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(148, 163, 184, 0.08)',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  flexShrink: 0,
                }}
              >
                <ClockIcon />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Duration
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {examPaper.timeLimitMinutes} Minutes
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(148, 163, 184, 0.08)',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  flexShrink: 0,
                }}
              >
                <CodeIcon size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Challenges
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {examPaper.questions.length} {examPaper.questions.length === 1 ? 'Problem' : 'Problems'}
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Protocol */}
          <div style={{ backgroundColor: '#0f172a80', border: '1px solid #334155', borderRadius: '10px', padding: '18px 20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheckIcon /> Assessment Guidelines &amp; Integrity Protocol
            </h3>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '0.825rem', lineHeight: 1.75 }}>
              <li>
                <strong style={{ color: '#e2e8f0' }}>Single-Window Policy:</strong> Switching tabs or navigating away from this window is monitored and recorded in your proctoring audit log.
              </li>
              <li>
                <strong style={{ color: '#e2e8f0' }}>Timer &amp; Auto-Submit:</strong> The countdown timer starts immediately upon beginning. When time expires, answers submit automatically.
              </li>
              <li>
                <strong style={{ color: '#e2e8f0' }}>Run &amp; Submit:</strong> Use <strong>Run</strong> to test code against sample test cases, and <strong>Submit</strong> when you are ready to finalize.
              </li>
            </ul>
          </div>

          <button
            onClick={handleStartExam}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <span>Begin Assessment</span>
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER PHASE: SUBMITTING
  // =============================================================
  if (phase === 'submitting') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '4px solid #334155',
            borderTopColor: '#10b981',
            animation: 'spin 1s linear infinite',
            marginBottom: '24px',
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Grading Your Code Submissions...</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '8px' }}>
          Executing test suites, evaluating edge cases, and storing your evaluation report.
        </p>
      </div>
    );
  }

  // =============================================================
  // RENDER PHASE: COMPLETED (3-4 WORKING DAYS REVIEW NOTICE)
  // =============================================================
  if (phase === 'completed' && finalResult) {
    const tabInfractions = finalResult.proctorSummary?.tabSwitches ?? tabSwitches;

    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '620px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '20px',
            padding: '44px 36px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#10b98120',
              border: '2px solid #10b98140',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckIcon />
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 800,
              color: '#38bdf8',
              backgroundColor: '#0369a120',
              border: '1px solid #0284c740',
              padding: '4px 12px',
              borderRadius: '999px',
              display: 'inline-block',
              marginBottom: '12px',
            }}
          >
            SUBMISSION COMPLETE • UNDER REVIEW
          </span>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 12px', color: '#ffffff' }}>
            {finalResult.assessmentTitle}
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 auto 24px', maxWidth: '480px', lineHeight: 1.6 }}>
            Your code has been securely submitted and stored in the evaluation registry.
          </p>

          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f59e0b20', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClockIcon />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Results Published in 3–4 Working Days
              </h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Our engineering evaluation panel and hiring team will review your typed code solutions.
              Once finalized, your technical marks, performance scorecard, and technical interview decision will be published directly to your profile.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#0f172a80',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '28px',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                STATUS
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px', display: 'block' }}>
                Under Review
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                QUESTIONS SUBMITTED
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px', display: 'block' }}>
                {finalResult.answers?.length || examPaper?.questions?.length || 0} Problems
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                PROCTOR TELEMETRY
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: tabInfractions === 0 ? '#10b981' : '#f59e0b', marginTop: '4px', display: 'block' }}>
                {tabInfractions === 0 ? 'Verified Clean (0)' : `${tabInfractions} Alert(s)`}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/candidate/assessments')}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            }}
          >
            <span>Done &amp; Return to Technical Assessments</span>
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER PHASE: LIVE EXAM (3-PANEL SIMULTANEOUS SPLIT VIEW)
  // =============================================================
  if (!examPaper || !currentQuestion) {
    return null;
  }

  const isTimeCritical = remainingSeconds <= 300;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* -------------------------------------------------------------
          TOP BAR: TIMER, PROCTORING TELEMETRY & SUBMIT ACTION
          ------------------------------------------------------------- */}
      <header
        style={{
          height: '56px',
          borderBottom: '1px solid #334155',
          backgroundColor: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CodeIcon size={16} />
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              LIVE CODING ASSESSMENT
            </span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {examPaper.assessmentTitle}
            </div>
          </div>
        </div>

        {/* Center: Proctoring Pill & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '0.75rem',
              color: '#cbd5e1',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            <span>Proctoring Active</span>
            {tabSwitches > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  marginLeft: '4px',
                }}
              >
                {tabSwitches} alert{tabSwitches > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isTimeCritical ? '#ef444420' : '#0f172a',
              border: `1px solid ${isTimeCritical ? '#ef4444' : '#334155'}`,
              borderRadius: '8px',
              padding: '5px 12px',
              color: isTimeCritical ? '#ef4444' : '#f8fafc',
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.05em',
            }}
          >
            <ClockIcon />
            <span>{formatTime(remainingSeconds)}</span>
          </div>
        </div>

        {/* Right: Question Navigation & Submit CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Question Navigator Pills */}
          {examPaper.questions.length > 1 && (
            <div style={{ display: 'flex', gap: '4px', marginRight: '6px' }}>
              {examPaper.questions.map((q, idx) => {
                const isSelected = idx === currentQIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQIndex(idx);
                      setLastRunResult(null);
                      setExecutionError(null);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#2563eb' : '#0f172a',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      border: isSelected ? '1px solid #3b82f6' : '1px solid #334155',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckIcon />
            <span>Submit Exam ({answeredCount}/{examPaper.questions.length})</span>
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------
          PROCTORING ANTI-CHEAT WARNING BANNER
          ------------------------------------------------------------- */}
      {showCheatWarning && (
        <div
          style={{
            backgroundColor: '#ef4444',
            color: '#ffffff',
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangleIcon size={18} />
            <span>
              <strong>Integrity Alert:</strong> {cheatWarningMessage} Tab switches and window focus losses are permanently
              logged to your candidate proctoring audit log.
            </span>
          </div>
          <button
            onClick={() => setShowCheatWarning(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          MAIN 3-PANEL RESIZABLE WORKSPACE
          ------------------------------------------------------------- */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* =========================================================
            PANEL 1: PROBLEM PANEL (LEFT SIDE, ~30% WIDTH, RESIZABLE)
            ========================================================= */}
        <div
          style={{
            width: `${leftPanelWidth}%`,
            height: '100%',
            overflowY: 'auto',
            padding: '20px 22px',
            backgroundColor: '#0b1120',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
        >
          {/* Header Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span
              style={{
                backgroundColor:
                  currentQuestion.difficulty?.toLowerCase() === 'easy'
                    ? '#10b98120'
                    : currentQuestion.difficulty?.toLowerCase() === 'hard'
                    ? '#ef444420'
                    : '#f59e0b20',
                color:
                  currentQuestion.difficulty?.toLowerCase() === 'easy'
                    ? '#10b981'
                    : currentQuestion.difficulty?.toLowerCase() === 'hard'
                    ? '#ef4444'
                    : '#f59e0b',
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {currentQuestion.difficulty || 'Medium'}
            </span>

            <span
              style={{
                backgroundColor: '#334155',
                color: '#cbd5e1',
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              {currentQuestion.points} Points
            </span>

            <span
              style={{
                backgroundColor: '#1e293b',
                color: '#60a5fa',
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {currentRuntime.label.split(' ')[0]}
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 14px' }}>
            {currentQuestion.title}
          </h2>

          {/* Problem Statement */}
          <div
            style={{
              color: '#cbd5e1',
              fontSize: '0.88rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              marginBottom: '22px',
            }}
          >
            {currentQuestion.problemStatement}
          </div>

          {/* Input/Output Format & Constraints (if present in problem or structured) */}
          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Execution Constraints
            </h4>
            <div style={{ backgroundColor: '#1e293b80', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <div>• Time Limit: <strong>5.0 seconds</strong> per test case</div>
              <div>• Memory Limit: <strong>256 MB</strong></div>
              <div>• Isolated execution sandbox</div>
            </div>
          </div>

          {/* Sample Test Cases (Examples) */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 10px' }}>
              Sample Examples
            </h4>

            {currentQuestion.sampleTestCases && currentQuestion.sampleTestCases.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQuestion.sampleTestCases.map((tc, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
                      EXAMPLE {idx + 1}
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>INPUT:</span>
                      <pre
                        style={{
                          margin: '3px 0 0',
                          backgroundColor: '#0f172a',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          color: '#e2e8f0',
                          fontFamily: 'Consolas, monospace',
                        }}
                      >
                        {tc.input}
                      </pre>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>EXPECTED OUTPUT:</span>
                      <pre
                        style={{
                          margin: '3px 0 0',
                          backgroundColor: '#0f172a',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          color: '#10b981',
                          fontFamily: 'Consolas, monospace',
                        }}
                      >
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#1e293b80',
                  border: '1px dashed #334155',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                }}
              >
                No visible sample test cases provided. Write and test your solution in the code editor.
              </div>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------------
            HORIZONTAL RESIZER (DRAGGABLE DIVIDER BETWEEN LEFT & RIGHT)
            ------------------------------------------------------------- */}
        <div
          onMouseDown={handleMouseDownH}
          title="Drag to resize Problem Panel and Code Workspace width"
          style={{
            width: '6px',
            backgroundColor: '#1e293b',
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderLeft: '1px solid #334155',
            borderRight: '1px solid #334155',
            transition: 'background-color 0.15s',
          }}
          onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#3b82f6')}
          onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b')}
        >
          <div style={{ width: '2px', height: '24px', backgroundColor: '#64748b', borderRadius: '1px' }} />
        </div>

        {/* =========================================================
            RIGHT COLUMN CONTAINER (CODE PANEL + OUTPUT PANEL)
            ========================================================= */}
        <div
          ref={rightColRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
          }}
        >
          {/* =========================================================
              PANEL 2: CODE PANEL (TOP-RIGHT, ~60% HEIGHT, RESIZABLE)
              ========================================================= */}
          <div
            style={{
              height: `${codePanelHeight}%`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: '#1e1e1e', // Monaco dark editor background
            }}
          >
            {/* Code Panel Header Toolbar */}
            <div
              style={{
                height: '42px',
                backgroundColor: '#1e293b',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px',
                flexShrink: 0,
              }}
            >
              {/* Language Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Language:</span>
                <select
                  value={currentLang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {SUPPORTED_RUNTIMES.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleResetStarterCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '2px 6px',
                  }}
                >
                  Reset Template
                </button>
              </div>

              {/* Action Buttons: Run & Submit */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* RUN Button */}
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isExecuting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isExecuting ? '#334155' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: isExecuting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {isExecuting ? (
                    <>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon />
                      <span>Run</span>
                    </>
                  )}
                </button>

                {/* SUBMIT Button */}
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <CheckIcon />
                  <span>Submit</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor (Lazy Loaded) */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <React.Suspense
                fallback={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      backgroundColor: '#1e1e1e',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid #334155',
                        borderTopColor: '#3b82f6',
                        animation: 'spin 1s linear infinite',
                        marginRight: '10px',
                      }}
                    />
                    <span>Loading Monaco Code Editor...</span>
                  </div>
                }
              >
                <MonacoEditor
                  height="100%"
                  language={currentRuntime.monacoLang}
                  value={currentCode}
                  onChange={(val) => handleCodeChange(val || '')}
                  theme="vs-dark"
                  options={{
                    fontSize: 13.5,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    tabSize: 4,
                    fontFamily: '"Fira Code", "Cascadia Code", Consolas, Monaco, monospace',
                  }}
                />
              </React.Suspense>
            </div>
          </div>

          {/* -------------------------------------------------------------
              VERTICAL RESIZER (DRAGGABLE DIVIDER BETWEEN CODE & OUTPUT)
              ------------------------------------------------------------- */}
          <div
            onMouseDown={handleMouseDownV}
            title="Drag to resize Code Editor and Output Panel height"
            style={{
              height: '6px',
              backgroundColor: '#1e293b',
              cursor: 'row-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderTop: '1px solid #334155',
              borderBottom: '1px solid #334155',
              transition: 'background-color 0.15s',
            }}
            onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#3b82f6')}
            onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b')}
          >
            <div style={{ height: '2px', width: '24px', backgroundColor: '#64748b', borderRadius: '1px' }} />
          </div>

          {/* =========================================================
              PANEL 3: OUTPUT PANEL (BOTTOM-RIGHT, ~40% HEIGHT, RESIZABLE)
              ========================================================= */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#090d16',
              overflow: 'hidden',
            }}
          >
            {/* Output Panel Header Tabs */}
            <div
              style={{
                height: '38px',
                backgroundColor: '#111827',
                borderBottom: '1px solid #1f2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveOutputTab('console')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    color: activeOutputTab === 'console' ? '#38bdf8' : '#94a3b8',
                    borderBottom: activeOutputTab === 'console' ? '2px solid #38bdf8' : '2px solid transparent',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '8px 10px',
                    cursor: 'pointer',
                  }}
                >
                  <TerminalIcon />
                  <span>Execution Output</span>
                </button>

                {lastRunResult?.samplePassed !== null && lastRunResult?.samplePassed !== undefined && (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      backgroundColor: lastRunResult.samplePassed ? '#065f4630' : '#991b1b30',
                      border: `1px solid ${lastRunResult.samplePassed ? '#059669' : '#dc2626'}`,
                      color: lastRunResult.samplePassed ? '#34d399' : '#f87171',
                    }}
                  >
                    Sample Case 1: {lastRunResult.samplePassed ? 'PASSED ✓' : 'FAILED ✕'}
                  </span>
                )}
              </div>

              {/* Execution Time & Exit Code */}
              {lastRunResult && !isExecuting && (
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Exit Code: <strong style={{ color: lastRunResult.exitCode === 0 ? '#10b981' : '#f87171' }}>{lastRunResult.exitCode}</strong>
                  {' • '}
                  Time: <strong>{lastRunResult.executionTimeMs}ms</strong>
                </div>
              )}
            </div>

            {/* Output Panel Content Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 16px',
                fontFamily: 'Consolas, "Fira Code", monospace',
                fontSize: '0.84rem',
                color: '#e2e8f0',
              }}
            >
              {/* 1. Loading State */}
              {isExecuting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', padding: '12px 0' }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid #38bdf8',
                      borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Executing code in secure sandbox ({currentRuntime.label})...</span>
                </div>
              ) : executionError ? (
                /* 2. Error / Rate Limit State */
                <div
                  style={{
                    backgroundColor: '#ef444415',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: '#fca5a5',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangleIcon size={16} />
                    <span>{lastRunResult?.isRateLimited ? 'Rate Limit Exceeded (429)' : 'Execution Error'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>{executionError}</div>
                  {lastRunResult?.isRateLimited && (
                    <button
                      type="button"
                      onClick={handleRunCode}
                      style={{
                        marginTop: '10px',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Retry Run
                    </button>
                  )}
                </div>
              ) : lastRunResult ? (
                /* 3. Output Results */
                <div>
                  {/* Compiler Errors if any */}
                  {lastRunResult.compileOutput && (
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>
                        COMPILATION ERROR:
                      </span>
                      <pre
                        style={{
                          margin: '4px 0 0',
                          backgroundColor: '#1f1515',
                          border: '1px solid #7f1d1d',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          color: '#fca5a5',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5,
                        }}
                      >
                        {lastRunResult.compileOutput}
                      </pre>
                    </div>
                  )}

                  {/* Standard Output */}
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      STDOUT:
                    </span>
                    <pre
                      style={{
                        margin: '4px 0 0',
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        color: '#f1f5f9',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                      }}
                    >
                      {lastRunResult.stdout || '<No standard output>'}
                    </pre>
                  </div>

                  {/* Standard Error */}
                  {lastRunResult.stderr && (
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>
                        STDERR:
                      </span>
                      <pre
                        style={{
                          margin: '4px 0 0',
                          backgroundColor: '#1f1515',
                          border: '1px solid #7f1d1d',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          color: '#fca5a5',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5,
                        }}
                      >
                        {lastRunResult.stderr}
                      </pre>
                    </div>
                  )}

                  {/* Sample Test Comparison */}
                  {(lastRunResult.expectedOutput || (currentQuestion?.sampleTestCases && currentQuestion.sampleTestCases.length > 0)) && (
                    <div
                      style={{
                        backgroundColor: '#1e293b80',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Sample Test Case 1 Evaluation:
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>Input: </span>
                        <code style={{ color: '#e2e8f0', backgroundColor: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>
                          {lastRunResult.sampleInputUsed || currentQuestion?.sampleTestCases?.[0]?.input || '<none>'}
                        </code>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>Expected Output: </span>
                        <code style={{ color: '#10b981', backgroundColor: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>
                          {lastRunResult.expectedOutput || currentQuestion?.sampleTestCases?.[0]?.expectedOutput || '<none>'}
                        </code>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>Your Output: </span>
                        <code style={{
                          color: lastRunResult.samplePassed ? '#10b981' : '#f87171',
                          backgroundColor: '#0f172a',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}>
                          {lastRunResult.stdout?.trim() || '<empty>'}
                        </code>
                      </div>
                      {lastRunResult.samplePassed === false && (
                        <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px', lineHeight: 1.4 }}>
                          <strong>Format Tip:</strong> Automated test grading expects exact matching. If the problem asks for <code>42</code>, use <code>print(maximum)</code> instead of <code>print(&quot;Maximum number:&quot;, maximum)</code>.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* 4. Empty State */
                <div style={{ color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                  Click &ldquo;<strong>Run</strong>&rdquo; to execute your code against the sample test case in the sandbox,
                  or &ldquo;<strong>Submit</strong>&rdquo; to evaluate against all test cases and finalize your exam.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SUBMIT CONFIRMATION MODAL
          ------------------------------------------------------------- */}
      {showSubmitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px' }}>
              Submit Technical Assessment?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              You have answered <strong>{answeredCount}</strong> out of{' '}
              <strong>{examPaper.questions.length}</strong> coding challenge(s). Once submitted, automated test runners
              will execute your solutions against all test suites, and your score will be forwarded to the recruitment team.
            </p>

            {tabSwitches > 0 && (
              <div
                style={{
                  backgroundColor: '#ef444420',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: '#fca5a5',
                  marginBottom: '20px',
                }}
              >
                Note: <strong>{tabSwitches} window blur/tab switch event(s)</strong> have been recorded in your proctoring telemetry.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Confirm &amp; Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
