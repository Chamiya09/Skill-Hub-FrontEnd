import React, { useState } from 'react';
import {
  Inbox,
  Search,
  Eye,
  Building2,
  User,
  Check,
  RotateCcw,
  Mail,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';
import '../../pages/TechnicalAssessmentsFull.css';
import '../../pages/admin/AdminDashboard.css';

interface Inquiry {
  id: string;
  sender: string;
  senderType: 'Candidate' | 'Company' | 'Guest';
  organization?: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'New' | 'Resolved';
  priority: 'High' | 'Normal';
}

const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: 'inq-801',
    sender: 'Elena Vance',
    organization: 'CloudScale Systems Inc.',
    senderType: 'Company',
    email: 'elena.vance@cloudscale.io',
    subject: 'Enterprise Talent Match API & ATS Integration Walkthrough',
    message:
      'We are scaling our core infrastructure engineering organization and would like to integrate our Greenhouse ATS with Skill Hub’s AI Match Engine API. Could you share your OpenAPI schemas, enterprise pricing tiers, and schedule an architecture walkthrough this week?',
    date: 'Oct 02, 2026',
    status: 'New',
    priority: 'High',
  },
  {
    id: 'inq-802',
    sender: 'David Miller',
    senderType: 'Candidate',
    email: 'david.miller@gmail.com',
    subject: 'Question regarding profile AI verification badge timeline',
    message:
      'Hello team, my Python Data Structures and Distributed Systems technical assessments were completed yesterday afternoon with an overall 94% score. How long does the verified talent badge typically take to populate on my public candidate profile for employers to view?',
    date: 'Oct 01, 2026',
    status: 'Resolved',
    priority: 'Normal',
  },
  {
    id: 'inq-803',
    sender: 'Apex Autonomous Robotics',
    organization: 'Apex Robotics Labs',
    senderType: 'Company',
    email: 'talent@apexrobotics.ai',
    subject: 'Expedited Access to Top 5% Machine Learning Engineers',
    message:
      'We require expedited access to thoroughly benchmarked ML engineers specializing in ROS2, CUDA optimization, and Computer Vision. We are looking to fill 5 senior positions immediately and would like to review pre-assessed candidates on your leaderboard.',
    date: 'Sep 30, 2026',
    status: 'New',
    priority: 'High',
  },
  {
    id: 'inq-804',
    sender: 'Dr. Sarah Jenkins',
    organization: 'Global Tech Academy',
    senderType: 'Guest',
    email: 'sarah.jenkins@consultant.org',
    subject: 'Partnership Inquiry for University & Bootcamp Graduates',
    message:
      'Reaching out on behalf of our tech fellowship to explore whether our graduating cohort of 120 software engineers can participate in Skill Hub’s standardized skill assessments to facilitate direct talent placements with hiring partners.',
    date: 'Sep 28, 2026',
    status: 'Resolved',
    priority: 'Normal',
  },
  {
    id: 'inq-805',
    sender: 'Kavitha Patel',
    senderType: 'Candidate',
    email: 'kavitha.patel@devcloud.tech',
    subject: 'Requesting Code Review Re-evaluation for Assessment #T-882',
    message:
      'I completed the React State Machine challenge. One test case failed due to an edge case timeout in the virtual browser runner, though the solution was O(n). Could an administrator or evaluator take a secondary look at my submission logs?',
    date: 'Sep 27, 2026',
    status: 'New',
    priority: 'Normal',
  },
  {
    id: 'inq-806',
    sender: 'Marcus Aurelius Vance',
    organization: 'Vance Capital & Ventures',
    senderType: 'Company',
    email: 'marcus@vancecap.vc',
    subject: 'Custom Technical Assessment Suite for Portfolio Companies',
    message:
      'We are interested in licensing Skill Hub across 14 of our seed and Series-A portfolio startups to standardize engineering screening. Inquiring about a unified portfolio dashboard and volume billing.',
    date: 'Sep 25, 2026',
    status: 'Resolved',
    priority: 'High',
  },
];

