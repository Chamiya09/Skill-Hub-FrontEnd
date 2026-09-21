import React, { useState, useEffect, useMemo } from 'react';
import {
  interviewPrepApi,
  jobApplicationsApi,
  type CandidateApplicationItemDto,
  type InterviewPrepGuideDto,
  type InterviewQuestionDto,
  type BehavioralQuestionDto,
} from '../services/api';
import './CandidateInterviewPrep.css';

// Crisp inline icons
const SparkleIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
  </svg>
);

const BriefcaseIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ChevronDownIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LightbulbIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const TargetIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const RefreshIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const PrinterIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect width="12" height="8" x="6" y="14" />
  </svg>
);

export const CandidateInterviewPrep: React.FC = () => {
  // Mode toggle
  const [activeTab, setActiveTab] = useState<'applied' | 'custom'>('applied');

  // Candidate applications
  const [applications, setApplications] = useState<CandidateApplicationItemDto[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // Custom inputs
  const [customTitle, setCustomTitle] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customJobDesc, setCustomJobDesc] = useState('');

  // Guide State
  const [guide, setGuide] = useState<InterviewPrepGuideDto | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interactive Results State
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Fetch candidate applied jobs on mount
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        setIsLoadingApps(true);
        const apps = await jobApplicationsApi.getMyApplications();
        setApplications(apps || []);
        if (apps && apps.length > 0) {
          setSelectedAppId(apps[0].id);
        }
      } catch {
        // Fallback demo applications if network or empty
        setApplications([
          {
            id: 'app-demo-1',
            jobId: 'job-101',
            jobTitle: 'Senior Full-Stack .NET & React Engineer',
            companyName: 'Acme Digital Solutions',
            status: 'Shortlisted',
          } as CandidateApplicationItemDto,
          {
            id: 'app-demo-2',
            jobId: 'job-102',
            jobTitle: 'Cloud Solutions & Systems Architect',
            companyName: 'Vertex Cloud Platforms',
            status: 'Interview',
          } as CandidateApplicationItemDto,
        ]);
        setSelectedAppId('app-demo-1');
      } finally {
        setIsLoadingApps(false);
      }
    };

    fetchAppliedJobs();
  }, []);

  // Handle Primary Action: Generate AI Prep Guide
  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);

    let payload = {
      jobId: undefined as string | undefined,
      jobTitle: '',
      targetRole: '',
      jobDescription: '',
    };

    if (activeTab === 'applied') {
      const selected = applications.find((a) => a.id === selectedAppId);
      if (!selected) {
        setError('Please select an applied job from the list.');
        setIsGenerating(false);
        return;
      }
      payload = {
        jobId: selected.jobId,
        jobTitle: selected.jobTitle,
        targetRole: selected.jobTitle,
        jobDescription: `Applied role at ${selected.companyName || 'Enterprise'}. Key responsibilities include designing scalable cloud architectures, high-performance web systems, database optimization, and team mentoring.`,
      };
    } else {
      if (!customJobDesc.trim()) {
        setError('Please enter a job description to generate your customized guide.');
        setIsGenerating(false);
        return;
      }
      payload = {
        jobId: undefined,
        jobTitle: customTitle.trim() || 'Software Engineer',
        targetRole: customRole.trim() || customTitle.trim() || 'Software Engineer',
        jobDescription: customJobDesc.trim(),
      };
    }

    try {
      const response = await interviewPrepApi.generate(payload);
      setGuide(response);
      // Auto-expand first 2 questions
      if (response.technicalQuestions?.length) {
        setExpandedQuestionIds({
          [response.technicalQuestions[0].id]: true,
          ...(response.technicalQuestions[1] ? { [response.technicalQuestions[1].id]: true } : {}),
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate interview preparation guide. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestionAccordion = (id: string) => {
    setExpandedQuestionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleChecklist = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Categories for technical questions filter
  const categories = useMemo(() => {
    if (!guide?.technicalQuestions) return [];
    const set = new Set<string>();
    guide.technicalQuestions.forEach((q) => set.add(q.category));
    return ['All', ...Array.from(set)];
  }, [guide]);

  const filteredQuestions = useMemo(() => {
    if (!guide?.technicalQuestions) return [];
    if (selectedCategory === 'All') return guide.technicalQuestions;
    return guide.technicalQuestions.filter((q) => q.category === selectedCategory);
  }, [guide, selectedCategory]);

  return (
    <div className="prep-container">
      {/* Header Banner */}
      <header className="prep-header">
        <div className="prep-title-area">
          <h1>
            AI Interview Prep Guide
            <span className="prep-badge-module">Student 1 Module</span>
          </h1>
          <p className="prep-subtitle">
            Generate customized technical interview questions, STAR behavioral frameworks, and rubrics tailored to your job vacancy.
          </p>
        </div>
      </header>

      {/* Input Selection Card */}
      <div className="prep-input-card">
        {/* Mode Tabs */}
        <div className="prep-mode-tabs">
          <button
            type="button"
            className={`prep-tab-btn ${activeTab === 'applied' ? 'active' : ''}`}
            onClick={() => setActiveTab('applied')}
          >
            <BriefcaseIcon />
            <span>Select Applied Job</span>
          </button>
          <button
            type="button"
            className={`prep-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            <EditIcon />
            <span>Custom Job Description</span>
          </button>
        </div>

        {/* Tab 1: Applied Jobs Selector */}
        {activeTab === 'applied' && (
          <div className="prep-form-group">
            <label htmlFor="applied-job-select">Choose Applied Position</label>
            {isLoadingApps ? (
              <div style={{ padding: '12px', color: '#64748b' }}>Loading applied jobs...</div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '12px', color: '#64748b' }}>
                No active applications found. Switch to 'Custom Job Description' to input requirements manually.
              </div>
            ) : (
              <select
                id="applied-job-select"
                className="prep-select"
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.jobTitle} &bull; {app.companyName || 'Enterprise'} ({app.status || 'Applied'})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Tab 2: Custom Job Description Input */}
        {activeTab === 'custom' && (
          <>
            <div className="prep-form-row">
              <div className="prep-form-group">
                <label htmlFor="custom-title-input">Job Title</label>
                <input
                  id="custom-title-input"
                  type="text"
                  className="prep-input"
                  placeholder="e.g. Lead Full-Stack Engineer"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
              <div className="prep-form-group">
                <label htmlFor="custom-role-input">Target Role / Specialization</label>
                <input
                  id="custom-role-input"
                  type="text"
                  className="prep-input"
                  placeholder="e.g. C# / .NET Core, React, AWS Architecture"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              </div>
            </div>
            <div className="prep-form-group">
              <label htmlFor="custom-desc-textarea">Job Description / Requirements</label>
              <textarea
                id="custom-desc-textarea"
                className="prep-textarea"
                placeholder="Paste the job description, key requirements, technical qualifications, or interview expectations here..."
                value={customJobDesc}
                onChange={(e) => setCustomJobDesc(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Action Bar */}
        <div className="prep-action-bar">
          <div className="prep-hint">
            <LightbulbIcon />
            <span>AI analyzes core technical competencies, system design expectations, and culture fit.</span>
          </div>
          <button
            type="button"
            className="btn-generate-ai"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <SparkleIcon />
            <span>{isGenerating ? 'Synthesizing Guide...' : 'Generate AI Prep Guide'}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="prep-error-card">
          <p>{error}</p>
          <button type="button" className="btn-error-retry" onClick={handleGenerate}>
            Retry
          </button>
        </div>
      )}

      {/* Loading Animation */}
      {isGenerating && (
        <div className="prep-loading-card">
          <div className="prep-spinner-wrap">
            <div className="prep-spinner" />
            <div className="prep-spinner-icon">
              <SparkleIcon />
            </div>
          </div>
          <div className="prep-loading-title">Synthesizing Your Tailored Interview Guide</div>
          <p style={{ color: '#64748b', margin: '0 auto', maxWidth: '500px' }}>
            Extracting architectural requirements, formulating senior-level technical rubrics, and structuring STAR behavioral models...
          </p>
          <div className="prep-loading-steps">
            <span className="prep-step-pill active">Analyzing Vacancy</span>
            <span className="prep-step-pill active">Compiling Technical Rubrics</span>
            <span className="prep-step-pill active">Building STAR Matrix</span>
            <span className="prep-step-pill active">Generating Checklist</span>
          </div>
        </div>
      )}

      {/* Results View */}
      {!isGenerating && guide && (
        <div className="prep-results-wrap">
          {/* Guide Header Banner */}
          <div className="prep-guide-banner">
            <div className="prep-banner-top">
              <div>
                <h2 className="prep-banner-role">{guide.targetRole || guide.jobTitle}</h2>
                <div className="prep-banner-meta">
                  <span>Position: {guide.jobTitle}</span>
                  <span>&bull;</span>
                  <span>Generated: {new Date(guide.createdAt).toLocaleDateString()}</span>
                  <span>&bull;</span>
                  <span>Ready for Mock Practice</span>
                </div>
              </div>
              <div className="prep-banner-actions">
                <button
                  type="button"
                  className="btn-banner-action"
                  onClick={() => window.print()}
                  title="Print or Save PDF"
                >
                  <PrinterIcon />
                  <span>Print Guide</span>
                </button>
                <button
                  type="button"
                  className="btn-banner-action"
                  onClick={handleGenerate}
                  title="Regenerate with fresh questions"
                >
                  <RefreshIcon />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
            {guide.roleOverviewSummary && (
              <p className="prep-banner-summary">{guide.roleOverviewSummary}</p>
            )}
          </div>

          {/* 1. Expected Technical Questions */}
          <section className="prep-section">
            <div className="prep-section-header">
              <div className="prep-section-title">
                <span className="prep-section-title-icon">
                  <TargetIcon />
                </span>
                <span>Expected Technical Questions & Rubrics</span>
                <span className="prep-badge-count">{filteredQuestions.length} Questions</span>
              </div>
              {categories.length > 2 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`prep-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="prep-questions-list">
              {filteredQuestions.map((q: InterviewQuestionDto) => {
                const isExpanded = !!expandedQuestionIds[q.id];
                const diffClass = (q.difficulty || 'Mid-Level').toLowerCase().replace(' ', '-');

                return (
                  <div key={q.id} className="prep-question-card">
                    <div
                      className="prep-question-card-header"
                      onClick={() => toggleQuestionAccordion(q.id)}
                    >
                      <div>
                        <div className="prep-question-meta">
                          <span className="badge-category">{q.category}</span>
                          <span className={`badge-difficulty ${diffClass}`}>{q.difficulty}</span>
                        </div>
                        <h3 className="prep-question-text">{q.question}</h3>
                      </div>
                      <div className={`prep-accordion-toggle ${isExpanded ? 'open' : ''}`}>
                        <ChevronDownIcon />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="prep-question-body">
                        {q.expectedAnswerGuideline && (
                          <div className="prep-rubric-block">
                            <div className="prep-rubric-title">What the Interviewer Is Looking For</div>
                            <p className="prep-guideline-text">{q.expectedAnswerGuideline}</p>
                          </div>
                        )}

                        {q.sampleAnswer && (
                          <div className="prep-rubric-block">
                            <div className="prep-rubric-title">Exemplary Technical Response</div>
                            <div className="prep-sample-answer-box">{q.sampleAnswer}</div>
                          </div>
                        )}

                        {q.keyEvaluationPoints && q.keyEvaluationPoints.length > 0 && (
                          <div className="prep-rubric-block">
                            <div className="prep-rubric-title">Key Evaluation Criteria</div>
                            <div className="prep-eval-tags">
                              {q.keyEvaluationPoints.map((point, idx) => (
                                <span key={idx} className="prep-eval-pill">
                                  &bull; {point}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {q.proTip && (
                          <div className="prep-protip-inline">
                            <LightbulbIcon />
                            <span><strong>Pro Tip:</strong> {q.proTip}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Behavioral Questions (STAR Framework) */}
          <section className="prep-section">
            <div className="prep-section-header">
              <div className="prep-section-title">
                <span className="prep-section-title-icon">
                  <SparkleIcon />
                </span>
                <span>Behavioral Questions & STAR Framework</span>
                <span className="prep-badge-count">{guide.behavioralQuestions?.length || 0} Scenarios</span>
              </div>
            </div>

            <div className="prep-star-grid">
              {guide.behavioralQuestions?.map((bq: BehavioralQuestionDto) => (
                <div key={bq.id} className="prep-star-card">
                  <span className="prep-star-competency">{bq.competency}</span>
                  <h3 className="prep-star-question">{bq.question}</h3>

                  <div className="star-steps-grid">
                    <div className="star-step-item">
                      <span className="star-letter">S - Situation</span>
                      <p className="star-desc">{bq.starGuidance?.situation}</p>
                    </div>
                    <div className="star-step-item">
                      <span className="star-letter">T - Task</span>
                      <p className="star-desc">{bq.starGuidance?.task}</p>
                    </div>
                    <div className="star-step-item">
                      <span className="star-letter">A - Action</span>
                      <p className="star-desc">{bq.starGuidance?.action}</p>
                    </div>
                    <div className="star-step-item">
                      <span className="star-letter">R - Result</span>
                      <p className="star-desc">{bq.starGuidance?.result}</p>
                    </div>
                  </div>

                  {bq.whatToAvoid && (
                    <div className="star-avoid-box">
                      <span><strong>What to Avoid:</strong> {bq.whatToAvoid}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. Pro Tips & Strategic Guidance */}
          {guide.proTips && guide.proTips.length > 0 && (
            <section className="prep-section">
              <div className="prep-section-header">
                <div className="prep-section-title">
                  <span className="prep-section-title-icon">
                    <LightbulbIcon />
                  </span>
                  <span>Interview Strategy & Pro Tips</span>
                </div>
              </div>

              <div className="prep-protips-grid">
                {guide.proTips.map((tip, idx) => (
                  <div key={idx} className="prep-protip-card">
                    <div className="prep-protip-icon">
                      <LightbulbIcon />
                    </div>
                    <p className="prep-protip-text">{tip}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Day-of-Interview Interactive Checklist */}
          {guide.preparationChecklist && guide.preparationChecklist.length > 0 && (
            <section className="prep-section">
              <div className="prep-section-header">
                <div className="prep-section-title">
                  <span className="prep-section-title-icon">
                    <TargetIcon />
                  </span>
                  <span>Day-of-Interview Readiness Checklist</span>
                </div>
              </div>

              <div className="prep-checklist-wrap">
                {guide.preparationChecklist.map((item, idx) => {
                  const isChecked = !!checkedItems[idx];
                  return (
                    <div
                      key={idx}
                      className={`prep-check-item ${isChecked ? 'checked' : ''}`}
                      onClick={() => toggleChecklist(idx)}
                    >
                      <div className="prep-checkbox">
                        {isChecked && <CheckIcon />}
                      </div>
                      <span className="prep-check-label">{item}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Idle Placeholder State */}
      {!isGenerating && !guide && (
        <div className="prep-idle-placeholder">
          <div className="prep-idle-icon-box">
            <SparkleIcon />
          </div>
          <h2 className="prep-idle-title">Ready to Ace Your Next Interview?</h2>
          <p className="prep-idle-desc">
            Select one of your applied positions above or paste any Job Description to generate targeted technical rubrics, STAR behavioral examples, and preparation checklists.
          </p>
          <div className="prep-feature-grid">
            <div className="prep-feature-card">
              <h4>
                <TargetIcon /> Tailored Technical Questions
              </h4>
              <p>Senior-level rubrics, expected architectural explanations, and sample answers based on job keywords.</p>
            </div>
            <div className="prep-feature-card">
              <h4>
                <SparkleIcon /> STAR Behavioral Matrix
              </h4>
              <p>Structured Situation, Task, Action, and Result frameworks so you can articulate impact with confidence.</p>
            </div>
            <div className="prep-feature-card">
              <h4>
                <LightbulbIcon /> Pro Preparation Strategies
              </h4>
              <p>Insightful questions to ask interviewers, communication tips, and culture-fit best practices.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateInterviewPrep;
