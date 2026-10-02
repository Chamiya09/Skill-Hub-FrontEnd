import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi, authStorage } from '../../services/api';
import './AdminDashboard.css';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthData, currentUser, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in as Admin, redirect immediately
  React.useEffect(() => {
    if (!authLoading && currentUser && currentUser.role?.toLowerCase() === 'admin') {
      navigate('/skillhub-secure-admin/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="admin-login-viewport" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#00b074', fontWeight: 700, fontSize: 14 }}>
          Verifying security authorization...
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await adminApi.adminLogin({
        email: email.trim(),
        password: password,
      });

      // Synchronize through auth storage and context
      authStorage.setAuth(response);
      setAuthData(response.user, response.token);

      navigate('/skillhub-secure-admin/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@skillhub.internal');
    setPassword('SkillHub@Admin2026');
  };

  return (
    <div className="admin-login-viewport">
      {/* Background radial glow */}
      <div className="admin-login-glow-bg" />

      <div className="admin-login-card">
        {/* Top Header Badge */}
        <div className="admin-login-header">
          <div className="admin-login-icon-badge">
            <Shield size={28} color="#00b074" />
          </div>
          <div className="admin-login-security-tag">
            <Lock size={12} />
            <span>Restricted Gateway • Super Admin</span>
          </div>
          <h1 className="admin-login-title">Skill Hub Master Console</h1>
          <p className="admin-login-subtitle">
            Enterprise system monitoring, platform audit logs & global user governance.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="admin-login-alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label htmlFor="admin-email">Admin Identity / Email</label>
            <div className="admin-input-wrapper">
              <Mail size={16} className="admin-input-icon" />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                placeholder="admin@skillhub.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Master Security Key / Password</label>
            <div className="admin-input-wrapper">
              <KeyRound size={16} className="admin-input-icon" />
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="admin-login-submit-btn"
          >
            {isLoading ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Access Admin Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Helper for Evaluation / Testing */}
        <div className="admin-login-hint">
          <div className="admin-hint-header">
            <span>Development Master Credentials</span>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="admin-hint-fill-btn"
            >
              Auto-Fill
            </button>
          </div>
          <code>admin@skillhub.internal / SkillHub@Admin2026</code>
        </div>
      </div>
    </div>
  );
};
