import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Search,
  Briefcase,
  Ban,
  UserCheck,
  CheckCircle2,
  ShieldAlert,
  X,
  ExternalLink,
  MapPin,
  Mail,
  Calendar,
} from 'lucide-react';
import '../../pages/TechnicalAssessmentsFull.css';
import '../../pages/admin/AdminDashboard.css';
import { adminApi, authStorage, type AdminCompanyDto } from '../../services/api';
import { TableRowSkeleton, SkeletonStatValue, SkeletonStatLabel } from '../../components/common/SkeletonCard';

// Comprehensive mock companies reflecting required columns and states
// Note: No manual approval workflow; accounts are Active or Suspended.
const INITIAL_MOCK_COMPANIES: AdminCompanyDto[] = [
  {
    id: 'comp-001',
    name: 'Stripe Technologies Inc.',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    industry: 'FinTech & Payments Infrastructure',
    contactEmail: 'talent-recruiting@stripe.com',
    website: 'https://stripe.com',
    activeJobPosts: 14,
    totalHires: 42,
    status: 'Active',
    tier: 'Enterprise',
    location: 'San Francisco, CA',
    joinedDate: 'Jan 2025',
  },
  {
    id: 'comp-002',
    name: 'Anthropic Compute Labs',
    logo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=120&auto=format&fit=crop&q=80',
    industry: 'Artificial Intelligence & Safety',
    contactEmail: 'careers@anthropic.com',
    website: 'https://anthropic.com',
    activeJobPosts: 8,
    totalHires: 19,
    status: 'Active',
    tier: 'Enterprise',
    location: 'San Francisco, CA',
    joinedDate: 'Mar 2025',
  },
  {
    id: 'comp-003',
    name: 'Linear Systems Inc.',
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80',
    industry: 'Engineering DevTools & Productivity',
    contactEmail: 'hiring@linear.app',
    website: 'https://linear.app',
    activeJobPosts: 5,
    totalHires: 11,
    status: 'Active',
    tier: 'ScaleUp',
    location: 'New York, NY',
    joinedDate: 'Jul 2025',
  },
  {
    id: 'comp-004',
    name: 'Databricks Cloud Analytics',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&auto=format&fit=crop&q=80',
    industry: 'Data Engineering & Lakehouse',
    contactEmail: 'talent-ops@databricks.com',
    website: 'https://databricks.com',
    activeJobPosts: 12,
    totalHires: 35,
    status: 'Active',
    tier: 'Enterprise',
    location: 'San Francisco, CA',
    joinedDate: 'Oct 2024',
  },
  {
    id: 'comp-005',
    name: 'Nexus Quantum Software',
    logo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=120&auto=format&fit=crop&q=80',
    industry: 'Quantum Simulation & Cloud',
    contactEmail: 'hr-compliance@nexusquantum.io',
    website: 'https://nexusquantum.io',
    activeJobPosts: 2,
    totalHires: 3,
    status: 'Suspended',
    tier: 'Startup',
    location: 'Austin, TX',
    joinedDate: 'Jan 2026',
  },
  {
    id: 'comp-006',
    name: 'AeroDynamics Propulsion',
    logo: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=120&auto=format&fit=crop&q=80',
    industry: 'Aerospace Engineering',
    contactEmail: 'recruitment@aerodynamics.io',
    website: 'https://aerodynamics.io',
    activeJobPosts: 0,
    totalHires: 1,
    status: 'Suspended',
    tier: 'Startup',
    location: 'Seattle, WA',
    joinedDate: 'Feb 2026',
  },
];

interface CompanyJobListing {
  id: string;
  title: string;
  department: string;
  type: string;
  applicants: number;
  postedDate: string;
}

const SAMPLE_COMPANY_JOBS: Record<string, CompanyJobListing[]> = {
  'comp-001': [
    { id: 'job-1', title: 'Staff Backend Infrastructure Engineer', department: 'Payments Core', type: 'Full-time', applicants: 34, postedDate: '3 days ago' },
    { id: 'job-2', title: 'Senior React / UI Platform Architect', department: 'Dashboard & Billing', type: 'Full-time', applicants: 28, postedDate: '1 week ago' },
    { id: 'job-3', title: 'Lead Distributed Systems Engineer', department: 'Treasury Network', type: 'Full-time', applicants: 19, postedDate: '2 weeks ago' },
  ],
  'comp-002': [
    { id: 'job-4', title: 'Research Scientist - Alignment & Safety', department: 'Frontier AI', type: 'Full-time', applicants: 62, postedDate: '5 days ago' },
    { id: 'job-5', title: 'ML Performance Optimization Engineer', department: 'Supercompute', type: 'Full-time', applicants: 41, postedDate: '2 weeks ago' },
  ],
  'comp-003': [
    { id: 'job-6', title: 'Senior Product Designer', department: 'Design Systems', type: 'Full-time', applicants: 15, postedDate: '4 days ago' },
    { id: 'job-7', title: 'Full Stack TypeScript Engineer', department: 'Sync Engine', type: 'Full-time', applicants: 22, postedDate: '1 week ago' },
  ],
};

