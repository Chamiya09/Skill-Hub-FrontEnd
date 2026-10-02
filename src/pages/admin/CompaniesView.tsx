import React, { useState } from 'react';
import {
  Building2,
  Search,
  Briefcase,
  Eye,
} from 'lucide-react';
import '../../pages/admin/AdminDashboard.css';

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  contactEmail: string;
  activeJobPosts: number;
  totalHires: number;
  status: 'Active' | 'Pending';
  tier: 'Enterprise' | 'Startup' | 'ScaleUp';
}

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-101',
    name: 'Stripe Technologies Inc.',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    industry: 'FinTech & Payments Infrastructure',
    contactEmail: 'talent-recruiting@stripe.com',
    activeJobPosts: 14,
    totalHires: 42,
    status: 'Active',
    tier: 'Enterprise',
  },
  {
    id: 'comp-102',
    name: 'Anthropic Compute Labs',
    logo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&auto=format&fit=crop&q=80',
    industry: 'Artificial Intelligence & Safety Research',
    contactEmail: 'careers@anthropic.com',
    activeJobPosts: 8,
    totalHires: 19,
    status: 'Active',
    tier: 'Enterprise',
  },
  {
    id: 'comp-103',
    name: 'Nexus Quantum Software',
    logo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=100&auto=format&fit=crop&q=80',
    industry: 'Quantum Simulation & Cloud Services',
    contactEmail: 'hr-compliance@nexusquantum.io',
    activeJobPosts: 2,
    totalHires: 3,
    status: 'Pending',
    tier: 'Startup',
  },
];

export const CompaniesView: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Pending'>('All');
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<Company | null>(null);

  const toggleCompanyStatus = (id: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'Active' ? 'Pending' : 'Active' }
          : c
      )
    );
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Header & Metrics */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#00b074', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            <Building2 size={14} />
            <span>Employer Pipeline & Governance</span>
          </div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: 26, fontWeight: 850, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Manage Companies
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
            Oversee registered enterprise hiring organizations, active job posts, and authorization compliance.
          </p>
        </div>

        {/* Counter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Active Job Openings</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              {companies.reduce((sum, c) => sum + c.activeJobPosts, 0)}
            </span>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#00b074' }}>Verified Employers</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#00b074' }}>
              {companies.filter((c) => c.status === 'Active').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by company name, email, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: 40, padding: '0 14px 0 38px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 13.5, outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' }}
          />
        </div>

        <div className="unified-tab-bar" style={{ display: 'inline-flex', padding: 4, background: '#f1f5f9', borderRadius: 9999, border: '1px solid #e2e8f0', gap: 4 }}>
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

      {/* 3. Companies Data Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '34%' }}>
                  Company Name
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '26%' }}>
                  Contact Email
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '18%' }}>
                  Active Job Posts
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: '12%' }}>
                  Status
                </th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '10%' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    No companies found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                    {/* Company Name & Details */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img
                          src={company.logo}
                          alt={company.name}
                          style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
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
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                color: '#475569',
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}
                            >
                              {company.tier}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{company.industry}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Email */}
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 12.5, color: '#475569' }}>
                      {company.contactEmail}
                    </td>

                    {/* Active Job Posts */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 10px',
                          borderRadius: 9999,
                          background: '#f0fdfa',
                          border: '1px solid #99f6e4',
                          color: '#0f766e',
                          fontSize: 12,
                          fontWeight: 750,
                        }}
                      >
                        <Briefcase size={12} color="#0f766e" />
                        <span>{company.activeJobPosts} Vacancies</span>
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
                          background: company.status === 'Active' ? '#e6f9f2' : '#fffbeb',
                          border: `1px solid ${company.status === 'Active' ? '#a7f3d0' : '#fde68a'}`,
                          color: company.status === 'Active' ? '#009e67' : '#b45309',
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
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
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
                            background: company.status === 'Active' ? '#ffffff' : '#e6f9f2',
                            color: company.status === 'Active' ? '#475569' : '#009e67',
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
      </div>

      {/* 4. Company Detail Modal */}
      {selectedCompanyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 540, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src={selectedCompanyModal.logo}
                  alt={selectedCompanyModal.name}
                  style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #e2e8f0' }}
                />
                <div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{selectedCompanyModal.name}</h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>{selectedCompanyModal.industry}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompanyModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Corporate Email:</span>
                <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{selectedCompanyModal.contactEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>License Plan:</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{selectedCompanyModal.tier} Tier</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Active Job Postings:</span>
                <span style={{ color: '#0f766e', fontWeight: 800 }}>{selectedCompanyModal.activeJobPosts} Live Vacancies</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Total Placements via ATS:</span>
                <span style={{ color: '#00b074', fontWeight: 800 }}>{selectedCompanyModal.totalHires} candidates hired</span>
              </div>
            </div>

            <div style={{ paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedCompanyModal(null)}
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
