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
  Eye,
  Globe,
  Copy,
  Check,
  ShieldCheck,
  Users,
  Award,
  Sparkles,
  Send,
  FileText,
  Building,
  Phone,
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
    description: 'Stripe is an economic infrastructure platform for the internet. Millions of businesses—from the world’s largest enterprises to ambitious startups—use Stripe software to accept payments, grow revenue, and accelerate new business opportunities.',
    companySize: '5,000 - 10,000 Employees',
    phone: '+1 (415) 890-7100',
    headquarters: 'South San Francisco, CA, USA',
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
    description: 'Anthropic is an AI safety and research company that builds reliable, interpretable, and steerable AI systems. Creators of Claude and pioneer in constitutional AI research.',
    companySize: '500 - 1,000 Employees',
    phone: '+1 (415) 670-9200',
    headquarters: 'San Francisco, CA, USA',
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
    description: 'Linear is a purpose-built issue tracking and project management tool designed specifically for high-performing modern software engineering and product teams.',
    companySize: '100 - 250 Employees',
    phone: '+1 (212) 430-8800',
    headquarters: 'New York, NY, USA',
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
    description: 'Databricks unites data engineering, science, machine learning, and business analytics on their lakehouse architecture, driving predictive AI transformation globally.',
    companySize: '5,000+ Employees',
    phone: '+1 (866) 330-0121',
    headquarters: 'San Francisco, CA, USA',
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
    description: 'Nexus Quantum delivers fault-tolerant quantum algorithms and cloud-based quantum simulator compilers for computational chemistry and material discovery.',
    companySize: '25 - 50 Employees',
    phone: '+1 (512) 980-3344',
    headquarters: 'Austin, TX, USA',
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
    description: 'AeroDynamics is developing next-generation electric propulsion turbines and hybrid-hydrogen aerodynamic airframes for sustainable commercial aviation.',
    companySize: '50 - 100 Employees',
    phone: '+1 (206) 554-9100',
    headquarters: 'Seattle, WA, USA',
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

// Metadata resolvers for fallback values
const getCompanyDescription = (c: AdminCompanyDto) => {
  if (c.description) return c.description;
  return `${c.name} is a premier enterprise employer partner operating in ${c.industry}, actively recruiting verified technical talent through the Skill Hub assessment network.`;
};

const getCompanySize = (c: AdminCompanyDto) => {
  if (c.companySize) return c.companySize;
  if (c.tier === 'Enterprise') return '1,000 - 5,000+ Employees';
  if (c.tier === 'ScaleUp') return '100 - 500 Employees';
  return '25 - 100 Employees';
};

const getCompanyInitials = (name: string) => {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'CO'
  );
};

