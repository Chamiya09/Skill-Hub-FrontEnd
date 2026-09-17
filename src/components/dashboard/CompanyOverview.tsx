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

interface CompanyOverviewProps {
  companyName: string;
  stats: DashboardStatsDto | null;
  jobs: JobDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenVacancies: () => void;
}

const TALENT_MATCHES = [
  { initials: 'CI', name: 'Chedima Imashi', role: 'Lead Full-Stack Engineer', score: 94 },
  { initials: 'AK', name: 'Aarav Kumar', role: 'Senior Backend Engineer', score: 91 },
  { initials: 'SN', name: 'Sara Nadeem', role: 'Cloud Platform Engineer', score: 89 },
  { initials: 'DM', name: 'Daniel Mensah', role: 'React Engineer', score: 87 },
];

const FUNNEL = [
  { label: 'Applied', value: 142, width: 100 },
  { label: 'AI Screened', value: 80, width: 56 },
  { label: 'Shortlisted', value: 24, width: 30 },
  { label: 'Pipeline', value: 5, width: 14 },
];

export const CompanyOverview: React.FC<CompanyOverviewProps> = ({
  companyName, stats, jobs, loading, error, onRetry, onOpenVacancies,
}) => {
  const activeJobs = jobs.filter((job) => job.status.toLowerCase() === 'active');
  const candidates = jobs.reduce((sum, job) => sum + (job.applicantsCount || 0), 0) || 142;
  const kpis = [
    { label: 'Active Vacancies', value: stats?.activeVacanciesCount ?? activeJobs.length, suffix: 'Live', icon: <BriefcaseIcon /> },
    { label: 'Total Candidates', value: candidates, suffix: 'in Pool', note: '+12 this week', icon: <UsersIcon /> },
    { label: 'AI Shortlisted', value: 24, suffix: 'High Matches', accent: true, icon: <SparkleIcon /> },
    { label: 'Pending Interviews', value: 5, suffix: 'Scheduled', icon: <ClockIcon /> },
  ];

  return (
    <div className="company-overview">
      {error && <div className="overview-error" role="alert"><span>{error}</span><button type="button" onClick={onRetry}>Retry</button></div>}

      <header className="overview-heading">
        <div><span className="overview-kicker"><SparkleIcon /> TALENT INTELLIGENCE</span>
          <h1>Company Overview</h1><p>{companyName} candidate velocity and hiring signals at a glance.</p></div>
        <button type="button" className="overview-primary-action" onClick={onOpenVacancies}>Manage Vacancies</button>
      </header>

      <section className="overview-kpi-grid" aria-label="Hiring metrics">
        {kpis.map((kpi) => <article className={`overview-kpi ${kpi.accent ? 'is-accent' : ''}`} key={kpi.label}>
          <div className="overview-kpi-top"><span>{kpi.label}</span><i>{kpi.icon}</i></div>
          <div className="overview-kpi-value"><strong>{loading ? '—' : kpi.value}</strong><span>{kpi.suffix}</span></div>
          {kpi.note && <small><TrendUpIcon /> {kpi.note}</small>}
        </article>)}
      </section>

      <div className="overview-content-grid">
        <div className="overview-main-column">
          <section className="overview-panel">
            <div className="overview-panel-heading"><div><h2>Top AI Talent Matches</h2><p>Highest recent match scores across active roles</p></div><span className="overview-live-badge">Live Intelligence</span></div>
            <div className="overview-table-scroll"><table className="overview-table"><thead><tr><th>Candidate</th><th>Target Role</th><th>AI Score</th><th /></tr></thead>
              <tbody>{TALENT_MATCHES.map((candidate, index) => <tr key={candidate.name}><td><div className="overview-candidate"><span>{candidate.initials}</span><div><strong>{candidate.name}</strong><small>Rank #{index + 1}</small></div></div></td><td>{candidate.role}</td><td><b className="overview-score">{candidate.score}% Match</b></td><td><button type="button" className="overview-ghost-action">Quick Review</button></td></tr>)}</tbody>
            </table></div>
          </section>

          <section className="overview-panel">
            <div className="overview-panel-heading"><div><h2>Active Job Vacancies</h2><p>Applicant volume and AI screening coverage</p></div><button type="button" className="overview-text-action" onClick={onOpenVacancies}>View all →</button></div>
            <div className="overview-table-scroll"><table className="overview-table vacancies-compact"><thead><tr><th>Role</th><th>Applicants</th><th>AI Screened</th><th>Status</th></tr></thead>
              <tbody>{(activeJobs.length ? activeJobs.slice(0, 5) : jobs.slice(0, 5)).map((job) => {
                const applicants = job.applicantsCount || 0;
                return <tr key={job.id}><td><div className="overview-role"><strong>{job.title}</strong><small>{job.department}</small></div></td><td>{applicants}</td><td>{Math.round(applicants * .72)}</td><td><span className="overview-status"><i />{job.status}</span></td></tr>;
              })}{!loading && jobs.length === 0 && <tr><td colSpan={4} className="overview-empty">No vacancies created yet.</td></tr>}</tbody>
            </table></div>
          </section>
        </div>

        <aside className="overview-insights-column">
          <section className="overview-panel funnel-panel">
            <div className="overview-panel-heading"><div><h2>Hiring Pipeline Health</h2><p>Overall funnel conversion</p></div><FunnelIcon /></div>
            <div className="overview-funnel">{FUNNEL.map((stage, index) => <div className="funnel-stage" key={stage.label}><div className="funnel-stage-label"><span>{stage.label}</span><strong>{stage.value}</strong></div><div className="funnel-track"><span style={{ width: `${stage.width}%` }} /></div>{index < FUNNEL.length - 1 && <small>{Math.round((FUNNEL[index + 1].value / stage.value) * 100)}% advance</small>}</div>)}</div>
            <div className="funnel-summary"><strong>17%</strong><span>Applied-to-shortlist conversion</span></div>
          </section>

          <section className="overview-panel activity-panel">
            <div className="overview-panel-heading"><div><h2>Recent AI Activity</h2><p>Signals requiring attention</p></div></div>
            <div className="ai-alert success"><i>✨</i><div><strong>AI screening completed</strong><p>Lead Full-Stack Engineer has 4 new high-confidence matches.</p><small>8 minutes ago</small></div></div>
            <div className="ai-alert warning"><i>!</i><div><strong>Evaluation queue</strong><p>15 pending applications still require AI evaluation.</p><small>Review screening queue</small></div></div>
            <Link to="/dashboard/pipelines" className="activity-link">Open AI Screening <span>→</span></Link>
          </section>
        </aside>
      </div>
    </div>
  );
};
