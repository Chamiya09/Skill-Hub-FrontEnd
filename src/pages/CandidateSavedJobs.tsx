import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { savedJobsApi, type SavedJobDto } from '../services/api';
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  ClockIcon,
  MapPinIcon,
  SearchIcon,
} from '../components/common/Icons';
import './CandidateSavedJobs.css';

const BookmarkIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5m4-5v5" />
  </svg>
);

export const CandidateSavedJobs: React.FC = () => {
  const [savedJobs, setSavedJobs] = useState<SavedJobDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSavedJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSavedJobs(await savedJobsApi.getAll());
    } catch (err: unknown) {
      console.error('Unable to load saved jobs:', err);
      setError(err instanceof Error ? err.message : 'Unable to load your saved jobs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadSavedJobs);
  }, []);

  const removeSavedJob = async (jobId: string) => {
    const previous = savedJobs;
    setRemovingId(jobId);
    setSavedJobs((current) => current.filter((saved) => saved.jobId !== jobId));
    try {
      await savedJobsApi.remove(jobId);
    } catch (err: unknown) {
      setSavedJobs(previous);
      setError(err instanceof Error ? err.message : 'Unable to remove the saved job.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="saved-jobs-page">
      <section className="saved-jobs-hero">
        <div>
          <div className="saved-jobs-eyebrow"><BookmarkIcon /> SAVED BOOKMARKS</div>
          <h1>Saved Jobs</h1>
          <p>Keep promising opportunities organised and return when you are ready to apply.</p>
        </div>
        <Link to="/jobs" className="saved-jobs-primary"><SearchIcon /> Browse Available Jobs</Link>
      </section>

      {error && <div className="saved-jobs-error" role="alert"><span>{error}</span>
        <button type="button" onClick={() => void loadSavedJobs()}>Retry</button></div>}

      {isLoading ? (
        <div className="saved-jobs-state" aria-live="polite">
          <div className="saved-jobs-spinner" /><p>Loading your saved opportunities...</p>
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="saved-jobs-state saved-jobs-empty">
          <div className="saved-jobs-empty-icon"><BookmarkIcon /></div>
          <h2>No Bookmarked Jobs</h2>
          <p>Use the bookmark button on any vacancy to build your personal opportunity shortlist.</p>
          <Link to="/jobs" className="saved-jobs-primary">Explore Job Directory <ArrowRightIcon /></Link>
        </div>
      ) : (
        <>
          <div className="saved-jobs-summary">
            <span><strong>{savedJobs.length}</strong> saved {savedJobs.length === 1 ? 'opportunity' : 'opportunities'}</span>
            <span>Private to your candidate account</span>
          </div>
          <div className="saved-jobs-grid">
            {savedJobs.map((saved) => {
              const initials = saved.companyName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();
              const savedDate = new Date(saved.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <article className="saved-job-card" key={saved.id}>
                  <header>
                    <div className="saved-job-logo">
                      {saved.companyLogoUrl ? <img src={saved.companyLogoUrl} alt={`${saved.companyName} logo`} /> : initials}
                    </div>
                    <button type="button" className="saved-job-remove" disabled={removingId === saved.jobId}
                      onClick={() => void removeSavedJob(saved.jobId)} aria-label={`Remove ${saved.jobTitle} from saved jobs`}>
                      <TrashIcon />
                    </button>
                  </header>
                  <div className="saved-job-body">
                    <span className="saved-job-level"><BriefcaseIcon /> {saved.experienceLevel}</span>
                    <Link to={`/jobs/${saved.jobId}`} className="saved-job-title">{saved.jobTitle}</Link>
                    <div className="saved-job-company"><BuildingIcon /> {saved.companyName}</div>
                    <div className="saved-job-meta">
                      <span><MapPinIcon /> {saved.location}</span>
                      <span><ClockIcon /> {saved.employmentType}</span>
                    </div>
                    {saved.salaryRange && <div className="saved-job-salary">{saved.salaryRange}</div>}
                  </div>
                  <footer>
                    <span>Saved {savedDate}</span>
                    <Link to={`/jobs/${saved.jobId}`}>View Job <ArrowRightIcon /></Link>
                  </footer>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
