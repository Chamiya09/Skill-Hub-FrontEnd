import { useState } from 'react'
import {
  SparkleIcon,
  MailIcon,
  MapPinIcon,
  SendIcon,
  CheckIcon,
  BuildingIcon,
  ShieldCheckIcon,
} from '../components/common/Icons'

export const Contact = () => {
  const [roleType, setRoleType] = useState<'candidate' | 'employer' | 'partner'>('candidate')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
  }

  return (
    <div className="contact-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="badge-tag">
          <SparkleIcon />
          <span>DIRECT ENTERPRISE SUPPORT</span>
        </div>
        <h1 className="hero-heading">
          Let's start a <span className="ai-text">conversation</span>
        </h1>
        <p className="hero-subtext">
          Whether you're looking for your next career move, scaling your engineering organization, or integrating with our Talent Graph API—we're here to help.
        </p>
      </div>

      {/* Two-Column Bento Layout */}
      <div className="contact-layout-grid">
        {/* Left Column: Standardized Contact Form */}
        <div className="contact-form-container">
          {/* Standardized Role Selector Tabs */}
          <div style={{ marginBottom: '24px' }}>
            <div className="unified-tab-bar" style={{ width: '100%', display: 'flex' }}>
              <button
                type="button"
                className={`unified-tab-btn ${roleType === 'candidate' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setRoleType('candidate')}
              >
                Candidate / Talent
              </button>
              <button
                type="button"
                className={`unified-tab-btn ${roleType === 'employer' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setRoleType('employer')}
              >
                Employer / Recruiter
              </button>
              <button
                type="button"
                className={`unified-tab-btn ${roleType === 'partner' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setRoleType('partner')}
              >
                API & Partner
              </button>
            </div>
          </div>

          {formSubmitted ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#e6f9f2',
                  color: '#00b074',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <CheckIcon />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Message Dispatched!
              </h3>
              <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '440px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                Thank you for reaching out, <strong>{formData.name || 'there'}</strong>. Our {roleType === 'employer' ? 'Enterprise Talent' : 'Support'} team will respond within 2 hours.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ margin: '0 auto' }}
                onClick={() => {
                  setFormSubmitted(false)
                  setFormData({ name: '', email: '', company: '', subject: '', message: '' })
                }}
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-field-row">
                <div className="form-group-item">
                  <label htmlFor="fullName">Your Full Name *</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    className="input-field-standard"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label htmlFor="workEmail">Work / Personal Email *</label>
                  <input
                    id="workEmail"
                    type="email"
                    required
                    placeholder="alex@example.com"
                    className="input-field-standard"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {roleType !== 'candidate' && (
                <div className="form-group-item">
                  <label htmlFor="companyName">Company / Organization *</label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    placeholder="e.g. Vector Compute Inc."
                    className="input-field-standard"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group-item">
                <label htmlFor="inquirySubject">Subject *</label>
                <input
                  id="inquirySubject"
                  type="text"
                  required
                  placeholder={
                    roleType === 'candidate'
                      ? 'e.g. Question regarding profile AI verification'
                      : roleType === 'employer'
                      ? 'e.g. Hiring 5+ Senior ML Engineers'
                      : 'e.g. Integrating Skill Hub ATS with Greenhouse'
                  }
                  className="input-field-standard"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="form-group-item">
                <label htmlFor="messageText">Detailed Message *</label>
                <textarea
                  id="messageText"
                  required
                  rows={4}
                  placeholder="Tell us about your requirements, questions, or goals..."
                  className="input-field-standard"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '14px', borderRadius: '12px' }}
              >
                <span>Send Message</span>
                <SendIcon />
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '16px',
                  color: '#94a3b8',
                  fontSize: '12.5px',
                }}
              >
                <ShieldCheckIcon />
                <span>Enterprise grade encryption. We never sell your contact information.</span>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Direct Channels & Status */}
        <div className="contact-sidebar-column">
          {/* Candidate Support Channel */}
          <div className="contact-channel-card">
            <div className="contact-icon-wrapper">
              <MailIcon />
            </div>
            <div>
              <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Candidate & Talent Support
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', marginBottom: '8px' }}>
                Need help with job applications, skill assessments, or account settings?
              </p>
              <a
                href="mailto:support@skillhub.com"
                style={{ color: '#00b074', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
              >
                support@skillhub.com ↗
              </a>
            </div>
          </div>

          {/* Enterprise Hiring Team Channel */}
          <div className="contact-channel-card">
            <div className="contact-icon-wrapper" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <BuildingIcon />
            </div>
            <div>
              <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Enterprise ATS & Hiring Sales
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', marginBottom: '8px' }}>
                Book an interactive demo or inquire about high-volume hiring tier plans.
              </p>
              <a
                href="mailto:sales@skillhub.com"
                style={{ color: '#4338ca', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
              >
                sales@skillhub.com ↗
              </a>
            </div>
          </div>

          {/* Global Headquarters */}
          <div className="contact-channel-card">
            <div className="contact-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}>
              <MapPinIcon />
            </div>
            <div>
              <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Global Headquarters
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>
                500 Howard Street, Suite 400<br />
                San Francisco, CA 94105<br />
                United States
              </p>
            </div>
          </div>

          {/* Live System Uptime Card */}
          <div className="status-pulse-card">
            <div className="pulse-dot" />
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                All Systems Operational
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Talent Graph API & Match Engine: 99.99% SLA
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