export const InquiriesView: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>(INITIAL_INQUIRIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'New' | 'Resolved'>('All');
  const [selectedSenderType, setSelectedSenderType] = useState<string>('All');
  const [activeMessageModal, setActiveMessageModal] = useState<Inquiry | null>(null);

  const toggleResolved = (id: string) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === id
          ? { ...inq, status: inq.status === 'New' ? 'Resolved' : 'New' }
          : inq
      )
    );
    if (activeMessageModal && activeMessageModal.id === id) {
      setActiveMessageModal((prev) =>
        prev ? { ...prev, status: prev.status === 'New' ? 'Resolved' : 'New' } : null
      );
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
  const newInquiriesCount = inquiries.filter((i) => i.status === 'New').length;
  const companyInquiriesCount = inquiries.filter((i) => i.senderType === 'Company').length;
  const resolvedInquiriesCount = inquiries.filter((i) => i.status === 'Resolved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* =========================================================
          1. TOP HERO HEADER (Company Assessment Page Banner Style)
          ========================================================= */}
      <div
        style={{
          position: 'relative',
          padding: '28px 32px',
          background: 'linear-gradient(112deg, #ffffff 0%, #ffffff 66%, #e6f9f2 100%)',
          border: '1px solid #dce7e2',
          borderRadius: 18,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          overflow: 'hidden',
          isolation: 'isolate',
        }}
      >
        {/* Decorative background geometry matching company assessment page */}
        <div
          style={{
            position: 'absolute',
            width: 170,
            height: 170,
            top: -70,
            right: 40,
            border: '22px solid rgba(0, 176, 116, 0.06)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 90,
            height: 90,
            bottom: -45,
            right: 180,
            border: '14px solid rgba(0, 176, 116, 0.05)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              color: '#008e60',
              background: '#e6f9f2',
              border: '1px solid #a7f3d0',
              padding: '3px 10px',
              borderRadius: 20,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            <Mail size={13} color="#008e60" />
            <span>CUSTOMER & ENTERPRISE COMMUNICATIONS DESK</span>
          </div>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: 24,
              fontWeight: 850,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            Inquiries & Contact Requests
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', maxWidth: 680, lineHeight: 1.5 }}>
            Review incoming correspondence from candidates, enterprise partners, and guests submitted via the universal contact portal.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
          <div
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: '#ffffff',
              border: '1px solid #dce7e2',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.035)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Response SLA Rate</span>
            <span style={{ fontSize: 15, fontWeight: 850, color: '#008e60', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#00b074',
                  boxShadow: '0 0 0 2px rgba(0, 176, 116, 0.25)',
                }}
              />
              98.4% On Time (&lt; 2h)
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. TOP STATS BOX (Exact Company Assessment Page Grid)
          Using .assessment-overview-grid & .assessment-overview-card
          ========================================================= */}
      <div className="assessment-overview-grid" style={{ marginBottom: 0 }}>
        {/* Card 1: Total Inquiries (Emerald) */}
        <div className="assessment-overview-card">
          <div className="assessment-overview-icon">
            <Inbox size={20} />
          </div>
          <div>
            <strong>{totalInquiriesCount}</strong>
            <span>Total Inquiries</span>
          </div>
        </div>

        {/* Card 2: Pending Review (Blue) */}
        <div className="assessment-overview-card assessment-overview-card--blue">
          <div className="assessment-overview-icon">
            <Clock size={20} />
          </div>
          <div>
            <strong>{newInquiriesCount}</strong>
            <span>Pending Review</span>
          </div>
        </div>

        {/* Card 3: Enterprise Requests (Amber) */}
        <div className="assessment-overview-card assessment-overview-card--amber">
          <div className="assessment-overview-icon">
            <Building2 size={20} />
          </div>
          <div>
            <strong>{companyInquiriesCount}</strong>
            <span>Enterprise Requests</span>
          </div>
        </div>

        {/* Card 4: Resolved Tickets (Violet) */}
        <div className="assessment-overview-card assessment-overview-card--violet">
          <div className="assessment-overview-icon">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <strong>{resolvedInquiriesCount}</strong>
            <span>Resolved Inquiries</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. MAIN WORKSPACE: SEARCH, FILTERS & DATA TABLE
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
            gap: 14,
            flexWrap: 'wrap',
            background: '#ffffff',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 440 }}>
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
              placeholder="Search by sender, email, subject, or message content..."
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

          {/* Filter Controls Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Sender Type Dropdown */}
            <select
              value={selectedSenderType}
              onChange={(e) => setSelectedSenderType(e.target.value)}
              style={{
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid #dce5eb',
                background: '#ffffff',
                color: '#334155',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="All">All Senders</option>
              <option value="Company">Companies</option>
              <option value="Candidate">Candidates</option>
              <option value="Guest">Guests</option>
            </select>

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
              {(['All', 'New', 'Resolved'] as const).map((status) => (
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
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '28%' }}>
                  Sender & Organization
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '22%' }}>
                  Email Address
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '26%' }}>
                  Subject & Preview
                </th>
                <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '10%' }}>
                  Date
                </th>
                <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '8%' }}>
                  Status
                </th>
                <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '6%' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '52px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={28} color="#cbd5e1" />
                      <span>No inquiries found matching "{searchQuery}"</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fcfdfd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Sender & Organization */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            background:
                              inq.senderType === 'Company'
                                ? '#eef2ff'
                                : inq.senderType === 'Candidate'
                                ? '#eafaf3'
                                : '#f1f5f9',
                            border: `1.5px solid ${
                              inq.senderType === 'Company'
                                ? '#c7d2fe'
                                : inq.senderType === 'Candidate'
                                ? '#a7f3d0'
                                : '#e2e8f0'
                            }`,
                            color:
                              inq.senderType === 'Company'
                                ? '#4f46e5'
                                : inq.senderType === 'Candidate'
                                ? '#008e60'
                                : '#64748b',
                          }}
                        >
                          {inq.senderType === 'Company' ? (
                            <Building2 size={18} />
                          ) : inq.senderType === 'Candidate' ? (
                            <User size={18} />
                          ) : (
                            <HelpCircle size={18} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 750, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{inq.sender}</span>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                                background:
                                  inq.senderType === 'Company'
                                    ? '#eef2ff'
                                    : inq.senderType === 'Candidate'
                                    ? '#ecfdf5'
                                    : '#f1f5f9',
                                border: `1px solid ${
                                  inq.senderType === 'Company'
                                    ? '#c7d2fe'
                                    : inq.senderType === 'Candidate'
                                    ? '#a7f3d0'
                                    : '#e2e8f0'
                                }`,
                                color:
                                  inq.senderType === 'Company'
                                    ? '#4338ca'
                                    : inq.senderType === 'Candidate'
                                    ? '#047857'
                                    : '#475569',
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}
                            >
                              {inq.senderType}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            {inq.organization ? inq.organization : `${inq.senderType} Direct Inquiry`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 12.5, color: '#475569' }}>
                      {inq.email}
                    </td>

                    {/* Subject & Preview */}
                    <td style={{ padding: '16px 20px' }}>
                      <div
                        style={{
                          fontWeight: 750,
                          color: '#0f172a',
                          maxWidth: 290,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={inq.subject}
                      >
                        {inq.subject}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#94a3b8',
                          maxWidth: 290,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 2,
                        }}
                      >
                        {inq.message}
                      </div>
                    </td>

                    {/* Received Date */}
                    <td style={{ padding: '16px 18px', textAlign: 'center', fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {inq.date}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 9999,
                          fontSize: 11.5,
                          fontWeight: 750,
                          background: inq.status === 'New' ? '#eff6ff' : '#eafaf3',
                          border: `1px solid ${inq.status === 'New' ? '#bfdbfe' : '#a7f3d0'}`,
                          color: inq.status === 'New' ? '#1d4ed8' : '#008e60',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: inq.status === 'New' ? '#2563eb' : '#00b074',
                          }}
                        />
                        {inq.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setActiveMessageModal(inq)}
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
                          <span>Read</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleResolved(inq.id)}
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
                            border: inq.status === 'New' ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                            background: inq.status === 'New' ? '#eafaf3' : '#ffffff',
                            color: inq.status === 'New' ? '#008e60' : '#64748b',
                          }}
                        >
                          {inq.status === 'New' ? (
                            <>
                              <Check size={13} />
                              <span>Resolve</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw size={13} />
                              <span>Reopen</span>
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

        {/* Table Footer: Summary count */}
        <div
          style={{
            padding: '12px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #edf2f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: '#64748b',
          }}
        >
          <span>
            Showing <strong style={{ color: '#0f172a' }}>{filteredInquiries.length}</strong> of{' '}
            <strong style={{ color: '#0f172a' }}>{inquiries.length}</strong> customer tickets
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00b074' }} />
            Communication Dispatch Service v2.4
          </span>
        </div>
      </div>

      {/* =========================================================
          4. READ MESSAGE MODAL
          ========================================================= */}
      {activeMessageModal && (
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
              maxWidth: 600,
              background: '#ffffff',
              border: '1px solid #dce7e2',
              borderRadius: 20,
              padding: 28,
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25)',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#008e60',
                      background: '#e6f9f2',
                      border: '1px solid #a7f3d0',
                      padding: '2px 8px',
                      borderRadius: 14,
                    }}
                  >
                    {activeMessageModal.senderType} Submission
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                    #{activeMessageModal.id}
                  </span>
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {activeMessageModal.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMessageModal(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 15,
                  cursor: 'pointer',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Metadata Grid */}
            <div style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  background: '#f8fafc',
                  padding: 16,
                  borderRadius: 14,
                  border: '1px solid #edf2f7',
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block' }}>From Sender</span>
                  <span style={{ fontSize: 13.5, fontWeight: 750, color: '#0f172a' }}>
                    {activeMessageModal.sender}
                  </span>
                  {activeMessageModal.organization && (
                    <span style={{ fontSize: 11.5, color: '#64748b', display: 'block', marginTop: 1 }}>
                      {activeMessageModal.organization}
                    </span>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block' }}>Email Address</span>
                  <a
                    href={`mailto:${activeMessageModal.email}`}
                    style={{ fontSize: 13, fontFamily: 'monospace', color: '#008e60', textDecoration: 'none', fontWeight: 700 }}
                  >
                    {activeMessageModal.email}
                  </a>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block' }}>Date Received</span>
                  <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{activeMessageModal.date}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block' }}>Current Status</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 800,
                      background: activeMessageModal.status === 'New' ? '#eff6ff' : '#eafaf3',
                      border: `1px solid ${activeMessageModal.status === 'New' ? '#bfdbfe' : '#a7f3d0'}`,
                      color: activeMessageModal.status === 'New' ? '#1d4ed8' : '#008e60',
                      marginTop: 2,
                    }}
                  >
                    {activeMessageModal.status}
                  </span>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Message Content
                </span>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    color: '#334155',
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {activeMessageModal.message}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                paddingTop: 16,
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => toggleResolved(activeMessageModal.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 10,
                    fontSize: 12.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                    border: activeMessageModal.status === 'New' ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                    background: activeMessageModal.status === 'New' ? '#00b074' : '#f8fafc',
                    color: activeMessageModal.status === 'New' ? '#ffffff' : '#475569',
                    boxShadow: activeMessageModal.status === 'New' ? '0 2px 8px rgba(0, 176, 116, 0.25)' : 'none',
                  }}
                >
                  {activeMessageModal.status === 'New' ? (
                    <>
                      <Check size={14} />
                      <span>Mark as Resolved</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      <span>Reopen Inquiry</span>
                    </>
                  )}
                </button>

                <a
                  href={`mailto:${activeMessageModal.email}?subject=Re: ${encodeURIComponent(activeMessageModal.subject)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Send size={13} />
                  <span>Direct Reply</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setActiveMessageModal(null)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
