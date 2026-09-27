import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  interviewPrepApi,
  jobApplicationsApi,
  type CandidateApplicationItemDto,
  type InterviewPrepGuideDto,
} from '../services/api';
import {
  EligibleJobCard,
  EmptyStateMessage,
  OtherApplicationsSection,
  GeneratingGuideModal,
  ReviewStudyGuideModal,
} from '../components/interview-prep';
import { BookOpen, BriefcaseBusiness, CheckCircle2, Clock, Search, Sparkles, X } from 'lucide-react';
import './CandidateInterviewPrep.css';

type PrepGuideFilter = 'all' | 'ready' | 'not-ready';
type PrepGuideSort = 'newest' | 'company' | 'role';

export const CandidateInterviewPrep: React.FC = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<CandidateApplicationItemDto[]>([]);
  const [savedGuides, setSavedGuides] = useState<InterviewPrepGuideDto[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [generatingAppId, setGeneratingAppId] = useState<string | null>(null);
  const [activeGeneratingApp, setActiveGeneratingApp] = useState<CandidateApplicationItemDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guideFilter, setGuideFilter] = useState<PrepGuideFilter>('all');
  const [guideSearch, setGuideSearch] = useState('');
  const [guideSort, setGuideSort] = useState<PrepGuideSort>('newest');

  // Human Review & Approval Modal state
  const [reviewingGuide, setReviewingGuide] = useState<InterviewPrepGuideDto | null>(null);
  const [reviewingApp, setReviewingApp] = useState<CandidateApplicationItemDto | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Load candidate applications and any previously generated guides on mount
  useEffect(() => {
    let isMounted = true;

    const fetchApplications = async () => {
      try {
        setIsLoadingApps(true);
        const [appsData, guidesData] = await Promise.all([
          jobApplicationsApi.getMyApplications().catch(() => [] as CandidateApplicationItemDto[]),
          interviewPrepApi.getAll().catch(() => [] as InterviewPrepGuideDto[]),
        ]);
        if (isMounted) {
          setApplications(appsData || []);
          setSavedGuides(guidesData || []);
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

  // Find saved guide for an application
  const getSavedGuideForApp = (app: CandidateApplicationItemDto) => {
    const appId = app.id || app.applicationId;
    return savedGuides.find(
      (g) =>
        (g.applicationId && (g.applicationId === appId || g.applicationId === app.id)) ||
        (g.jobId && g.jobId === app.jobId)
    );
  };

  const readyGuidesCount = eligibleApplications.filter((app) => Boolean(getSavedGuideForApp(app))).length;
  const awaitingGuidesCount = Math.max(eligibleApplications.length - readyGuidesCount, 0);

  const filteredEligibleApplications = eligibleApplications
    .filter((app) => {
      const hasGuide = Boolean(getSavedGuideForApp(app));
      if (guideFilter === 'ready' && !hasGuide) return false;
      if (guideFilter === 'not-ready' && hasGuide) return false;

      if (guideSearch.trim()) {
        const query = guideSearch.trim().toLowerCase();
        return [app.jobTitle, app.companyName, app.status]
          .some((value) => (value || '').toLowerCase().includes(query));
      }
      return true;
    })
    .sort((a, b) => {
      if (guideSort === 'company') return (a.companyName || '').localeCompare(b.companyName || '');
      if (guideSort === 'role') return (a.jobTitle || '').localeCompare(b.jobTitle || '');
      return new Date(b.appliedDate || 0).getTime() - new Date(a.appliedDate || 0).getTime();
    });

  const hasGuideFilters = guideFilter !== 'all' || guideSearch.trim() !== '' || guideSort !== 'newest';

  const clearGuideFilters = () => {
    setGuideFilter('all');
    setGuideSearch('');
    setGuideSort('newest');
  };

  // View Existing Saved Guide in Study Dashboard without regenerating
  const handleViewGuide = (guideId: string) => {
    localStorage.setItem('skillhub_last_guide_id', guideId);
    navigate(`/candidate/interview-prep/guide/${guideId}`);
  };

  // Primary Action: Generate AI Prep Guide and Open Review & Approval Modal
  const handleGenerateGuide = async (app: CandidateApplicationItemDto, forceRegenerate = false) => {
    const appId = app.id || app.applicationId || '';
    try {
      setError(null);
      setGeneratingAppId(appId || null);
      setActiveGeneratingApp(app);

      const response = await interviewPrepApi.generate({
        applicationId: appId,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        targetRole: app.jobTitle,
        jobDescription: `Position: ${app.jobTitle} at ${app.companyName || 'Enterprise'}. Core responsibilities include full lifecycle system architecture, high-performance web development, database optimization, and team collaboration.`,
        forceRegenerate,
      });

      const guideId = response.guideId || response.id || response.guide?.id;
      let guideObj = response.guide;
      if (!guideObj && guideId) {
        try {
          guideObj = await interviewPrepApi.getById(guideId);
        } catch (fetchErr) {
          console.warn('Failed to fetch full guide object, using partial response', fetchErr);
        }
      }

      if (!guideObj && !guideId) {
        throw new Error('Guide generation completed but no guide ID was returned.');
      }

      setGeneratingAppId(null);
      setActiveGeneratingApp(null);

      // Open Human Review & Approval Modal instead of navigating directly to Study Dashboard
      if (guideObj) {
        setReviewingGuide(guideObj);
        setReviewingApp(app);
      } else if (guideId) {
        // Fallback navigation if guide object structure missing
        localStorage.setItem('skillhub_last_guide_id', guideId);
        navigate(`/candidate/interview-prep/guide/${guideId}`);
      }
    } catch (err: any) {
      console.error('Error generating prep guide:', err);
      setError(err?.message || 'Failed to generate interview preparation guide. Please try again.');
      setGeneratingAppId(null);
      setActiveGeneratingApp(null);
    }
  };

  // Human Approval: Candidate approves the AI guidelines -> saves to Study Dashboard
  const handleApproveReviewGuide = async () => {
    if (!reviewingGuide || !reviewingGuide.id) return;
    try {
      setIsApproving(true);
      setError(null);
      const approved = await interviewPrepApi.approve(reviewingGuide.id);

      // Update savedGuides in state so the card immediately reflects Guide Ready
      setSavedGuides((prev) => {
        const filtered = prev.filter(
          (g) => g.id !== approved.id && (!approved.applicationId || g.applicationId !== approved.applicationId)
        );
        return [approved, ...filtered];
      });

      localStorage.setItem('skillhub_last_guide_id', approved.id);

      const guideId = approved.id;
      setReviewingGuide(null);
      setReviewingApp(null);

      // Navigate to Study Dashboard to begin studying
      navigate(`/candidate/interview-prep/guide/${guideId}`);
    } catch (err: any) {
      console.error('Error approving guide:', err);
      setError(err?.message || 'Failed to approve and save study guidelines.');
    } finally {
      setIsApproving(false);
    }
  };

  // Human Approval: Candidate requests regeneration of AI guidelines
  const handleRegenerateReviewGuide = async () => {
    if (!reviewingGuide || !reviewingGuide.id) return;
    try {
      setIsRegenerating(true);
      setError(null);

      const response = await interviewPrepApi.regenerate(reviewingGuide.id);
      const newGuide = response.guide || (response.guideId ? await interviewPrepApi.getById(response.guideId) : null);

      if (newGuide) {
        setReviewingGuide(newGuide);
      } else {
        throw new Error('Regeneration completed but could not load new guidelines.');
      }
    } catch (err: any) {
      console.error('Error regenerating guide:', err);
      setError(err?.message || 'Failed to regenerate study guidelines. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Discard Draft and close review modal
  const handleDiscardReviewGuide = () => {
    setReviewingGuide(null);
    setReviewingApp(null);
  };

  return (
    <div className="candidate-interview-prep-page">
      {/* 1. Interview Preparation Dashboard */}
      <section className="prep-dashboard-card" aria-labelledby="prep-dashboard-title">
        <div className="prep-dashboard-header">
          <div>
            <span className="prep-dashboard-eyebrow">AI career coach</span>
            <h1 id="prep-dashboard-title">Interview Prep Hub</h1>
            <p>Generate, review, and organize role-specific preparation guides for your upcoming interviews.</p>
          </div>
          <span className="prep-dashboard-live"><span /> Preparation active</span>
        </div>

        <div className="prep-summary-grid">
          <article className="prep-summary-card summary-applications">
            <div className="prep-summary-icon"><BriefcaseBusiness /></div>
            <div><span>Total applications</span><strong>{applications.length}</strong><small>Tracked candidate roles</small></div>
          </article>
          <article className="prep-summary-card summary-eligible">
            <div className="prep-summary-icon"><Sparkles /></div>
            <div><span>Interview roles</span><strong>{eligibleApplications.length}</strong><small>Eligible for preparation</small></div>
          </article>
          <article className="prep-summary-card summary-ready">
            <div className="prep-summary-icon"><CheckCircle2 /></div>
            <div><span>Guides ready</span><strong>{readyGuidesCount}</strong><small>Available to study</small></div>
          </article>
          <article className="prep-summary-card summary-awaiting">
            <div className="prep-summary-icon"><Clock /></div>
            <div><span>Awaiting guide</span><strong>{awaitingGuidesCount}</strong><small>Ready for generation</small></div>
          </article>
        </div>
      </section>

      {/* 2. Standalone Preparation Filters */}
      <section className="prep-filter-panel" aria-label="Interview preparation filters">
        <div className="prep-filter-heading">
          <div>
            <span>Preparation workspace</span>
            <h2>Find your interview guides</h2>
          </div>
          <strong>{filteredEligibleApplications.length} of {eligibleApplications.length} shown</strong>
        </div>

        <div className="prep-filter-toolbar">
          <div className="prep-filter-tabs" role="group" aria-label="Filter guides by readiness">
            <button type="button" className={guideFilter === 'all' ? 'active' : ''} onClick={() => setGuideFilter('all')}>
              All roles ({eligibleApplications.length})
            </button>
            <button type="button" className={guideFilter === 'ready' ? 'active' : ''} onClick={() => setGuideFilter('ready')}>
              Guide ready ({readyGuidesCount})
            </button>
            <button type="button" className={guideFilter === 'not-ready' ? 'active' : ''} onClick={() => setGuideFilter('not-ready')}>
              Needs guide ({awaitingGuidesCount})
            </button>
          </div>

          <div className="prep-filter-search">
            <Search />
            <input
              type="search"
              value={guideSearch}
              onChange={(event) => setGuideSearch(event.target.value)}
              placeholder="Search role or company..."
              aria-label="Search interview preparation roles"
            />
            {guideSearch && (
              <button type="button" onClick={() => setGuideSearch('')} aria-label="Clear guide search"><X /></button>
            )}
          </div>

          <div className="prep-filter-select">
            <label htmlFor="prep-guide-sort">Sort by</label>
            <select id="prep-guide-sort" value={guideSort} onChange={(event) => setGuideSort(event.target.value as PrepGuideSort)}>
              <option value="newest">Newest application</option>
              <option value="company">Company A–Z</option>
              <option value="role">Role A–Z</option>
            </select>
          </div>

          {hasGuideFilters && (
            <button type="button" className="prep-clear-filters" onClick={clearGuideFilters}><X /> Clear filters</button>
          )}
        </div>
      </section>

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
                    Upcoming Interview Roles ({filteredEligibleApplications.length})
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

              {filteredEligibleApplications.length > 0 ? (
              <div className="eligible-jobs-grid">
                {filteredEligibleApplications.map((app) => {
                  const appId = app.id || app.applicationId;
                  const saved = getSavedGuideForApp(app);
                  return (
                    <EligibleJobCard
                      key={appId}
                      application={app}
                      isGenerating={generatingAppId === appId}
                      savedGuideId={saved?.id || null}
                      onGenerateGuide={handleGenerateGuide}
                      onViewGuide={handleViewGuide}
                    />
                  );
                })}
              </div>
              ) : (
                <div className="prep-filter-empty">
                  <div><BookOpen /></div>
                  <h3>No matching preparation guides</h3>
                  <p>Try changing the search, guide status, or sorting options.</p>
                  <button type="button" onClick={clearGuideFilters}>Reset preparation filters</button>
                </div>
              )}
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

      {/* 6. Human Review & Approval Modal */}
      {reviewingGuide && (
        <ReviewStudyGuideModal
          guide={reviewingGuide}
          application={reviewingApp}
          isApproving={isApproving}
          isRegenerating={isRegenerating}
          onApprove={handleApproveReviewGuide}
          onRegenerate={handleRegenerateReviewGuide}
          onDiscard={handleDiscardReviewGuide}
        />
      )}
    </div>
  );
};

export default CandidateInterviewPrep;
