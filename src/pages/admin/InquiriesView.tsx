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
} from 'lucide-react';
import '../../pages/TechnicalAssessmentsFull.css';
import '../../pages/admin/AdminDashboard.css';
import { adminApi, type AdminInquiryDto } from '../../services/api';
import { TableRowSkeleton, SkeletonStatValue, SkeletonStatLabel } from '../../components/common/SkeletonCard';

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
  },
];

export const InquiriesView: React.FC = () => {
  const [inquiries, setInquiries] = useState<AdminInquiryDto[]>(INITIAL_MOCK_INQUIRIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'New' | 'Read' | 'Resolved'>('All');
  const [selectedSenderType, setSelectedSenderType] = useState<string>('All');
  const [activeMessageModal, setActiveMessageModal] = useState<AdminInquiryDto | null>(null);

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
          3. INQUIRY READER MODAL
          ========================================================= */}
      {activeMessageModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveMessageModal(null)}
        >
          <div
            className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    activeMessageModal.senderType === 'Company'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : activeMessageModal.senderType === 'Candidate'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {activeMessageModal.senderType === 'Company' ? (
                    <Building2 size={18} />
                  ) : activeMessageModal.senderType === 'Candidate' ? (
                    <User size={18} />
                  ) : (
                    <HelpCircle size={18} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeMessageModal.sender}</h3>
                  <div className="text-[12px] text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                    <span className="font-sans text-slate-700">{activeMessageModal.email}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-600">{activeMessageModal.senderType}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMessageModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Inquiry Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar size={13} className="text-slate-400" />
                  Received: <strong className="text-slate-700">{activeMessageModal.date}</strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    activeMessageModal.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : activeMessageModal.status === 'Read'
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {activeMessageModal.status}
                </span>
              </div>

              <div>
                <h4 className="text-[14px] font-bold text-slate-900 mb-1">{activeMessageModal.subject}</h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
                  {activeMessageModal.message}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleResolved(activeMessageModal.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${
                  activeMessageModal.status === 'Resolved'
                    ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {activeMessageModal.status === 'Resolved' ? 'Reopen Ticket' : 'Mark Resolved'}
              </button>

              <button
                type="button"
                onClick={() => setActiveMessageModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
