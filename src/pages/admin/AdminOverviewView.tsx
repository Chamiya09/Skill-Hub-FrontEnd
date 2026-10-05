import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  Inbox,
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
import '../../pages/TechnicalAssessmentsFull.css';
import '../../components/dashboard/CompanyOverview.css';
import '../../components/dashboard/CompanyOverviewFull.css';
import './AdminDashboard.css';
import { TableRowSkeleton, SkeletonStatValue, SkeletonStatLabel } from '../../components/common/SkeletonCard';

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

  const topCompanies = [...companies]
    .sort((a, b) => (b.activeJobPosts + b.totalHires) - (a.activeJobPosts + a.totalHires))
    .slice(0, 5);

  const recentInquiries = inquiries.slice(0, 3);

  return (
    <div className="company-overview" style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%' }}>
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

      {/* =========================================================
          1. TOP COMPONENT: ADMIN ECOSYSTEM OVERVIEW & STATS
          (Matching Admin Side Details Box & Architecture)
          ========================================================= */}
      <section className="pipeline-dashboard-card" aria-labelledby="overview-dashboard-title" style={{ width: '100%' }}>
        <div className="pipeline-dashboard-header">
          <div>
            <span className="pipeline-dashboard-eyebrow">Platform Telemetry &amp; ATS Governance</span>
            <h2 id="overview-dashboard-title">Admin Ecosystem Overview</h2>
            <p>
              Real-time platform activity, enterprise requisitions, verified candidate assessment pipeline, and ecosystem telemetry.
            </p>
          </div>

          <div className="pipeline-dashboard-header-actions">
            <span className="pipeline-dashboard-live">
              <span /> Telemetry Live
            </span>
          </div>
        </div>

        <div className="pipeline-summary-grid">
          <article className="pipeline-summary-card summary-total">
            <div className="summary-icon"><Users size={20} /></div>
            <div>
              <span>Total Candidates</span>
              <strong>{isLoading ? <SkeletonStatValue width="55px" /> : totalCandidatesCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="145px" /> : `${highMatchCount} AI verified talent profiles`}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-ready">
            <div className="summary-icon"><Building2 size={20} /></div>
            <div>
              <span>Verified Employers</span>
              <strong>{isLoading ? <SkeletonStatValue width="50px" /> : totalCompaniesCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="150px" /> : `${activeCompaniesCount} active corporate accounts`}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-active">
            <div className="summary-icon"><Briefcase size={20} /></div>
            <div>
              <span>Live Job Vacancies</span>
              <strong>{isLoading ? <SkeletonStatValue width="45px" /> : totalActiveJobs}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="145px" /> : `${totalPlacementsCount} placements completed`}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-applicants">
            <div className="summary-icon"><Inbox size={20} /></div>
            <div>
              <span>Pending Inquiries</span>
              <strong>{isLoading ? <SkeletonStatValue width="40px" /> : pendingInquiriesCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="160px" /> : `${inquiries.length} universal contact submissions`}</small>
            </div>
          </article>
        </div>
      </section>

      {/* 3. DUAL-COLUMN CONTENT GRID */}
      <div className="overview-content-grid">
        {/* 3.1 LEFT MAIN COLUMN: ACTIVE EMPLOYERS */}
        <div className="overview-main-column">
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
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={5} />
                    ))
                  ) : topCompanies.length > 0 ? (
                    topCompanies.map((comp) => (
                      <tr key={comp.id}>
                        <td>
                          <div>
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
                    ))
                  ) : (
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
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div className="funnel-stage animate-pulse" key={idx} style={{ opacity: 0.75 }}>
                    <div className="funnel-stage-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ display: 'inline-block', width: 110, height: 13, background: '#cbd5e1', borderRadius: 4 }} />
                      <span style={{ display: 'inline-block', width: 32, height: 13, background: '#e2e8f0', borderRadius: 4 }} />
                    </div>
                    <div className="funnel-track" style={{ background: '#f1f5f9' }}>
                      <span style={{ width: `${85 - idx * 20}%`, background: '#cbd5e1' }} />
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
                ))
              )}
            </div>
            <div className="funnel-summary">
              <strong>{isLoading ? <SkeletonStatValue width="45px" height="20px" /> : `${placementRate}%`}</strong>
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

            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
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
                    <div style={{ width: '85%', height: 11, borderRadius: 4, background: '#e2e8f0' }} />
                  </div>
                </div>
              ))
            ) : recentInquiries.length > 0 ? (
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
