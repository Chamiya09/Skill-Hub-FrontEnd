import { Link } from 'react-router-dom'
import {
  SparkleIcon,
  LinkedInIcon,
  TwitterIcon,
  GitHubIcon,
  DiscordIcon,
} from './Icons'

export const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        {/* Main Compact Grid: Brand + 3 Targeted Columns */}
        <div className="footer-main-grid">
          {/* Brand Info & Tagline & Social Icons */}
          <div className="footer-brand-column">
            <Link to="/" className="footer-brand-title">
              <div className="logo-icon-wrap">
                <SparkleIcon />
              </div>
              <span className="footer-brand-name">Skill Hub</span>
            </Link>
            <p className="footer-brand-description">
              AI-powered talent matching & recruitment infrastructure for high-growth engineering teams.
            </p>
            <div className="footer-social-icons">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="Twitter"
              >
                <TwitterIcon />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="GitHub"
              >
                <GitHubIcon />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="Discord"
              >
                <DiscordIcon />
              </a>
            </div>
          </div>

          {/* Column 1: Company */}
          <div className="footer-nav-column">
            <h4>Company</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/about" className="footer-link-item">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="footer-link-item">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Product */}
          <div className="footer-nav-column">
            <h4>Product</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/jobs" className="footer-link-item">Find Jobs</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="footer-nav-column">
            <h4>Legal</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#privacy" className="footer-link-item">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms" className="footer-link-item">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Simple Bottom Copyright Bar */}
        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} Skill Hub Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

