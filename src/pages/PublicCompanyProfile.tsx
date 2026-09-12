import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  companyProfileApi,
  type CompanyProfileDto,
  type JobDto,
} from '../services/api';
import { JobVacancyCard } from '../components/jobs/JobVacancyCard';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import {
  BuildingIcon,
  GlobeIcon,
  MapPinIcon,
  CheckIcon,
  SparkleIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  SearchIcon,
} from '../components/common/Icons';

export const PublicCompanyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [company, setCompany] = useState<CompanyProfileDto | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [logoError, setLogoError] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);
        setLogoError(false);

        const identifier = id || 'current';
        const data = await companyProfileApi.getPublicProfile(identifier);
        setCompany(data.company);
        setJobs(data.jobs);
      } catch (err: any) {
        console.error('Failed to load public company profile:', err);
        setError(err.message || 'Unable to retrieve company information.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();

    const handleProfileUpdate = () => {
      fetchCompanyData();
    };

    window.addEventListener('skillhub_company_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('skillhub_company_profile_updated', handleProfileUpdate);
    };
  }, [id]);

  const toggleBookmark = (jobId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(jobId) ? prev.filter((i) => i !== jobId) : [...prev, jobId]
    );
  };

  // Filter jobs by search term
  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.department.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q) ||
      job.employmentType.toLowerCase().includes(q)
    );
  });

  const companyInitials =
    (company?.companyName || 'CO')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CO';

  // Format website URL for display & link target
  const websiteHref = company?.website
    ? company.website.startsWith('http')
      ? company.website
      : `https://${company.website}`
    : null;

  const websiteDisplay = company?.website
    ? company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null;

  if (loading) {
    return (
      <div className="public-company-container">
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '36px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: '#f1f5f9' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ height: '24px', background: '#f1f5f9', borderRadius: '6px', width: '35%' }} />
              <div style={{ height: '16px', background: '#f1f5f9', borderRadius: '6px', width: '20%' }} />
            </div>
          </div>
        </div>
        <SkeletonGrid count={3} variant="rich-grid" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="public-company-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '40px 30px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BuildingIcon />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Company Not Found</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
            {error || 'The requested employer profile could not be located.'}
          </p>
          <Link
            to="/jobs"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', textDecoration: 'none' }}
          >
            <span>Explore All Vacancies</span>
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="public-company-container">
      {/* =========================================================
          1. HEADER SECTION (Logo, Name, Location badge, Website)
          ========================================================= */}
      <header className="public-company-hero">
        <div className="public-company-identity-stack">
          {/* Company Logo / Initials Avatar */}
          <div className="public-company-logo-badge">
            {company.logoUrl && !logoError ? (
              <img
                src={company.logoUrl}
                alt={`${company.companyName} Logo`}
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="public-company-logo-initials">{companyInitials}</span>
            )}
          </div>

          {/* Identity & Meta Badges */}
          <div>
            <div className="public-company-title-row">
              <h1 className="public-company-name">{company.companyName}</h1>
              <span className="public-company-verified-tag">
                <CheckIcon />
                <span>Verified Employer</span>
              </span>
            </div>

            {/* Meta details row: Location, Website, Industry */}
            <div className="public-company-meta-row">
              {/* Location Badge */}
              {(company.location || (jobs.length > 0 && jobs[0].location)) && (
                <div className="public-meta-pill">
                  <MapPinIcon />
                  <span>{company.location || jobs[0].location}</span>
                </div>
              )}

              {/* Clickable Website Link */}
              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-website-link"
                  title={`Visit ${company.companyName} official website`}
                >
                  <GlobeIcon />
                  <span>{websiteDisplay}</span>
                  <ExternalLinkIcon />
                </a>
              )}

              {/* Industry Meta */}
              {company.industry && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
                  <BuildingIcon />
                  <span>{company.industry}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Stats Tag */}
        <div className="public-positions-badge">
          <span className="public-positions-badge-label">Active Requisitions</span>
          <div className="public-positions-badge-pill">
            <BriefcaseIcon />
            <span>{jobs.length} Open {jobs.length === 1 ? 'Position' : 'Positions'}</span>
          </div>
        </div>
      </header>

      {/* =========================================================
          2. ABOUT SECTION (Clean Typography Description)
          ========================================================= */}
      <section className="public-about-card">
        <div className="public-about-header">
          <div>
            <h2>About {company.companyName}</h2>
            <p>Company mission, engineering principles, and culture</p>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BuildingIcon />
          </div>
        </div>

        {/* Clean Typography Content */}
        <div className="public-about-text">
          {company.about ? (
            company.about
              .split('\n')
              .filter((p) => p.trim().length > 0)
              .map((para, idx) => <p key={idx}>{para}</p>)
          ) : (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              No company overview has been published yet.
            </p>
          )}
        </div>
      </section>

      {/* =========================================================
          3. OPEN POSITIONS SECTION (Unified JobCard Reused)
          ========================================================= */}
      <section>
        <div className="public-jobs-header-row">
          <div className="public-jobs-title-box">
            <div className="tag">
              <SparkleIcon />
              <span>Career Opportunities</span>
            </div>
            <h2>Open Positions at {company.companyName}</h2>
            <p>Join {company.companyName} and contribute to high-impact technical initiatives.</p>
          </div>

          {/* Search filter within company's open vacancies */}
          {jobs.length > 2 && (
            <div className="public-jobs-search-box">
              <span className="search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Job Card Grid */}
        {filteredJobs.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <BriefcaseIcon />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              No active vacancies found
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '380px', margin: '0 auto 16px' }}>
              {searchQuery
                ? `No positions match "${searchQuery}". Try a different keyword.`
                : `${company.companyName} currently does not have any publicly listed job vacancies.`}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="rich-jobs-grid">
            {filteredJobs.map((job) => (
              <JobVacancyCard
                key={job.id}
                job={job}
                isBookmarked={bookmarkedIds.includes(job.id)}
                onToggleBookmark={toggleBookmark}
                showBookmark={true}
                showAiMatch={true}
                matchPercentage={95}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
