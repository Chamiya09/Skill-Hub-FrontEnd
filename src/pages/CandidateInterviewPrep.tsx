import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  interviewPrepApi,
  jobApplicationsApi,
  type CandidateApplicationItemDto,
} from '../services/api';
import {
  InterviewHubHeader,
  EligibleJobCard,
  EmptyStateMessage,
  OtherApplicationsSection,
  GeneratingGuideModal,
} from '../components/interview-prep';
import './CandidateInterviewPrep.css';

export const CandidateInterviewPrep: React.FC = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<CandidateApplicationItemDto[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [generatingAppId, setGeneratingAppId] = useState<string | null>(null);
  const [activeGeneratingApp, setActiveGeneratingApp] = useState<CandidateApplicationItemDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load candidate applications on mount
  useEffect(() => {
    let isMounted = true;

    const fetchApplications = async () => {
      try {
        setIsLoadingApps(true);
        const data = await jobApplicationsApi.getMyApplications();
        if (isMounted) {
          setApplications(data || []);
        }
      } catch (err: unknown) {
        console.warn('Failed to fetch real applications, using fallback for testing:', err);
        if (isMounted) {
          // Fallback test data if offline / demo
          setApplications([
            {
              id: 'app-demo-1',
              jobId: 'job-101',
              jobTitle: 'Senior Full-Stack .NET & React Engineer',
              companyName: 'Acme Digital Solutions',
              status: 'Assessment',
              appliedDate: new Date().toISOString(),
            } as CandidateApplicationItemDto,
            {
              id: 'app-demo-2',
              jobId: 'job-102',
              jobTitle: 'Cloud Solutions & Systems Architect',
              companyName: 'Vertex Cloud Platforms',
              status: 'Interview',
              appliedDate: new Date().toISOString(),
            } as CandidateApplicationItemDto,
            {
              id: 'app-demo-3',
              jobId: 'job-103',
              jobTitle: 'Junior Frontend Developer',
              companyName: 'BlueSky Media',
              status: 'Applied',
              appliedDate: new Date().toISOString(),
            } as CandidateApplicationItemDto,
          ]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingApps(false);
        }
      }
    };

    fetchApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter strictly for eligible applications: ONLY where status is strictly 'Interview'
  const eligibleApplications = useMemo(() => {
    return applications.filter((app) => {
      const s = (app.status || '').toLowerCase().trim();
      return s === 'interview';
    });
  }, [applications]);

  // Non-eligible applications (Assessment, Applied, Shortlisted, Rejected, etc.)
  const otherApplications = useMemo(() => {
    return applications.filter((app) => {
      const s = (app.status || '').toLowerCase().trim();
      return s !== 'interview';
    });
  }, [applications]);

  // Primary Action: Generate AI Prep Guide and Navigate to Page 2 (The Study Dashboard)
  const handleGenerateGuide = async (app: CandidateApplicationItemDto) => {
    try {
      setError(null);
      setGeneratingAppId(app.id);
      setActiveGeneratingApp(app);

      const response = await interviewPrepApi.generate({
        applicationId: app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        targetRole: app.jobTitle,
        jobDescription: `Position: ${app.jobTitle} at ${app.companyName || 'Enterprise'}. Core responsibilities include full lifecycle system architecture, high-performance web development, database optimization, and team collaboration.`,
      });

      const guideId = response.guideId || response.id || response.guide?.id;
      if (!guideId) {
        throw new Error('Guide generation completed but no guide ID was returned.');
      }

      // Store last generated guide ID for sidebar direct access
      localStorage.setItem('skillhub_last_guide_id', guideId);

      // Navigate seamlessly to Page 2: The Study Dashboard
      navigate(`/candidate/interview-prep/guide/${guideId}`);
    } catch (err: any) {
      console.error('Error generating prep guide:', err);
      setError(err?.message || 'Failed to generate interview preparation guide. Please try again.');
      setGeneratingAppId(null);
      setActiveGeneratingApp(null);
    }
  };

  return (
    <div className="candidate-interview-prep-page">
      {/* 1. Hub Header Hero Section */}
      <InterviewHubHeader eligibleCount={eligibleApplications.length} />

      {/* Error Alert Banner */}
      {error && (
        <div className="prep-error-alert" role="alert">
          <div className="prep-error-text">
            <strong>Generation Notice:</strong> {error}
          </div>
          <button
            type="button"
            className="prep-error-dismiss"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Full-Screen / Modal Loading Indicator when Generating */}
      {generatingAppId && (
        <GeneratingGuideModal
          jobTitle={activeGeneratingApp?.jobTitle}
          companyName={activeGeneratingApp?.companyName}
        />
      )}

      {/* 2. Initial Loading State */}
      {isLoadingApps ? (
        <div className="prep-loading-state-card" aria-live="polite">
          <div className="prep-state-spinner" />
          <p>Checking eligible interview applications...</p>
        </div>
      ) : (
        <>
          {/* 3. Eligible Applications Grid (Status is strictly 'Interview') */}
          {eligibleApplications.length > 0 ? (
            <section className="eligible-jobs-section">
              <div className="eligible-jobs-header">
                <div>
                  <h2 className="eligible-jobs-title">
                    Upcoming Interview Roles ({eligibleApplications.length})
                  </h2>
                  <p className="eligible-jobs-subtitle">
                    Select an interview role below to generate or review its AI Technical Career Coach study guide.
                  </p>
                </div>
                <div className="eligible-unlocked-badge">
                  <span className="unlocked-dot" />
                  <span>AI Study Guide Unlocked</span>
                </div>
              </div>

              <div className="eligible-jobs-grid">
                {eligibleApplications.map((app) => (
                  <EligibleJobCard
                    key={app.id}
                    application={app}
                    isGenerating={generatingAppId === app.id}
                    onGenerateGuide={handleGenerateGuide}
                  />
                ))}
              </div>
            </section>
          ) : (
            /* 4. Empty State when NO Interview Applications */
            <EmptyStateMessage />
          )}

          {/* 5. Ineligible / Other Applications List */}
          {otherApplications.length > 0 && (
            <OtherApplicationsSection applications={otherApplications} />
          )}
        </>
      )}
    </div>
  );
};

export default CandidateInterviewPrep;
