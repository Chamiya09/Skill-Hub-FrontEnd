import React, { useState } from 'react';
import {
  Building2,
  Search,
  Briefcase,
  Eye,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react';
import '../../pages/TechnicalAssessmentsFull.css';
import '../../pages/admin/AdminDashboard.css';

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  contactEmail: string;
  website: string;
  activeJobPosts: number;
  totalHires: number;
  status: 'Active' | 'Pending';
  tier: 'Enterprise' | 'Startup' | 'ScaleUp';
  location: string;
  joinedDate: string;
}

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-101',
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
    id: 'comp-102',
    name: 'Anthropic Compute Labs',
    logo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=120&auto=format&fit=crop&q=80',
    industry: 'Artificial Intelligence & Safety Research',
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
    id: 'comp-103',
    name: 'Linear Systems Inc.',
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80',
    industry: 'Engineering DevTools & Productivity',
    contactEmail: 'hiring@linear.app',
    website: 'https://linear.app',
    activeJobPosts: 5,
    totalHires: 12,
    status: 'Active',
    tier: 'ScaleUp',
    location: 'New York, NY',
    joinedDate: 'Jun 2025',
  },
  {
    id: 'comp-104',
    name: 'Databricks Cloud Analytics',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&auto=format&fit=crop&q=80',
    industry: 'Data Engineering & Lakehouse',
    contactEmail: 'talent-ops@databricks.com',
    website: 'https://databricks.com',
    activeJobPosts: 18,
    totalHires: 64,
    status: 'Active',
    tier: 'Enterprise',
    location: 'San Francisco, CA',
    joinedDate: 'Nov 2024',
  },
  {
    id: 'comp-105',
    name: 'Vercel Platform Inc.',
    logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=80',
    industry: 'Frontend Cloud & Edge Infrastructure',
    contactEmail: 'recruiting@vercel.com',
    website: 'https://vercel.com',
    activeJobPosts: 9,
    totalHires: 28,
    status: 'Active',
    tier: 'ScaleUp',
    location: 'Remote / Global',
    joinedDate: 'Feb 2025',
  },
  {
    id: 'comp-106',
    name: 'Nexus Quantum Software',
    logo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=120&auto=format&fit=crop&q=80',
    industry: 'Quantum Simulation & Cloud Services',
    contactEmail: 'hr-compliance@nexusquantum.io',
    website: 'https://nexusquantum.io',
    activeJobPosts: 2,
    totalHires: 3,
    status: 'Pending',
    tier: 'Startup',
    location: 'Austin, TX',
    joinedDate: 'Sep 2026',
  },
];

