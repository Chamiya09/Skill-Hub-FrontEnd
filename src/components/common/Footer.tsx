import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  SparkleIcon,
  ShieldCheckIcon,
  LinkedInIcon,
  TwitterIcon,
  GitHubIcon,
  DiscordIcon,
  CheckIcon,
} from './Icons'

export const Footer = () => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
    }
  }

  return (
    <footer className="footer-container">
      <div className="footer-inner">
        {/* Top Newsletter Card (Strict Light Theme) */}
        <div className="footer-newsletter-row">
          <div className="newsletter-text-box">
            <h3>Stay ahead with AI hiring benchmarks</h3>
            <p>Join 25,000+ tech leaders receiving our monthly engineering compensation & hiring reports.</p>
          </div>
          {subscribed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00b074', fontWeight: 600 }}>
              <CheckIcon />
              <span>You're subscribed! Check your inbox soon.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your work email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field-standard"
                style={{ background: '#ffffff', padding: '11px 16px' }}
              />
              <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                Subscribe
              </button>
            </form>
          )}
        </div>

        {/* 5-Column Navigation Grid */}
        <div className="footer-main-grid">
          {/* Column 1: Brand & Certification */}
          <div className="footer-brand-column">
            <Link to="/" className="footer-brand-title">
              <div className="logo-icon-wrap">
                <SparkleIcon />
              </div>
              <span className="footer-brand-name">Skill Hub</span>
            </Link>
            <p className="footer-brand-description">
              Next-generation AI recruitment infrastructure connecting top technical talent with industry-defining engineering teams.
            </p>
            <div className="footer-badge-soc2">
              <ShieldCheckIcon />
              <span>SOC-2 Type II Certified</span>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div className="footer-nav-column">
            <h4>Platform</h4>
            <ul className="footer-links-list">
              <li><Link to="/jobs" className="footer-link-item">AI Match Engine</Link></li>
              <li><Link to="/jobs" className="footer-link-item">Explore Roles</Link></li>
              <li><a href="#salary-insights" className="footer-link-item">Salary Benchmark</a></li>
              <li><a href="#enterprise" className="footer-link-item">Enterprise ATS</a></li>
              <li><a href="#talent-graph" className="footer-link-item">Talent Graph API</a></li>
            </ul>
          </div>

          {/* Column 3: Candidates */}
          <div className="footer-nav-column">
            <h4>For Talent</h4>
            <ul className="footer-links-list">
              <li><Link to="/jobs" className="footer-link-item">Find Jobs</Link></li>
              <li><a href="#profile-tailor" className="footer-link-item">Profile Intelligence</a></li>
              <li><a href="#skill-assessments" className="footer-link-item">Skill Assessments</a></li>
              <li><a href="#career-path" className="footer-link-item">Career Roadmap</a></li>
              <li><a href="#interview-prep" className="footer-link-item">AI Interview Prep</a></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="footer-nav-column">
            <h4>Company</h4>
            <ul className="footer-links-list">
              <li><Link to="/about" className="footer-link-item">About Us</Link></li>
              <li>
                <Link to="/jobs" className="footer-link-item">
                  Careers <span className="hiring-badge">HIRING</span>
                </Link>
              </li>
              <li><Link to="/contact" className="footer-link-item">Contact Support</Link></li>
              <li><a href="#security" className="footer-link-item">Trust & Security</a></li>
              <li><a href="#press" className="footer-link-item">News & Press</a></li>
            </ul>
          </div>

          {/* Column 5: Resources */}
          <div className="footer-nav-column">
            <h4>Resources</h4>
            <ul className="footer-links-list">
              <li><a href="#blog" className="footer-link-item">Engineering Blog</a></li>
              <li><a href="#ai-report" className="footer-link-item">2026 AI Report</a></li>
              <li><a href="#case-studies" className="footer-link-item">Customer Stories</a></li>
              <li><a href="#documentation" className="footer-link-item">API Docs</a></li>
              <li><a href="#help-center" className="footer-link-item">Help Center</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Socials */}
        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} Skill Hub Technologies Inc. All rights reserved.</p>
          
          <div className="footer-legal-group">
            <a href="#privacy" className="footer-legal-link">Privacy Policy</a>
            <span>•</span>
            <a href="#terms" className="footer-legal-link">Terms of Service</a>
            <span>•</span>
            <a href="#cookies" className="footer-legal-link">Cookie Settings</a>
          </div>

          <div className="footer-social-icons">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="LinkedIn">
              <LinkedInIcon />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Twitter">
              <TwitterIcon />
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="GitHub">
              <GitHubIcon />
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Discord">
              <DiscordIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
