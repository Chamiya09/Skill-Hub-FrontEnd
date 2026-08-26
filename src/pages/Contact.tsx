import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  SparkleIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  SendIcon,
} from '../components/common/Icons'

export const Contact = () => {
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
  )
}
