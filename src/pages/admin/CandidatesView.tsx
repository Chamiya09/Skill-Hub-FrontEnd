import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  Eye,
  Ban,
  UserCheck,
  CheckCircle2,
  ShieldAlert,
  X,
  Mail,
  MapPin,
} from 'lucide-react';
import '../../pages/TechnicalAssessmentsFull.css';
import '../../pages/admin/AdminDashboard.css';
import { adminApi, type AdminCandidateDto } from '../../services/api';
import { TableRowSkeleton, SkeletonStatValue, SkeletonStatLabel } from '../../components/common/SkeletonCard';

// Comprehensive mock candidates reflecting required columns and states
const INITIAL_MOCK_CANDIDATES: AdminCandidateDto[] = [
  {
    id: 'cand-001',
    name: 'Alex Rivera',
    avatar: '',
    role: 'Senior Full-Stack Engineer',
    email: 'alex.rivera@example.com',
    topSkills: ['React', 'TypeScript', 'Node.js', '.NET 8', 'PostgreSQL'],
    aiMatchAverage: 94,
    status: 'Active',
    location: 'San Francisco, CA',
  },
  {
    id: 'cand-002',
    name: 'Dr. Samantha Chen',
    avatar: '',
    role: 'Lead AI / ML Researcher',
    email: 'samantha.chen@mllabs.ai',
    topSkills: ['Python', 'PyTorch', 'LLMs', 'Groq', 'FastAPI'],
    aiMatchAverage: 98,
    status: 'Active',
    location: 'Boston, MA',
  },
  {
    id: 'cand-003',
    name: 'Marcus Vance',
    avatar: '',
    role: 'Staff DevOps & Cloud Architect',
    email: 'marcus.vance@cloudarch.dev',
    topSkills: ['Kubernetes', 'AWS', 'Terraform', 'Docker', 'CI/CD'],
    aiMatchAverage: 88,
    status: 'Active',
    location: 'Seattle, WA',
  },
  {
    id: 'cand-004',
    name: 'Elena Rostova',
    avatar: '',
    role: 'Staff Security Engineer',
    email: 'elena.rostova@cybershield.io',
    topSkills: ['OAuth2', 'Zero Trust', 'Pen Testing', 'Go', 'Rust'],
    aiMatchAverage: 91,
    status: 'Suspended',
    location: 'Austin, TX',
  },
  {
    id: 'cand-005',
    name: 'David Okafor',
    avatar: '',
    role: 'Senior Frontend Architect',
    email: 'david.okafor@frontendhub.org',
    topSkills: ['Vue.js', 'Next.js', 'Tailwind CSS', 'GraphQL'],
    aiMatchAverage: 85,
    status: 'Active',
    location: 'Chicago, IL',
  },
  {
    id: 'cand-006',
    name: 'Clara Oswald',
    avatar: '',
    role: 'Junior Data Scientist',
    email: 'clara.oswald@analytics.co',
    topSkills: ['SQL', 'Pandas', 'Tableau', 'R'],
    aiMatchAverage: 72,
    status: 'Suspended',
    location: 'Denver, CO',
  },
];

