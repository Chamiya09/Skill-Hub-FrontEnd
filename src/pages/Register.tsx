import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import {
  SparkleIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowRightIcon,
  BuildingIcon,
  UsersIcon,
} from '../components/common/Icons';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    industry: 'Software & Technology',
    website: '',
    adminFullName: '',
    adminEmail: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await authApi.register({
        companyName: formData.companyName.trim(),
        contactEmail: formData.contactEmail.trim(),
        industry: formData.industry,
        website: formData.website.trim(),
        adminFullName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim(),
        password: formData.password,
      });

      setSuccessMessage(`Company "${response.user.companyName}" successfully registered! Redirecting...`);
      setTimeout(() => {
        navigate('/users');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register company. Please verify the information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <div className="auth-card" style={{ maxWidth: '640px' }}>
        {/* Header Branding */}
        <div className="auth-header">
          <div className="badge-tag">
            <SparkleIcon />
            <span>ENTERPRISE ONBOARDING</span>
          </div>
          <h1 className="auth-title">Register Your Company</h1>
          <p className="auth-subtitle">
            Deploy Skill Hub's AI matching engine for your engineering recruitment pipeline.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-alert-error">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="auth-alert-success">
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Section 1: Company Profile */}
          <div className="form-section-header">
            <div className="section-icon-wrap">
              <BuildingIcon />
            </div>
            <div>
              <h3 className="section-title-sm">Company Information</h3>
              <p className="section-desc-sm">Details about your corporate organization.</p>
            </div>
          </div>

          <div className="form-field-row">
            <div className="form-group-item">
              <label htmlFor="regCompanyName">Company Name *</label>
              <input
                id="regCompanyName"
                type="text"
                required
                placeholder="e.g. Neuralabs AI"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="input-field-standard"
              />
            </div>
            <div className="form-group-item">
              <label htmlFor="regContactEmail">Company Contact Email *</label>
              <input
                id="regContactEmail"
                type="email"
                required
                placeholder="contact@company.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="input-field-standard"
              />
            </div>
          </div>

          <div className="form-field-row">
            <div className="form-group-item">
              <label htmlFor="regIndustry">Primary Industry</label>
              <select
                id="regIndustry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="input-field-standard"
                style={{ cursor: 'pointer' }}
              >
                <option value="Software & Technology">Software & Technology</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Fintech & Banking">Fintech & Banking</option>
                <option value="Healthcare & Biotech">Healthcare & Biotech</option>
                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
              </select>
            </div>
            <div className="form-group-item">
              <label htmlFor="regWebsite">Company Website</label>
              <input
                id="regWebsite"
                type="url"
                placeholder="https://company.ai"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="input-field-standard"
              />
            </div>
          </div>

          {/* Section 2: Primary HR Admin Account */}
          <div className="form-section-header" style={{ marginTop: '16px' }}>
            <div className="section-icon-wrap" style={{ background: '#e6f9f2', color: '#00b074' }}>
              <UsersIcon />
            </div>
            <div>
              <h3 className="section-title-sm">HR Administrator Account</h3>
              <p className="section-desc-sm">This account will be created with HR Admin privileges.</p>
            </div>
          </div>

          <div className="form-field-row">
            <div className="form-group-item">
              <label htmlFor="regAdminName">Admin Full Name *</label>
              <input
                id="regAdminName"
                type="text"
                required
                placeholder="e.g. Sarah Connor"
                value={formData.adminFullName}
                onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                className="input-field-standard"
              />
            </div>
            <div className="form-group-item">
              <label htmlFor="regAdminEmail">Admin Corporate Email *</label>
              <input
                id="regAdminEmail"
                type="email"
                required
                placeholder="sarah@company.com"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                className="input-field-standard"
              />
            </div>
          </div>

          <div className="form-group-item">
            <label htmlFor="regPassword">Account Password *</label>
            <input
              id="regPassword"
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters with mixed characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field-standard"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', marginTop: '12px' }}
          >
            {loading ? (
              <span>Provisioning Enterprise Account...</span>
            ) : (
              <>
                <span>Complete Company Registration</span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        {/* Card Footer */}
        <div className="auth-card-footer">
          <p>
            Already have a corporate account?{' '}
            <Link to="/login" className="auth-footer-link">
              Sign In Here
            </Link>
          </p>
          <div className="auth-security-badge">
            <ShieldCheckIcon />
            <span>Automatic HR Admin Provisioning • Zero Data Lock-In</span>
          </div>
        </div>
      </div>
    </div>
  );
};
