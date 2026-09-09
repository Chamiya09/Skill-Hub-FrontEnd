import { Link } from 'react-router-dom'
import {
  SparkleIcon,
  TargetIcon,
  LightningIcon,
  TrendUpIcon,
  ArrowRightIcon,
  LinkedInIcon,
  TwitterIcon,
  ShieldCheckIcon,
  CheckIcon,
} from '../components/common/Icons'

interface TeamMember {
  name: string
  role: string
  initials: string
  bg: string
  bio: string
  linkedin: string
  twitter: string
}

const teamMembers: TeamMember[] = [
  {
    name: 'Sarah Chen',
    role: 'Co-Founder & CEO',
    initials: 'SC',
    bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    bio: 'Ex-Google AI Director. 12+ years pioneering large-scale recruitment infrastructure and semantic search.',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'Marcus Vance',
    role: 'Co-Founder & CTO',
    initials: 'MV',
    bg: 'linear-gradient(135deg, #e6f9f2 0%, #bbf7d0 100%)',
    bio: 'Former Staff Engineer at Stripe. Specialized in distributed talent graph matching and AI validation pipelines.',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'Elena Rostova',
    role: 'VP of AI Research',
    initials: 'ER',
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    bio: 'PhD from Stanford AI Lab. Published 15+ papers on bias-free algorithmic evaluation and talent ranking models.',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'David Kalu',
    role: 'Head of Product Design',
    initials: 'DK',
    bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    bio: 'Former Design Lead at Linear and Figma. Dedicated to crafting fluid, responsive, frictionless ATS workflows.',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
]

export const About = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="badge-tag">
          <SparkleIcon />
          <span>OUR MISSION & STORY</span>
        </div>
        <h1 className="hero-heading">
          Empowering the next generation of <br />
          <span className="ai-text">intelligent recruitment</span>
        </h1>
        <p className="hero-subtext">
          Skill Hub was built to eliminate the noise from technical hiring. We use real-time skill parsing and machine learning to build transparent, bias-free matches between top engineers and pioneering companies.
        </p>
      </div>

      {/* Metrics Counter Section */}
      <div className="about-stats-grid">
        <div className="stat-card">
          <div className="stat-number">99.4%</div>
          <div className="stat-label">AI Match Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">45k+</div>
          <div className="stat-label">Engineers Placed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">1,200+</div>
          <div className="stat-label">Enterprise Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">4.2x</div>
          <div className="stat-label">Faster Time to Hire</div>
        </div>
      </div>

      {/* Bento Story & Vision (Strict Light Theme) */}
      <div className="bento-section">
        {/* Clean Light Bento Vision Card */}
        <div className="bento-card highlight-bento">
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#e6f9f2',
                color: '#009e67',
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '20px',
              }}
            >
              <SparkleIcon />
              <span>THE VISION</span>
            </div>
            <h2 className="bento-title">A frictionless talent economy driven by deep competence</h2>
            <p className="bento-text">
              Traditional job boards are flooded with uncurated noise and keyword-stuffed resumes. Skill Hub replaces keyword matching with semantic vector graphs that accurately understand code, system complexity, and engineer potential.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569', fontWeight: 500 }}>
              <div style={{ color: '#00b074' }}><CheckIcon /></div>
              <span>Bias-Free Algorithms</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569', fontWeight: 500 }}>
              <div style={{ color: '#00b074' }}><CheckIcon /></div>
              <span>Verified Salary Ranges</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#475569', fontWeight: 500 }}>
              <div style={{ color: '#00b074' }}><CheckIcon /></div>
              <span>Direct Team Access</span>
            </div>
          </div>
        </div>

        {/* Story Bento Card */}
        <div className="bento-card">
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '20px',
              }}
            >
              <ShieldCheckIcon />
              <span>OUR ORIGIN</span>
            </div>
            <h2 className="bento-title">Built by engineers who experienced the broken hiring loop</h2>
            <p className="bento-text">
              We started Skill Hub in 2024 after watching brilliant engineers get overlooked by antiquated ATS filters while top engineering leaders spent months sifting through unqualified applicants.
            </p>
          </div>
          <div
            style={{
              padding: '16px 20px',
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              fontSize: '13.5px',
              color: '#475569',
              fontStyle: 'italic',
            }}
          >
            "Skill Hub shortened our staff engineer hiring cycles from 65 days to just 11 days with zero recruiter spam." — VP of Eng, Vector Compute
          </div>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="values-section">
        <div className="section-centered-header">
          <div className="section-tag">
            <SparkleIcon />
            <span>OUR CORE PILLARS</span>
          </div>
          <h2 className="section-title">The principles behind everything we build</h2>
        </div>

        <div className="values-grid">
          <div className="value-card">
            <div className="feature-icon-box">
              <TargetIcon />
            </div>
            <h3 className="feature-title">Precision First</h3>
            <p className="feature-description">
              We never broadcast your profile blindly. Matches are computed based on multidimensional skill graphs and cultural alignment metrics.
            </p>
          </div>

          <div className="value-card">
            <div className="feature-icon-box">
              <LightningIcon />
            </div>
            <h3 className="feature-title">Instant Applications</h3>
            <p className="feature-description">
              One-click submissions with standardized, verified profile tokens. Say goodbye to re-entering your work history 50 times.
            </p>
          </div>

          <div className="value-card">
            <div className="feature-icon-box">
              <TrendUpIcon />
            </div>
            <h3 className="feature-title">Radical Transparency</h3>
            <p className="feature-description">
              Every job posting features verified salary bands, equity packages, and direct tech stack breakdowns before you apply.
            </p>
          </div>
        </div>
      </div>

      {/* Leadership Team Grid */}
      <div style={{ marginBottom: '64px' }}>
        <div className="section-centered-header">
          <div className="section-tag">
            <SparkleIcon />
            <span>LEADERSHIP</span>
          </div>
          <h2 className="section-title">Meet the team revolutionizing tech hiring</h2>
        </div>

        <div className="team-grid">
          {teamMembers.map((member) => (
            <div key={member.name} className="team-card">
              <div className="team-avatar-box" style={{ background: member.bg }}>
                {member.initials}
              </div>
              <h3 className="team-name">{member.name}</h3>
              <div className="team-role">{member.role}</div>
              <p className="team-bio">{member.bio}</p>
              <div className="team-social-links">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="team-social-icon"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href={member.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="team-social-icon"
                  aria-label="Twitter"
                >
                  <TwitterIcon />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strict Light Theme Call to Action Banner */}
      <div className="cta-banner-card">
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Ready to find your next breakthrough role?
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '520px' }}>
            Join top developers, designers, and AI engineers advancing their careers with Skill Hub.
          </p>
        </div>
        <div className="cta-actions">
          <Link to="/jobs" className="btn-primary">
            <span>Explore Jobs</span>
            <ArrowRightIcon />
          </Link>
          <Link to="/contact" className="btn-secondary">
            Contact Team
          </Link>
        </div>
      </div>
    </div>
  )
}
