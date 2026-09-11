import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JobForm, type JobFormData } from '../components/jobs/JobForm';
import { CheckIcon, ClockIcon } from '../components/common/Icons';
import { jobsApi } from '../services/api';

export const EditJob = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobFormData | null>(null);

  // Load existing vacancy data from API
  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await jobsApi.getJobById(id);
        setJobData({
          title: data.title,
          department: data.department,
          location: data.location,
          type: (data.employmentType as any) || 'Full-time',
          experienceLevel: data.experienceLevel || 'Senior Level (5+ Yrs)',
          status: (data.status as any) || 'Active',
          salaryRange: data.salaryRange || '',
          description: data.description || '',
          benefits: data.whatWeOffer || '',
        });
      } catch (err: any) {
        console.error('Error fetching job for edit:', err);
        setErrorMessage(err.message || 'Failed to load job details from database.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleEditSubmit = async (data: JobFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      await jobsApi.updateJob(id, {
        title: data.title,
        department: data.department,
        location: data.location,
        employmentType: data.type,
        experienceLevel: data.experienceLevel,
        salaryRange: data.salaryRange,
        status: data.status,
        description: data.description,
        whatWeOffer: data.benefits,
      });

      setToastMessage(`Job vacancy "${data.title}" updated successfully!`);
      setTimeout(() => {
        navigate(`/dashboard/jobs/${id}`);
      }, 1000);
    } catch (err: any) {
      console.error('Error updating job:', err);
      alert(err.message || 'Failed to update job vacancy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="job-form-wrapper">
        <div className="job-form-inner-container">
          <div className="job-form-card-container">
            <div className="job-edit-loading-state">
              <ClockIcon />
              <span>Loading job vacancy details from database...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !jobData) {
    return (
      <div className="job-form-wrapper">
        <div className="job-form-inner-container">
          <div className="job-form-card-container p-8 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Unable to Load Job Requisition</h3>
            <p className="text-sm text-slate-500 mb-6">{errorMessage || 'Job not found.'}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              Return to Vacancies Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-job-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="job-details-toast">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      <JobForm
        initialData={jobData}
        onSubmit={handleEditSubmit}
        isEditMode={true}
        isSubmitting={isSubmitting}
        formTitle="Edit Job Vacancy"
        formSubtitle="Modify the role requirements, hiring criteria, compensation range, and candidate matching parameters."
        backLinkUrl={`/dashboard/jobs/${id}`}
        backLinkLabel="Back to Job Details"
        badgeText="REQUISITION MANAGEMENT"
      />
    </div>
  );
};
