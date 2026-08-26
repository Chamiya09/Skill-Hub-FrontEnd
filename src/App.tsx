import { useState, type ChangeEvent, type FormEvent } from 'react'
import './App.css'

// Sparkle icon for AI badge
const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
)

// Search icon
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

// Check icon
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Target / Bullseye icon
const TargetIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

// Lightning icon
const LightningIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

// Trend Up icon
const TrendUpIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
)

// Location Pin icon
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

// Clock / Remote icon
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 14 14" />
  </svg>
)

// Chevron Down
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// Arrow Right
const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

// Kanban Board icon
const KanbanIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="18" rx="1" />
    <rect x="10" y="3" width="5" height="12" rx="1" />
    <rect x="17" y="3" width="5" height="15" rx="1" />
  </svg>
)

// Smart Leaderboard / Trophy icon
const TrophyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

// Mail / Email icon
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

// Phone icon
const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

// Send icon
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)


interface Job {
  id: string
  company: string
  companyShort: string
  postedTime: string
  matchPercent: number
  isMultilineMatch?: boolean
  title: string
  location: string
  workType: string
  salary: string
}

const jobOpportunities: Job[] = [
  {
    id: '1',
    company: 'Neuralabs AI',
    companyShort: 'NL',
    postedTime: '2d ago',
    matchPercent: 96,
    title: 'Senior Frontend Engineer',
    location: 'San Francisco, CA',
    workType: 'Remote',
    salary: '$160k - $210k',
  },
  {
    id: '2',
    company: 'Vector Compute',
    companyShort: 'VC',
    postedTime: '1d ago',
    matchPercent: 92,
    isMultilineMatch: true,
    title: 'ML Platform Engineer',
    location: 'New York, NY',
    workType: 'Hybrid',
    salary: '$180k - $230k',
  },
  {
    id: '3',
    company: 'Flowstate',
    companyShort: 'FS',
    postedTime: '4d ago',
    matchPercent: 88,
    title: 'Product Designer, AI Tools',
    location: 'Remote',
    workType: 'Remote',
    salary: '$140k - $175k',
  },
]

