import React, { useState } from 'react';
import {
  Inbox,
  Search,
  Eye,
  Building,
  User,
  Check,
  RotateCcw,
} from 'lucide-react';
import '../../pages/admin/AdminDashboard.css';

interface Inquiry {
  id: string;
  sender: string;
  senderType: 'Candidate' | 'Company' | 'Guest';
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'New' | 'Resolved';
}

const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: 'inq-801',
    sender: 'Elena Vance (CloudScale Systems)',
    senderType: 'Company',
    email: 'elena@cloudscale.io',
    subject: 'Enterprise Talent Match API Integration',
    message:
      'We are scaling our engineering organization and would like to integrate our Greenhouse ATS with Skill Hub’s Match Engine API. Could you share API documentation and schedule an enterprise walkthrough?',
    date: 'Oct 02, 2026',
    status: 'New',
  },
  {
    id: 'inq-802',
    sender: 'David Miller',
    senderType: 'Candidate',
    email: 'david.miller@gmail.com',
    subject: 'Question regarding profile AI verification badge',
    message:
      'Hello team, my Python and System Design assessments were completed yesterday afternoon with a 94% score. How long does the verified badge take to appear on my public ATS profile?',
    date: 'Oct 01, 2026',
    status: 'Resolved',
  },
  {
    id: 'inq-803',
    sender: 'Apex Autonomous Robotics',
    senderType: 'Company',
    email: 'talent@apexrobotics.ai',
    subject: 'Hiring 5+ Senior ML Engineers & Tier Pricing',
    message:
      'We require expedited access to evaluated ML candidates specializing in ROS2 and CUDA. Inquiring about our dedicated recruiter tier plan and candidate pipeline access.',
    date: 'Sep 30, 2026',
    status: 'New',
  },
  {
    id: 'inq-804',
    sender: 'Sarah Jenkins',
    senderType: 'Guest',
    email: 'sarah.jenkins@consultant.org',
    subject: 'Partnership Inquiry for University Bootcamp Students',
    message:
      'Reaching out on behalf of our tech bootcamp to explore if our graduating cohort can take standardized Skill Hub skill assessments for verified job placement.',
    date: 'Sep 28, 2026',
    status: 'Resolved',
  },
];

export const InquiriesView: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>(INITIAL_INQUIRIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'New' | 'Resolved'>('All');
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
      inq.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || inq.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#00b074', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            <Inbox size={14} />
            <span>Customer & Enterprise Communications</span>
          </div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: 26, fontWeight: 850, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Inquiries & Contact Requests
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
            Incoming direct inquiries received from the universal Contact form across Candidates, Companies, and Guests.
          </p>
        </div>

        {/* Counter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Total Inquiries</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{inquiries.length}</span>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>Pending Review</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#2563eb' }}>
              {inquiries.filter((i) => i.status === 'New').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by sender, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: 40, padding: '0 14px 0 38px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 13.5, outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' }}
          />
        </div>

        <div className="unified-tab-bar" style={{ display: 'inline-flex', padding: 4, background: '#f1f5f9', borderRadius: 9999, border: '1px solid #e2e8f0', gap: 4 }}>
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

      {/* 3. Inquiries Data Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '28%' }}>
                  Sender
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '22%' }}>
                  Email
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '28%' }}>
                  Subject
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '10%' }}>
                  Date
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '6%' }}>
                  Status
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '6%' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    No inquiries found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inq) => (
                  <tr key={inq.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                    {/* Sender */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            background: inq.senderType === 'Company' ? '#eef2ff' : inq.senderType === 'Candidate' ? '#e6f9f2' : '#f1f5f9',
                            border: `1px solid ${inq.senderType === 'Company' ? '#c7d2fe' : inq.senderType === 'Candidate' ? '#a7f3d0' : '#e2e8f0'}`,
                            color: inq.senderType === 'Company' ? '#4f46e5' : inq.senderType === 'Candidate' ? '#00b074' : '#64748b',
                          }}
                        >
                          {inq.senderType === 'Company' ? (
                            <Building size={16} />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 750, color: '#0f172a' }}>{inq.sender}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                            {inq.senderType} Submission
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 12.5, color: '#475569' }}>
                      {inq.email}
                    </td>

                    {/* Subject */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 750, color: '#0f172a', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inq.subject}>
                        {inq.subject}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                        {inq.message}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 12, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {inq.date}
                    </td>

                    {/* Status Badge */}
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
                          background: inq.status === 'New' ? '#eff6ff' : '#e6f9f2',
                          border: `1px solid ${inq.status === 'New' ? '#bfdbfe' : '#a7f3d0'}`,
                          color: inq.status === 'New' ? '#2563eb' : '#009e67',
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
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
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
                            background: inq.status === 'New' ? '#e6f9f2' : '#ffffff',
                            color: inq.status === 'New' ? '#009e67' : '#64748b',
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
      </div>

      {/* 4. Read Message Modal */}
      {activeMessageModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 580, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00b074' }}>
                  {activeMessageModal.senderType} Submission #{activeMessageModal.id}
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {activeMessageModal.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMessageModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #edf2f7' }}>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block' }}>From Sender</span>
                  <span style={{ fontSize: 13.5, fontWeight: 750, color: '#0f172a' }}>{activeMessageModal.sender}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block' }}>Email Address</span>
                  <a href={`mailto:${activeMessageModal.email}`} style={{ fontSize: 13, fontFamily: 'monospace', color: '#00b074', textDecoration: 'none', fontWeight: 600 }}>
                    {activeMessageModal.email}
                  </a>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block' }}>Date Received</span>
                  <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{activeMessageModal.date}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block' }}>Status</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 800,
                      background: activeMessageModal.status === 'New' ? '#eff6ff' : '#e6f9f2',
                      border: `1px solid ${activeMessageModal.status === 'New' ? '#bfdbfe' : '#a7f3d0'}`,
                      color: activeMessageModal.status === 'New' ? '#2563eb' : '#009e67',
                      marginTop: 2,
                    }}
                  >
                    {activeMessageModal.status}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                  Detailed Message
                </span>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, color: '#334155', fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {activeMessageModal.message}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  fontWeight: 700,
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
                    <span>Re-open Inquiry</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveMessageModal(null)}
                style={{ padding: '8px 18px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
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
