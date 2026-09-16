import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SparkleIcon, ChevronDownIcon } from './Icons'

export const Header = () => {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/company-login')
  }

  const initials = currentUser?.companyName
    ? currentUser.companyName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CO'

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <div className="logo-icon-wrap">
          <SparkleIcon />
        </div>
        <span className="brand-name">Skill Hub</span>
      </Link>

      <nav className="nav-center-menu">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Home
        </NavLink>
        <NavLink
          to="/jobs"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Find Jobs
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          About Us
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Contact Us
        </NavLink>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        {currentUser ? (
          <div>
            <button
              className="user-profile-btn"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="avatar-circle" style={{ overflow: 'hidden', padding: 0 }}>
                {currentUser.logoUrl ? (
                  <img
                    src={currentUser.logoUrl}
                    alt={currentUser.companyName || 'Company'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                {!currentUser.logoUrl && initials}
              </div>
              <span className="user-name">{currentUser.companyName || currentUser.fullName}</span>
              <span className="chevron-icon">
                <ChevronDownIcon />
              </span>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '220px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {currentUser.role?.toLowerCase() === 'candidate'
                      ? currentUser.fullName || 'Candidate Portal'
                      : currentUser.companyName || currentUser.fullName || 'Corporate Portal'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {currentUser.email}
                  </div>
                </div>

                {currentUser.role?.toLowerCase() === 'candidate' ? (
                  <Link
                    to="/candidate/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      color: '#334155',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <SparkleIcon />
                    <span>My Digital CV</span>
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      color: '#334155',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <SparkleIcon />
                    <span>Employer Dashboard</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/candidate-login"
              style={{
                color: '#334155',
                background: 'transparent',
                border: 'none',
                padding: '8px 16px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              className="hover:text-emerald-600 hover:bg-slate-50 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/candidate-register"
              className="btn-primary"
              style={{
                padding: '8px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '10px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export const Navbar = Header;
