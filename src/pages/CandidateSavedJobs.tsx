import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { savedJobsApi, type SavedJobDto } from '../services/api';
import {
  ArrowRightIcon,
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
        <div className="saved-jobs-table-card">
          <div className="saved-jobs-summary">
            <span><strong>{savedJobs.length}</strong> saved {savedJobs.length === 1 ? 'opportunity' : 'opportunities'}</span>
            <span>Private to your candidate account</span>
          </div>
          <div className="saved-jobs-table-scroll">
            <table className="saved-jobs-table">
              <thead><tr><th>Position &amp; Company</th><th>Location &amp; Type</th><th>Experience</th><th>Date Saved</th><th><span className="saved-sr-only">Actions</span></th></tr></thead>
              <tbody>{savedJobs.map((saved) => {
                const initials = saved.companyName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();
                const savedDate = new Date(saved.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return <tr key={saved.id}>
                  <td><div className="saved-table-position"><span className="saved-table-avatar">
                    {saved.companyLogoUrl ? <img src={saved.companyLogoUrl} alt="" /> : initials}
                  </span><div><Link to={`/jobs/${saved.jobId}`}>{saved.jobTitle}</Link><span>{saved.companyName}</span></div></div></td>
                  <td><div className="saved-table-meta"><strong><MapPinIcon /> {saved.location}</strong><span><ClockIcon /> {saved.employmentType}</span></div></td>
                  <td><span className="saved-table-level">{saved.experienceLevel}</span></td>
                  <td><div className="saved-table-date"><strong>{savedDate}</strong>{saved.salaryRange && <span>{saved.salaryRange}</span>}</div></td>
                  <td><div className="saved-table-actions"><Link to={`/jobs/${saved.jobId}`} className="saved-view-button">View Job <ArrowRightIcon /></Link>
                    <button type="button" className="saved-job-remove" disabled={removingId === saved.jobId}
                      onClick={() => void removeSavedJob(saved.jobId)} aria-label={`Remove ${saved.jobTitle} from saved jobs`}><TrashIcon /></button></div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
