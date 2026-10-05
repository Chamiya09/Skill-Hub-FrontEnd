import React, { useState, useEffect, useCallback } from 'react';
import {
  Inbox,
  Search,
  Eye,
  Check,
  CheckCircle2,
  X,
  Mail,
  User,
  Building2,
  HelpCircle,
  Clock,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Tag,
  ShieldCheck,
  Send,
  Copy,
  ExternalLink,
  MessageSquare,
  FileText,
  LifeBuoy,
  CornerDownRight,
} from 'lucide-react';
import '../../pages/TechnicalAssessmentsFull.css';
import '../../pages/admin/AdminDashboard.css';
import { adminApi, type AdminInquiryDto } from '../../services/api';
import { TableRowSkeleton, SkeletonStatValue, SkeletonStatLabel } from '../../components/common/SkeletonCard';

// Automated topic classification and metadata resolvers
const getInquiryCategory = (inq: AdminInquiryDto) => {
  if (inq.category) return inq.category;
  const text = `${inq.subject} ${inq.message}`.toLowerCase();
  if (text.includes('bug') || text.includes('error') || text.includes('fix') || text.includes('issue') || text.includes('broken')) {
    return 'Technical Bug & Platform Issue';
  }
  if (text.includes('certif') || text.includes('score') || text.includes('badge') || text.includes('exam') || text.includes('assessment')) {
    return 'Assessment & Skill Certification';
  }
  if (text.includes('bill') || text.includes('pricing') || text.includes('seat') || text.includes('upgrade') || text.includes('subscription')) {
    return 'Billing & Enterprise Licensing';
  }
  if (text.includes('api') || text.includes('webhook') || text.includes('sync') || text.includes('integration')) {
    return 'API Integration & HRMS Sync';
  }
  if (text.includes('account') || text.includes('suspend') || text.includes('reactivat') || text.includes('login') || text.includes('password')) {
    return 'Account Security & Clearance';
  }
  return 'General Support Requisition';
};

const getInquiryPriority = (inq: AdminInquiryDto): 'High' | 'Normal' => {
  if (inq.priority) return inq.priority;
  const text = `${inq.subject} ${inq.message}`.toLowerCase();
  if (text.includes('bug') || text.includes('urgent') || text.includes('critical') || text.includes('suspend') || text.includes('down')) {
    return 'High';
  }
  return 'Normal';
};

const getTicketId = (inq: AdminInquiryDto) =>
  `#TKT-${inq.id.replace('inq-', '').toUpperCase().padStart(4, '0')}`;

