import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { candidateAuthApi } from '../services/api';
import {
  UserIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  BriefcaseIcon,
  SparkleIcon,
  CheckIcon,
  ArrowRightIcon,
} from '../components/common/Icons';

export const CandidateProfile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser, logout } = useAuth();

  const [headline, setHeadline] = useState(currentUser?.headline || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await candidateAuthApi.updateProfile({
        headline: headline.trim(),
        phone: phone.trim(),
        location: location.trim(),
      });
      updateUser(updated);
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update candidate profile:', err);
      setErrorMsg(err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/candidate-login');
  };

  const initials =
    (currentUser?.fullName || currentUser?.firstName || 'Candidate')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CA';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Top Header Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #00b074 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0, 176, 116, 0.25)',
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {currentUser?.fullName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Candidate Profile'}
                </h1>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: '#e6f9f2',
                    color: '#00b074',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <SparkleIcon />
                  <span>Job Seeker</span>
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                {currentUser?.headline || 'Ready for new engineering & technology opportunities'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary"
              style={{ padding: '9px 16px', fontSize: '13.5px' }}
            >
              {isEditing ? 'Cancel Editing' : 'Edit Profile'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid #fee2e2',
                background: '#fef2f2',
                color: '#dc2626',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="auth-alert-success" style={{ marginBottom: '20px' }}>
            <CheckIcon />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="auth-alert-error" style={{ marginBottom: '20px' }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Edit Profile Form Card */}
        {isEditing && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '28px',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Update Candidate Details
            </h2>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Professional Headline / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack Engineer • React / .NET Core"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="input-field-standard w-full"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field-standard w-full"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Colombo, Sri Lanka"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-field-standard w-full"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '13px' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2-Column Overview Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Column: Profile Summary & Job Search Hub */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                Personal & Contact Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <MailIcon />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Email Address</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{currentUser?.email}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <PhoneIcon />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Phone</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                      {currentUser?.phone || 'Not provided'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <MapPinIcon />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Location</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                      {currentUser?.location || 'Not provided'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <UserIcon />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Account Role</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                      {currentUser?.role || 'CANDIDATE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Card: Explore Vacancies */}
            <div
              style={{
                background: 'linear-gradient(135deg, #00b074 0%, #059669 100%)',
                color: '#ffffff',
                borderRadius: '20px',
                padding: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
                  Explore Active Job Openings
                </h3>
                <p style={{ fontSize: '13.5px', color: '#d1fae5', margin: 0, maxWidth: '420px' }}>
                  Discover verified software engineering, product, and leadership positions across enterprise employers.
                </p>
              </div>
              <Link
                to="/jobs"
                style={{
                  background: '#ffffff',
                  color: '#065f46',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Browse All Jobs</span>
                <ArrowRightIcon />
              </Link>
            </div>
          </div>

          {/* Right Column: Career Hub Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e6f9f2', color: '#00b074', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BriefcaseIcon />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Application Status
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Active Applications</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Saved Vacancies</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Interview Invitations</span>
                  <span style={{ fontWeight: 700, color: '#00b074' }}>0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
