import React from 'react';
import { Link } from 'react-router-dom';
import type { DashboardStatsDto, JobDto } from '../../services/api';
import {
  BriefcaseIcon,
  ClockIcon,
  FunnelIcon,
  SparkleIcon,
  TrendUpIcon,
  UsersIcon,
} from '../common/Icons';
import './CompanyOverview.css';
import './CompanyOverviewFull.css';
import { TableRowSkeleton, SkeletonStatValue, SkeletonStatLabel } from '../common/SkeletonCard';

interface CompanyOverviewProps {
  companyName: string;
  stats: DashboardStatsDto | null;
  jobs: JobDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenVacancies: () => void;
}

export const CompanyOverview: React.FC<CompanyOverviewProps> = ({
  companyName, stats, jobs, loading, error, onRetry, onOpenVacancies,
}) => {
  const activeJobs = jobs.filter((job) => job.status.toLowerCase() === 'active');
  const candidates = stats?.totalCandidatesCount ?? 0;
  const topMatches = stats?.topTalentMatches ?? [];
  const vacancyMetrics = stats?.vacancyMetrics ?? [];
  const funnel = [
    { label: 'Applied', value: candidates },
    { label: 'AI Screened', value: stats?.aiScreenedCount ?? 0 },
    { label: 'Shortlisted', value: stats?.shortlistedCount ?? 0 },
    { label: 'Pipeline', value: stats?.pendingInterviewsCount ?? 0 },
  ];
  const funnelMaximum = Math.max(1, ...funnel.map((stage) => stage.value));
  const shortlistConversion = candidates > 0
    ? Math.round(((stats?.shortlistedCount ?? 0) / candidates) * 100)
    : 0;
  const kpis = [
    { label: 'Active Vacancies', value: stats?.activeVacanciesCount ?? activeJobs.length, suffix: 'Live', icon: <BriefcaseIcon /> },
    { label: 'Total Candidates', value: candidates, suffix: 'in Pool', note: `+${stats?.candidatesThisWeekCount ?? 0} this week`, icon: <UsersIcon /> },
    { label: 'AI Shortlisted', value: stats?.aiShortlistedCount ?? 0, suffix: 'High Matches', accent: true, icon: <SparkleIcon /> },
    { label: 'Pending Interviews', value: stats?.pendingInterviewsCount ?? 0, suffix: 'Scheduled', icon: <ClockIcon /> },
  ];

  return (
    <div className="company-overview">
      {error && <div className="overview-error" role="alert"><span>{error}</span><button type="button" onClick={onRetry}>Retry</button></div>}

      <header className="overview-heading">
        <div><span className="overview-kicker"><SparkleIcon /> TALENT INTELLIGENCE</span>
          <h1><b>Company Overview</b></h1>
          <p>
            {loading && !companyName ? (
              <span className="animate-pulse" style={{ display: 'inline-block', width: '280px', height: '14px', background: '#cbd5e1', borderRadius: '4px' }} />
            ) : (
              `${companyName} candidate velocity and hiring signals at a glance.`
            )}
          </p>
        </div>
        <button type="button" className="overview-primary-action" onClick={onOpenVacancies}>Manage Vacancies</button>
      </header>

      <section className="overview-kpi-grid" aria-label="Hiring metrics">
        {kpis.map((kpi) => (
          <article className={`overview-kpi ${kpi.accent ? 'is-accent' : ''}`} key={kpi.label}>
            <div className="overview-kpi-top">
              <span>{kpi.label}</span>
              <i>{kpi.icon}</i>
            </div>
            <div className="overview-kpi-value">
              <strong>{loading ? <SkeletonStatValue width="50px" height="28px" /> : kpi.value}</strong>
              <span>{kpi.suffix}</span>
            </div>
            {loading ? (
              <SkeletonStatLabel width="110px" />
            ) : (
              kpi.note && <small><TrendUpIcon /> {kpi.note}</small>
            )}
          </article>
        ))}
      </section>

      <div className="overview-content-grid">
        <div className="overview-main-column">
          <section className="overview-panel">
            <div className="overview-panel-heading">
              <div>
                <h2>Top AI Talent Matches</h2>
                <p>Highest recent match scores across active roles</p>
              </div>
              <span className="overview-live-badge">Live Intelligence</span>
            </div>
            <div className="overview-table-scroll">
              <table className="overview-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Target Role</th>
                    <th>AI Score</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableRowSkeleton cols={4} rows={4} hasAvatar />
                  ) : topMatches.length > 0 ? (
                    topMatches.map((candidate, index) => {
                      const initials = candidate.candidateName
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <tr key={`${candidate.candidateId}-${candidate.jobId}`}>
                          <td>
                            <div className="overview-candidate">
                              <span>{initials || 'CA'}</span>
                              <div>
                                <strong>{candidate.candidateName}</strong>
                                <small>{candidate.headline || `Rank #${index + 1}`}</small>
                              </div>
                            </div>
                          </td>
                          <td>{candidate.jobTitle}</td>
                          <td>
                            <b className="overview-score">{candidate.matchPercentage}% Match</b>
                          </td>
                          <td>
                            <Link to="/pipelines" className="overview-ghost-action">
                              Open AI Screening
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="overview-empty">
                        No AI-scored candidates yet. Run AI Screening to populate this list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overview-panel">
            <div className="overview-panel-heading">
              <div>
                <h2>Active Job Vacancies</h2>
                <p>Applicant volume and AI screening coverage</p>
              </div>
              <button type="button" className="overview-text-action" onClick={onOpenVacancies}>
                View all →
              </button>
            </div>
            <div className="overview-table-scroll">
              <table className="overview-table vacancies-compact">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Applicants</th>
                    <th>AI Screened</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableRowSkeleton cols={4} rows={4} hasAvatar />
                  ) : vacancyMetrics.length > 0 ? (
                    vacancyMetrics.map((job) => (
                      <tr key={job.jobId}>
                        <td>
                          <div className="overview-role">
                            <strong>{job.title}</strong>
                            <small>{job.department}</small>
                          </div>
                        </td>
                        <td>{job.applicantsCount}</td>
                        <td>{job.aiScreenedCount}</td>
                        <td>
                          <span className="overview-status">
                            <i />
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="overview-empty">
                        No active vacancies created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="overview-insights-column">
          <section className="overview-panel funnel-panel">
            <div className="overview-panel-heading">
              <div>
                <h2>Hiring Pipeline Health</h2>
                <p>Overall funnel conversion</p>
              </div>
              <FunnelIcon />
            </div>
            <div className="overview-funnel">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div className="funnel-stage animate-pulse" key={idx} style={{ opacity: 0.75 }}>
                    <div className="funnel-stage-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ display: 'inline-block', width: 85, height: 13, background: '#cbd5e1', borderRadius: 4 }} />
                      <span style={{ display: 'inline-block', width: 30, height: 13, background: '#e2e8f0', borderRadius: 4 }} />
                    </div>
                    <div className="funnel-track" style={{ background: '#f1f5f9' }}>
                      <span style={{ width: `${80 - idx * 20}%`, background: '#cbd5e1' }} />
                    </div>
                  </div>
                ))
              ) : (
                funnel.map((stage, index) => (
                  <div className="funnel-stage" key={stage.label}>
                    <div className="funnel-stage-label">
                      <span>{stage.label}</span>
                      <strong>{stage.value}</strong>
                    </div>
                    <div className="funnel-track">
                      <span style={{ width: `${Math.round((stage.value / funnelMaximum) * 100)}%` }} />
                    </div>
                    {index < funnel.length - 1 && (
                      <small>
                        {stage.value > 0 ? Math.round((funnel[index + 1].value / stage.value) * 100) : 0}% advance
                      </small>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="funnel-summary">
              <strong>{loading ? <SkeletonStatValue width="45px" height="20px" /> : `${shortlistConversion}%`}</strong>
              <span>Applied-to-shortlist conversion</span>
            </div>
          </section>

          <section className="overview-panel activity-panel">
            <div className="overview-panel-heading">
              <div>
                <h2>Recent AI Activity</h2>
                <p>Signals requiring attention</p>
              </div>
            </div>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#cbd5e1', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ width: '55%', height: 13, borderRadius: 4, background: '#cbd5e1' }} />
                    <div style={{ width: '80%', height: 11, borderRadius: 4, background: '#e2e8f0' }} />
                  </div>
                </div>
              ))
            ) : stats?.recentAiActivity ? (
              <div className="ai-alert success">
                <i><SparkleIcon /></i>
                <div>
                  <strong>AI screening completed</strong>
                  <p>{stats.recentAiActivity.jobTitle} produced a {stats.recentAiActivity.matchPercentage}% candidate match.</p>
                  <small>{new Date(stats.recentAiActivity.occurredAt).toLocaleString()}</small>
                </div>
              </div>
            ) : (
              <div className="ai-alert success">
                <i><SparkleIcon /></i>
                <div>
                  <strong>No AI activity yet</strong>
                  <p>Run a candidate screen to generate live matching insights.</p>
                </div>
              </div>
            )}
            {!loading && (
              <div className="ai-alert warning">
                <i>!</i>
                <div>
                  <strong>Evaluation queue</strong>
                  <p>{stats?.pendingAiEvaluationsCount ?? 0} pending applications require AI evaluation.</p>
                  <small>Review screening queue</small>
                </div>
              </div>
            )}
            <Link to="/dashboard/pipelines" className="activity-link">Open AI Screening <span>→</span></Link>
          </section>
        </aside>
      </div>
    </div>
  );
};