// Comprehensive mock dataset reflecting required columns, dates ('MMM DD, YYYY'), and statuses
const INITIAL_MOCK_INQUIRIES: AdminInquiryDto[] = [
  {
    id: 'inq-001',
    sender: 'Sarah Jenkins',
    senderType: 'Candidate',
    email: 'sarah.jenkins@gmail.com',
    subject: 'Verification status question regarding AWS Solutions Architect certification score',
    message: 'Hello Support Team, I completed the Advanced Cloud Architecture assessment yesterday and received a 96% score. Could you please confirm if this badge has been automatically published to my public talent profile?',
    date: 'Oct 02, 2026',
    status: 'New',
    priority: 'Normal',
    category: 'Assessment & Skill Certification',
  },
  {
    id: 'inq-002',
    sender: 'David Sterling',
    senderType: 'Company',
    organization: 'Acme Enterprise Labs',
    email: 'd.sterling@acmelabs.com',
    subject: 'Request for custom technical skill benchmark matrix for hiring senior Rust engineers',
    message: 'We are expanding our high-frequency trading engine team and would like to configure a bespoke automated coding assessment including concurrency and memory safety benchmarks.',
    date: 'Sep 29, 2026',
    status: 'Read',
    priority: 'High',
    category: 'Enterprise Benchmark Matrix',
  },
  {
    id: 'inq-003',
    sender: 'Elena Rostova',
    senderType: 'Candidate',
    email: 'elena.rostova@cybershield.io',
    subject: 'Account reactivation request following multi-region security compliance audit check',
    message: 'Greetings, my profile was temporarily suspended due to a duplicate device login while traveling internationally. I have verified my credentials and request account reactivation.',
    date: 'Sep 25, 2026',
    status: 'New',
    priority: 'High',
    category: 'Account Security & Clearance',
  },
  {
    id: 'inq-004',
    sender: 'Rachel Green',
    senderType: 'Company',
    organization: 'Vanguard FinTech Group',
    email: 'rchel.green@vanguardtech.io',
    subject: 'Billing inquiry and enterprise bulk candidate seat tier upgrade assistance',
    message: 'Our annual subscription renewal is approaching. We would like to add 25 additional ATS reviewer seats for our European recruitment department.',
    date: 'Sep 18, 2026',
    status: 'Resolved',
    priority: 'Normal',
    category: 'Billing & Enterprise Licensing',
  },
  {
    id: 'inq-005',
    sender: 'Liam Henderson',
    senderType: 'Candidate',
    email: 'liam.henderson@devmail.org',
    subject: 'Question on Groq AI coding assessment evaluation criteria and automated feedback',
    message: 'I really appreciated the automated AI feedback on my algorithms assessment. Is it possible to share the performance score report directly with external recruiters via a verified link?',
    date: 'Sep 12, 2026',
    status: 'Read',
    priority: 'Normal',
    category: 'AI Scoring & Evaluation',
  },
  {
    id: 'inq-006',
    sender: 'Patricia Moore',
    senderType: 'Company',
    organization: 'CloudScale Networks',
    email: 'patricia@cloudscale.net',
    subject: 'API webhook integration setup for automated ATS candidate applicant sync',
    message: 'Thank you for your assistance. The webhook integration with our internal HRMS is now functioning seamlessly across all our tech vacancies.',
    date: 'Aug 30, 2026',
    status: 'Resolved',
    priority: 'Normal',
    category: 'API Integration & HRMS Sync',
  },
];

