/**
 * CvEvaluationPanel.tsx
 *
 * AI CV Evaluation Side Drawer — Full-Detail View with Scroll.
 *
 * Layout Architecture (3-part flex column, fills 100% of the drawer height):
 *   ┌─────────────────────────────┐  ← sticky header (shrink-0)
 *   │  Sticky Top Bar             │
 *   ├─────────────────────────────┤
 *   │  Scrollable Body            │  ← flex:1, overflowY:auto
 *   │   · Hero Score Card         │
 *   │   · Recommendation          │
 *   │   · Skills Match Analysis   │
 *   │     – Strengths chips       │
 *   │     – Skill Gaps chips      │
 *   │   · Validator Adjustments   │
 *   │   · Evaluation Meta         │
 *   ├─────────────────────────────┤
 *   │  Sticky Footer (Actions)    │  ← sticky bottom (shrink-0)
 *   └─────────────────────────────┘
 *
 * THEME: Matches CandidateProfileReadOnly ("View CV") design language exactly.
 *   --cv-primary:      #059669
 *   --cv-primary-dark: #047857
 *   --cv-primary-soft: #ecfdf5
 *   Brand primary:     #00b074 / #009663
 *
 * Props:
 *   onClose — called when the panel's own X button is clicked
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  cvEvaluationApi,
  jobApplicationsApi,
  type CvEvaluationResultDto,
} from '../../services/api';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CvEvaluationPanelProps {
  candidateId: string;
  jobId: string;
  applicationId: string;
  candidateName: string;
  /** Called when the X close button inside the panel header is clicked */
  onClose?: () => void;
  /** Called after a successful Approve & Shortlist action */
  onApproved?: (evaluationId: string) => void;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const SparkleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const TargetIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LightbulbIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
);

const ShieldCheckIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11.5 14.5 15.5 9.5" />
  </svg>
);

const ShieldXIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const HourglassIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  </svg>
);

// ─── Score Ring ───────────────────────────────────────────────────────────────

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const getColor = (s: number) => {
    if (s >= 80) return '#00b074';
    if (s >= 60) return '#0369a1';
    if (s >= 40) return '#b45309';
    return '#b91c1c';
  };
  const color = getColor(score);

  return (
    <div style={{ position: 'relative', width: '108px', height: '108px', flexShrink: 0 }}>
      <svg width="108" height="108" viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="54" cy="54" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="9" />
        <circle
          cx="54" cy="54" r={radius} fill="none"
          stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '26px', fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.04em' }}>{score}</span>
        <span style={{ fontSize: '9px', fontWeight: 750, color: '#94a3b8', letterSpacing: '0.1em', marginTop: '3px' }}>MATCH</span>
      </div>
    </div>
  );
};

