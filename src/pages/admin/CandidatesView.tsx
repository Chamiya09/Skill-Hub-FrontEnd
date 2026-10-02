import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  ShieldCheck,
  Eye,
  Sparkles,
  Ban,
  UserCheck,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import '../../pages/TechnicalAssessmentsFull.css';
import '../../pages/admin/AdminDashboard.css';
import { adminApi, type AdminCandidateDto } from '../../services/api';

export const CandidatesView: React.FC = () => {
  const [candidates, setCandidates] = useState<AdminCandidateDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [activeCandidateModal, setActiveCandidateModal] = useState<AdminCandidateDto | null>(null);

  const loadCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminApi.getCandidates();
      setCandidates(data);
    } catch (err: any) {
      console.error('Failed to fetch real candidates:', err);
      setError(err.message || 'Failed to load candidates from server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const toggleCandidateStatus = async (id: string) => {
    try {
      const res = await adminApi.toggleCandidateStatus(id);
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: res.status as 'Active' | 'Suspended' } : c
        )
      );
      if (activeCandidateModal && activeCandidateModal.id === id) {
        setActiveCandidateModal((prev) =>
          prev ? { ...prev, status: res.status as 'Active' | 'Suspended' } : null
        );
      }
    } catch (err) {
      console.error('Failed to toggle status on server:', err);
      // Fallback optimistic toggle
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: c.status === 'Active' ? 'Suspended' : 'Active' }
            : c
        )
      );
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.topSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCandidatesCount = candidates.length;
  const activeCount = candidates.filter((c) => c.status === 'Active').length;
  const highMatchCount = candidates.filter((c) => c.aiMatchAverage >= 85).length;
  const suspendedCount = candidates.filter((c) => c.status === 'Suspended').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%' }}>
      {/* =========================================================
          1. TOP COMPONENT: CANDIDATE DIRECTORY DASHBOARD & STATS
          (Structured according to the reference UI design)
          ========================================================= */}
      <section className="pipeline-dashboard-card" aria-labelledby="candidates-dashboard-title" style={{ width: '100%' }}>
        <div className="pipeline-dashboard-header">
          <div>
            <span className="pipeline-dashboard-eyebrow">Global Talent Evaluation & ATS Telemetry</span>
            <h2 id="candidates-dashboard-title">Candidate Assessment Directory</h2>
            <p>
              Real-time governance over candidate assessment metrics, verified skill matrices, AI match benchmarks, and account security authorizations.
            </p>
          </div>

          <div className="pipeline-dashboard-header-actions">
            <span className="pipeline-dashboard-live">
              <span /> Evaluation Live
            </span>
            <button
              type="button"
              className="pipeline-action-btn"
              onClick={() => setSelectedStatus(selectedStatus === 'Active' ? 'All' : 'Active')}
              title={selectedStatus === 'Active' ? 'Show all candidates' : 'Filter to active verified talent'}
            >
              <Sparkles size={14} />
              <span>{selectedStatus === 'Active' ? 'Show All Candidates' : `Verified Talent (${activeCount})`}</span>
            </button>
            <button
              type="button"
              className="pipeline-action-btn"
              onClick={() => loadCandidates()}
              disabled={isLoading}
              title="Refresh candidate data from live database"
            >
              <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isLoading ? 'Fetching...' : 'Sync DB'}</span>
            </button>
          </div>
        </div>

        <div className="pipeline-summary-grid">
          <article className="pipeline-summary-card summary-total">
            <div className="summary-icon"><Users size={20} /></div>
            <div>
              <span>Total Candidates</span>
              <strong>{isLoading ? '...' : totalCandidatesCount}</strong>
              <small>Registered talent profiles</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-ready">
            <div className="summary-icon"><Sparkles size={20} /></div>
            <div>
              <span>AI Verified Talent</span>
              <strong>{isLoading ? '...' : highMatchCount}</strong>
              <small>Passed AI benchmark (&gt;85%)</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-active">
            <div className="summary-icon"><CheckCircle2 size={20} /></div>
            <div>
              <span>Available for Hire</span>
              <strong>{isLoading ? '...' : activeCount}</strong>
              <small>Open for employer placement</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-applicants">
            <div className="summary-icon"><ShieldAlert size={20} /></div>
            <div>
              <span>Suspended / Audit</span>
              <strong>{isLoading ? '...' : suspendedCount}</strong>
              <small>Flagged compliance accounts</small>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          3. MAIN WORKSPACE: SEARCH, TABS & DATA TABLE
          ========================================================= */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #dce7e2',
          borderRadius: 18,
          boxShadow: '0 4px 18px rgba(15, 23, 42, 0.035)',
          overflow: 'hidden',
        }}
      >
        {/* Search & Filter Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #edf2f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            background: '#ffffff',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search candidate by name, email, or verified skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 14px 0 40px',
                borderRadius: 10,
                border: '1px solid #dce5eb',
                background: '#f8fafc',
                color: '#0f172a',
                fontSize: 13.5,
                outline: 'none',
                transition: 'all 0.18s ease',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Unified Filter Tabs */}
          <div
            className="unified-tab-bar"
            style={{
              display: 'inline-flex',
              padding: 4,
              background: '#f1f5f9',
              borderRadius: 9999,
              border: '1px solid #e2e8f0',
              gap: 4,
            }}
          >
            {(['All', 'Active', 'Suspended'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`unified-tab-btn ${selectedStatus === status ? 'active' : ''}`}
                style={{ padding: '6px 16px', fontSize: 12.5 }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '28%' }}>
                  Candidate Profile
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '22%' }}>
                  Contact Email
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '24%' }}>
                  Assessed Skills
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '12%' }}>
                  AI Match Avg
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '8%' }}>
                  Status
                </th>
                <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '6%' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '56px 20px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 650, fontSize: 14 }}>
                      <span className="pipeline-dashboard-live" style={{ padding: 0 }}><span /></span>
                      Retrieving verified candidate records from database...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#ef4444' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Failed to load live data</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>{error}</div>
                    <button
                      type="button"
                      onClick={() => loadCandidates()}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 8,
                        background: '#00b074',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Retry Connection
                    </button>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '52px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    No candidates found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Candidate */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img
                          src={candidate.avatar}
                          alt={candidate.name}
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid #dce7e2',
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 750, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{candidate.name}</span>
                            {candidate.status === 'Active' && (
                              <span title="Verified Candidate" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <ShieldCheck size={14} color="#00b074" />
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{candidate.role}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 12.5, color: '#475569' }}>
                      {candidate.email}
                    </td>

                    {/* Top Skills */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {candidate.topSkills.map((skill) => (
                          <span
                            key={skill}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#334155',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 600,
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* AI Match Average */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 10px',
                          borderRadius: 9999,
                          background: '#eafaf3',
                          border: '1px solid #a7f3d0',
                          color: '#008e60',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        <Sparkles size={12} color="#008e60" />
                        <span>{candidate.aiMatchAverage}%</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 9999,
                          fontSize: 11.5,
                          fontWeight: 750,
                          background: candidate.status === 'Active' ? '#eafaf3' : '#fef2f2',
                          border: `1px solid ${candidate.status === 'Active' ? '#a7f3d0' : '#fecaca'}`,
                          color: candidate.status === 'Active' ? '#008e60' : '#dc2626',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: candidate.status === 'Active' ? '#00b074' : '#ef4444',
                          }}
                        />
                        {candidate.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setActiveCandidateModal(candidate)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCandidateStatus(candidate.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: candidate.status === 'Active' ? '1px solid #fecaca' : '1px solid #a7f3d0',
                            background: candidate.status === 'Active' ? '#fff5f5' : '#eafaf3',
                            color: candidate.status === 'Active' ? '#dc2626' : '#008e60',
                          }}
                        >
                          {candidate.status === 'Active' ? (
                            <>
                              <Ban size={13} />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={13} />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          4. CANDIDATE PROFILE MODAL
          ========================================================= */}
      {activeCandidateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 540,
              background: '#ffffff',
              border: '1px solid #dce7e2',
              borderRadius: 20,
              padding: 28,
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src={activeCandidateModal.avatar}
                  alt={activeCandidateModal.name}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #a7f3d0',
                  }}
                />
                <div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    {activeCandidateModal.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                    {activeCandidateModal.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCandidateModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{activeCandidateModal.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Location:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{activeCandidateModal.location}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>AI Match Rating:</span>
                <span style={{ color: '#008e60', fontWeight: 800 }}>{activeCandidateModal.aiMatchAverage}% (Top Talent Tier)</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Verified Skills:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeCandidateModal.topSkills.map((s) => (
                    <span
                      key={s}
                      style={{
                        background: '#eafaf3',
                        border: '1px solid #a7f3d0',
                        color: '#008e60',
                        padding: '3px 9px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActiveCandidateModal(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