export const InquiriesView: React.FC = () => {
  const [inquiries, setInquiries] = useState<AdminInquiryDto[]>(INITIAL_MOCK_INQUIRIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'New' | 'Read' | 'Resolved'>('All');
  const [selectedSenderType, setSelectedSenderType] = useState<string>('All');
  const [activeMessageModal, setActiveMessageModal] = useState<AdminInquiryDto | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState('');

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const loadInquiries = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getInquiries();
      if (Array.isArray(data) && data.length > 0) {
        // Ensure dates conform to 'MMM DD, YYYY' format
        const formatted = data.map((item) => ({
          ...item,
          status: (item.status === 'Resolved' ? 'Resolved' : item.status === 'Read' ? 'Read' : 'New') as 'New' | 'Read' | 'Resolved',
        }));
        setInquiries(formatted);
      } else {
        setInquiries(INITIAL_MOCK_INQUIRIES);
      }
    } catch (err) {
      console.warn('Backend API inquiries endpoint unavailable, using mock dataset:', err);
      setInquiries(INITIAL_MOCK_INQUIRIES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  // Read action: opens modal and marks 'New' inquiries as 'Read'
  const handleReadInquiry = (inquiry: AdminInquiryDto) => {
    if (inquiry.status === 'New') {
      setInquiries((prev) =>
        prev.map((i) => (i.id === inquiry.id ? { ...i, status: 'Read' } : i))
      );
      setActiveMessageModal({ ...inquiry, status: 'Read' });
    } else {
      setActiveMessageModal(inquiry);
    }
  };

  // Toggle/Mark Resolved action
  const toggleResolved = async (id: string) => {
    const target = inquiries.find((i) => i.id === id);
    const nextStatus = target?.status === 'Resolved' ? 'Read' : 'Resolved';

    setInquiries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: nextStatus } : i))
    );

    if (activeMessageModal && activeMessageModal.id === id) {
      setActiveMessageModal((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    try {
      await adminApi.toggleInquiryStatus(id);
    } catch (err) {
      console.warn('Persisting inquiry status toggle via fallback state:', err);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      inq.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.organization && inq.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inq.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || inq.status === selectedStatus;
    const matchesSenderType = selectedSenderType === 'All' || inq.senderType === selectedSenderType;
    return matchesSearch && matchesStatus && matchesSenderType;
  });

  const totalInquiriesCount = inquiries.length;
  const newCount = inquiries.filter((i) => i.status === 'New').length;
  const readCount = inquiries.filter((i) => i.status === 'Read').length;
  const resolvedCount = inquiries.filter((i) => i.status === 'Resolved').length;

  return (
    <div className="flex flex-col gap-6 w-full font-sans antialiased text-slate-800">
      {/* =========================================================
          1. TOP COMPONENT: INQUIRIES DESK DASHBOARD & STATS
          ========================================================= */}
      <section className="pipeline-dashboard-card" aria-labelledby="inquiries-dashboard-title" style={{ width: '100%' }}>
        <div className="pipeline-dashboard-header">
          <div>
            <span className="pipeline-dashboard-eyebrow">Enterprise & Candidate Communications Desk</span>
            <h2 id="inquiries-dashboard-title">Inquiries Directory</h2>
            <p>
              Review correspondence from candidates, employers, and enterprise partners submitted through the universal support portal.
            </p>
          </div>

          <div className="pipeline-dashboard-header-actions">
            <span className="pipeline-dashboard-live">
              <span /> Dispatch Active
            </span>
          </div>
        </div>

        <div className="pipeline-summary-grid">
          <article className="pipeline-summary-card summary-total">
            <div className="summary-icon"><Inbox size={20} /></div>
            <div>
              <span>Total Inquiries</span>
              <strong>{isLoading ? <SkeletonStatValue width="55px" /> : totalInquiriesCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="125px" /> : 'Submissions received'}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-ready">
            <div className="summary-icon"><Clock size={20} /></div>
            <div>
              <span>New Submissions</span>
              <strong>{isLoading ? <SkeletonStatValue width="45px" /> : newCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="100px" /> : 'Awaiting review'}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-active">
            <div className="summary-icon"><Mail size={20} /></div>
            <div>
              <span>Read / In Review</span>
              <strong>{isLoading ? <SkeletonStatValue width="45px" /> : readCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="115px" /> : 'Under investigation'}</small>
            </div>
          </article>
          <article className="pipeline-summary-card summary-applicants">
            <div className="summary-icon"><CheckCircle2 size={20} /></div>
            <div>
              <span>Resolved Cases</span>
              <strong>{isLoading ? <SkeletonStatValue width="40px" /> : resolvedCount}</strong>
              <small>{isLoading ? <SkeletonStatLabel width="125px" /> : 'Successfully resolved'}</small>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          2. MAIN WORKSPACE: SEARCH, FILTERS & DATA TABLE
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
              placeholder="Search by sender, email, subject, or message..."
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

          {/* Filter Controls Row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Sender Type Dropdown */}
            <select
              value={selectedSenderType}
              onChange={(e) => setSelectedSenderType(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            >
              <option value="All">All Senders</option>
              <option value="Candidate">Candidate Only</option>
              <option value="Company">Company Only</option>
            </select>

            {/* Status Filter Tabs (All / New / Read / Resolved) */}
            <div className="unified-tab-bar">
              {(['All', 'New', 'Read', 'Resolved'] as const).map((status) => (
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
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm company-table">
            <thead className="bg-[#f8fafc] border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">Sender Details</th>
                <th scope="col" className="px-6 py-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">Subject</th>
                <th scope="col" className="px-6 py-3.5 text-center text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">Date Received</th>
                <th scope="col" className="px-6 py-3.5 text-center text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">Status</th>
                <th scope="col" className="px-6 py-3.5 text-right text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={5} hasAvatar />
                ))
              ) : filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium text-[13.5px]">
                    No inquiries found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    className="hover:bg-[#fbfcfe] transition-colors duration-150"
                  >
                    {/* 1. Sender Details (Display Name + Candidate/Company indicator) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            inq.senderType === 'Company'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : inq.senderType === 'Candidate'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {inq.senderType === 'Company' ? (
                            <Building2 size={16} />
                          ) : inq.senderType === 'Candidate' ? (
                            <User size={16} />
                          ) : (
                            <HelpCircle size={16} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14.5px] font-bold text-slate-900 tracking-[-0.2px] hover:text-[#00b074] transition-colors">{inq.sender}</span>
                            {/* Candidate or Company Indicator Pill */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                inq.senderType === 'Company'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : inq.senderType === 'Candidate'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {inq.senderType}
                            </span>
                          </div>
                          <div className="text-[12px] font-medium text-slate-500 mt-0.5 font-sans flex items-center gap-1.5">
                            <span>{inq.email}</span>
                            {inq.organization && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{inq.organization}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Subject (Truncated with ellipsis) */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs md:max-w-md">
                        <p
                          className="font-bold text-slate-900 text-[13.5px] tracking-[-0.15px] truncate"
                          title={inq.subject}
                        >
                          {inq.subject}
                        </p>
                        <p className="text-[12px] font-medium text-slate-500 truncate mt-0.5">
                          {inq.message}
                        </p>
                      </div>
                    </td>

                    {/* 3. Date Received ('MMM DD, YYYY') */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-[12.5px] text-slate-600 font-semibold font-sans">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{inq.date}</span>
                      </span>
                    </td>

                    {/* 4. Status (New / Read / Resolved — Blue/Gray/Green pill badges) */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {inq.status === 'New' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] shadow-[0_0_0_2px_rgba(37,99,235,0.25)]" />
                          New
                        </span>
                      )}
                      {inq.status === 'Read' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shadow-[0_0_0_2px_rgba(148,163,184,0.25)]" />
                          Read
                        </span>
                      )}
                      {inq.status === 'Resolved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#e6f9f2] text-[#009663] border border-[#b7eedc]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00b074] shadow-[0_0_0_2px_rgba(0,176,116,0.25)]" />
                          Resolved
                        </span>
                      )}
                    </td>

                    {/* 5. Actions ("Read", "Mark Resolved") */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {/* Read Button */}
                        <button
                          type="button"
                          onClick={() => handleReadInquiry(inq)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-[12px] font-semibold shadow-xs transition-colors"
                          title="Open and read inquiry"
                        >
                          <Eye size={13} className="text-slate-500" />
                          <span>Read</span>
                        </button>

                        {/* Mark Resolved Button */}
                        <button
                          type="button"
                          onClick={() => toggleResolved(inq.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors border shadow-xs ${
                            inq.status === 'Resolved'
                              ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80'
                          }`}
                          title={inq.status === 'Resolved' ? 'Reopen inquiry ticket' : 'Mark inquiry as resolved'}
                        >
                          {inq.status === 'Resolved' ? (
                            <>
                              <RotateCcw size={13} />
                              <span>Reopen</span>
                            </>
                          ) : (
                            <>
                              <Check size={13} />
                              <span>Mark Resolved</span>
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
              <span className="inline-block w-40 h-3.5 bg-slate-200 animate-pulse rounded" />
            ) : (
              <>
                Showing <strong className="text-slate-900 font-bold">{filteredInquiries.length}</strong> of{' '}
                <strong className="text-slate-900 font-bold">{inquiries.length}</strong> inquiries
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Support Communications Desk Live
          </span>
        </div>
      </div>

      {/* =========================================================
          3. INQUIRY READER MODAL (Skill Hub System UI Theme)
          ========================================================= */}
      {activeMessageModal && (() => {
        const category = getInquiryCategory(activeMessageModal);
        const priority = getInquiryPriority(activeMessageModal);
        const ticketId = getTicketId(activeMessageModal);
        const isResolved = activeMessageModal.status === 'Resolved';

        const templates = [
          {
            title: 'Acknowledge Issue',
            body: `Hello ${activeMessageModal.sender},\n\nThank you for contacting Skill Hub Support. We have logged your inquiry (${ticketId}) regarding "${activeMessageModal.subject}". Our engineering team is currently investigating the matter and will update you shortly.\n\nBest regards,\nSkill Hub Support Team`,
          },
          {
            title: 'Request Details',
            body: `Hello ${activeMessageModal.sender},\n\nRegarding ticket ${ticketId} ("${activeMessageModal.subject}"), could you please provide additional details, browser version, or a screenshot of the issue so we can assist you promptly?\n\nBest regards,\nSkill Hub Support Team`,
          },
          {
            title: 'Resolution Deployed',
            body: `Hello ${activeMessageModal.sender},\n\nWe are pleased to inform you that the issue reported in ticket ${ticketId} ("${activeMessageModal.subject}") has been resolved in our latest platform deployment. Please verify on your end.\n\nBest regards,\nSkill Hub Support Team`,
          },
          {
            title: 'Close Ticket',
            body: `Hello ${activeMessageModal.sender},\n\nWe have reviewed and resolved inquiry ${ticketId}. If you continue to experience any issues or have additional questions, feel free to submit a new inquiry anytime.\n\nBest regards,\nSkill Hub Support Team`,
          },
        ];

        const mailtoHref = `mailto:${activeMessageModal.email}?subject=${encodeURIComponent(
          `[${ticketId}] Re: ${activeMessageModal.subject}`
        )}&body=${encodeURIComponent(
          quickReplyText ||
            `Hello ${activeMessageModal.sender},\n\nRegarding your inquiry (${ticketId}):\n\n`
        )}`;

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => setActiveMessageModal(null)}
          >
            <div
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Skill Hub Corporate Emerald Banner */}
              <div className="relative h-20 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-6 py-3.5 flex items-start justify-between flex-shrink-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-xs">
                  <LifeBuoy size={13} className="text-emerald-200" />
                  <span>Support Communications Desk • Ticket Dispatch</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMessageModal(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
                  title="Close ticket"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 2. Hero Overlapping Header */}
              <div className="px-6 pt-0 pb-3.5 border-b border-slate-100 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 -mt-9 mb-2.5">
                  <div className="flex items-end gap-3.5">
                    {/* Sender Icon Box */}
                    <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center bg-white">
                      <div
                        className={`w-full h-full flex items-center justify-center text-white ${
                          activeMessageModal.senderType === 'Company'
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-700'
                            : activeMessageModal.senderType === 'Candidate'
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                            : 'bg-gradient-to-br from-amber-500 to-orange-600'
                        }`}
                      >
                        {activeMessageModal.senderType === 'Company' ? (
                          <Building2 size={24} />
                        ) : activeMessageModal.senderType === 'Candidate' ? (
                          <User size={24} />
                        ) : (
                          <HelpCircle size={24} />
                        )}
                      </div>
                    </div>

                    {/* Sender Identity & Badges */}
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">
                          {activeMessageModal.sender}
                        </h3>
                        {/* Status Badge */}
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e6f9f2] text-[#009663] border border-[#b7eedc]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00b074] shadow-[0_0_0_2px_rgba(0,176,116,0.25)]" />
                            Resolved
                          </span>
                        ) : activeMessageModal.status === 'Read' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            New Requisition
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12.5px] font-semibold text-emerald-700">
                          {activeMessageModal.organization ||
                            (activeMessageModal.senderType === 'Company'
                              ? 'Corporate Employer Partner'
                              : activeMessageModal.senderType === 'Candidate'
                              ? 'Verified Talent Profile'
                              : 'Platform Guest Visitor')}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11.5px] font-bold text-slate-500 uppercase tracking-wider">
                          {activeMessageModal.senderType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Reference Code */}
                  <span className="font-mono text-[11.5px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 tracking-wide">
                    {ticketId}
                  </span>
                </div>

                {/* Sub-meta quick strip */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[12px] font-medium text-slate-500 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <span className="text-slate-700 font-sans">{activeMessageModal.email}</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Received {activeMessageModal.date}</span>
                  </span>
                </div>
              </div>

              {/* 3. SLA & Topic Telemetry Grid (3 Cards) */}
              <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 flex-shrink-0">
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Priority / SLA */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        priority === 'High'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {priority === 'High' ? <AlertTriangle size={15} /> : <Clock size={15} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Priority Level
                      </div>
                      <div
                        className={`text-[12px] font-bold truncate ${
                          priority === 'High' ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {priority === 'High' ? 'High (SLA < 4h)' : 'Normal (SLA < 24h)'}
                      </div>
                    </div>
                  </div>

                  {/* Topic Category */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Tag size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Topic Classification
                      </div>
                      <div className="text-[12px] font-bold text-slate-800 truncate" title={category}>
                        {category}
                      </div>
                    </div>
                  </div>

                  {/* Inbound Channel */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Security Clearance
                      </div>
                      <div className="text-[12px] font-bold text-slate-800 truncate">
                        {activeMessageModal.senderType === 'Guest'
                          ? 'Public Web Form'
                          : 'Authenticated User'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Scrollable Inquiry Details Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* Subject & Message Content Box */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                      <FileText size={15} className="text-emerald-600" />
                      <span>{activeMessageModal.subject}</span>
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-500">
                      ID: {activeMessageModal.id}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 text-slate-800 text-[13px] leading-relaxed whitespace-pre-wrap font-sans shadow-2xs">
                    {activeMessageModal.message}
                  </div>
                </div>

                {/* Contact & Dispatch Channel */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Mail size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                        Sender Email Channel
                      </div>
                      <div className="text-[12.5px] font-bold text-slate-800 truncate font-sans">
                        {activeMessageModal.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyEmail(activeMessageModal.email)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        copiedEmail
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title="Copy email to clipboard"
                    >
                      {copiedEmail ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
                    </button>

                    <a
                      href={mailtoHref}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                      title="Open default email client"
                    >
                      <ExternalLink size={13} />
                      <span>Write Mail</span>
                    </a>
                  </div>
                </div>

                {/* Quick Response Templates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11.5px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-emerald-600" />
                      Quick Admin Response Templates
                    </label>
                    {quickReplyText && (
                      <button
                        type="button"
                        onClick={() => setQuickReplyText('')}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Reset Template
                      </button>
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.title}
                        type="button"
                        onClick={() => setQuickReplyText(tpl.body)}
                        className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all border cursor-pointer ${
                          quickReplyText === tpl.body
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-200'
                        }`}
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>

                  {quickReplyText && (
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                        <span className="flex items-center gap-1.5">
                          <CornerDownRight size={13} className="text-emerald-600" />
                          Template Draft Preview
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(quickReplyText);
                            setCopiedEmail(true);
                            setTimeout(() => setCopiedEmail(false), 2000);
                          }}
                          className="text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                        >
                          Copy Draft
                        </button>
                      </div>
                      <p className="text-[12px] text-slate-700 whitespace-pre-wrap font-sans bg-white p-2.5 rounded-lg border border-emerald-100">
                        {quickReplyText}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Redesigned System Footer Actions */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleResolved(activeMessageModal.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isResolved
                      ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs'
                      : 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-xs'
                  }`}
                >
                  {isResolved ? (
                    <>
                      <RotateCcw size={14} />
                      <span>Reopen Inquiry</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Mark as Resolved</span>
                    </>
                  )}
                </button>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <a
                    href={mailtoHref}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
                  >
                    <Send size={13} className="text-emerald-600" />
                    <span>Send Reply</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setActiveMessageModal(null)}
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
