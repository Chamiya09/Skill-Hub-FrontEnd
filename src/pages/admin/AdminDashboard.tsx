import React, { useState } from 'react';
import { AdminLayout, type AdminTab } from '../../components/admin/AdminLayout';
import { CandidatesView } from './CandidatesView';
import { CompaniesView } from './CompaniesView';
import { InquiriesView } from './InquiriesView';
import './AdminDashboard.css';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('candidates');

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'candidates' && <CandidatesView />}
      {activeTab === 'companies' && <CompaniesView />}
      {activeTab === 'inquiries' && <InquiriesView />}
    </AdminLayout>
  );
};
export default AdminDashboard;
