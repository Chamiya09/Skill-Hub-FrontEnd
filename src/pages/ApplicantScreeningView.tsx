import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, Bot, CheckCircle2, Loader2, Users } from 'lucide-react'
import { jobApplicationsApi, type ScreenedApplicantDto } from '../services/api'

type ApplicantRow = ScreenedApplicantDto

export function ApplicantScreeningView() {
  const { jobId } = useParams<{ jobId: string }>()
  const [applicants, setApplicants] = useState<ApplicantRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isScreening, setIsScreening] = useState(false)
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

  const toggleCandidate = (candidateId: string) => setSelectedIds(previous => {
    const next = new Set(previous)
    next.has(candidateId) ? next.delete(candidateId) : next.add(candidateId)
    return next
  })

  const toggleAll = () => setSelectedIds(previous => previous.size === sortedApplicants.length
    ? new Set()
    : new Set(sortedApplicants.map(candidate => candidate.candidateId)))

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

  const moveToShortlist = async () => {
    if (!jobId || selectedIds.size === 0 || isMoving) return
    setIsMoving(true)
    setError(null)
    try {
      const ids = [...selectedIds]
      const result = await jobApplicationsApi.moveToShortlist(jobId, ids)
      setApplicants(previous => previous.filter(candidate => !selectedIds.has(candidate.candidateId)))
      setSelectedIds(new Set())
      setNotice(result.message)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to move candidates.')
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10"><div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-bold uppercase tracking-wider text-blue-600">Human-in-the-Loop Screening</p><h1 className="text-3xl font-extrabold text-slate-900">Applied Candidates</h1><p className="mt-1 text-slate-500">AI ranks profiles; your HR team makes every shortlist decision.</p></div>
        <button type="button" onClick={runAiScreen} disabled={isScreening || isLoading || applicants.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">{isScreening ? <><Loader2 size={19} className="animate-spin" />Analyzing candidate profiles...</> : <><Bot size={19} />Run AI Screen</>}</button>
      </header>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"><CheckCircle2 size={18} />{notice}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <div className="flex items-center justify-center gap-3 p-16 text-slate-500"><Loader2 className="animate-spin" />🤖 AI is analyzing candidate profiles... This may take a few seconds.</div> : applicants.length === 0 ? <div className="p-16 text-center text-slate-500"><Users className="mx-auto mb-3 text-slate-300" size={42} /><p className="font-semibold">No candidates are currently in the Applied stage.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="w-14 px-5 py-4"><input type="checkbox" aria-label="Select all candidates" checked={selectedIds.size === sortedApplicants.length && sortedApplicants.length > 0} onChange={toggleAll} /></th><th className="px-5 py-4">Candidate</th><th className="px-5 py-4">Skills</th><th className="px-5 py-4">Applied</th><th className="px-5 py-4 text-center">AI Match Score</th></tr></thead><tbody className="divide-y divide-slate-100">{sortedApplicants.map(candidate => <tr key={candidate.candidateId} className={`transition hover:bg-slate-50 ${selectedIds.has(candidate.candidateId) ? 'bg-blue-50/60' : ''}`}><td className="px-5 py-4"><input type="checkbox" aria-label={`Select ${candidate.fullName}`} checked={selectedIds.has(candidate.candidateId)} onChange={() => toggleCandidate(candidate.candidateId)} /></td><td className="px-5 py-4"><p className="font-bold text-slate-900">{candidate.fullName}</p><p className="text-sm text-slate-500">{candidate.headline || candidate.email}</p></td><td className="px-5 py-4"><div className="flex max-w-md flex-wrap gap-1.5">{candidate.skills.slice(0, 4).map(skill => <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{skill}</span>)}{candidate.skills.length === 0 && <span className="text-sm text-slate-400">No skills listed</span>}</div></td><td className="px-5 py-4 text-sm text-slate-600">{new Date(candidate.appliedDate).toLocaleDateString()}</td><td className="px-5 py-4 text-center">{candidate.aiMatchScore == null ? <span className="text-sm font-medium text-slate-400">Not screened</span> : <span className={`inline-flex min-w-16 justify-center rounded-full px-3 py-1.5 text-sm font-extrabold ${candidate.aiMatchScore >= 75 ? 'bg-emerald-100 text-emerald-700' : candidate.aiMatchScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{candidate.aiMatchScore}%</span>}</td></tr>)}</tbody></table></div>}
      </div>
      <div className="sticky bottom-5 mt-6 flex justify-end"><button type="button" onClick={moveToShortlist} disabled={selectedIds.size === 0 || isMoving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-xl transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">{isMoving ? <><Loader2 size={18} className="animate-spin" />Moving candidates...</> : <><ArrowRight size={19} />Move to Shortlist ({selectedIds.size})</>}</button></div>
    </div></div>
  )
}