// Users and team data
interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  avatar: string
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sunil Perera',
    role: 'Chief Executive Officer',
    bio: '15+ years of enterprise SaaS leadership scaling corporate HRtech and recruitment platforms globally.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '2',
    name: 'Kamal Silva',
    role: 'Tech Lead & Architect',
    bio: 'Pioneering distributed cloud systems, real-time hiring pipelines, and robust enterprise ATS architectures.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '3',
    name: 'Nimal Fernando',
    role: 'AI & ML Engineer',
    bio: 'Specialist in deep neural candidate matching, automated resume vectorization, and zero-bias ranking algorithms.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '4',
    name: 'Chamod Ekanayaka',
    role: 'Full Stack & Product Engineer',
    bio: 'Crafting high-velocity hiring workflows, intuitive recruiter Kanban boards, and seamless candidate UI/UX.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
  },
]

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'contact'>('contact')
  const [searchQuery, setSearchQuery] = useState('')

  // Contact form state
  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    companyName: '',
    message: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitContact = (e: FormEvent) => {
    e.preventDefault()
    if (formData.fullName && formData.workEmail && formData.message) {
      setFormSubmitted(true)
      setTimeout(() => {
        setFormData({ fullName: '', workEmail: '', companyName: '', message: '' })
      }, 500)
    }
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Navigation Bar */}
        <header className="navbar">
          <div className="brand" onClick={() => setCurrentPage('home')}>
            <div className="logo-icon-wrap">
              <SparkleIcon />
            </div>
            <span className="brand-name">Skill Hub</span>
          </div>

          <nav className="nav-center-menu">
            <button
              type="button"
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              Home
            </button>
            <a href="#find-jobs" className="nav-link">Find Jobs</a>
            <button
              type="button"
              className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
              onClick={() => setCurrentPage('about')}
            >
              About Us
            </button>
            <button
              type="button"
              className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`}
              onClick={() => setCurrentPage('contact')}
            >
              Contact Us
            </button>
          </nav>

          <button className="user-profile-btn" type="button">
            <div className="avatar-circle">RJ</div>
            <span className="user-name">Riya J.</span>
            <span className="chevron-icon">
              <ChevronDownIcon />
            </span>
          </button>
        </header>

        {/* ================= CONTACT US PAGE VIEW ================= */}
        {currentPage === 'contact' && (
          <>
            {/* Contact Page Hero Header */}
            <section className="contact-hero-section">
              <div className="badge-tag">
                <SparkleIcon />
                <span>ENTERPRISE ATS INQUIRIES</span>
              </div>

              <h1 className="contact-hero-heading">
                Contact Our <span className="ai-text">Sales & Solutions Team</span>
              </h1>

              <p className="contact-hero-subtext">
                Ready to automate your talent pipeline with AI precision? Speak with our enterprise recruitment specialists or request an ATS workflow consultation.
              </p>
            </section>

            {/* Main Contact Grid: Form + Info Cards */}
            <div className="contact-content-grid">
              {/* Modern Contact Form */}
              <div className="contact-form-card">
                <h2 className="contact-form-title">Send us a Message</h2>
                <p className="contact-form-subtitle">
                  Fill out the form below and our team will get back to you within 24 business hours.
                </p>

                {formSubmitted && (
                  <div className="form-success-banner">
                    <CheckIcon />
                    <span>Thank you! Your message has been sent successfully. Our team will reach out shortly.</span>
                  </div>
                )}

                <form className="contact-form" onSubmit={handleSubmitContact}>
                  <div className="form-row-double">
                    <div className="form-group">
                      <label className="form-label" htmlFor="fullName">Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        required
                        className="form-input"
                        placeholder="Sarah Jenkins"
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="workEmail">Work Email *</label>
                      <input
                        type="email"
                        id="workEmail"
                        name="workEmail"
                        required
                        className="form-input"
                        placeholder="s.jenkins@enterprise.com"
                        value={formData.workEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="companyName">Company Name</label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      className="form-input"
                      placeholder="e.g. Acme Corporation"
                      value={formData.companyName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      className="form-textarea"
                      placeholder="Tell us about your corporate hiring needs, ATS integration questions, or desired demo date..."
                      value={formData.message}
                      onChange={handleInputChange}
                    />
                  </div>

                  <button type="submit" className="submit-btn">
                    <span>Send Message</span>
                    <SendIcon />
                  </button>
                </form>
              </div>

              {/* Side Contact Information Cards */}
              <div className="contact-info-column">
                <div className="contact-info-card">
                  <h3 className="info-card-title">Corporate Information</h3>

                  <div className="info-items-list">
                    <div className="info-item">
                      <div className="info-icon-box">
                        <MailIcon />
                      </div>
                      <div className="info-details">
                        <span className="info-label">Email Support</span>
                        <a href="mailto:support@skillhub.com" className="info-value">support@skillhub.com</a>
                      </div>
                    </div>

                    <div className="info-item">
                      <div className="info-icon-box">
                        <PhoneIcon />
                      </div>
                      <div className="info-details">
                        <span className="info-label">Corporate Line</span>
                        <a href="tel:+18005550199" className="info-value">+1 (800) 555-0199</a>
                      </div>
                    </div>

                    <div className="info-item">
                      <div className="info-icon-box">
                        <MapPinIcon />
                      </div>
                      <div className="info-details">
                        <span className="info-label">Headquarters</span>
                        <span className="info-value">100 Montgomery St, Suite 1800<br />San Francisco, CA 94104</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corporate SLA Card */}
                <div className="support-hours-card">
                  <h4 className="support-hours-title">Enterprise SLA Support</h4>
                  <p className="support-hours-desc">
                    Dedicated account managers and 24/7 priority support available for all enterprise corporate tiers.
                  </p>
                  <div className="support-hours-badge">
                    <SparkleIcon />
                    <span>Avg Response Time: &lt; 15 mins</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= ABOUT US PAGE VIEW ================= */}
        {currentPage === 'about' && (
          <>
            {/* About Us Hero Section */}
            <section className="about-hero-section">
              <div className="badge-tag">
                <SparkleIcon />
                <span>B2B AI-DRIVEN CORPORATE ATS</span>
              </div>

              <h1 className="about-hero-heading">
                The Future of Talent Acquisition with <span className="ai-text">Automated AI Workflows</span>
              </h1>

              <p className="about-hero-subtext">
                Skill Hub is an enterprise-grade, B2B AI-driven corporate Applicant Tracking System built to eliminate recruiting bottlenecks, automate screening workflows, and empower hiring teams with data-backed talent decisions.
              </p>
            </section>

            {/* The 'Why Skill Hub' Section */}
            <section className="mission-section">
              <div className="mission-card">
                <div className="mission-header">
                  <div className="section-tag">
                    <SparkleIcon />
                    <span>WHY SKILL HUB</span>
                  </div>
                  <h2 className="mission-title">Built to Supercharge Corporate Hiring</h2>
                </div>

                <p className="mission-lead-text">
                  Skill Hub reimagines the corporate recruitment lifecycle by combining autonomous intelligence with human-centered hiring workflows. Say goodbye to manual resume parsing and lost applications—Skill Hub accelerates time-to-hire by 70% while improving candidate quality.
                </p>

                <div className="mission-highlights-grid">
                  <div className="highlight-item">
                    <div className="highlight-icon-box">
                      <TargetIcon />
                    </div>
                    <h3 className="highlight-title">AI Profile Screener</h3>
                    <p className="highlight-description">
                      Instantly parses and evaluates incoming resumes against role requirements, extracting verified hard skills and experience benchmarks.
                    </p>
                  </div>

                  <div className="highlight-item">
                    <div className="highlight-icon-box">
                      <TrophyIcon />
                    </div>
                    <h3 className="highlight-title">Smart Candidate Leaderboard</h3>
                    <p className="highlight-description">
                      Automatically scores and ranks applicants in real-time, giving recruiters an instant priority list of the highest-match talent.
                    </p>
                  </div>

                  <div className="highlight-item">
                    <div className="highlight-icon-box">
                      <KanbanIcon />
                    </div>
                    <h3 className="highlight-title">Efficient Kanban Pipeline</h3>
                    <p className="highlight-description">
                      An intuitive, drag-and-drop collaborative stage pipeline that keeps hiring managers, recruiters, and interviewers aligned.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Team Section */}
            <section className="team-section">
              <div className="team-header">
                <div className="section-tag">
                  <SparkleIcon />
                  <span>OUR TEAM</span>
                </div>
                <h2 className="team-title">Meet the Team Behind Skill Hub</h2>
                <p className="team-subtitle">
                  Our engineering and leadership team is dedicated to building the most intelligent recruitment platform for modern enterprises.
                </p>
              </div>

              <div className="team-grid">
                {teamMembers.map((member) => (
                  <div className="team-card" key={member.id}>
                    <div className="team-avatar-wrap">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="team-avatar-img"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="team-name">{member.name}</h3>
                    <span className="team-role">{member.role}</span>
                    <p className="team-bio">{member.bio}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ================= HOME PAGE VIEW ================= */}
        {currentPage === 'home' && (
          <>
            {/* Hero Section */}
            <section className="hero-section">
              <div className="badge-tag">
                <SparkleIcon />
                <span>AI-POWERED RECRUITMENT PLATFORM</span>
              </div>

              <h1 className="hero-heading">
                Find your next role with <span className="ai-text">AI precision</span>
              </h1>

              <p className="hero-subtext">
                Skill Hub matches you to the best AI and tech roles based on your skills,
                experience, and career goals. Smart matching, real-time updates, and a
                seamless application experience.
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
                  Our engine analyzes your profile against every role and surfaces only
                  the best fits.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-box">
                  <LightningIcon />
                </div>
                <h3 className="feature-title">Instant Applications</h3>
                <p className="feature-description">
                  Apply with one click. Your profile is automatically tailored for each
                  submission.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-box">
                  <TrendUpIcon />
                </div>
                <h3 className="feature-title">Real-time Tracking</h3>
                <p className="feature-description">
                  Track every application from submission to interview in one unified
                  dashboard.
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
          </>
        )}
      </div>

      {/* Footer Section */}
      <footer className="footer-container">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="brand" onClick={() => setCurrentPage('home')}>
                <div className="logo-icon-wrap">
                  <SparkleIcon />
                </div>
                <span className="brand-name">Skill Hub</span>
              </div>
              <p className="footer-tagline">
                AI-powered recruitment platform connecting top talent with next-generation AI and tech roles.
              </p>
            </div>

            <div className="footer-links-grid">
              <div className="footer-column">
                <h4 className="footer-column-title">Platform</h4>
                <ul className="footer-list">
                  <li><a href="#find-jobs" className="footer-link">Find Jobs</a></li>
                  <li><a href="#browse-companies" className="footer-link">Browse Companies</a></li>
                  <li><a href="#salary-calculator" className="footer-link">Salary Calculator</a></li>
                  <li><a href="#ai-matching" className="footer-link">AI Match Engine</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4 className="footer-column-title">Candidates</h4>
                <ul className="footer-list">
                  <li><a href="#resume-builder" className="footer-link">Profile Tailoring</a></li>
                  <li><a href="#job-alerts" className="footer-link">Job Alerts</a></li>
                  <li><a href="#career-guidance" className="footer-link">Career Insights</a></li>
                  <li><a href="#applications" className="footer-link">Application Tracker</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4 className="footer-column-title">Company</h4>
                <ul className="footer-list">
                  <li>
                    <button
                      type="button"
                      className="footer-link-btn"
                      onClick={() => setCurrentPage('about')}
                    >
                      About Us
                    </button>
                  </li>
                  <li><a href="#careers" className="footer-link">Careers</a></li>
                  <li><a href="#privacy" className="footer-link">Privacy Policy</a></li>
                  <li>
                    <button
                      type="button"
                      className="footer-link-btn"
                      onClick={() => setCurrentPage('contact')}
                    >
                      Contact Support
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} Skill Hub Inc. All rights reserved.
            </p>
            <div className="footer-legal-links">
              <a href="#privacy" className="footer-legal-link">Privacy Policy</a>
              <span className="legal-dot">•</span>
              <a href="#terms" className="footer-legal-link">Terms of Service</a>
              <span className="legal-dot">•</span>
              <a href="#cookies" className="footer-legal-link">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

