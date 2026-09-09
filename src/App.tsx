import { useState } from "react";
import "./App.css";

// Sparkle icon for AI badge
const SparkleIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

// Search icon
const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

// Check icon
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Target / Bullseye icon
const TargetIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Lightning icon
const LightningIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// Trend Up icon
const TrendUpIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

// Location Pin icon
const MapPinIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Clock / Remote icon
const ClockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 14 14" />
  </svg>
);

// Chevron Down
const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Arrow Right
const ArrowRightIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Bolt logo icon
const BoltLogoIcon = () => (
  <svg width="14" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

interface Job {
  id: string;
  company: string;
  companyShort: string;
  postedTime: string;
  matchPercent: number;
  isMultilineMatch?: boolean;
  title: string;
  location: string;
  workType: string;
  salary: string;
}

const jobOpportunities: Job[] = [
  {
    id: "1",
    company: "Neuralabs AI",
    companyShort: "NL",
    postedTime: "2d ago",
    matchPercent: 96,
    title: "Senior Frontend Engineer",
    location: "San Francisco, CA",
    workType: "Remote",
    salary: "$160k - $210k",
  },
  {
    id: "2",
    company: "Vector Compute",
    companyShort: "VC",
    postedTime: "1d ago",
    matchPercent: 92,
    isMultilineMatch: true,
    title: "ML Platform Engineer",
    location: "New York, NY",
    workType: "Hybrid",
    salary: "$180k - $230k",
  },
  {
    id: "3",
    company: "Flowstate",
    companyShort: "FS",
    postedTime: "4d ago",
    matchPercent: 88,
    title: "Product Designer, AI Tools",
    location: "Remote",
    workType: "Remote",
    salary: "$140k - $175k",
  },
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Navigation Bar */}
        <header className="navbar">
          <div className="brand">
            <div className="logo-icon-wrap">
              <SparkleIcon />
            </div>
            <span className="brand-name">Koda</span>
          </div>

          <nav className="nav-center-menu">
            <a href="#home" className="nav-link active">
              Home
            </a>
            <a href="#find-jobs" className="nav-link">
              Find Jobs
            </a>
            <a href="#about" className="nav-link">
              About Us
            </a>
            <a href="#contact" className="nav-link">
              Contact Us
            </a>
          </nav>

          <button className="user-profile-btn" type="button">
            <div className="avatar-circle">RJ</div>
            <span className="user-name">Riya J.</span>
            <span className="chevron-icon">
              <ChevronDownIcon />
            </span>
          </button>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="badge-tag">
            <SparkleIcon />
            <span>AI-POWERED RECRUITMENT PLATFORM</span>
          </div>

          <h1 className="hero-heading">
            Find your next role with{" "}
            <span className="ai-text">AI precision</span>
          </h1>

          <p className="hero-subtext">
            Koda matches you to the best AI and tech roles based on your skills,
            experience, and career goals. Smart matching, real-time updates, and
            a seamless application experience.
          </p>

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-input-wrap">
              <span className="search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search for jobs, companies, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="search-button" type="button">
              Search
              <ArrowRightIcon />
            </button>
          </div>

          {/* Metric Highlights */}
          <div className="metrics-row">
            <div className="metric-item">
              <CheckIcon />
              <span>2,840+ active roles</span>
            </div>
            <div className="metric-item">
              <CheckIcon />
              <span>AI-powered matching</span>
            </div>
            <div className="metric-item">
              <CheckIcon />
              <span>Free for candidates</span>
            </div>
          </div>
        </section>

        {/* Feature Value Proposition Cards */}
        <section className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <TargetIcon />
            </div>
            <h3 className="feature-title">AI Match Scoring</h3>
            <p className="feature-description">
              Our engine analyzes your profile against every role and surfaces
              only the best fits.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <LightningIcon />
            </div>
            <h3 className="feature-title">Instant Applications</h3>
            <p className="feature-description">
              Apply with one click. Your profile is automatically tailored for
              each submission.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <TrendUpIcon />
            </div>
            <h3 className="feature-title">Real-time Tracking</h3>
            <p className="feature-description">
              Track every application from submission to interview in one
              unified dashboard.
            </p>
          </div>
        </section>

        {/* Featured Roles Section */}
        <section className="featured-section">
          <div className="section-header">
            <div className="section-header-left">
              <div className="section-tag">
                <SparkleIcon />
                <span>FEATURED ROLES</span>
              </div>
              <h2 className="section-title">Top AI-matched opportunities</h2>
            </div>
            <a href="#all-jobs" className="view-all-link">
              View all jobs
              <ArrowRightIcon />
            </a>
          </div>

          {/* Job Cards */}
          <div className="jobs-grid">
            {jobOpportunities.map((job) => (
              <div className="job-card" key={job.id}>
                <div className="job-card-header">
                  <div className="company-info">
                    <div className="company-logo">{job.companyShort}</div>
                    <div className="company-details">
                      <span className="company-name">{job.company}</span>
                      <span className="post-time">{job.postedTime}</span>
                    </div>
                  </div>

                  {job.isMultilineMatch ? (
                    <div className="match-badge multiline">
                      <SparkleIcon />
                      <div className="match-badge-text-stack">
                        <span>{job.matchPercent}% AI</span>
                        <span>Match</span>
                      </div>
                    </div>
                  ) : (
                    <div className="match-badge">
                      <SparkleIcon />
                      <span>{job.matchPercent}% AI Match</span>
                    </div>
                  )}
                </div>

                <h3 className="job-title">{job.title}</h3>

                <div className="job-meta-row">
                  <div className="meta-item">
                    <MapPinIcon />
                    <span>{job.location}</span>
                  </div>
                  <div className="meta-item">
                    <ClockIcon />
                    <span>{job.workType}</span>
                  </div>
                </div>

                <div className="job-card-footer">
                  <span className="salary">{job.salary}</span>
                  <button className="view-details-btn" type="button">
                    View Details
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Made in Bolt badge */}
      <div className="bolt-floating-badge">
        <BoltLogoIcon />
        <span>Made in Bolt</span>
      </div>
    </div>
  );
}