export const CompaniesView: React.FC = () => {
  const [companies, setCompanies] = useState<AdminCompanyDto[]>(INITIAL_MOCK_COMPANIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [viewJobsModalCompany, setViewJobsModalCompany] = useState<AdminCompanyDto | null>(null);

  const loadCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getCompanies();
      if (Array.isArray(data) && data.length > 0) {
        // Normalize any legacy status
        const normalized = data.map((c) => ({
          ...c,
          status: (c.status === 'Active' ? 'Active' : 'Suspended') as 'Active' | 'Suspended',
        }));
        setCompanies(normalized);
      } else {
        setCompanies(INITIAL_MOCK_COMPANIES);
      }
    } catch (err) {
      console.warn('Backend API companies endpoint unavailable, using mock dataset:', err);
      setCompanies(INITIAL_MOCK_COMPANIES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const toggleCompanyStatus = async (id: string) => {
    const target = companies.find((c) => c.id === id);
    const nextStatus = target?.status === 'Active' ? 'Suspended' : 'Active';
    const isSuspended = nextStatus === 'Suspended';

    // Optimistically update UI
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );

    if (viewJobsModalCompany && viewJobsModalCompany.id === id) {
      setViewJobsModalCompany((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    // Broadcast instant cross-tab & cross-window suspension synchronization
    authStorage.syncAccountSuspension(id, target?.contactEmail, isSuspended);

    try {
      await adminApi.toggleUserSuspend(id);
    } catch {
      try {
        await adminApi.toggleCompanyStatus(id);
      } catch (err) {
        console.warn('Persisting company status toggle via fallback state:', err);
      }
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCompaniesCount = companies.length;
  const activeCount = companies.filter((c) => c.status === 'Active').length;
  const suspendedCount = companies.filter((c) => c.status === 'Suspended').length;
  const totalActiveJobs = companies.reduce((sum, c) => sum + (c.activeJobPosts || 0), 0);

  return (
    <div className="flex flex-col gap-6 w-full font-sans antialiased text-slate-800">
      {/* =========================================================
          1. TOP COMPONENT: COMPANY DIRECTORY DASHBOARD & STATS
          ========================================================= */}
      <section className="pipeline-dashboard-card" aria-labelledby="companies-dashboard-title" style={{ width: '100%' }}>
        <div className="pipeline-dashboard-header">
          <div>
            <span className="pipeline-dashboard-eyebrow">Enterprise Hiring & Employer Governance</span>
            <h2 id="companies-dashboard-title">Companies Directory</h2>
            <p>
              Oversee registered employers, active hiring campaigns, and manage platform authorization states. Accounts are active upon registration.
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
            <div className="summary-icon"><Building2 size={20} /></div>
            <div>
              <span>Total Companies</span>
              <strong>{isLoading ? <SkeletonStatValue width="55px" /> : totalCompaniesCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="135px" /> : 'Registered employer accounts'}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-ready">
            <div className="summary-icon"><Briefcase size={20} /></div>
            <div>
              <span>Active Job Posts</span>
              <strong>{isLoading ? <SkeletonStatValue width="45px" /> : totalActiveJobs}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="120px" /> : 'Live hiring requisitions'}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-active">
            <div className="summary-icon"><CheckCircle2 size={20} /></div>
            <div>
              <span>Active Accounts</span>
              <strong>{isLoading ? <SkeletonStatValue width="45px" /> : activeCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="110px" /> : 'Operating normally'}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-applicants">
            <div className="summary-icon"><ShieldAlert size={20} /></div>
            <div>
              <span>Suspended Accounts</span>
              <strong>{isLoading ? <SkeletonStatValue width="40px" /> : suspendedCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="130px" /> : 'Restricted posting access'}</small>
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
          {/* Search Box */}
          <div className="admin-company-search-box flex-1 min-w-[280px] max-w-md">
            <span className="admin-company-search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="admin-company-search-input"
              placeholder="Search by company name, HR email, or industry..."
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

          {/* Status Filter Tabs (Active / Suspended) */}
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
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm company-table">
            <thead className="bg-[#f8fafc] border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">Company Name</th>
                <th scope="col" className="px-6 py-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">HR Contact Email</th>
                <th scope="col" className="px-6 py-3.5 text-center text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">Active Job Posts</th>
                <th scope="col" className="px-6 py-3.5 text-center text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">Account Status</th>
                <th scope="col" className="px-6 py-3.5 text-right text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={5} />
                ))
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium text-[13.5px]">
                    No companies found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-[#fbfcfe] transition-colors duration-150"
                  >
                    {/* 1. Company Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14.5px] font-bold text-slate-900 tracking-[-0.2px] hover:text-[#00b074] transition-colors">{company.name}</span>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              {company.tier || 'Enterprise'}
                            </span>
                          </div>
                          <div className="text-[12px] font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span>{company.industry}</span>
                            <span className="text-slate-300">•</span>
                            <span>{company.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. HR Contact Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-slate-600 font-sans">
                      {company.contactEmail}
                    </td>

                    {/* 3. Active Job Posts (Integer count badge) */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
                        <Briefcase size={12} className="text-[#2563eb]" />
                        <span>{company.activeJobPosts} Active</span>
                      </span>
                    </td>

                    {/* 4. Account Status (Active / Suspended Green/Red pill badges) */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {company.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#e6f9f2] text-[#009663] border border-[#b7eedc]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00b074] shadow-[0_0_0_2px_rgba(0,176,116,0.25)]" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shadow-[0_0_0_2px_rgba(239,68,68,0.25)]" />
                          Suspended
                        </span>
                      )}
                    </td>

                    {/* 5. Actions ("View Jobs", "Suspend/Activate" toggle) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {/* View Jobs Button */}
                        <button
                          type="button"
                          onClick={() => setViewJobsModalCompany(company)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-[12px] font-semibold shadow-xs transition-colors"
                          title="Inspect active job postings"
                        >
                          <Briefcase size={13} className="text-slate-500" />
                          <span>View Jobs</span>
                        </button>

                        {/* Suspend / Activate Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleCompanyStatus(company.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors border shadow-xs ${
                            company.status === 'Active'
                              ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/80'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80'
                          }`}
                          title={company.status === 'Active' ? 'Suspend employer account' : 'Reactivate employer account'}
                        >
                          {company.status === 'Active' ? (
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

        {/* Table Footer */}
        <div className="px-6 py-3.5 bg-[#f8fafc] border-t border-slate-200 flex items-center justify-between text-[12px] font-medium text-slate-500">
          <span>
            {isLoading ? (
              <span className="inline-block w-44 h-3.5 bg-slate-200 animate-pulse rounded" />
            ) : (
              <>
                Showing <strong className="text-slate-900 font-bold">{filteredCompanies.length}</strong> of{' '}
                <strong className="text-slate-900 font-bold">{companies.length}</strong> registered employers
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Zero-Delay Account Creation Active
          </span>
        </div>
      </div>

      {/* =========================================================
          3. VIEW JOBS MODAL
          ========================================================= */}
      {viewJobsModalCompany && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewJobsModalCompany(null)}
        >
          <div
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {viewJobsModalCompany.name}
                    <span className="text-[11.5px] px-2.5 py-0.5 rounded-full font-bold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
                      {viewJobsModalCompany.activeJobPosts} Active Postings
                    </span>
                  </h3>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{viewJobsModalCompany.industry}</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1"><MapPin size={11} /> {viewJobsModalCompany.location}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewJobsModalCompany(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Metadata */}
            <div className="grid grid-cols-2 gap-3 text-[12px] bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={13} className="text-slate-400" />
                <span>HR: <strong className="text-slate-800 font-sans font-medium">{viewJobsModalCompany.contactEmail}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 justify-end">
                <a
                  href={viewJobsModalCompany.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>{viewJobsModalCompany.website}</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.5px] text-slate-500">
                Live Campaign Requisitions
              </h4>
              {viewJobsModalCompany.activeJobPosts === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No active job posts currently published by this employer.
                </div>
              ) : (
                (SAMPLE_COMPANY_JOBS[viewJobsModalCompany.id] || [
                  {
                    id: 'job-default-1',
                    title: 'Senior Software Engineer',
                    department: 'Engineering',
                    type: 'Full-time',
                    applicants: 18,
                    postedDate: 'Recently',
                  },
                  {
                    id: 'job-default-2',
                    title: 'Technical Product Manager',
                    department: 'Product',
                    type: 'Full-time',
                    applicants: 9,
                    postedDate: '1 week ago',
                  },
                ]).map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-[14px]">{job.title}</div>
                      <div className="text-[12px] text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                        <span className="font-semibold text-slate-700">{job.department}</span>
                        <span className="text-slate-300">•</span>
                        <span>{job.type}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {job.postedDate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-bold bg-[#e6f9f2] text-[#009663] px-2.5 py-1 rounded-md border border-[#b7eedc]">
                        {job.applicants} Applicants
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleCompanyStatus(viewJobsModalCompany.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${
                  viewJobsModalCompany.status === 'Active'
                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {viewJobsModalCompany.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
              </button>
              <button
                type="button"
                onClick={() => setViewJobsModalCompany(null)}
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