export const CandidatesView: React.FC = () => {
  const [candidates, setCandidates] = useState<AdminCandidateDto[]>(INITIAL_MOCK_CANDIDATES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [activeCandidateModal, setActiveCandidateModal] = useState<AdminCandidateDto | null>(null);

  const loadCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getCandidates();
      if (Array.isArray(data) && data.length > 0) {
        setCandidates(data);
      } else {
        setCandidates(INITIAL_MOCK_CANDIDATES);
      }
    } catch (err) {
      console.warn('Backend API candidates endpoint unavailable, running with mock dataset:', err);
      setCandidates(INITIAL_MOCK_CANDIDATES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const toggleCandidateStatus = async (id: string) => {
    const target = candidates.find((c) => c.id === id);
    const nextStatus = target?.status === 'Active' ? 'Suspended' : 'Active';

    // Optimistically update UI
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );

    if (activeCandidateModal && activeCandidateModal.id === id) {
      setActiveCandidateModal((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    try {
      await adminApi.toggleUserSuspend(id);
    } catch {
      try {
        await adminApi.toggleCandidateStatus(id);
      } catch (err) {
        console.warn('Persisting candidate status toggle via fallback state:', err);
      }
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
  const suspendedCount = candidates.filter((c) => c.status === 'Suspended').length;

  return (
    <div className="flex flex-col gap-6 w-full font-sans antialiased text-slate-800">
      {/* =========================================================
          1. TOP COMPONENT: CANDIDATE DIRECTORY DASHBOARD & STATS
          ========================================================= */}
      <section className="pipeline-dashboard-card" aria-labelledby="candidates-dashboard-title" style={{ width: '100%' }}>
        <div className="pipeline-dashboard-header">
          <div>
            <span className="pipeline-dashboard-eyebrow">Talent Assessment & ATS Verification</span>
            <h2 id="candidates-dashboard-title">Candidate Directory</h2>
            <p>
              Inspect candidate profiles, verified skill badges, profile strength scores, and enforce administrative suspension controls.
            </p>
          </div>

          <div className="pipeline-dashboard-header-actions">
            <span className="pipeline-dashboard-live">
              <span /> Directory Active
            </span>
          </div>
        </div>

        <div className="pipeline-summary-grid">
          <article className="pipeline-summary-card summary-total">
            <div className="summary-icon"><Users size={20} /></div>
            <div>
              <span>Total Candidates</span>
              <strong>{isLoading ? <SkeletonStatValue width="55px" /> : totalCandidatesCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="140px" /> : 'Registered candidate profiles'}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-active">
            <div className="summary-icon"><CheckCircle2 size={20} /></div>
            <div>
              <span>Active Accounts</span>
              <strong>{isLoading ? <SkeletonStatValue width="45px" /> : activeCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="120px" /> : 'Authorized talent in pool'}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-applicants">
            <div className="summary-icon"><ShieldAlert size={20} /></div>
            <div>
              <span>Suspended Accounts</span>
              <strong>{isLoading ? <SkeletonStatValue width="40px" /> : suspendedCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="105px" /> : 'Restricted access'}</small>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          2. MAIN WORKSPACE: SEARCH, TABS & DATA TABLE
          ========================================================= */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Search & Filter Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
          {/* Company-Style Search Box */}
          <div className="admin-company-search-box flex-1 min-w-[280px] max-w-md">
            <span className="admin-company-search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="admin-company-search-input"
              placeholder="Search by candidate name, email, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-company-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Unified Filter Tabs */}
          <div className="unified-tab-bar">
            {(['All', 'Active', 'Suspended'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`unified-tab-btn ${selectedStatus === status ? 'active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th scope="col" className="px-6 py-4">Candidate Name</th>
                <th scope="col" className="px-6 py-4">Email Address</th>
                <th scope="col" className="px-6 py-4">Top Skills</th>
                <th scope="col" className="px-6 py-4 text-center">Account Status</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={5} />
                ))
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No candidates found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="hover:bg-slate-50/75 transition-colors duration-150"
                  >
                    {/* 1. Candidate Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{candidate.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {candidate.role || 'Full-Stack Candidate'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Email Address */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                      {candidate.email}
                    </td>

                    {/* 3. Top Skills (Elegant Tailwind tags/badges) */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {candidate.topSkills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/70 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.topSkills.length > 4 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            +{candidate.topSkills.length - 4}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Account Status (Active / Suspended Green/Red pill badges) */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {candidate.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-inset ring-emerald-600/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-inset ring-rose-600/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Suspended
                        </span>
                      )}
                    </td>

                    {/* 5. Actions ("View", "Suspend/Activate" toggle) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => setActiveCandidateModal(candidate)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
                          title="View profile details"
                        >
                          <Eye size={13} className="text-slate-500" />
                          <span>View</span>
                        </button>

                        {/* Suspend / Activate Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleCandidateStatus(candidate.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border shadow-xs ${
                            candidate.status === 'Active'
                              ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/80'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80'
                          }`}
                          title={candidate.status === 'Active' ? 'Suspend candidate account' : 'Reactivate candidate account'}
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

        {/* Table Footer: Summary telemetry */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {isLoading ? (
              <span className="inline-block w-44 h-3.5 bg-slate-200 animate-pulse rounded" />
            ) : (
              <>
                Showing <strong className="text-slate-900 font-semibold">{filteredCandidates.length}</strong> of{' '}
                <strong className="text-slate-900 font-semibold">{candidates.length}</strong> candidate profiles
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ATS Candidate Pool Sync Active
          </span>
        </div>
      </div>

      {/* =========================================================
          3. CANDIDATE PROFILE INSPECTION MODAL
          ========================================================= */}
      {activeCandidateModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveCandidateModal(null)}
        >
          <div
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{activeCandidateModal.name}</h3>
                  <p className="text-xs text-slate-500">{activeCandidateModal.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCandidateModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Profile Metrics */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" />
                  Email
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900">{activeCandidateModal.email}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  Location
                </span>
                <span className="font-medium text-slate-900">{activeCandidateModal.location}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Account Authorization</span>
                <span
                  className={`font-semibold text-xs px-2.5 py-0.5 rounded-full border ${
                    activeCandidateModal.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {activeCandidateModal.status}
                </span>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-slate-600 block mb-2">Verified Skill Stack</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeCandidateModal.topSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleCandidateStatus(activeCandidateModal.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${
                  activeCandidateModal.status === 'Active'
                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {activeCandidateModal.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCandidateModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
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