export const CompaniesView: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Pending'>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<Company | null>(null);

  const toggleCompanyStatus = (id: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'Active' ? 'Pending' : 'Active' }
          : c
      )
    );
    if (selectedCompanyModal && selectedCompanyModal.id === id) {
      setSelectedCompanyModal((prev) =>
        prev
          ? { ...prev, status: prev.status === 'Active' ? 'Pending' : 'Active' }
          : null
      );
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    const matchesTier = selectedTier === 'All' || c.tier === selectedTier;
    return matchesSearch && matchesStatus && matchesTier;
  });

  const totalActiveJobs = companies.reduce((sum, c) => sum + c.activeJobPosts, 0);
  const totalHiresCount = companies.reduce((sum, c) => sum + c.totalHires, 0);
  const pendingCount = companies.filter((c) => c.status === 'Pending').length;

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
        {/* Subtle decorative geometric rings matching company assessment header */}
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
            <Building2 size={13} color="#008e60" />
            <span>ENTERPRISE HIRING & ATS GOVERNANCE</span>
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
            Company & Employer Directory
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', maxWidth: 680, lineHeight: 1.5 }}>
            Monitor verified employer accounts, active hiring requisitions, candidate placement benchmarks, and enterprise licensing compliance.
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
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Hiring Pipelines</span>
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
              {companies.filter((c) => c.status === 'Active').length} Verified Organizations
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. TOP STATS BOX (Exact Company Assessment Page Grid)
          Using .assessment-overview-grid & .assessment-overview-card
          ========================================================= */}
      <div className="assessment-overview-grid" style={{ marginBottom: 0 }}>
        {/* Card 1: Registered Companies (Emerald) */}
        <div className="assessment-overview-card">
          <div className="assessment-overview-icon">
            <Building2 size={20} />
          </div>
          <div>
            <strong>38</strong>
            <span>Registered Companies</span>
          </div>
        </div>

        {/* Card 2: Active Job Requisitions (Blue) */}
        <div className="assessment-overview-card assessment-overview-card--blue">
          <div className="assessment-overview-icon">
            <Briefcase size={20} />
          </div>
          <div>
            <strong>{totalActiveJobs}</strong>
            <span>Active Job Posts</span>
          </div>
        </div>

        {/* Card 3: Talent Placements (Amber) */}
        <div className="assessment-overview-card assessment-overview-card--amber">
          <div className="assessment-overview-icon">
            <TrendingUp size={20} />
          </div>
          <div>
            <strong>{totalHiresCount}</strong>
            <span>Talent Placements</span>
          </div>
        </div>

        {/* Card 4: Pending Authorization (Violet) */}
        <div className="assessment-overview-card assessment-overview-card--violet">
          <div className="assessment-overview-icon">
            <Clock size={20} />
          </div>
          <div>
            <strong>{pendingCount}</strong>
            <span>Pending Approvals</span>
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
              placeholder="Search company by name, email, or industry..."
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
            {/* Tier Select */}
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
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
              <option value="All">All Tiers</option>
              <option value="Enterprise">Enterprise</option>
              <option value="ScaleUp">ScaleUp</option>
              <option value="Startup">Startup</option>
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
              {(['All', 'Active', 'Pending'] as const).map((status) => (
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
                <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '30%' }}>
                  Company Organization
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '22%' }}>
                  Corporate Email
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '16%' }}>
                  Active Job Posts
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '12%' }}>
                  Placements
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '10%' }}>
                  Status
                </th>
                <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '10%' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '52px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={28} color="#cbd5e1" />
                      <span>No companies found matching "{searchQuery}"</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
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
                    {/* Company Details */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img
                          src={company.logo}
                          alt={company.name}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            objectFit: 'cover',
                            border: '1.5px solid #dce7e2',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 750, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{company.name}</span>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                background: company.tier === 'Enterprise' ? '#ecfdf5' : '#f1f5f9',
                                border: `1px solid ${company.tier === 'Enterprise' ? '#a7f3d0' : '#e2e8f0'}`,
                                color: company.tier === 'Enterprise' ? '#047857' : '#475569',
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}
                            >
                              {company.tier}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            {company.industry} • <span style={{ color: '#94a3b8' }}>{company.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 12.5, color: '#475569' }}>
                      {company.contactEmail}
                    </td>

                    {/* Active Job Posts */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 9999,
                          background: '#eef6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          fontSize: 12,
                          fontWeight: 750,
                        }}
                      >
                        <Briefcase size={12} color="#1d4ed8" />
                        <span>{company.activeJobPosts} Vacancies</span>
                      </span>
                    </td>

                    {/* Placements */}
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
                        <span>{company.totalHires} Hires</span>
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
                          background: company.status === 'Active' ? '#eafaf3' : '#fffbeb',
                          border: `1px solid ${company.status === 'Active' ? '#a7f3d0' : '#fde68a'}`,
                          color: company.status === 'Active' ? '#008e60' : '#b45309',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: company.status === 'Active' ? '#00b074' : '#f59e0b',
                          }}
                        />
                        {company.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCompanyModal(company)}
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
                          <span>Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCompanyStatus(company.id)}
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
                            border: company.status === 'Active' ? '1px solid #cbd5e1' : '1px solid #a7f3d0',
                            background: company.status === 'Active' ? '#ffffff' : '#eafaf3',
                            color: company.status === 'Active' ? '#475569' : '#008e60',
                          }}
                        >
                          {company.status === 'Active' ? 'Hold' : 'Approve'}
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
            Showing <strong style={{ color: '#0f172a' }}>{filteredCompanies.length}</strong> of{' '}
            <strong style={{ color: '#0f172a' }}>{companies.length}</strong> registered employers
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00b074' }} />
            Platform ATS Directory v2.4
          </span>
        </div>
      </div>

      {/* =========================================================
          4. COMPANY DETAILS MODAL
          ========================================================= */}
      {selectedCompanyModal && (
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
              maxWidth: 560,
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
                paddingBottom: 18,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src={selectedCompanyModal.logo}
                  alt={selectedCompanyModal.name}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    objectFit: 'cover',
                    border: '1.5px solid #dce7e2',
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                      {selectedCompanyModal.name}
                    </h3>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#047857',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {selectedCompanyModal.tier}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: '#64748b' }}>
                    {selectedCompanyModal.industry} • {selectedCompanyModal.location}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompanyModal(null)}
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

            {/* Modal Body Data */}
            <div style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Corporate Contact:</span>
                <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{selectedCompanyModal.contactEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Official Website:</span>
                <a
                  href={selectedCompanyModal.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#008e60', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                >
                  <span>{selectedCompanyModal.website}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Active Job Postings:</span>
                <span style={{ color: '#1d4ed8', fontWeight: 800 }}>{selectedCompanyModal.activeJobPosts} Live Vacancies</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Total Placements via ATS:</span>
                <span style={{ color: '#008e60', fontWeight: 800 }}>{selectedCompanyModal.totalHires} candidates hired</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Registered Date:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedCompanyModal.joinedDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Account Status:</span>
                <span
                  style={{
                    color: selectedCompanyModal.status === 'Active' ? '#008e60' : '#b45309',
                    fontWeight: 800,
                  }}
                >
                  {selectedCompanyModal.status} Account
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => toggleCompanyStatus(selectedCompanyModal.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: selectedCompanyModal.status === 'Active' ? '1px solid #cbd5e1' : '1px solid #a7f3d0',
                  background: selectedCompanyModal.status === 'Active' ? '#ffffff' : '#eafaf3',
                  color: selectedCompanyModal.status === 'Active' ? '#475569' : '#008e60',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                {selectedCompanyModal.status === 'Active' ? 'Place on Hold' : 'Authorize Account'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyModal(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: '#00b074',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(0, 176, 116, 0.25)',
                }}
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
