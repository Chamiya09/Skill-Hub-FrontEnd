import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobForm, type JobFormData } from '../components/jobs/JobForm';
import { CheckIcon } from '../components/common/Icons';

export const CreateJob = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const initialData: Partial<JobFormData> = {
    title: '',
    department: 'Engineering',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    experienceLevel: 'Senior Level (5+ Yrs)',
    status: 'Active',
    salaryRange: '$120,000 - $160,000 USD / yr',
    description: `<h2>Role Overview</h2><p>We are seeking a talented engineer to join our high-growth product team. You will lead key technical initiatives and build scalable solutions for enterprise customers.</p><h3>Key Responsibilities</h3><ul><li>Architect and implement robust cloud microservices.</li><li>Collaborate with cross-functional product and design teams.</li><li>Participate in code reviews and architectural discussions.</li></ul><h3>Required Qualifications</h3><ul><li>3+ years of professional software engineering experience.</li><li>Strong command of modern web development and distributed APIs.</li><li>Excellent communication and problem-solving skills.</li></ul>`,
    benefits: `<h3>What We Offer</h3><ul><li>Competitive base salary + equity stock options.</li><li>100% remote work flexibility with home office stipend.</li><li>Comprehensive health, dental, and vision coverage.</li><li>Annual learning and conference allowance ($2,000/yr).</li></ul>`,
  };

  const handleCreateSubmit = (data: JobFormData) => {
    setIsSubmitting(true);

    // Simulate API job creation
    setTimeout(() => {
      setIsSubmitting(false);
      const newJobId = `vac-${Date.now()}`;
      setToastMessage(`Job vacancy "${data.title}" published successfully!`);

      setTimeout(() => {
        navigate(`/dashboard/jobs/${newJobId}`);
      }, 1000);
    }, 500);
  };

  return (
    <div className="create-job-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="job-details-toast">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      <JobForm
        initialData={initialData}
        onSubmit={handleCreateSubmit}
        isEditMode={false}
        isSubmitting={isSubmitting}
        formTitle="Create New Job"
        formSubtitle="Publish a new job requisition to start receiving AI-screened candidate matches."
        backLinkUrl="/dashboard"
        backLinkLabel="Back to Vacancies"
        badgeText="TALENT REQUISITION"
      />
    </div>
  );
};
