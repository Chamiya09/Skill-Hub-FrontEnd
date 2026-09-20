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
    if (s >= 80) return '#047857'; // emerald-700
    if (s >= 60) return '#4338ca'; // indigo-700
    if (s >= 40) return '#b45309'; // amber-700
    return '#be123c'; // rose-700
  };

  const color = getColor(score);

  return (
    <div className="relative w-[90px] h-[90px] shrink-0">
      <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
        {/* Background track */}
        <circle cx="45" cy="45" r={radius} fill="none" className="stroke-slate-100" strokeWidth="7" />
        {/* Score arc */}
        <circle
          cx="45" cy="45" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-in-out"
        />
      </svg>
      {/* Score text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold leading-none" style={{ color }}>{score}</span>
        <span className="text-[9px] font-bold text-slate-400 tracking-wider">MATCH</span>
      </div>
    </div>
  );
};

// ─── Skill Chip Component ─────────────────────────────────────────────────────

const SkillChip: React.FC<{ label: string; variant: 'strength' | 'missing' }> = ({ label, variant }) => {
  const isStrength = variant === 'strength';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${
        isStrength 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
          : 'bg-rose-50 text-rose-700 border-rose-200'
      }`}
    >
      {isStrength ? '✓' : '✗'} {label}
    </span>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const EvaluationSkeleton: React.FC = () => (
  <div className="p-5 flex flex-col gap-3">
    {/* Agent step indicators */}
    {[
      { label: 'Agent 1 · Extractor: Fetching CV profile data...', done: true },
      { label: 'Agent 2 · Evaluator: Running AI match analysis...', done: false },
      { label: 'Agent 3 · Validator: Applying business rules...', done: false },
    ].map((step, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 ${step.done ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
          {step.done ? (
            <span className="text-emerald-600 text-xs font-bold">✓</span>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          )}
        </div>
        <span className={`text-sm ${step.done ? 'text-slate-900 font-semibold' : 'text-slate-400 font-medium'}`}>
          {step.label}
        </span>
      </div>
    ))}
    {/* Pulse placeholder */}
    <div className="mt-2 h-16 rounded-xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
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

  const [evaluationResult, setEvaluationResult] = useState<CvEvaluationResultDto | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cached = await cvEvaluationApi.getLatest(candidateId, jobId);
        if (isMounted) setEvaluationResult(cached);
      } catch {
        // No cached result
      }
    })();
    return () => { isMounted = false; };
  }, [candidateId, jobId]);

  const handleRunEvaluation = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setSuccessMessage(null);
      setEvaluationResult(null);

      const result = await cvEvaluationApi.analyze({
        candidateId,
        jobId,
        applicationId,
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

      const approvalResponse = await cvEvaluationApi.approve(evaluationResult.id, {
        decision: 'Approved',
        reviewerNotes: `Manually approved by recruiter on ${new Date().toLocaleString()}.`,
      });

      setEvaluationResult(prev => prev ? { ...prev, approvalStatus: 'Approved' } : null);
      setSuccessMessage(approvalResponse.message || `${candidateName} has been approved and shortlisted!`);

      onApproved?.(evaluationResult.id);
    } catch (err: any) {
      console.error('[CvEvaluationPanel] Approval error:', err);
      setError(err?.message || 'Failed to save approval decision.');
    } finally {
      setIsApproving(false);
    }
  }, [evaluationResult, candidateName, onApproved]);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (score >= 60) return { label: 'Good Fit',        color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    if (score >= 40) return { label: 'Partial Match',   color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    return                  { label: 'Weak Match',      color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
  };

  return (
    <div
      id={`cv-evaluation-panel-${candidateId}`}
      className="mt-4 bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-500"
    >
      {/* Panel Header */}
      <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50/80 via-white/40 to-emerald-50/80 border-b border-indigo-100/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-white/50">
            <SparkleIcon />
          </div>
          <span className="text-[15px] font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
            AI CV Evaluation Report
          </span>
          {evaluationResult && (
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-[0.1em] shadow-sm ml-2 ${
              evaluationResult.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' : 
              evaluationResult.approvalStatus === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200/50' : 
              'bg-amber-100 text-amber-800 border border-amber-200/50'
            }`}>
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
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
            isAnalyzing 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50' 
              : 'bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-100 hover:border-indigo-200 shadow-sm hover:shadow-md'
          } ${isApproving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              {evaluationResult ? <RefreshIcon /> : <SparkleIcon />}
              <span>{evaluationResult ? 'Re-evaluate' : 'Run AI Evaluation'}</span>
            </>
          )}
        </button>
      </div>

      {/* Panel Body */}
      <div className="p-0">
        {isAnalyzing && <EvaluationSkeleton />}

        {!isAnalyzing && error && (
          <div className="px-6 py-4 flex items-start gap-3 bg-rose-50/80 text-rose-700 border-b border-rose-100 backdrop-blur-md">
            <div className="mt-0.5"><AlertTriangleIcon /></div>
            <div>
              <p className="text-sm font-bold m-0 text-rose-800">Evaluation Failed</p>
              <p className="text-xs m-0 mt-1 text-rose-600/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {!isAnalyzing && successMessage && (
          <div className="px-6 py-3 flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-emerald-50/30 border-b border-emerald-100 text-emerald-700">
            <CheckCircleIcon />
            <span className="text-sm font-extrabold">{successMessage}</span>
          </div>
        )}

        {!isAnalyzing && !error && !evaluationResult && (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
              <span className="text-slate-300 transform scale-150"><SparkleIcon /></span>
            </div>
            <p className="text-sm text-slate-500 m-0">
              Click <strong className="text-slate-700 font-extrabold">Run AI Evaluation</strong> to analyse {candidateName}'s profile.
            </p>
          </div>
        )}

        {!isAnalyzing && evaluationResult && (
          <div className="p-5 md:p-6">
            {/* ─ Score Row ───────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6 p-5 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110 duration-700" />
              
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-full shadow-lg opacity-20 blur-md"></div>
                <ScoreGauge score={evaluationResult.matchScore} />
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left relative z-10">
                {(() => {
                  const band = getScoreLabel(evaluationResult.matchScore);
                  return (
                    <div className="mb-3 flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                      <span className={`text-xl font-black tracking-tight ${band.color}`}>
                        {evaluationResult.matchScore}% {band.label}
                      </span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-black border uppercase tracking-[0.15em] shadow-sm ${band.bg} ${band.color} ${band.border}`}>
                        AI Score
                      </span>
                    </div>
                  );
                })()}

                {evaluationResult.recommendation && (
                  <p className="text-[13px] text-slate-600 m-0 leading-relaxed font-medium">
                    {evaluationResult.recommendation}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* ─ Strengths ─── */}
              {evaluationResult.strengths.length > 0 && (
                <div className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100/50">
                  <p className="text-[11px] font-black text-emerald-700 uppercase tracking-wider m-0 mb-3 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">✓</span>
                    Strengths ({evaluationResult.strengths.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {evaluationResult.strengths.map((s, i) => (
                      <SkillChip key={i} label={s} variant="strength" />
                    ))}
                  </div>
                </div>
              )}

              {/* ─ Missing Skills ─ */}
              {evaluationResult.missingSkills.length > 0 && (
                <div className="bg-rose-50/30 rounded-2xl p-4 border border-rose-100/50">
                  <p className="text-[11px] font-black text-rose-700 uppercase tracking-wider m-0 mb-3 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">✗</span>
                    Skill Gaps ({evaluationResult.missingSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {evaluationResult.missingSkills.map((s, i) => (
                      <SkillChip key={i} label={s} variant="missing" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─ Validation Notes ──────────────────── */}
            {evaluationResult.validationNotes.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex items-start gap-3 backdrop-blur-sm">
                <span className="text-amber-600 mt-0.5 p-1 bg-amber-100/50 rounded-lg"><InfoIcon /></span>
                <div>
                  <p className="text-xs font-black text-amber-800 m-0 mb-1.5 tracking-wide">
                    Validator Adjustments
                  </p>
                  <ul className="m-0 pl-4 space-y-1.5">
                    {evaluationResult.validationNotes.map((note, i) => (
                      <li key={i} className="text-[13px] text-amber-700/90 leading-snug font-medium marker:text-amber-400">{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ─ Action Row ──────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-2 border-t border-slate-100/80">
              <span className="text-[11px] font-semibold text-slate-400/80 uppercase tracking-wider">
                Evaluated {new Date(evaluationResult.createdAt).toLocaleString()}
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
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
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 ${
                    isApproving || evaluationResult.approvalStatus !== 'Pending'
                      ? 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-white border border-rose-200/80 text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:shadow-sm'
                  }`}
                >
                  <span>✗</span> Reject
                </button>

                {/* Approve & Shortlist Button */}
                <button
                  type="button"
                  id={`btn-approve-shortlist-${candidateId}`}
                  onClick={handleApprove}
                  disabled={isApproving || evaluationResult.approvalStatus !== 'Pending'}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 ${
                    evaluationResult.approvalStatus === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 border border-emerald-600/50'
                  } ${isApproving || evaluationResult.approvalStatus !== 'Pending' ? 'opacity-70 cursor-not-allowed shadow-none' : 'hover:-translate-y-0.5'}`}
                >
                  {isApproving ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : evaluationResult.approvalStatus === 'Approved' ? (
                    <>
                      <span className="scale-110"><CheckCircleIcon /></span>
                      <span>Approved</span>
                    </>
                  ) : (
                    <>
                      <span className="scale-110"><CheckCircleIcon /></span>
                      <span>Approve &amp; Shortlist</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default CvEvaluationPanel;
