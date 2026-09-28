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
import { ProblemStatementViewer } from '../components/assessment';
import './CandidateExam.css';

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
  const isSubmittedRef = useRef<boolean>(false);

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

        // Prepopulate code and language for each question from starter templates
        const initialAnswers: Record<string, { code: string; language: string }> = {};
        paper.questions.forEach((q) => {
          const qLang = (q.language || 'csharp').toLowerCase();
          const runtime = SUPPORTED_RUNTIMES.find(
            (r) => r.id === qLang || r.monacoLang === qLang || r.pistonLang === qLang
          );
          const resolvedLangId = runtime ? runtime.id : 'csharp';
          const defaultCode = q.starterCode || DEFAULT_STARTER_TEMPLATES[resolvedLangId] || `// Solution for ${q.title}\n`;

          initialAnswers[q.id] = {
            code: defaultCode,
            language: resolvedLangId,
          };
        });
        setAnswers(initialAnswers);

        // Strict One-Attempt Check: if already started or blocked, block re-entry
        const isAlreadyStarted = paper.status === 'Started' || paper.status === 'In_Progress' || !!paper.startedAt;
        const isBlocked = paper.status === 'Blocked';

        if (isBlocked || isAlreadyStarted) {
          assessmentsApi.blockAssessment(submissionId).catch(() => {});
          setErrorMessage('This technical assessment has been blocked and cannot be retaken because the test session was closed or exited.');
          setPhase('error');
          return;
        }

        setRemainingSeconds(paper.timeLimitMinutes * 60);
        setPhase('briefing');
      } catch (err: unknown) {
        console.error('Failed to load exam paper:', err);
        const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
        setErrorMessage(
          errorObj?.response?.data?.message ||
            errorObj?.message ||
            'Could not load assessment paper. It may have expired, been blocked, or already been completed.'
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

  // Window unload / unmount hook: strictly block assessment if candidate closes tab, refreshes, or navigates away
  useEffect(() => {
    if (phase !== 'in_progress' || !submissionId) return;

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5155/api';
    const blockUrl = `${apiBase}/Assessments/take/${submissionId}/block`;

    const handleExit = () => {
      if (isSubmittedRef.current) return;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(blockUrl, { method: 'POST', keepalive: true, headers }).catch(() => {});
      } catch {
        // ignore
      }
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(blockUrl);
        }
      } catch {
        // ignore
      }
      try {
        localStorage.removeItem(`exam_draft_${submissionId}`);
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('pagehide', handleExit);

    return () => {
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('pagehide', handleExit);
      if (!isSubmittedRef.current) {
        handleExit();
        assessmentsApi.blockAssessment(submissionId).catch(() => {});
      }
    };
  }, [phase, submissionId]);

  const handleAutoSubmit = useCallback(async () => {
    if (phase !== 'in_progress' || !submissionId || !examPaper) return;
    isSubmittedRef.current = true;
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
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, handleAutoSubmit]);

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
    isSubmittedRef.current = true;
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
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 12px' }}>
            {errorMessage?.toLowerCase().includes('block') || errorMessage?.toLowerCase().includes('retake')
              ? 'Assessment Blocked'
              : 'Assessment Unavailable'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 24px' }}>
            {errorMessage || 'The assessment link is invalid, expired, or has already been completed.'}
          </p>
          <button
            onClick={() => navigate('/candidate/assessments')}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #00b074 100%)',
              color: '#ffffff',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 176, 116, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            Return to Technical Assessments
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
      <div className="exam-briefing-wrapper">
        <div className="exam-briefing-card">
          <div className="exam-briefing-header">
            <div className="exam-briefing-icon-badge">
              <CodeIcon size={22} />
            </div>
            <div className="exam-briefing-header-text">
              <div className="exam-briefing-badge-row">
                <span className="exam-briefing-category-badge">
                  Candidate Technical Examination
                </span>
              </div>
              <h1 className="exam-briefing-title">
                {examPaper.assessmentTitle}
              </h1>
            </div>
          </div>

          <p className="exam-briefing-description">
            You have been invited to complete a technical coding assessment. Your solutions will be evaluated against automated test suites and reviewed by the technical hiring panel.
          </p>

          {/* 2-Column Clean Meta Row */}
          <div className="exam-briefing-meta-grid">
            <div className="exam-briefing-meta-card">
              <div className="exam-briefing-meta-icon">
                <ClockIcon />
              </div>
              <div>
                <span className="exam-briefing-meta-label">
                  Duration
                </span>
                <div className="exam-briefing-meta-val">
                  {examPaper.timeLimitMinutes} Minutes
                </div>
              </div>
            </div>

            <div className="exam-briefing-meta-card">
              <div className="exam-briefing-meta-icon">
                <CodeIcon size={18} />
              </div>
              <div>
                <span className="exam-briefing-meta-label">
                  Challenges
                </span>
                <div className="exam-briefing-meta-val">
                  {examPaper.questions.length} {examPaper.questions.length === 1 ? 'Problem' : 'Problems'}
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Protocol */}
          <div className="exam-briefing-protocol-card">
            <h3 className="exam-briefing-protocol-title">
              <span className="exam-briefing-shield-icon"><ShieldCheckIcon /></span>
              <span>Assessment Guidelines &amp; Integrity Protocol</span>
            </h3>

            {/* Prominent One-Attempt Security Warning */}
            <div className="exam-briefing-warning-card">
              <div className="exam-briefing-warning-icon">
                <AlertTriangleIcon size={18} />
              </div>
              <div className="exam-briefing-warning-content">
                <strong className="exam-briefing-warning-title">
                  Strict One-Attempt Security Policy:
                </strong>
                If you close the browser tab, refresh the page, or navigate back during the active test, the assessment will immediately be terminated and permanently blocked. You cannot retake or resume this assessment once exited.
              </div>
            </div>

            <ul className="exam-briefing-rules-list">
              <li>
                <strong>Tab Switching Monitored:</strong> Navigating between tabs or losing window focus is strictly monitored and recorded in your proctoring audit log.
              </li>
              <li>
                <strong>Timer &amp; Auto-Submit:</strong> The countdown timer starts immediately upon beginning. When time expires, answers submit automatically.
              </li>
              <li>
                <strong>Run &amp; Submit:</strong> Use <strong>Run</strong> to test code against sample test cases, and <strong>Submit</strong> when you are ready to finalize.
              </li>
            </ul>
          </div>

          <button
            onClick={handleStartExam}
            className="exam-briefing-start-btn"
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
      <header className="exam-workspace-header">
        <div className="exam-brand-group">
          <div className="exam-brand-icon">
            <CodeIcon size={16} />
          </div>
          <div>
            <span className="exam-brand-tag">
              LIVE CODING ASSESSMENT
            </span>
            <div className="exam-brand-title">
              {examPaper.assessmentTitle}
            </div>
          </div>
        </div>

        {/* Center: Proctoring Pill & Timer */}
        <div className="exam-status-group">
          <div className="exam-proctor-pill">
            <span className="exam-proctor-dot" />
            <span>Proctoring Active</span>
            {tabSwitches > 0 && (
              <span className="exam-proctor-alert-count">
                {tabSwitches} alert{tabSwitches > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className={`exam-timer-pill ${isTimeCritical ? 'critical' : ''}`}>
            <ClockIcon />
            <span>{formatTime(remainingSeconds)}</span>
          </div>
        </div>

        {/* Right: Question Navigation & Submit CTA */}
        <div className="exam-header-actions">
          {/* Question Navigator Pills */}
          {examPaper.questions.length > 1 && (
            <div style={{ display: 'flex', gap: '5px', marginRight: '6px' }}>
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
                    className={`exam-q-pill ${isSelected ? 'active' : ''}`}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setShowSubmitModal(true)}
            className="exam-submit-header-btn"
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
        <div className="exam-cheat-alert-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: '#f87171', display: 'flex', flexShrink: 0 }}>
              <AlertTriangleIcon size={18} />
            </div>
            <span>
              <strong>Integrity Alert:</strong> {cheatWarningMessage} Tab switches and window focus losses are permanently
              logged to your candidate proctoring audit log.
            </span>
          </div>
          <button
            onClick={() => setShowCheatWarning(false)}
            className="exam-cheat-close-btn"
            aria-label="Dismiss alert"
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
          className="exam-left-panel"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Header Badges */}
          <div className="exam-left-panel-badge-row">
            <span
              className={`exam-diff-badge ${
                currentQuestion.difficulty?.toLowerCase() === 'easy'
                  ? 'easy'
                  : currentQuestion.difficulty?.toLowerCase() === 'hard'
                  ? 'hard'
                  : 'medium'
              }`}
            >
              {currentQuestion.difficulty || 'Medium'}
            </span>

            <span className="exam-points-badge">
              {currentQuestion.points} Points
            </span>

            <span className="exam-runtime-badge">
              {currentRuntime.label.split(' ')[0]}
            </span>
          </div>

          <h2 className="exam-problem-heading">
            {currentQuestion.title}
          </h2>

          {/* Formatted Problem Statement with Rich UI Sections */}
          <div style={{ marginBottom: '22px' }}>
            <ProblemStatementViewer
              content={currentQuestion.problemStatement}
              theme="dark"
            />
          </div>

          {/* Input/Output Format & Constraints (if present in problem or structured) */}
          <div style={{ marginBottom: '22px' }}>
            <h4 className="exam-section-title">
              Execution Constraints
            </h4>
            <div className="exam-constraints-card">
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
          className="exam-resizer-h"
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
            <div className="exam-code-toolbar">
              {/* Language Selector Dropdown */}
              <div className="exam-toolbar-left">
                <span className="exam-toolbar-label">Language:</span>
                <select
                  value={currentLang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="exam-toolbar-select"
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
                  className="exam-reset-link-btn"
                >
                  Reset Template
                </button>
              </div>

              {/* Action Buttons: Run & Submit */}
              <div className="exam-toolbar-right">
                {/* RUN Button */}
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isExecuting}
                  className="exam-run-btn"
                >
                  {isExecuting ? (
                    <>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          border: '2px solid #34d399',
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
                  className="exam-submit-btn"
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
            className="exam-resizer-v"
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
            <div className="exam-output-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveOutputTab('console')}
                  className="exam-output-tab-btn"
                >
                  <TerminalIcon />
                  <span>Execution Output</span>
                </button>
              </div>

              {/* Execution Time & Exit Code */}
              {lastRunResult && !isExecuting && (
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Exit Code: <strong style={{ color: lastRunResult.exitCode === 0 ? '#00b074' : '#f87171' }}>{lastRunResult.exitCode}</strong>
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
              ) : executionError && !lastRunResult ? (
                /* 2. System / Network Error State */
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
                    <span>Execution Error</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>{executionError}</div>
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
                </div>
              ) : lastRunResult ? (
                /* 3. Output Results (Clean Terminal Runner) */
                <div>
                  {executionError && (
                    <div
                      style={{
                        backgroundColor: '#ef444415',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#fca5a5',
                        marginBottom: '14px',
                        fontSize: '0.8rem',
                      }}
                    >
                      {executionError}
                    </div>
                  )}

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

                  {/* Runtime Error / Standard Error */}
                  {lastRunResult.stderr && (
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>
                        {lastRunResult.exitCode !== 0 ? 'RUNTIME ERROR / STDERR:' : 'STDERR:'}
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

                  {/* Execution Error (if no stderr or compileOutput) */}
                  {lastRunResult.isError && !lastRunResult.compileOutput && !lastRunResult.stderr && lastRunResult.errorMessage && (
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>
                        EXECUTION ERROR:
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
                        {lastRunResult.errorMessage}
                      </pre>
                    </div>
                  )}

                  {/* Non-zero Exit Code Notice */}
                  {lastRunResult.exitCode !== 0 && !lastRunResult.compileOutput && !lastRunResult.stderr && !lastRunResult.errorMessage && (
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>
                        TERMINAL STATUS:
                      </span>
                      <div
                        style={{
                          margin: '4px 0 0',
                          backgroundColor: '#1f1515',
                          border: '1px solid #7f1d1d',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          color: '#fca5a5',
                          fontSize: '0.82rem',
                        }}
                      >
                        Process terminated with non-zero exit code ({lastRunResult.exitCode}).
                      </div>
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
                      {lastRunResult.stdout || (lastRunResult.exitCode !== 0 ? '<No standard output produced>' : '<No standard output>')}
                    </pre>
                  </div>
                </div>
              ) : (
                /* 4. Empty State */
                <div style={{ color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                  Click &ldquo;<strong>Run</strong>&rdquo; to execute your code in the sandbox,
                  or &ldquo;<strong>Submit</strong>&rdquo; to finalize your exam.
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
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div className="exam-submit-modal-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 12px' }}>
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
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderLeft: '3.5px solid #ef4444',
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
                className="exam-modal-cancel-btn"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="exam-modal-confirm-btn"
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