export const CompaniesView: React.FC = () => {
  const [companies, setCompanies] = useState<AdminCompanyDto[]>(INITIAL_MOCK_COMPANIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [activeCompanyModal, setActiveCompanyModal] = useState<AdminCompanyDto | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

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

    if (activeCompanyModal && activeCompanyModal.id === id) {
      setActiveCompanyModal((prev) => (prev ? { ...prev, status: nextStatus } : null));
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
                        {/* View Details Button */}
                        <button
                          type="button"
                          onClick={() => setActiveCompanyModal(company)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-[12px] font-semibold shadow-xs transition-colors cursor-pointer"
                          title="View company details"
                        >
                          <Eye size={13} className="text-slate-500" />
                          <span>View Details</span>
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
          3. COMPANY DETAILS MODAL (Skill Hub System UI Theme)
          ========================================================= */}
      {activeCompanyModal && (() => {
        const initials = getCompanyInitials(activeCompanyModal.name);
        const desc = getCompanyDescription(activeCompanyModal);
        const size = getCompanySize(activeCompanyModal);
        const jobsList = SAMPLE_COMPANY_JOBS[activeCompanyModal.id] || [
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
        ];

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => setActiveCompanyModal(null)}
          >
            <div
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Skill Hub Corporate Emerald Gradient Banner */}
              <div className="relative h-24 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-6 py-3.5 flex items-start justify-between flex-shrink-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-xs">
                  <ShieldCheck size={13} className="text-emerald-200" />
                  <span>Corporate Employer Partner • Verified Enterprise Clearance</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCompanyModal(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                  title="Close inspection"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 2. Hero Overlapping Profile Header */}
              <div className="px-6 pt-0 pb-4 border-b border-slate-100 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10 mb-3">
                  <div className="flex items-end gap-3.5">
                    {/* Company Logo Box */}
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                      {activeCompanyModal.logo ? (
                        <img
                          src={activeCompanyModal.logo}
                          alt={activeCompanyModal.name}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-emerald-600', 'to-teal-700', 'text-white');
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerText = initials;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-2xl font-black rounded-xl">
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Company Name & Badges */}
                    <div>
                      <div className="flex items-center flex-wrap gap-2.5">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                          {activeCompanyModal.name}
                        </h3>
                        {/* Account Status Pill */}
                        {activeCompanyModal.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#e6f9f2] text-[#009663] border border-[#b7eedc]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00b074] shadow-[0_0_0_2px_rgba(0,176,116,0.25)]" />
                            Active Partner
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shadow-[0_0_0_2px_rgba(239,68,68,0.25)]" />
                            Suspended
                          </span>
                        )}
                        {/* Tier Pill */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            activeCompanyModal.tier === 'Enterprise'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : activeCompanyModal.tier === 'ScaleUp'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}
                        >
                          <Award size={11} />
                          {activeCompanyModal.tier} Tier
                        </span>
                      </div>
                      <p className="text-[13.5px] font-semibold text-emerald-700 mt-0.5">
                        {activeCompanyModal.industry}
                      </p>
                    </div>
                  </div>

                  {/* ID Tag */}
                  <span className="font-mono text-[11.5px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                    ID: {activeCompanyModal.id}
                  </span>
                </div>

                {/* Sub-meta row: Location, Website, Joined Date */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[12px] font-medium text-slate-500 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{activeCompanyModal.location}</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe size={13} className="text-slate-400" />
                    <a
                      href={activeCompanyModal.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>{activeCompanyModal.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={10} />
                    </a>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Partner Since {activeCompanyModal.joinedDate}</span>
                  </span>
                </div>
              </div>

              {/* 3. Performance & Telemetry KPI Grid (4 Cards) */}
              <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex-shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 1. Active Openings */}
                  <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Active Openings</div>
                      <div className="text-base font-black text-slate-900">{activeCompanyModal.activeJobPosts} Live Roles</div>
                    </div>
                  </div>

                  {/* 2. Total Talent Hires */}
                  <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Talent Hires</div>
                      <div className="text-base font-black text-slate-900">{activeCompanyModal.totalHires} Placed</div>
                    </div>
                  </div>

                  {/* 3. Company Scale */}
                  <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Building size={18} />
                    </div>
                    <div>
                      <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Company Size</div>
                      <div className="text-xs font-bold text-slate-900 truncate" title={size}>{size}</div>
                    </div>
                  </div>

                  {/* 4. Directory Clearance */}
                  <div className="p-3 rounded-xl bg-white border border-teal-100 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Clearance</div>
                      <div className="text-xs font-bold text-emerald-700">Zero-Delay Live</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Scrollable Details Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* About & Corporate Overview */}
                <div>
                  <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <FileText size={13} className="text-emerald-600" />
                    Corporate Profile & Overview
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-[13px] leading-relaxed font-sans shadow-2xs">
                    {desc}
                  </div>
                </div>

                {/* Corporate Dispatch & Contact Channels */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Mail size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">HR Contact Channel</div>
                      <div className="text-[12.5px] font-bold text-slate-800 truncate font-sans">
                        {activeCompanyModal.contactEmail}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyEmail(activeCompanyModal.contactEmail)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        copiedEmail
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title="Copy HR email"
                    >
                      {copiedEmail ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
                    </button>

                    <a
                      href={`mailto:${activeCompanyModal.contactEmail}?subject=${encodeURIComponent(`Skill Hub Administration - ${activeCompanyModal.name}`)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                      title="Send email via mail client"
                    >
                      <Send size={13} />
                      <span>Write Email</span>
                    </a>
                  </div>
                </div>

                {/* Live Campaign Requisitions & Vacancies */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Briefcase size={13} className="text-emerald-600" />
                      Live Campaign Requisitions & Vacancies
                    </h4>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {jobsList.length} Active Postings
                    </span>
                  </div>

                  {jobsList.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No active job posts currently published by this employer.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {jobsList.map((job) => (
                        <div
                          key={job.id}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white transition-all shadow-2xs hover:shadow-xs flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-[13.5px]">{job.title}</div>
                            <div className="text-[12px] text-slate-500 flex items-center flex-wrap gap-2 mt-1 font-medium">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                {job.department}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span>{job.type}</span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar size={11} /> {job.postedDate}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold bg-[#e6f9f2] text-[#009663] px-2.5 py-1 rounded-lg border border-[#b7eedc]">
                              <Users size={12} />
                              {job.applicants} Applicants
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. System Footer Actions */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
                <button
                  type="button"
                  onClick={() => toggleCompanyStatus(activeCompanyModal.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    activeCompanyModal.status === 'Active'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs'
                      : 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-xs'
                  }`}
                >
                  {activeCompanyModal.status === 'Active' ? (
                    <>
                      <Ban size={14} />
                      <span>Suspend Account</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      <span>Activate Account</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2.5">
                  <a
                    href={`mailto:${activeCompanyModal.contactEmail}?subject=${encodeURIComponent(`Skill Hub Administration - ${activeCompanyModal.name}`)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
                  >
                    <Mail size={13} className="text-emerald-600" />
                    <span>Contact HR</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setActiveCompanyModal(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
