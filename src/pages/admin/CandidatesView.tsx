import React, { useState } from 'react';
import {
  Search,
  Users,
  ShieldCheck,
  Eye,
  Sparkles,
  Ban,
  UserCheck,
} from 'lucide-react';
import '../../pages/admin/AdminDashboard.css';

interface Candidate {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
  topSkills: string[];
  aiMatchAverage: number;
  status: 'Active' | 'Suspended';
  location: string;
}

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-001',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    role: 'Senior Full-Stack Engineer',
    email: 'alex.rivera@example.com',
    topSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    aiMatchAverage: 96,
    status: 'Active',
    location: 'San Francisco, CA',
  },
  {
    id: 'cand-002',
    name: 'Dr. Samantha Chen',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    role: 'Lead AI / ML Researcher',
    email: 'samantha.chen@mllabs.ai',
    topSkills: ['PyTorch', 'LLMs', 'FastAPI', 'Vector DBs'],
    aiMatchAverage: 98,
    status: 'Active',
    location: 'Boston, MA',
  },
  {
    id: 'cand-003',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    role: 'Staff DevOps & Cloud Architect',
    email: 'marcus.vance@cloudarch.dev',
    topSkills: ['Kubernetes', 'Terraform', 'AWS', 'Docker'],
    aiMatchAverage: 91,
    status: 'Active',
    location: 'Seattle, WA',
  },
  {
    id: 'cand-004',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    role: 'Senior UI/UX & Frontend Engineer',
    email: 'elena.rostova@designsystems.io',
    topSkills: ['Tailwind CSS', 'Figma', 'Next.js', 'Accessibility'],
    aiMatchAverage: 89,
    status: 'Suspended',
    location: 'Austin, TX',
  },
];

export const CandidatesView: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [activeCandidateModal, setActiveCandidateModal] = useState<Candidate | null>(null);

  const toggleCandidateStatus = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'Active' ? 'Suspended' : 'Active' }
          : c
      )
    );
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.topSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Header & Metric Tags */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#00b074', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            <Users size={14} />
            <span>Talent Directory & Governance</span>
          </div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: 26, fontWeight: 850, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Manage Candidates
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
            Audit candidate ATS profiles, skill matrices, AI assessments, and account authorization states.
          </p>
        </div>

        {/* Counter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Total Talent</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{candidates.length}</span>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#00b074' }}>Active</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#00b074' }}>
              {candidates.filter((c) => c.status === 'Active').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar: Search Input & Standardized Pill Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by candidate name, email, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: 40, padding: '0 14px 0 38px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 13.5, outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' }}
          />
        </div>

        {/* Standard System Unified Tab Bar */}
        <div className="unified-tab-bar" style={{ display: 'inline-flex', padding: 4, background: '#f1f5f9', borderRadius: 9999, border: '1px solid #e2e8f0', gap: 4 }}>
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

      {/* 3. Candidates Data Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '28%' }}>
                  Candidate
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '22%' }}>
                  Email
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '24%' }}>
                  Top Skills
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '12%' }}>
                  AI Match Avg
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '8%' }}>
                  Status
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '6%' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    No candidates found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                    {/* Candidate */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img
                          src={candidate.avatar}
                          alt={candidate.name}
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontWeight: 750, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{candidate.name}</span>
                            {candidate.status === 'Active' && (
                              <ShieldCheck size={14} color="#00b074" title="Verified Candidate" />
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
                          background: '#e6f9f2',
                          border: '1px solid #a7f3d0',
                          color: '#009e67',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        <Sparkles size={12} color="#00b074" />
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
                          background: candidate.status === 'Active' ? '#e6f9f2' : '#fef2f2',
                          border: `1px solid ${candidate.status === 'Active' ? '#a7f3d0' : '#fecaca'}`,
                          color: candidate.status === 'Active' ? '#009e67' : '#dc2626',
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
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
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
                            background: candidate.status === 'Active' ? '#fff5f5' : '#e6f9f2',
                            color: candidate.status === 'Active' ? '#dc2626' : '#009e67',
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

      {/* 4. Candidate Quick View Modal */}
      {activeCandidateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 540, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src={activeCandidateModal.avatar}
                  alt={activeCandidateModal.name}
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #a7f3d0' }}
                />
                <div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{activeCandidateModal.name}</h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>{activeCandidateModal.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCandidateModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', padding: 4 }}
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
                <span style={{ color: '#00b074', fontWeight: 800 }}>{activeCandidateModal.aiMatchAverage}% (Top Talent Tier)</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Verified Skills:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeCandidateModal.topSkills.map((s) => (
                    <span key={s} style={{ background: '#e6f9f2', border: '1px solid #a7f3d0', color: '#009e67', padding: '3px 9px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
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
                style={{ padding: '8px 18px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
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
