import { useEffect, useId, useRef } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  X,
} from 'lucide-react'

export interface AiMatchInsightsSidebarProps {
  isOpen: boolean
  onClose: () => void
  aiResults: AiMatchResults | null
  hasApplied: boolean
}

export interface AiMatchResults {
  matchPercentage: number
  strengths: string[]
  missingSkills: string[]
  aiRecommendation: string
}

export function AiMatchInsightsSidebar({
  isOpen,
  onClose,
  aiResults,
  hasApplied,
}: AiMatchInsightsSidebarProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const score = Math.min(
    100,
    Math.max(0, Math.round(aiResults?.matchPercentage ?? 0)),
  )
  const radius = 76
  const circumference = 2 * Math.PI * radius
  const progressOffset = circumference * (1 - score / 100)

  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [isOpen, onClose])

  return (
    <>
      <div
        className={`ai-insights-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`ai-match-insights-sidebar fixed right-0 h-screen sm:w-[400px] bg-white shadow-2xl transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
      >
        <header className="ai-insights-header">
          <div className="ai-insights-title-group">
            <span className="ai-insights-title-icon" aria-hidden="true">
              <Sparkles size={19} />
            </span>
            <div>
              <span className="ai-insights-eyebrow">Semantic Twin Analysis</span>
              <h2 id={titleId}>AI Match Insights</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="ai-insights-close"
            onClick={onClose}
            aria-label="Close AI Match Insights"
          >
            <X size={20} />
          </button>
        </header>

        <div className="ai-insights-body">
          {hasApplied && (
            <div className="ai-insights-applied-banner w-full bg-emerald-50 text-emerald-700 text-xs font-semibold py-1.5 text-center flex justify-center items-center gap-1.5">
              <CheckCircle size={14} aria-hidden="true" />
              <span>You have already applied for this position.</span>
            </div>
          )}
          {aiResults ? (
            <>
              <section className="ai-score-section" aria-label={`${score}% job match`}>
            <div
              className="ai-score-ring drop-shadow-[0_0_15px_rgba(52,211,118,0.5)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
            >
              <svg viewBox="0 0 176 176" aria-hidden="true">
                <circle className="ai-score-track" cx="88" cy="88" r={radius} />
                <circle
                  className="ai-score-progress text-emerald-400"
                  cx="88"
                  cy="88"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                />
              </svg>
              <div className="ai-score-value">
                <strong>{score}%</strong>
                <span>Match</span>
              </div>
            </div>
            <div className="ai-score-caption">
              <span><Sparkles size={13} /> Real-time AI analysis</span>
              <p>Your profile has strong alignment with this opportunity.</p>
            </div>
              </section>

              <div className="ai-insights-breakdown">
                <section className="ai-insight-card strengths-card bg-green-50 border-green-100">
                  <div className="ai-insight-card-header">
                    <span className="ai-insight-icon"><CheckCircle2 size={19} /></span>
                    <h3>Strengths</h3>
                  </div>
                  <ul>
                    {aiResults.strengths.map((strength, index) => (
                      <li key={`${strength}-${index}`}>{strength}</li>
                    ))}
                  </ul>
                </section>

                <section className="ai-insight-card gaps-card bg-rose-50 border-rose-100">
                  <div className="ai-insight-card-header">
                    <span className="ai-insight-icon"><AlertTriangle size={19} /></span>
                    <h3>Missing Skill Gaps</h3>
                  </div>
                  <ul>
                    {aiResults.missingSkills.map((skill, index) => (
                      <li key={`${skill}-${index}`}>{skill}</li>
                    ))}
                  </ul>
                </section>

                <section className="ai-insight-card recommendation-card bg-amber-50 border-amber-100">
                  <div className="ai-insight-card-header">
                    <span className="ai-insight-icon"><Lightbulb size={19} /></span>
                    <h3>AI Recommendation</h3>
                  </div>
                  <p>{aiResults.aiRecommendation}</p>
                </section>
              </div>
            </>
          ) : (
            <div className="ai-insights-empty" role="status">
              No match analysis is available yet.
            </div>
          )}
        </div>

      </aside>
    </>
  )
}
