import React, { useState } from 'react';
import { AdminLayout, type AdminTab } from '../../components/admin/AdminLayout';
import { AdminOverviewView } from './AdminOverviewView';
import { CandidatesView } from './CandidatesView';
import { CompaniesView } from './CompaniesView';
import { InquiriesView } from './InquiriesView';
import { AdminSecurityView } from './AdminSecurityView';
import './AdminDashboard.css';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'overview' && <AdminOverviewView onNavigateTab={setActiveTab} />}
      {activeTab === 'candidates' && <CandidatesView />}
      {activeTab === 'companies' && <CompaniesView />}
      {activeTab === 'inquiries' && <InquiriesView />}
      {activeTab === 'security' && <AdminSecurityView />}
    </AdminLayout>
  );
};
export default AdminDashboard;
