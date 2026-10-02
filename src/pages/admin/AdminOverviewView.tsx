import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  Inbox,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  AlertCircle,
} from 'lucide-react';
import type { AdminTab } from '../../components/admin/AdminLayout';
import {
  adminApi,
  type AdminCandidateDto,
  type AdminCompanyDto,
  type AdminInquiryDto,
} from '../../services/api';
import '../../components/dashboard/CompanyOverview.css';
import '../../components/dashboard/CompanyOverviewFull.css';
import './AdminDashboard.css';

interface AdminOverviewViewProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigateTab }) => {
  const [candidates, setCandidates] = useState<AdminCandidateDto[]>([]);
  const [companies, setCompanies] = useState<AdminCompanyDto[]>([]);
  const [inquiries, setInquiries] = useState<AdminInquiryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [candData, compData, inqData] = await Promise.all([
        adminApi.getCandidates(),
        adminApi.getCompanies(),
        adminApi.getInquiries(),
      ]);
      setCandidates(candData);
      setCompanies(compData);
      setInquiries(inqData);
    } catch (err: any) {
      console.error('Failed to load admin overview metrics:', err);
      setError(err.message || 'Failed to fetch platform metrics from database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed metrics
  const totalCandidatesCount = candidates.length;
  const highMatchCount = candidates.filter((c) => c.aiMatchAverage >= 85).length;

  const totalCompaniesCount = companies.length;
  const activeCompaniesCount = companies.filter((c) => c.status === 'Active').length;
  const totalActiveJobs = companies.reduce((sum, c) => sum + (c.activeJobPosts || 0), 0);
  const totalPlacementsCount = companies.reduce((sum, c) => sum + (c.totalHires || 0), 0);

  const pendingInquiriesCount = inquiries.filter((i) => i.status === 'New').length;

  // Funnel calculation
  const funnel = [
    { label: 'Registered Talent', value: totalCandidatesCount },
    { label: 'AI Benchmarked', value: candidates.filter((c) => c.aiMatchAverage > 0).length },
    { label: 'High Match (>80%)', value: candidates.filter((c) => c.aiMatchAverage >= 80).length },
    { label: 'Placed / Hired', value: totalPlacementsCount },
  ];
  const funnelMaximum = Math.max(1, ...funnel.map((s) => s.value));
  const placementRate = totalCandidatesCount > 0
    ? Math.round((totalPlacementsCount / totalCandidatesCount) * 100)
    : 0;

  // Sorted list samples for panels
  const topCandidates = [...candidates]
    .sort((a, b) => b.aiMatchAverage - a.aiMatchAverage)
    .slice(0, 5);

  const topCompanies = [...companies]
    .sort((a, b) => (b.activeJobPosts + b.totalHires) - (a.activeJobPosts + a.totalHires))
    .slice(0, 5);

  const recentInquiries = inquiries.slice(0, 3);

  // KPI card configs matching CompanyOverview
  const kpis = [
    {
      label: 'Total Candidates',
      value: totalCandidatesCount,
      suffix: 'in Pool',
      note: `${highMatchCount} AI Verified (>85%)`,
      icon: <Users size={16} />,
      accent: false,
    },
    {
      label: 'Verified Employers',
      value: totalCompaniesCount,
      suffix: 'Enterprises',
      note: `${activeCompaniesCount} Active Accounts`,
      icon: <Building2 size={16} />,
      accent: false,
    },
    {
      label: 'Live Job Vacancies',
      value: totalActiveJobs,
      suffix: 'Active Roles',
      note: `${totalPlacementsCount} Placements Made`,
      icon: <Briefcase size={16} />,
      accent: true,
    },
    {
      label: 'Pending Inquiries',
      value: pendingInquiriesCount,
      suffix: 'Awaiting Action',
      note: `${inquiries.length} Total Submissions`,
      icon: <Inbox size={16} />,
      accent: false,
    },
  ];

  return (
    <div className="company-overview" style={{ width: '100%' }}>
      {/* Error state */}
      {error && (
        <div className="overview-error" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* 1. HERO HEADER (Matches Company Overview header with Kickers and Actions) */}
      <header className="overview-heading">
        <div>
          <span className="overview-kicker">
            <Sparkles size={13} /> PLATFORM TELEMETRY &amp; ATS GOVERNANCE
          </span>
          <h1>Admin Overview</h1>
          <p>
            Real-time platform activity, enterprise requisitions, verified candidate assessment pipeline, and ecosystem telemetry.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="overview-primary-action"
            onClick={() => onNavigateTab('candidates')}
          >
            Manage Candidates
          </button>
          <button
            type="button"
            className="overview-ghost-action"
            style={{
              padding: '0 16px',
              minHeight: 44,
              borderRadius: 11,
              fontWeight: 700,
              fontSize: 12.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => onNavigateTab('companies')}
          >
            <span>View Employers</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* 2. 4-KPI METRIC GRID (Matches Company Overview KPI Grid) */}
      <section className="overview-kpi-grid" aria-label="Ecosystem metrics">
        {kpis.map((kpi) => (
          <article
            className={`overview-kpi ${kpi.accent ? 'is-accent' : ''}`}
            key={kpi.label}
          >
            <div className="overview-kpi-top">
              <span>{kpi.label}</span>
              <i>{kpi.icon}</i>
            </div>
            <div className="overview-kpi-value">
              <strong>{isLoading ? '—' : kpi.value}</strong>
              <span>{kpi.suffix}</span>
            </div>
            {kpi.note && (
              <small>
                <TrendingUp size={12} /> {kpi.note}
              </small>
            )}
          </article>
        ))}
      </section>

      {/* 3. DUAL-COLUMN CONTENT GRID */}
      <div className="overview-content-grid">
        {/* 3.1 LEFT MAIN COLUMN: TOP CANDIDATES & ACTIVE EMPLOYERS */}
        <div className="overview-main-column">
          {/* Top AI Verified Talent Panel */}
          <section className="overview-panel">
            <div className="overview-panel-heading">
              <div>
                <h2>Top AI Talent Matches</h2>
                <p>Leading benchmark assessment scores across verified candidates</p>
              </div>
              <button
                type="button"
                className="overview-text-action"
                onClick={() => onNavigateTab('candidates')}
              >
                View all candidates ({totalCandidatesCount}) →
              </button>
            </div>
            <div className="overview-table-scroll">
              <table className="overview-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Verified Skills</th>
                    <th>AI Match Score</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topCandidates.map((candidate, index) => {
                    const initials = candidate.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={candidate.id}>
                        <td>
                          <div className="overview-candidate">
                            <span>{initials || 'CD'}</span>
                            <div>
                              <strong>{candidate.name}</strong>
                              <small>
                                {candidate.role ? `${candidate.role} • ${candidate.location}` : `Rank #${index + 1} • ${candidate.location}`}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {candidate.topSkills.slice(0, 2).map((skill) => (
                              <span
                                key={skill}
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.topSkills.length > 2 && (
                              <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                +{candidate.topSkills.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <b className="overview-score">
                            {candidate.aiMatchAverage}% Match
                          </b>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="overview-ghost-action"
                            onClick={() => onNavigateTab('candidates')}
                          >
                            Inspect Candidate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && topCandidates.length === 0 && (
                    <tr>
                      <td colSpan={4} className="overview-empty">
                        No candidate profiles registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Active Enterprise Employers Panel */}
          <section className="overview-panel">
            <div className="overview-panel-heading">
              <div>
                <h2>Enterprise Employer Directory</h2>
                <p>Active companies, open requisitions, and placement telemetry</p>
              </div>
              <button
                type="button"
                className="overview-text-action"
                onClick={() => onNavigateTab('companies')}
              >
                View all employers ({totalCompaniesCount}) →
              </button>
            </div>
            <div className="overview-table-scroll">
              <table className="overview-table vacancies-compact">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Industry</th>
                    <th>Live Vacancies</th>
                    <th>Placements</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topCompanies.map((comp) => (
                    <tr key={comp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={comp.logo}
                            alt={comp.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';
                            }}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              objectFit: 'cover',
                              border: '1px solid #dce7e2',
                            }}
                          />
                          <div className="overview-role">
                            <strong>{comp.name}</strong>
                            <small>{comp.location}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 11.5, color: '#475569' }}>
                          {comp.industry}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#1d4ed8' }}>
                          {comp.activeJobPosts} Vacancies
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#008e60' }}>
                          {comp.totalHires} Hires
                        </span>
                      </td>
                      <td>
                        <span className="overview-status">
                          <i />
                          {comp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && topCompanies.length === 0 && (
                    <tr>
                      <td colSpan={5} className="overview-empty">
                        No enterprise companies registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* 3.2 RIGHT INSIGHTS COLUMN: FUNNEL & COMMUNICATIONS DESK */}
        <aside className="overview-insights-column">
          {/* Ecosystem Pipeline Health Panel */}
          <section className="overview-panel funnel-panel">
            <div className="overview-panel-heading">
              <div>
                <h2>Ecosystem Talent Funnel</h2>
                <p>End-to-end recruitment conversion</p>
              </div>
              <Activity size={18} color="#059669" />
            </div>
            <div className="overview-funnel">
              {funnel.map((stage, index) => (
                <div className="funnel-stage" key={stage.label}>
                  <div className="funnel-stage-label">
                    <span>{stage.label}</span>
                    <strong>{stage.value}</strong>
                  </div>
                  <div className="funnel-track">
                    <span
                      style={{
                        width: `${Math.round((stage.value / funnelMaximum) * 100)}%`,
                      }}
                    />
                  </div>
                  {index < funnel.length - 1 && (
                    <small>
                      {stage.value > 0
                        ? Math.round((funnel[index + 1].value / stage.value) * 100)
                        : 0}
                      % advance
                    </small>
                  )}
                </div>
              ))}
            </div>
            <div className="funnel-summary">
              <strong>{placementRate}%</strong>
              <span>Talent pool to hired placement rate</span>
            </div>
          </section>

          {/* Recent Communications Desk */}
          <section className="overview-panel activity-panel">
            <div className="overview-panel-heading">
              <div>
                <h2>Communications &amp; Inquiries</h2>
                <p>Pending messages and partner requests</p>
              </div>
              <span className="overview-live-badge">
                {pendingInquiriesCount} Pending
              </span>
            </div>

            {recentInquiries.length > 0 ? (
              recentInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className={`ai-alert ${inq.status === 'New' ? 'warning' : 'success'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigateTab('inquiries')}
                >
                  <i>
                    {inq.status === 'New' ? (
                      <Clock size={14} color="#d97706" />
                    ) : (
                      <CheckCircle2 size={14} color="#008e60" />
                    )}
                  </i>
                  <div>
                    <strong>
                      {inq.sender} ({inq.senderType})
                    </strong>
                    <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                      {inq.subject}
                    </p>
                    <small>{inq.date}</small>
                  </div>
                </div>
              ))
            ) : (
              <div className="ai-alert success">
                <i>
                  <ShieldCheck size={14} color="#008e60" />
                </i>
                <div>
                  <strong>All caught up!</strong>
                  <p>No incoming contact requests requiring review.</p>
                </div>
              </div>
            )}

            <button
              type="button"
              className="activity-link"
              onClick={() => onNavigateTab('inquiries')}
              style={{ background: 'none', cursor: 'pointer', width: 'calc(100% - 32px)', textAlign: 'left' }}
            >
              <span>Open Inquiries Desk ({inquiries.length})</span>
              <span>→</span>
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};
