import React, { useState, useEffect, useMemo } from 'react';
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
  UsersIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  LinkedInIcon,
  TwitterIcon,
  GitHubIcon,
  ExternalLinkIcon,
  CheckIcon,
  SearchIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  SparkleIcon,
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
      const identifier = (id || '').trim();
      if (!identifier) {
        setError('No company identifier provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setLogoError(false);

        // Strictly fetch the specific company data by route parameter id or slug from PostgreSQL database
        const data = await companyProfileApi.getPublicProfile(identifier);
        if (!data || !data.company) {
          throw new Error(`Company '${identifier}' could not be found.`);
        }
        setCompany(data.company);
        setJobs(data.jobs || []);
      } catch (err: any) {
        console.error('Failed to load public company profile:', err);
        setError(err.message || 'Unable to retrieve company information.');
        setCompany(null);
        setJobs([]);
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

  // Strict Frontend Filter: ensure ONLY jobs matching this specific company's ID or exact company name are displayed
  const companyJobs = useMemo(() => {
    if (!company) return [];
    const targetId = (company.id || '').toLowerCase().trim();
    const targetName = (company.companyName || '').toLowerCase().trim();

    return jobs.filter((job) => {
      const jobCompanyId = (job.companyId || '').toLowerCase().trim();
      const jobCompanyName = (job.companyName || '').toLowerCase().trim();

      if (targetId && jobCompanyId) {
        return jobCompanyId === targetId;
      }
      if (targetName && jobCompanyName) {
        return jobCompanyName === targetName;
      }
      return false;
    });
  }, [jobs, company]);

  // Filter company's jobs by search term (title, department, location, tags)
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return companyJobs;
    const q = searchQuery.toLowerCase().trim();
    return companyJobs.filter((job) => {
      const inTitle = job.title.toLowerCase().includes(q);
      const inDept = job.department.toLowerCase().includes(q);
      const inLoc = job.location.toLowerCase().includes(q);
      const inType = job.employmentType.toLowerCase().includes(q);
      const inTags = job.tags ? job.tags.some((t) => t.toLowerCase().includes(q)) : false;
      return inTitle || inDept || inLoc || inType || inTags;
    });
  }, [companyJobs, searchQuery]);

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
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '36px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '76px', height: '76px', borderRadius: '16px', background: '#f1f5f9' }} />
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
        <div style={{ maxWidth: '460px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '40px 30px' }}>
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

  const primaryLocation = company.location || 'Headquarters';

  return (
    <div className="public-company-container">
      {/* =========================================================
          1. CLEAN TOP HEADER (Strictly Brand Logo, Name, Verified Badge & Positions Count)
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

          {/* Identity Title & Verified Tag */}
          <div className="public-company-title-box">
            <div className="public-company-title-row">
              <h1 className="public-company-name">{company.companyName}</h1>
              <span className="public-company-verified-tag">
                <CheckIcon />
                <span>Verified Employer</span>
              </span>
            </div>
            <p className="public-company-tagline">
              Official Employer & Engineering Recruitment Hub on Skill Hub
            </p>
          </div>
        </div>

        {/* Right Header Stats Tag */}
        <div className="public-positions-badge">
          <span className="public-positions-badge-label">Active Requisitions</span>
          <div className="public-positions-badge-pill">
            <BriefcaseIcon />
            <span>{companyJobs.length} Open {companyJobs.length === 1 ? 'Position' : 'Positions'}</span>
          </div>
        </div>
      </header>

      {/* =========================================================
          2. TWO-COLUMN GRID LAYOUT (Main Content Left & Details Card Right)
          ========================================================= */}
      <div className="public-company-grid-layout">
        {/* =========================================================
            LEFT COLUMN (Approx. 2/3 Width): About Us & Open Positions
            ========================================================= */}
        <main className="public-company-main-col">
          {/* About Company Card */}
          <section className="public-about-card">
            <div className="public-about-header">
              <div>
                <h2>About {company.companyName}</h2>
                <p>Company mission, engineering principles, and culture</p>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BuildingIcon />
              </div>
            </div>

            {/* Clean Typography Description */}
            <div className="public-about-text">
              {company.about ? (
                company.about
                .split('\n')
                .filter((p) => p.trim().length > 0)
                .map((para, idx) => <p key={idx}>{para}</p>)
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  No detailed company overview has been published yet.
                </p>
              )}
            </div>
          </section>

          {/* Open Positions Section */}
          <section className="public-jobs-section">
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
              {companyJobs.length > 2 && (
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

            {/* Reused Unified JobVacancyCard Components */}
            {filteredJobs.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '48px 24px', textAlign: 'center' }}>
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
              <div className="public-vacancies-grid">
                {filteredJobs.map((job) => (
                  <JobVacancyCard
                    key={job.id}
                    job={job}
                    isBookmarked={bookmarkedIds.includes(job.id)}
                    onToggleBookmark={toggleBookmark}
                    showBookmark={true}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        {/* =========================================================
            RIGHT COLUMN (Approx. 1/3 Width): Single Consolidated Details Card
            ========================================================= */}
        <aside className="public-company-sidebar-col">
          <div className="public-sidebar-card">
            <div className="public-sidebar-header">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e6f9f2', color: '#00b074', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BuildingIcon />
              </div>
              <h3>Company Details & Links</h3>
            </div>

            {/* Consolidated Details List (Single Source of Truth) */}
            <div className="public-sidebar-details-list">
              {/* Headquarters Location */}
              <div className="public-sidebar-item">
                <div className="public-sidebar-icon">
                  <MapPinIcon />
                </div>
                <div className="public-sidebar-info">
                  <span className="public-sidebar-label">Headquarters</span>
                  <span className="public-sidebar-value">{primaryLocation}</span>
                </div>
              </div>

              {/* Industry */}
              {company.industry && (
                <div className="public-sidebar-item">
                  <div className="public-sidebar-icon">
                    <BuildingIcon />
                  </div>
                  <div className="public-sidebar-info">
                    <span className="public-sidebar-label">Industry</span>
                    <span className="public-sidebar-value">{company.industry}</span>
                  </div>
                </div>
              )}

              {/* Company Size */}
              {company.companySize && (
                <div className="public-sidebar-item">
                  <div className="public-sidebar-icon">
                    <UsersIcon />
                  </div>
                  <div className="public-sidebar-info">
                    <span className="public-sidebar-label">Company Size</span>
                    <span className="public-sidebar-value">{company.companySize}</span>
                  </div>
                </div>
              )}

              {/* Founded Year */}
              {company.foundedYear && (
                <div className="public-sidebar-item">
                  <div className="public-sidebar-icon">
                    <CalendarIcon />
                  </div>
                  <div className="public-sidebar-info">
                    <span className="public-sidebar-label">Founded</span>
                    <span className="public-sidebar-value">{company.foundedYear}</span>
                  </div>
                </div>
              )}

              {/* Official Website Link */}
              {websiteHref && (
                <div className="public-sidebar-item">
                  <div className="public-sidebar-icon">
                    <GlobeIcon />
                  </div>
                  <div className="public-sidebar-info">
                    <span className="public-sidebar-label">Official Website</span>
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-sidebar-link"
                    >
                      <span>{websiteDisplay}</span>
                      <ExternalLinkIcon />
                    </a>
                  </div>
                </div>
              )}

              {/* Official Email */}
              {company.contactEmail && (
                <div className="public-sidebar-item">
                  <div className="public-sidebar-icon">
                    <MailIcon />
                  </div>
                  <div className="public-sidebar-info">
                    <span className="public-sidebar-label">Official Email</span>
                    <a
                      href={`mailto:${company.contactEmail}`}
                      className="public-sidebar-link"
                    >
                      <span>{company.contactEmail}</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Phone Number */}
              {company.phone && (
                <div className="public-sidebar-item">
                  <div className="public-sidebar-icon">
                    <PhoneIcon />
                  </div>
                  <div className="public-sidebar-info">
                    <span className="public-sidebar-label">Phone Number</span>
                    <a
                      href={`tel:${company.phone}`}
                      className="public-sidebar-link"
                    >
                      <span>{company.phone}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Channels */}
            {(company.linkedinUrl || company.twitterUrl || company.githubUrl) && (
              <div style={{ paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
                <span className="public-sidebar-label" style={{ display: 'block', marginBottom: '10px' }}>
                  Social Channels
                </span>
                <div className="public-social-grid">
                  {company.linkedinUrl && (
                    <a
                      href={company.linkedinUrl.startsWith('http') ? company.linkedinUrl : `https://${company.linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-social-btn"
                    >
                      <div className="public-social-btn-inner">
                        <span style={{ color: '#0a66c2' }}><LinkedInIcon /></span>
                        <span>LinkedIn</span>
                      </div>
                      <ExternalLinkIcon />
                    </a>
                  )}

                  {company.twitterUrl && (
                    <a
                      href={company.twitterUrl.startsWith('http') ? company.twitterUrl : `https://${company.twitterUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-social-btn"
                    >
                      <div className="public-social-btn-inner">
                        <span style={{ color: '#0f172a' }}><TwitterIcon /></span>
                        <span>Twitter / X</span>
                      </div>
                      <ExternalLinkIcon />
                    </a>
                  )}

                  {company.githubUrl && (
                    <a
                      href={company.githubUrl.startsWith('http') ? company.githubUrl : `https://${company.githubUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-social-btn"
                    >
                      <div className="public-social-btn-inner">
                        <span style={{ color: '#24292f' }}><GitHubIcon /></span>
                        <span>GitHub</span>
                      </div>
                      <ExternalLinkIcon />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
