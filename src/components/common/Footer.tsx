import { Link } from 'react-router-dom'
import { SparkleIcon } from './Icons'

export const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand-col">
            <Link to="/" className="brand">
              <div className="logo-icon-wrap">
                <SparkleIcon />
              </div>
              <span className="brand-name">Skill Hub</span>
            </Link>
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
                  <Link to="/about" className="footer-link">
                    About Us
                  </Link>
                </li>
                <li><a href="#careers" className="footer-link">Careers</a></li>
                <li><a href="#privacy" className="footer-link">Privacy Policy</a></li>
                <li>
                  <Link to="/contact" className="footer-link">
                    Contact Support
                  </Link>
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
  )
}