// ─── Section Card (mirrors candidate-card structure exactly) ──────────────────

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accentLeft?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ icon, title, subtitle, accentLeft, children }) => (
  <div style={{
    overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '18px',
    background: 'rgba(255,255,255,0.98)',
    boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
    position: 'relative',
    flexShrink: 0,
  }}>
    {accentLeft && (
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
        background: accentLeft,
      }} />
    )}
    {/* Header — .candidate-card-header */}
    <div style={{
      padding: '16px 20px 13px', borderBottom: '1px solid #edf2f7',
      background: 'linear-gradient(180deg, #ffffff, #fbfdff)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      {/* Icon wrap — .candidate-card-icon-wrap */}
      <div style={{
        display: 'grid', placeItems: 'center', flexShrink: 0,
        width: '36px', height: '36px', borderRadius: '10px',
        background: '#ecfdf5', color: '#047857',
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.018em', lineHeight: 1.25 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '11.5px', lineHeight: 1.4 }}>{subtitle}</p>
        )}
      </div>
    </div>
    {/* Body */}
    <div style={{ padding: '18px 20px 20px' }}>
      {children}
    </div>
  </div>
);

// ─── Skill Chip ───────────────────────────────────────────────────────────────

const SkillChip: React.FC<{ label: string; variant: 'strength' | 'missing' }> = ({ label, variant }) => {
  const ok = variant === 'strength';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '9px',
      padding: '9px 13px', borderRadius: '11px',
      fontSize: '12.5px', lineHeight: 1.55, fontWeight: 500,
      border: ok ? '1px solid #bbf7d0' : '1px solid #fecaca',
      background: ok ? '#f0fdf4' : '#fef2f2',
      color: ok ? '#14532d' : '#991b1b',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <span style={{
        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: ok ? '#dcfce7' : '#fee2e2',
        color: ok ? '#16a34a' : '#dc2626',
        marginTop: '1px',
      }}>
        {ok ? <CheckIcon size={10} /> : <XIcon size={9} />}
      </span>
      <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{label}</span>
    </div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const EvaluationSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px 20px' }}>
    {/* Spinner header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '16px 18px', border: '1px solid #d1fae5', borderRadius: '14px',
      background: '#f0fdf4',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
        border: '3px solid #d1fae5', borderTopColor: '#00b074',
        animation: 'cv-eval-spin 0.75s linear infinite',
      }} />
      <div>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Running AI Evaluation Pipeline</p>
        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>Analysing CV against job requirements…</p>
      </div>
    </div>

    {/* Agent steps */}
    {[
      { label: 'Agent 1 · Extractor: Fetching CV profile data...', done: true },
      { label: 'Agent 2 · Evaluator: Running AI match analysis...', done: false },
      { label: 'Agent 3 · Validator: Applying business rules...', done: false },
    ].map((step, i) => (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 14px',
        border: '1px solid', borderColor: step.done ? '#d1fae5' : '#f1f5f9',
        borderRadius: '11px',
        background: step.done ? '#f0fdf4' : '#f8fafc',
      }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: step.done ? '2px solid #00b074' : '2px solid #e2e8f0',
          background: step.done ? '#ecfdf5' : '#f8fafc',
        }}>
          {step.done
            ? <CheckIcon size={12} />
            : <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                border: '2px solid #00b074', borderTopColor: 'transparent',
                animation: 'cv-eval-spin 0.75s linear infinite',
              }} />
          }
        </div>
        <span style={{ fontSize: '12.5px', fontWeight: step.done ? 600 : 500, color: step.done ? '#047857' : '#94a3b8' }}>
          {step.label}
        </span>
      </div>
    ))}

    {/* Shimmer blocks */}
    {[80, 56, 96].map((h, i) => (
      <div key={i} style={{
        height: `${h}px`, borderRadius: '12px',
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e8edf3 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%', animation: 'cv-eval-shimmer 1.5s infinite',
        animationDelay: `${i * 0.15}s`,
      }} />
    ))}
  </div>
);

// ─── Score Band Helper ────────────────────────────────────────────────────────

