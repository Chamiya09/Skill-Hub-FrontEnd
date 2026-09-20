/**
 * CvEvaluationPanel.tsx
 *
 * Self-contained React component for the Candidate Evaluation Dashboard.
 *
 * CRITICAL RULE: This component ONLY adds API integration logic.
 * It does NOT modify any existing UI layout, buttons, or components
 * in HiringPipeline.tsx. It is mounted as a child sub-panel inside
 * the existing candidate card action area.
 *
 * Wires:
 *   "Run AI CV Evaluation" → POST /api/CVEvaluation/analyze
 *   "Approve & Shortlist"  → POST /api/CVEvaluation/{id}/approve
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  cvEvaluationApi,
  type CvEvaluationResultDto,
} from '../../services/api';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CvEvaluationPanelProps {
  /** The candidate's User ID (for the /analyze payload) */
  candidateId: string;
  /** The job vacancy ID (for the /analyze payload) */
  jobId: string;
  /** The specific application ID linking candidate to vacancy */
  applicationId: string;
  /** Candidate display name — used in UI copy */
  candidateName: string;
  /** Called when the recruiter successfully approves the candidate */
  onApproved?: (evaluationId: string) => void;
}

// ─── Inline SVG Icons (no new dependencies) ──────────────────────────────────

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ─── Score Gauge Ring Component ────────────────────────────────────────────────

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#00b074';
    if (s >= 60) return '#0284c7';
    if (s >= 40) return '#d97706';
    return '#dc2626';
  };

  const color = getColor(score);

  return (
    <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
      <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle cx="45" cy="45" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        {/* Score arc */}
        <circle
          cx="45" cy="45" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      {/* Score text overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em' }}>MATCH</span>
      </div>
    </div>
  );
};

// ─── Skill Chip Component ─────────────────────────────────────────────────────

const SkillChip: React.FC<{ label: string; variant: 'strength' | 'missing' }> = ({ label, variant }) => {
  const isStrength = variant === 'strength';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '9999px', fontSize: '11.5px', fontWeight: 600,
      background: isStrength ? '#ecfdf5' : '#fef2f2',
      color: isStrength ? '#047857' : '#b91c1c',
      border: `1px solid ${isStrength ? '#a7f3d0' : '#fecaca'}`,
      whiteSpace: 'nowrap',
    }}>
      {isStrength ? '✓' : '✗'} {label}
    </span>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const EvaluationSkeleton: React.FC = () => (
  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {/* Agent step indicators */}
    {[
      { label: 'Agent 1 · Extractor: Fetching CV profile data...', done: true },
      { label: 'Agent 2 · Evaluator: Running AI match analysis...', done: false },
      { label: 'Agent 3 · Validator: Applying business rules...', done: false },
    ].map((step, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${step.done ? '#00b074' : '#cbd5e1'}`,
          background: step.done ? '#e6f9f2' : '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {step.done
            ? <span style={{ color: '#00b074', fontSize: '11px', fontWeight: 700 }}>✓</span>
            : <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                border: '2px solid #00b074', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }} />
          }
        </div>
        <span style={{ fontSize: '12px', color: step.done ? '#0f172a' : '#94a3b8', fontWeight: step.done ? 600 : 400 }}>
          {step.label}
        </span>
      </div>
    ))}
    {/* Pulse placeholder */}
    <div style={{ marginTop: '6px', height: '60px', borderRadius: '10px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
  </div>
);

// ─── Main CvEvaluationPanel ───────────────────────────────────────────────────

export const CvEvaluationPanel: React.FC<CvEvaluationPanelProps> = ({
  candidateId,
  jobId,
  applicationId,
  candidateName,
  onApproved,
}) => {

  // ── State ─────────────────────────────────────────────────────────────────

  /** The live evaluation result fetched from the API */
  const [evaluationResult, setEvaluationResult] = useState<CvEvaluationResultDto | null>(null);

  /** Controls loading state for the "Run AI CV Evaluation" button */
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  /** Controls loading state for the "Approve & Shortlist" button */
  const [isApproving, setIsApproving] = useState<boolean>(false);

  /** Inline error message for the panel */
  const [error, setError] = useState<string | null>(null);

  /** Success message shown after successful approval */
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── On mount: Check for an existing cached evaluation ────────────────────
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cached = await cvEvaluationApi.getLatest(candidateId, jobId);
        if (isMounted) setEvaluationResult(cached);
      } catch {
        // No cached result — that's fine, user will click "Run AI CV Evaluation"
      }
    })();
    return () => { isMounted = false; };
  }, [candidateId, jobId]);

  // ── Handler: "Run AI CV Evaluation" button onClick ───────────────────────
  /**
   * Calls POST /api/CVEvaluation/analyze
   * Loading state is mapped to the full API call duration.
   */
  const handleRunEvaluation = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setSuccessMessage(null);
      setEvaluationResult(null); // Clear stale result while running

      const result = await cvEvaluationApi.analyze({
        candidateId,
        jobId,
        applicationId,
        forceRefresh: evaluationResult !== null, // Force refresh if re-running
      });

      setEvaluationResult(result);
    } catch (err: any) {
      console.error('[CvEvaluationPanel] Analysis error:', err);
      setError(err?.message || 'The AI evaluation pipeline encountered an unexpected error. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [candidateId, jobId, applicationId, evaluationResult]);

  // ── Handler: "Approve & Shortlist" button onClick ────────────────────────
  /**
   * Calls POST /api/CVEvaluation/{id}/approve
   * Loading state is mapped to the API call duration.
   */
  const handleApprove = useCallback(async () => {
    if (!evaluationResult) return;
    try {
      setIsApproving(true);
      setError(null);

      const approvalResponse = await cvEvaluationApi.approve(evaluationResult.id, {
        decision: 'Approved',
        reviewerNotes: `Manually approved by recruiter via Hiring Pipeline on ${new Date().toLocaleString()}.`,
      });

      // Update local state to reflect the new approval status
      setEvaluationResult(prev => prev ? { ...prev, approvalStatus: 'Approved' } : null);
      setSuccessMessage(approvalResponse.message || `${candidateName} has been approved and shortlisted!`);

      // Notify parent component so it can update the candidate card status
      onApproved?.(evaluationResult.id);
    } catch (err: any) {
      console.error('[CvEvaluationPanel] Approval error:', err);
      setError(err?.message || 'Failed to save approval decision. Please try again.');
    } finally {
      setIsApproving(false);
    }
  }, [evaluationResult, candidateName, onApproved]);

  // ── Derived: Score band label ─────────────────────────────────────────────

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', color: '#00b074', bg: '#ecfdf5', border: '#a7f3d0' };
    if (score >= 60) return { label: 'Good Fit',        color: '#0284c7', bg: '#eff6ff', border: '#bfdbfe' };
    if (score >= 40) return { label: 'Partial Match',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    return                  { label: 'Weak Match',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      id={`cv-evaluation-panel-${candidateId}`}
      style={{
        marginTop: '12px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: '#00b074', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SparkleIcon />
          </div>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
            AI CV Evaluation Report
          </span>
          {evaluationResult && (
            <span style={{
              fontSize: '10.5px', padding: '2px 7px', borderRadius: '9999px', fontWeight: 700,
              background: evaluationResult.approvalStatus === 'Approved' ? '#ecfdf5' : evaluationResult.approvalStatus === 'Rejected' ? '#fef2f2' : '#fffbeb',
              color: evaluationResult.approvalStatus === 'Approved' ? '#047857' : evaluationResult.approvalStatus === 'Rejected' ? '#b91c1c' : '#92400e',
              border: `1px solid ${evaluationResult.approvalStatus === 'Approved' ? '#a7f3d0' : evaluationResult.approvalStatus === 'Rejected' ? '#fecaca' : '#fde68a'}`,
            }}>
              {evaluationResult.approvalStatus}
            </span>
          )}
        </div>

        {/* Run AI CV Evaluation Button */}
        <button
          type="button"
          id={`btn-run-cv-evaluation-${candidateId}`}
          onClick={handleRunEvaluation}
          disabled={isAnalyzing || isApproving}
          title={evaluationResult ? 'Re-run AI evaluation with fresh data' : 'Run AI CV evaluation pipeline'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 12px', borderRadius: '7px',
            background: isAnalyzing ? '#f1f5f9' : 'linear-gradient(135deg, #00b074 0%, #0284c7 100%)',
            color: isAnalyzing ? '#94a3b8' : '#ffffff',
            border: isAnalyzing ? '1px solid #e2e8f0' : '1px solid transparent',
            fontSize: '11.5px', fontWeight: 700,
            cursor: isAnalyzing || isApproving ? 'not-allowed' : 'pointer',
            opacity: isApproving ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          {isAnalyzing ? (
            <>
              <div style={{
                width: '11px', height: '11px', borderRadius: '50%',
                border: '2px solid #94a3b8', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              {evaluationResult ? <RefreshIcon /> : <SparkleIcon />}
              <span>{evaluationResult ? 'Re-evaluate' : 'Run AI CV Evaluation'}</span>
            </>
          )}
        </button>
      </div>

      {/* Panel Body */}
      <div style={{ padding: '0' }}>

        {/* ── Loading State (maps to actual API call duration) ── */}
        {isAnalyzing && <EvaluationSkeleton />}

        {/* ── Error State ── */}
        {!isAnalyzing && error && (
          <div style={{
            padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '8px',
            background: '#fef2f2', color: '#b91c1c',
          }}>
            <AlertTriangleIcon />
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, margin: '0 0 2px 0' }}>Evaluation Failed</p>
              <p style={{ fontSize: '11.5px', margin: 0, color: '#dc2626' }}>{error}</p>
            </div>
          </div>
        )}

        {/* ── Success Message (post-approval) ── */}
        {!isAnalyzing && successMessage && (
          <div style={{
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px',
            background: '#ecfdf5', borderBottom: '1px solid #a7f3d0',
          }}>
            <CheckCircleIcon />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#047857' }}>{successMessage}</span>
          </div>
        )}

        {/* ── Empty State (no result yet) ── */}
        {!isAnalyzing && !error && !evaluationResult && (
          <div style={{
            padding: '20px 14px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              Click <strong style={{ color: '#0f172a' }}>Run AI CV Evaluation</strong> to analyse {candidateName}'s profile against this job using the three-agent pipeline.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            ── Human Approval Report — Bound to API JSON Data ──
            Binds: matchScore, strengths, missingSkills, recommendation
            ══════════════════════════════════════════════════════ */}
        {!isAnalyzing && evaluationResult && (
          <div style={{ padding: '14px' }}>

            {/* ─ Score Row ───────────────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              marginBottom: '14px', padding: '12px',
              background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0',
            }}>
              {/* Score Gauge — bound to evaluationResult.matchScore */}
              <ScoreGauge score={evaluationResult.matchScore} />

              <div style={{ flex: 1, minWidth: 0 }}>
                {(() => {
                  const band = getScoreLabel(evaluationResult.matchScore);
                  return (
                    <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '13.5px', fontWeight: 800, color: band.color,
                      }}>
                        {evaluationResult.matchScore}% {band.label}
                      </span>
                      <span style={{
                        fontSize: '10px', padding: '1px 7px', borderRadius: '9999px', fontWeight: 600,
                        background: band.bg, color: band.color, border: `1px solid ${band.border}`,
                      }}>
                        AI Score
                      </span>
                    </div>
                  );
                })()}

                {/* Recommendation — bound to evaluationResult.recommendation */}
                {evaluationResult.recommendation && (
                  <p style={{
                    fontSize: '11.5px', color: '#475569', margin: 0, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                  }}>
                    {evaluationResult.recommendation}
                  </p>
                )}
              </div>
            </div>

            {/* ─ Strengths — bound to evaluationResult.strengths[] ─── */}
            {evaluationResult.strengths.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#047857', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✓ Strengths ({evaluationResult.strengths.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {evaluationResult.strengths.map((s, i) => (
                    <SkillChip key={i} label={s} variant="strength" />
                  ))}
                </div>
              </div>
            )}

            {/* ─ Missing Skills — bound to evaluationResult.missingSkills[] ─ */}
            {evaluationResult.missingSkills.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✗ Skill Gaps ({evaluationResult.missingSkills.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {evaluationResult.missingSkills.map((s, i) => (
                    <SkillChip key={i} label={s} variant="missing" />
                  ))}
                </div>
              </div>
            )}

            {/* ─ Validation Notes (from AgentValidator) ──────────────────── */}
            {evaluationResult.validationNotes.length > 0 && (
              <div style={{
                marginBottom: '12px', padding: '8px 10px',
                background: '#fffbeb', borderRadius: '7px', border: '1px solid #fde68a',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#92400e', marginTop: '1px' }}><InfoIcon /></span>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', margin: '0 0 3px 0' }}>
                      Validator Adjustments
                    </p>
                    <ul style={{ margin: 0, padding: '0 0 0 14px' }}>
                      {evaluationResult.validationNotes.map((note, i) => (
                        <li key={i} style={{ fontSize: '11px', color: '#78350f', lineHeight: 1.5 }}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ─ Action Row ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Evaluated {new Date(evaluationResult.createdAt).toLocaleString()}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Reject Button */}
                <button
                  type="button"
                  id={`btn-reject-evaluation-${candidateId}`}
                  onClick={async () => {
                    if (!evaluationResult) return;
                    try {
                      setIsApproving(true);
                      await cvEvaluationApi.approve(evaluationResult.id, { decision: 'Rejected' });
                      setEvaluationResult(prev => prev ? { ...prev, approvalStatus: 'Rejected' } : null);
                    } catch (err: any) {
                      setError(err?.message || 'Failed to reject evaluation.');
                    } finally {
                      setIsApproving(false);
                    }
                  }}
                  disabled={isApproving || evaluationResult.approvalStatus !== 'Pending'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                    background: '#ffffff', border: '1px solid #fca5a5', color: '#dc2626',
                    cursor: (isApproving || evaluationResult.approvalStatus !== 'Pending') ? 'not-allowed' : 'pointer',
                    opacity: (isApproving || evaluationResult.approvalStatus !== 'Pending') ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  ✗ Reject
                </button>

                {/* Approve & Shortlist Button — calls POST /api/CVEvaluation/{id}/approve */}
                <button
                  type="button"
                  id={`btn-approve-shortlist-${candidateId}`}
                  onClick={handleApprove}
                  disabled={isApproving || evaluationResult.approvalStatus !== 'Pending'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700,
                    background: evaluationResult.approvalStatus === 'Approved'
                      ? '#ecfdf5' : 'linear-gradient(135deg, #00b074 0%, #008759 100%)',
                    color: evaluationResult.approvalStatus === 'Approved' ? '#047857' : '#ffffff',
                    border: evaluationResult.approvalStatus === 'Approved' ? '1px solid #a7f3d0' : '1px solid transparent',
                    cursor: (isApproving || evaluationResult.approvalStatus !== 'Pending') ? 'not-allowed' : 'pointer',
                    opacity: (isApproving || evaluationResult.approvalStatus !== 'Pending') ? 0.7 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {isApproving ? (
                    <>
                      <div style={{
                        width: '11px', height: '11px', borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      <span>Saving...</span>
                    </>
                  ) : evaluationResult.approvalStatus === 'Approved' ? (
                    <>
                      <CheckCircleIcon />
                      <span>Approved ✓</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon />
                      <span>Approve &amp; Shortlist</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        #btn-run-cv-evaluation-${candidateId}:not(:disabled):hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        #btn-approve-shortlist-${candidateId}:not(:disabled):hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default CvEvaluationPanel;
