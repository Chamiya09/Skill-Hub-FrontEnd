import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, Bot, CheckCircle2, Loader2, RefreshCw, Users } from 'lucide-react'
import { jobApplicationsApi, type ScoreBreakdown, type ScreenedApplicantDto } from '../services/api'

// ─── Score Breakdown Tooltip ─────────────────────────────────────────────────

interface BreakdownRow {
  label: string
  value: number
  max: number
}

function ScoreTooltip({ breakdown }: { breakdown: ScoreBreakdown | null | undefined }) {
  const rows: BreakdownRow[] = breakdown
    ? [
        { label: 'Skills',         value: breakdown.skills,         max: 30 },
        { label: 'Experience',     value: breakdown.experience,     max: 25 },
        { label: 'Projects',       value: breakdown.projects,       max: 20 },
        { label: 'Education',      value: breakdown.education,      max: 15 },
        { label: 'Certifications', value: breakdown.certifications, max: 10 },
      ]
    : []

  const total = rows.reduce((sum, row) => sum + row.value, 0)

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 w-56
                 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl
                 opacity-0 scale-95 transition-all duration-150
                 group-hover:opacity-100 group-hover:scale-100"
    >
      {/* Arrow */}
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45
                   border-b border-r border-slate-200 bg-white"
      />

      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
        Score Breakdown
      </p>

      {breakdown ? (
        <>
          <div className="space-y-1.5">
            {rows.map(({ label, value, max }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">{label}</span>
                <div className="flex items-center gap-1.5">
                  {/* mini progress bar */}
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${Math.round((value / max) * 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-800">
                    {value}/{max}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-xs font-bold text-slate-700">Total</span>
            <span className="text-xs font-extrabold tabular-nums text-violet-700">{total}/100</span>
          </div>
        </>
      ) : (
        <p className="text-center text-xs text-slate-400">No breakdown available</p>
      )}
    </div>
  )
}

// ─── Score Badge with Tooltip ─────────────────────────────────────────────────

function ScoreBadge({
  score,
  breakdown,
}: {
  score: number | null
  breakdown: ScoreBreakdown | null | undefined
}) {
  if (score == null) {
    return <span className="text-sm font-medium text-slate-400">Not screened</span>
  }

  const colorClass =
    score >= 75
      ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
      : score >= 50
        ? 'bg-amber-100 text-amber-700 ring-amber-200'
        : 'bg-red-100 text-red-700 ring-red-200'

  return (
    /* group enables the CSS group-hover on the tooltip */
    <div className="group relative inline-flex justify-center">
      <span
        className={`inline-flex min-w-16 cursor-default select-none justify-center rounded-full
                    px-3 py-1.5 text-sm font-extrabold ring-1 ${colorClass}`}
      >
        {score}%
      </span>
      <ScoreTooltip breakdown={breakdown} />
    </div>
  )
}

// ─── Per-candidate Re-analyze button ─────────────────────────────────────────

function ReanalyzeRowButton({
  jobId,
  onComplete,
}: {
  jobId: string
  onComplete: (updated: ScreenedApplicantDto[]) => void
}) {
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (busy) return
    setBusy(true)
    try {
      const result = await jobApplicationsApi.runAiScreen(jobId, { forceRefresh: true })
      onComplete(result)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      id="reanalyze-row-btn"
      onClick={run}
      disabled={busy}
      title="Force re-analyze this job's candidates via AI"
      className="ml-2 inline-flex items-center gap-1 rounded-full border border-slate-200
                 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500
                 shadow-sm transition hover:border-violet-300 hover:text-violet-700
                 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? (
        <Loader2 size={11} className="animate-spin" />
      ) : (
        <RefreshCw size={11} />
      )}
      {busy ? 'Recalculating…' : 'Re-analyze'}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ApplicantRow = ScreenedApplicantDto

export function ApplicantScreeningView() {
  const { jobId } = useParams<{ jobId: string }>()
  const [applicants, setApplicants] = useState<ApplicantRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isScreening, setIsScreening] = useState(false)
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadAppliedCandidates = useCallback(async () => {
    if (!jobId) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await jobApplicationsApi.getRankedApplicants(jobId)
      setApplicants(result)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load applicants.')
    } finally {
      setIsLoading(false)
    }
  }, [jobId])

  useEffect(() => { void loadAppliedCandidates() }, [loadAppliedCandidates])

  const sortedApplicants = useMemo(() => [...applicants].sort((left, right) =>
    (right.aiMatchScore ?? -1) - (left.aiMatchScore ?? -1) || left.fullName.localeCompare(right.fullName)
  ), [applicants])

  const alreadyShortlisted = useMemo(() => sortedApplicants.filter(c => c.status === 'Shortlisted'), [sortedApplicants])
  const pendingApplicants = useMemo(() => sortedApplicants.filter(c => c.status !== 'Shortlisted'), [sortedApplicants])

  const toggleCandidate = (candidateId: string) => setSelectedIds(previous => {
    const next = new Set(previous)
    next.has(candidateId) ? next.delete(candidateId) : next.add(candidateId)
    return next
  })

  const toggleAll = () => setSelectedIds(previous => previous.size === sortedApplicants.length
    ? new Set()
    : new Set(sortedApplicants.map(candidate => candidate.candidateId)))

  // Run AI Screen (uses cache — only evaluates candidates with no existing score)
  const runAiScreen = async () => {
    if (!jobId || isScreening) return
    setIsScreening(true)
    setError(null)
    setNotice(null)
    try {
      const screened = await jobApplicationsApi.runAiScreen(jobId)
      setApplicants(screened)
      setSelectedIds(new Set())
      setNotice(`AI screening completed for ${screened.length} candidate(s). Review the ranking before shortlisting.`)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'AI screening failed.')
    } finally {
      setIsScreening(false)
    }
  }

  // Re-analyze All — forceRefresh=true: deletes cached rows, re-calls Python LangGraph
  const reanalyzeAll = async () => {
    if (!jobId || isReanalyzing) return
    setIsReanalyzing(true)
    setError(null)
    setNotice(null)
    try {
      const screened = await jobApplicationsApi.runAiScreen(jobId, { forceRefresh: true })
      setApplicants(screened)
      setSelectedIds(new Set())
      setNotice(
        `Re-analysis complete for ${screened.length} candidate(s). ` +
        `Scores should be identical to the previous run if the AI temperature is 0 (deterministic).`
      )
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Re-analysis failed.')
    } finally {
      setIsReanalyzing(false)
    }
  }

  const moveToShortlist = async () => {
    if (!jobId || selectedIds.size === 0 || isMoving) return
    setIsMoving(true)
    setError(null)
    try {
      const ids = [...selectedIds]
      const result = await jobApplicationsApi.moveToShortlist(jobId, ids)
      
      // Explicitly re-fetch the list from backend to sync DB state
      await loadAppliedCandidates()
      
      setSelectedIds(new Set())
      setNotice(result.message)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to move candidates.')
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">

        {/* ── Header ── */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Human-in-the-Loop Screening
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900">Applied Candidates</h1>
            <p className="mt-1 text-slate-500">
              AI ranks profiles; your HR team makes every shortlist decision.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:items-end">
            {/* Primary — Run AI Screen (cache-aware) */}
            <button
              type="button"
              id="run-ai-screen-btn"
              onClick={runAiScreen}
              disabled={isScreening || isReanalyzing || isLoading || applicants.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600
                         px-5 py-3 font-bold text-white shadow-lg transition hover:bg-violet-700
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isScreening
                ? <><Loader2 size={19} className="animate-spin" />Analyzing candidate profiles…</>
                : <><Bot size={19} />Run AI Screen</>}
            </button>

            {/* Secondary — Re-analyze All (forceRefresh=true) */}
            <button
              type="button"
              id="reanalyze-all-btn"
              onClick={reanalyzeAll}
              disabled={isReanalyzing || isScreening || isLoading || applicants.length === 0}
              title="Delete cached AI scores and re-run the LangGraph microservice from scratch. If the LLM temperature is 0, scores should be identical — proving determinism."
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200
                         bg-violet-50 px-5 py-2.5 text-sm font-bold text-violet-700 shadow-sm
                         transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isReanalyzing
                ? <><Loader2 size={15} className="animate-spin" />Recalculating via AI…</>
                : <><RefreshCw size={15} />⟳ Re-analyze All</>}
            </button>
          </div>
        </header>

        {/* ── Alerts ── */}
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-slate-500">
              <Loader2 className="animate-spin" />
              🤖 AI is analyzing candidate profiles… This may take a few seconds.
            </div>
          ) : applicants.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Users className="mx-auto mb-3 text-slate-300" size={42} />
              <p className="font-semibold">No candidates are currently in the Applied stage.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="w-14 px-5 py-4">
                      {/* Only toggle pending applicants */}
                      <input
                        type="checkbox"
                        aria-label="Select all candidates"
                        checked={selectedIds.size === pendingApplicants.length && pendingApplicants.length > 0}
                        onChange={() => {
                          if (selectedIds.size === pendingApplicants.length) {
                            setSelectedIds(new Set())
                          } else {
                            setSelectedIds(new Set(pendingApplicants.map(c => c.candidateId)))
                          }
                        }}
                      />
                    </th>
                    <th className="px-5 py-4">Candidate</th>
                    <th className="px-5 py-4">Skills</th>
                    <th className="px-5 py-4">Applied</th>
                    <th className="px-5 py-4 text-center">
                      AI Match Score
                      <span
                        className="ml-1 cursor-default text-slate-400"
                        title="Hover a score badge to see the per-category breakdown. Click ⟳ Re-analyze All to force a fresh LLM evaluation."
                      >ⓘ</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alreadyShortlisted.length > 0 && (
                    <>
                      <tr className="bg-slate-50">
                        <td colSpan={5} className="px-5 py-3 font-semibold text-emerald-700">
                          ✅ Already Shortlisted
                        </td>
                      </tr>
                      {alreadyShortlisted.map(candidate => (
                        <tr key={candidate.candidateId} className="bg-slate-50/50 opacity-70">
                          <td className="px-5 py-4 text-center">
                            <span className="text-xs font-bold text-emerald-600">✓</span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">{candidate.fullName}</p>
                            <p className="text-sm text-slate-500">{candidate.headline || candidate.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex max-w-md flex-wrap gap-1.5">
                              {candidate.skills.slice(0, 4).map(skill => (
                                <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {new Date(candidate.appliedDate).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <ScoreBadge score={candidate.aiMatchScore} breakdown={candidate.scoreBreakdown} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                  {pendingApplicants.length > 0 && (
                    <>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={5} className="px-5 py-3 font-semibold text-amber-700">
                          ⏳ Pending Review
                        </td>
                      </tr>
                      {pendingApplicants.map(candidate => (
                        <tr
                          key={candidate.candidateId}
                          className={`transition hover:bg-slate-50 ${
                            selectedIds.has(candidate.candidateId) ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              aria-label={`Select ${candidate.fullName}`}
                              checked={selectedIds.has(candidate.candidateId)}
                              onChange={() => toggleCandidate(candidate.candidateId)}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">{candidate.fullName}</p>
                            <p className="text-sm text-slate-500">{candidate.headline || candidate.email}</p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex max-w-md flex-wrap gap-1.5">
                              {candidate.skills.slice(0, 4).map(skill => (
                                <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length === 0 && (
                                <span className="text-sm text-slate-400">No skills listed</span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {new Date(candidate.appliedDate).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <ScoreBadge
                                score={candidate.aiMatchScore}
                                breakdown={candidate.scoreBreakdown}
                              />
                              {candidate.aiMatchScore != null && jobId && (
                                <ReanalyzeRowButton
                                  jobId={jobId}
                                  onComplete={updated => {
                                    setApplicants(updated)
                                    setNotice(
                                      `Re-analysis complete. If the LLM is deterministic (temperature=0), ` +
                                      `scores should match the previous run.`
                                    )
                                  }}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Move to Shortlist ── */}
        <div className="sticky bottom-5 mt-6 flex justify-end">
          <button
            type="button"
            id="move-to-shortlist-btn"
            onClick={moveToShortlist}
            disabled={selectedIds.size === 0 || isMoving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold
                       text-white shadow-xl transition hover:bg-blue-700
                       disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {isMoving
              ? <><Loader2 size={18} className="animate-spin" />Moving candidates…</>
              : <><ArrowRight size={19} />Move to Shortlist ({selectedIds.size})</>}
          </button>
        </div>

      </div>
    </div>
  )
}