const getScoreBand = (score: number) => {
  if (score >= 80) return { label: 'Excellent Match', color: '#00b074', bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' };
  if (score >= 60) return { label: 'Good Fit',        color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' };
  if (score >= 40) return { label: 'Partial Match',   color: '#b45309', bg: '#fffbeb', border: '#fde68a', text: '#b45309' };
  return               { label: 'Weak Match',         color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' };
};

const getStatusStyle = (status: string) => {
  if (status === 'Approved') return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
  if (status === 'Rejected') return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
  return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CvEvaluationPanel: React.FC<CvEvaluationPanelProps> = ({
  candidateId,
  jobId,
  applicationId,
  candidateName,
  onClose,
  onApproved,
}) => {
  const [evaluationResult, setEvaluationResult] = useState<CvEvaluationResultDto | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load cached evaluation on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cached = await cvEvaluationApi.getLatest(candidateId, jobId);
        if (mounted) setEvaluationResult(cached);
      } catch { /* no cache */ }
    })();
    return () => { mounted = false; };
  }, [candidateId, jobId]);

  const handleRunEvaluation = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setSuccessMessage(null);
      setEvaluationResult(null);
      const result = await cvEvaluationApi.analyze({
        candidateId, jobId, applicationId,
        forceRefresh: evaluationResult !== null,
      });
      setEvaluationResult(result);
    } catch (err: any) {
      console.error('[CvEvaluationPanel] Analysis error:', err);
      setError(err?.message || 'The AI evaluation pipeline encountered an unexpected error.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [candidateId, jobId, applicationId, evaluationResult]);

  const handleApprove = useCallback(async () => {
    if (!evaluationResult) return;
    try {
      setIsApproving(true);
      setError(null);
      setSuccessMessage(null);

      // 1. Record HITL decision in CvEvaluationResults table
      const res = await cvEvaluationApi.approve(evaluationResult.id, {
        decision: 'Approved',
        reviewerNotes: `Approved by recruiter on ${new Date().toLocaleString()}.`,
      });

      // 2. Also update ATS pipeline so candidate is moved to Shortlist
      try {
        await jobApplicationsApi.moveToShortlist(jobId, [candidateId]);
      } catch (atsErr) {
        console.warn('[CvEvaluationPanel] ATS shortlist update warning:', atsErr);
      }

      setEvaluationResult(prev => prev ? { ...prev, approvalStatus: 'Approved' } : null);
      setSuccessMessage(res.message || `${candidateName} has been approved and moved to Shortlist!`);
      onApproved?.(evaluationResult.id);
    } catch (err: any) {
      console.error('[CvEvaluationPanel] Approval error:', err);
      setError(err?.message || 'Failed to save approval decision.');
    } finally {
      setIsApproving(false);
    }
  }, [evaluationResult, candidateId, jobId, candidateName, onApproved]);

  const handleReject = useCallback(async () => {
    if (!evaluationResult) return;
    try {
      setIsApproving(true);
      setError(null);
      setSuccessMessage(null);

      // 1. Record HITL decision in CvEvaluationResults table
      await cvEvaluationApi.approve(evaluationResult.id, {
        decision: 'Rejected',
        reviewerNotes: `Rejected by recruiter on ${new Date().toLocaleString()}.`,
      });

      // 2. Also update ATS pipeline so candidate is marked Rejected
      try {
        await jobApplicationsApi.rejectApplicant(jobId, [candidateId]);
      } catch (atsErr) {
        console.warn('[CvEvaluationPanel] ATS rejection update warning:', atsErr);
      }

      setEvaluationResult(prev => prev ? { ...prev, approvalStatus: 'Rejected' } : null);
      setSuccessMessage(`${candidateName} has been marked as Rejected.`);
      onApproved?.(evaluationResult.id);
    } catch (err: any) {
      console.error('[CvEvaluationPanel] Rejection error:', err);
      setError(err?.message || 'Failed to reject evaluation.');
    } finally {
      setIsApproving(false);
    }
  }, [evaluationResult, candidateId, jobId, candidateName, onApproved]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      id={`cv-evaluation-panel-${candidateId}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        flex: '1 1 0%',
        minHeight: 0,
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, sans-serif',
        background: '#f8fafc',
        color: '#0f172a',
      }}
    >
      <style>{`
        @keyframes cv-eval-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes cv-eval-spin {
          to { transform: rotate(360deg); }
        }
        .cv-eval-scroll {
          scrollbar-width: thin;
          scrollbar-color: #00b074 #f1f5f9;
        }
        .cv-eval-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .cv-eval-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .cv-eval-scroll::-webkit-scrollbar-thumb {
          background: #00b074;
          border-radius: 999px;
        }
        .cv-eval-scroll::-webkit-scrollbar-thumb:hover {
          background: #009663;
        }
        .cv-eval-scroll > * {
          flex-shrink: 0 !important;
        }
      `}</style>

        {/* ══════════════════════════════════════════════════════
            STICKY HEADER
            Matches .candidate-cv-readonly-container > .sticky
        ══════════════════════════════════════════════════════ */}
        <div style={{
          flexShrink: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 20px', gap: '10px',
          borderBottom: '1px solid #e2e8f0',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 1px 0 rgba(15,23,42,0.04)',
        }}>
          {/* Left badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 10px', borderRadius: '999px',
              border: '1px solid #a7f3d0', background: '#ecfdf5',
              color: '#047857', fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
            }}>
              <SparkleIcon />
              AI Evaluation Report
            </span>
            {evaluationResult && (() => {
              const s = getStatusStyle(evaluationResult.approvalStatus);
              return (
                <span style={{
                  padding: '4px 9px', borderRadius: '999px',
                  fontSize: '10px', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                  flexShrink: 0,
                }}>
                  {evaluationResult.approvalStatus}
                </span>
              );
            })()}
          </div>

          {/* Right: Run/Re-evaluate + Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              id={`btn-run-cv-evaluation-${candidateId}`}
              onClick={handleRunEvaluation}
              disabled={isAnalyzing || isApproving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '8px',
                fontSize: '11.5px', fontWeight: 600,
                cursor: isAnalyzing || isApproving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                border: isAnalyzing ? '1px solid #e2e8f0' : '1px solid #a7f3d0',
                background: isAnalyzing ? '#f8fafc' : '#ffffff',
                color: isAnalyzing ? '#94a3b8' : '#008759',
                opacity: isApproving ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                if (!isAnalyzing && !isApproving) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = '#ecfdf5'; b.style.borderColor = '#6ee7b7';
                }
              }}
              onMouseLeave={e => {
                if (!isAnalyzing && !isApproving) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = '#ffffff'; b.style.borderColor = '#a7f3d0';
                }
              }}
            >
              {isAnalyzing
                ? <><div style={{ width: '11px', height: '11px', borderRadius: '50%', border: '2px solid #a7f3d0', borderTopColor: '#00b074', animation: 'cv-eval-spin 0.75s linear infinite' }} /><span>Analyzing...</span></>
                : <>{evaluationResult ? <RefreshIcon /> : <SparkleIcon />}<span>{evaluationResult ? 'Re-evaluate' : 'Run AI Evaluation'}</span></>
              }
            </button>

            {/* Close button — matches candidate-cv-drawer-close-btn */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close"
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', background: '#ffffff',
                  color: '#64748b', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease', flexShrink: 0,
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#f1f5f9'; b.style.color = '#0f172a'; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#ffffff'; b.style.color = '#64748b'; }}
              >
                <XIcon />
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SCROLLABLE BODY  (flex:1, overflowY:auto)
        ══════════════════════════════════════════════════════ */}
        <div
          className="cv-eval-scroll"
          style={{
            flex: '1 1 0%',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '20px 18px 40px',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {/* Loading */}
          {isAnalyzing && <EvaluationSkeleton />}

          {/* Error */}
          {!isAnalyzing && error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '11px',
              padding: '14px 16px', borderRadius: '14px',
              border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c',
            }}>
              <div style={{ flexShrink: 0, marginTop: '1px' }}><AlertTriangleIcon /></div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 750, color: '#991b1b' }}>Evaluation Failed</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b91c1c', lineHeight: 1.55 }}>{error}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {!isAnalyzing && successMessage && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '12px 15px', borderRadius: '13px',
              border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857',
            }}>
              <CheckCircleIcon />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{successMessage}</span>
            </div>
          )}

          {/* Empty state */}
          {!isAnalyzing && !error && !evaluationResult && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', textAlign: 'center',
              padding: '60px 28px',
              border: '1px solid #e2e8f0', borderRadius: '18px',
              background: 'rgba(255,255,255,0.98)',
              boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
            }}>
              <div style={{
                width: '68px', height: '68px',
                background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#00b074', marginBottom: '18px',
              }}>
                <TargetIcon />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                No Evaluation Yet
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.65, maxWidth: '300px' }}>
                Click <strong style={{ color: '#047857' }}>Run AI Evaluation</strong> above to analyse{' '}
                <strong style={{ color: '#0f172a' }}>{candidateName}</strong>'s CV against this job's requirements.
              </p>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────
              FULL EVALUATION RESULT SECTIONS
          ────────────────────────────────────────────────────── */}
          {!isAnalyzing && evaluationResult && (() => {
            const band = getScoreBand(evaluationResult.matchScore);
            const isPending = evaluationResult.approvalStatus === 'Pending';

            return (
              <>
                {/* ① HERO SCORE CARD — mirrors candidate-hero-card */}
                <div style={{
                  overflow: 'hidden', position: 'relative',
                  border: '1px solid #b7ead7', borderRadius: '18px',
                  background: 'radial-gradient(circle at 88% 10%, rgba(16,185,129,0.14), transparent 38%), linear-gradient(135deg,#ffffff 0%,#f0fdf8 100%)',
                  boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
                  flexShrink: 0,
                }}>
                  {/* Left green stripe */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: '5px',
                    background: 'linear-gradient(180deg,#10b981,#047857)',
                  }} />
                  <div style={{ padding: '22px 22px 22px 27px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <ScoreGauge score={evaluationResult.matchScore} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: band.text, letterSpacing: '-0.04em', lineHeight: 1 }}>
                          {evaluationResult.matchScore}%
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.015em' }}>
                          {band.label}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 9px', borderRadius: '999px',
                          fontSize: '10px', fontWeight: 750,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: band.bg, color: band.text, border: `1px solid ${band.border}`,
                        }}>
                          <SparkleIcon /> AI Score
                        </span>
                      </div>

                      {/* Recommendation */}
                      {evaluationResult.recommendation && (
                        <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.65, fontWeight: 500 }}>
                          {evaluationResult.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ② CANDIDATE META INFO */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                  padding: '12px 16px', borderRadius: '12px',
                  border: '1px solid #f1f5f9', background: '#ffffff',
                  flexShrink: 0,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                    <span style={{ color: '#00b074' }}><TargetIcon /></span>
                    Candidate: <strong style={{ color: '#0f172a' }}>{candidateName}</strong>
                  </span>
                  <span style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                    <ClockIcon />
                    Evaluated {new Date(evaluationResult.createdAt).toLocaleString()}
                  </span>
                  <span style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                    ID: <code style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', color: '#475569' }}>
                      {evaluationResult.id.substring(0, 8).toUpperCase()}
                    </code>
                  </span>
                </div>

                {/* ③ SKILLS MATCH ANALYSIS */}
                {(evaluationResult.strengths.length > 0 || evaluationResult.missingSkills.length > 0) && (
                  <SectionCard
                    icon={<TargetIcon />}
                    title="Skills Match Analysis"
                    subtitle={`${evaluationResult.strengths.length} matched · ${evaluationResult.missingSkills.length} gap${evaluationResult.missingSkills.length !== 1 ? 's' : ''} identified`}
                  >
                    {/* Strengths */}
                    {evaluationResult.strengths.length > 0 && (
                      <div style={{ marginBottom: evaluationResult.missingSkills.length > 0 ? '18px' : 0 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          marginBottom: '12px',
                        }}>
                          <span style={{
                            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: '#ecfdf5', border: '1px solid #a7f3d0',
                            color: '#047857',
                          }}>
                            <CheckIcon size={11} />
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Matched Strengths ({evaluationResult.strengths.length})
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                          {evaluationResult.strengths.map((s, i) => (
                            <SkillChip key={i} label={s} variant="strength" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    {evaluationResult.strengths.length > 0 && evaluationResult.missingSkills.length > 0 && (
                      <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '18px' }} />
                    )}

                    {/* Missing Skills */}
                    {evaluationResult.missingSkills.length > 0 && (
                      <div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          marginBottom: '12px',
                        }}>
                          <span style={{
                            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            color: '#b91c1c',
                          }}>
                            <XIcon size={10} />
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Skill Gaps ({evaluationResult.missingSkills.length})
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                          {evaluationResult.missingSkills.map((s, i) => (
                            <SkillChip key={i} label={s} variant="missing" />
                          ))}
                        </div>
                      </div>
                    )}
                  </SectionCard>
                )}

                {/* ④ VALIDATOR ADJUSTMENTS — timeline style */}
                {evaluationResult.validationNotes.length > 0 && (
                  <SectionCard
                    icon={<InfoIcon />}
                    title="Validator Adjustments"
                    subtitle={`${evaluationResult.validationNotes.length} business rule${evaluationResult.validationNotes.length !== 1 ? 's' : ''} applied to final score`}
                  >
                    {/* Timeline — mirrors candidate-timeline */}
                    <div style={{ position: 'relative', paddingLeft: '24px' }}>
                      {/* Vertical line */}
                      <div style={{
                        position: 'absolute', top: '6px', bottom: '6px', left: '7px',
                        width: '2px', borderRadius: '2px', background: '#fde68a',
                      }} />
                      {evaluationResult.validationNotes.map((note, i) => (
                        <div key={i} style={{
                          position: 'relative',
                          paddingBottom: i < evaluationResult.validationNotes.length - 1 ? '16px' : 0,
                          paddingLeft: '14px',
                        }}>
                          {/* Bullet — mirrors candidate-timeline-bullet */}
                          <div style={{
                            position: 'absolute', top: '5px', left: '-4px',
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: '#f59e0b', border: '2px solid #ffffff',
                            boxShadow: '0 0 0 2px #fde68a',
                          }} />
                          <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: 1.6, fontWeight: 500 }}>
                            {note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* ⑤ SCORE BREAKDOWN CARD */}
                <SectionCard
                  icon={<SparkleIcon />}
                  title="Score Breakdown"
                  subtitle="How the AI pipeline scored this candidate"
                >
                  {/* Score bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Overall Match Score</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: band.text }}>{evaluationResult.matchScore}%</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '999px',
                        width: `${evaluationResult.matchScore}%`,
                        background: `linear-gradient(90deg, ${band.color}, ${band.color}cc)`,
                        transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)',
                      }} />
                    </div>
                  </div>

                  {/* Stat pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'Match Score', value: `${evaluationResult.matchScore}%`, color: band.text, bg: band.bg, border: band.border },
                      { label: 'Strengths', value: String(evaluationResult.strengths.length), color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
                      { label: 'Skill Gaps', value: String(evaluationResult.missingSkills.length), color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
                    ].map((stat, i) => (
                      <div key={i} style={{
                        padding: '12px 10px', borderRadius: '12px', textAlign: 'center',
                        border: `1px solid ${stat.border}`, background: stat.bg,
                      }}>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                          {stat.value}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: stat.color, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8 }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Validation notes count */}
                  {evaluationResult.validationNotes.length > 0 && (
                    <div style={{
                      marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid #fde68a', background: '#fffbeb',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ color: '#b45309' }}><InfoIcon /></span>
                      <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                        {evaluationResult.validationNotes.length} business rule adjustment{evaluationResult.validationNotes.length !== 1 ? 's' : ''} were applied to the final score.
                      </span>
                    </div>
                  )}
                </SectionCard>

                {/* ⑥ EVALUATION STATUS CARD */}
                <SectionCard
                  icon={<CheckCircleIcon />}
                  title="Decision Status"
                  subtitle="Current human-in-the-loop approval state"
                  accentLeft={
                    evaluationResult.approvalStatus === 'Approved' ? 'linear-gradient(180deg,#10b981,#047857)'
                    : evaluationResult.approvalStatus === 'Rejected' ? 'linear-gradient(180deg,#f87171,#b91c1c)'
                    : 'linear-gradient(180deg,#fbbf24,#b45309)'
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Status icon */}
                    <div style={{
                      width: '46px', height: '46px', flexShrink: 0,
                      borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: evaluationResult.approvalStatus === 'Approved' ? '#ecfdf5'
                        : evaluationResult.approvalStatus === 'Rejected' ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${evaluationResult.approvalStatus === 'Approved' ? '#a7f3d0'
                        : evaluationResult.approvalStatus === 'Rejected' ? '#fecaca' : '#fde68a'}`,
                      color: evaluationResult.approvalStatus === 'Approved' ? '#047857'
                        : evaluationResult.approvalStatus === 'Rejected' ? '#b91c1c' : '#b45309',
                    }}>
                      {evaluationResult.approvalStatus === 'Approved' ? (
                        <ShieldCheckIcon size={24} />
                      ) : evaluationResult.approvalStatus === 'Rejected' ? (
                        <ShieldXIcon size={24} />
                      ) : (
                        <HourglassIcon size={22} />
                      )}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        {evaluationResult.approvalStatus === 'Approved' ? 'Candidate Approved & Shortlisted'
                          : evaluationResult.approvalStatus === 'Rejected' ? 'Candidate Rejected'
                          : 'Awaiting Recruiter Decision'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                        {evaluationResult.approvalStatus === 'Pending'
                          ? 'Use the action buttons below to approve or reject this candidate.'
                          : `Decision recorded at ${new Date(evaluationResult.createdAt).toLocaleString()}.`}
                      </p>
                    </div>
                  </div>

                  {/* Pending action hint */}
                  {isPending && (
                    <div style={{
                      marginTop: '14px', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid #bae6fd', background: '#f0f9ff',
                      display: 'flex', alignItems: 'flex-start', gap: '9px',
                      fontSize: '12px', color: '#0369a1', fontWeight: 500, lineHeight: 1.55,
                    }}>
                      <div style={{ flexShrink: 0, marginTop: '1px', color: '#0284c7' }}>
                        <LightbulbIcon />
                      </div>
                      <div>
                        Review the match score and skill analysis above, then use <strong>Approve &amp; Shortlist</strong> to move this candidate to the pipeline, or <strong>Reject</strong> to exclude them.
                      </div>
                    </div>
                  )}
                </SectionCard>

              </>
            );
          })()}
        </div>

        {/* ══════════════════════════════════════════════════════
            STICKY FOOTER — Approve / Reject actions
            Only shown when a result exists
        ══════════════════════════════════════════════════════ */}
        {evaluationResult && !isAnalyzing && (
          <div style={{
            flexShrink: 0,
            padding: '14px 18px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '12px', flexWrap: 'wrap',
            boxShadow: '0 -2px 8px rgba(15,23,42,0.05)',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ClockIcon />
              {new Date(evaluationResult.createdAt).toLocaleString()}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Reject */}
              <button
                type="button"
                id={`btn-reject-evaluation-${candidateId}`}
                onClick={handleReject}
                disabled={isApproving || evaluationResult.approvalStatus === 'Rejected'}
                title={evaluationResult.approvalStatus === 'Rejected' ? 'Candidate is currently rejected' : 'Reject this candidate'}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '9px',
                  fontSize: '12.5px', fontWeight: 600,
                  transition: 'all 0.15s ease',
                  cursor: isApproving || evaluationResult.approvalStatus === 'Rejected' ? 'not-allowed' : 'pointer',
                  opacity: isApproving || evaluationResult.approvalStatus === 'Rejected' ? 0.55 : 1,
                  background: evaluationResult.approvalStatus === 'Rejected' ? '#fef2f2' : '#ffffff',
                  border: `1px solid ${evaluationResult.approvalStatus === 'Rejected' ? '#fca5a5' : '#fecaca'}`,
                  color: '#b91c1c',
                }}
                onMouseEnter={e => {
                  if (!isApproving && evaluationResult.approvalStatus !== 'Rejected') {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = '#fef2f2'; b.style.borderColor = '#f87171';
                  }
                }}
                onMouseLeave={e => {
                  if (!isApproving && evaluationResult.approvalStatus !== 'Rejected') {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = '#ffffff'; b.style.borderColor = '#fecaca';
                  }
                }}
              >
                {isApproving && evaluationResult.approvalStatus !== 'Approved'
                  ? <><div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(185,28,28,0.3)', borderTopColor: '#b91c1c', animation: 'cv-eval-spin 0.75s linear infinite' }} /><span>Rejecting...</span></>
                  : evaluationResult.approvalStatus === 'Rejected'
                    ? <><ShieldXIcon size={14} /><span>Rejected</span></>
                    : <><XIcon size={12} /><span>Reject Candidate</span></>
                }
              </button>

              {/* Approve & Shortlist — .candidate-cv-drawer-btn-primary */}
              <button
                type="button"
                id={`btn-approve-shortlist-${candidateId}`}
                onClick={handleApprove}
                disabled={isApproving || evaluationResult.approvalStatus === 'Approved'}
                title={evaluationResult.approvalStatus === 'Approved' ? 'Candidate is currently approved and shortlisted' : 'Approve and shortlist this candidate'}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '8px 18px', borderRadius: '9px',
                  fontSize: '12.5px', fontWeight: 600,
                  transition: 'all 0.15s ease',
                  cursor: isApproving || evaluationResult.approvalStatus === 'Approved' ? 'not-allowed' : 'pointer',
                  opacity: isApproving || evaluationResult.approvalStatus === 'Approved' ? 0.7 : 1,
                  background: evaluationResult.approvalStatus === 'Approved' ? '#ecfdf5' : '#00b074',
                  border: `1px solid ${evaluationResult.approvalStatus === 'Approved' ? '#a7f3d0' : '#009e67'}`,
                  color: evaluationResult.approvalStatus === 'Approved' ? '#047857' : '#ffffff',
                  boxShadow: evaluationResult.approvalStatus === 'Approved' ? 'none' : '0 4px 12px rgba(0,176,116,0.25)',
                }}
                onMouseEnter={e => {
                  if (!isApproving && evaluationResult.approvalStatus !== 'Approved') {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = '#009663'; b.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isApproving && evaluationResult.approvalStatus !== 'Approved') {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = '#00b074'; b.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isApproving && evaluationResult.approvalStatus !== 'Rejected'
                  ? <><div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'cv-eval-spin 0.75s linear infinite' }} /><span>Saving...</span></>
                  : evaluationResult.approvalStatus === 'Approved'
                    ? <><ShieldCheckIcon size={15} /><span>Approved &amp; Shortlisted</span></>
                    : <><CheckCircleIcon /><span>Approve &amp; Shortlist</span></>
                }
              </button>
            </div>
          </div>
        )}
      </div>
  );
};

export default CvEvaluationPanel;
