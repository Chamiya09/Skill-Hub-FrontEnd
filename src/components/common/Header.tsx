import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SparkleIcon, ChevronDownIcon } from './Icons'

export interface DashboardConfig {
  label: string
  route: string
}

/**
 * Returns dynamic Dashboard label and destination route based on the authenticated user's role.
 * Mapping logic:
 * - Admin     -> "Admin Dashboard"    -> /skillhub-secure-admin/dashboard (with /admin alias)
 * - Company   -> "Employer Dashboard" -> /company/dashboard (with /dashboard alias)
 * - Candidate -> "My Dashboard"       -> /candidate/dashboard
 */
export const getDashboardConfig = (role?: string): DashboardConfig => {
  const normalizedRole = role?.trim().toLowerCase()

  switch (normalizedRole) {
    case 'admin':
    case 'super_admin':
      return {
        label: 'Admin Dashboard',
        route: '/skillhub-secure-admin/dashboard',
      }
    case 'company':
    case 'employer':
    case 'hr_admin':
    case 'recruiter':
    case 'hiring_manager':
      return {
        label: 'Employer Dashboard',
        route: '/company/dashboard',
      }
    case 'candidate':
      return {
        label: 'My Dashboard',
        route: '/candidate/dashboard',
      }
    default:
      return {
        label: 'My Dashboard',
        route: '/candidate/dashboard',
      }
  }
}

export const Header = () => {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [dropdownOpen])

  const userRole = currentUser?.role?.trim().toLowerCase()
  const dashboardConfig = getDashboardConfig(currentUser?.role)

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    if (userRole === 'admin' || userRole === 'super_admin') {
      navigate('/skillhub-secure-admin')
    } else if (userRole === 'candidate') {
      navigate('/candidate-login')
    } else {
      navigate('/login')
    }
  }

  const displayName =
    userRole === 'admin' || userRole === 'super_admin'
      ? currentUser?.fullName || 'Super Administrator'
      : currentUser?.companyName || currentUser?.fullName || 'User'

  const headerTitle =
    userRole === 'candidate'
      ? currentUser?.fullName || 'Candidate Portal'
      : userRole === 'admin' || userRole === 'super_admin'
      ? currentUser?.fullName || 'Super Administrator'
      : currentUser?.companyName || currentUser?.fullName || 'Corporate Portal'

  const initials =
    userRole === 'admin' || userRole === 'super_admin'
      ? (currentUser?.fullName || 'Super Administrator')
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : currentUser?.companyName
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
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="user-profile-btn"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="avatar-circle" style={{ overflow: 'hidden', padding: 0 }}>
                {currentUser.logoUrl ? (
                  <img
                    src={currentUser.logoUrl}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      ;(e.currentTarget as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : null}
                {!currentUser.logoUrl && initials}
              </div>
              <span className="user-name">{displayName}</span>
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
                    {headerTitle}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {currentUser.email}
                  </div>
                </div>

                {/* Dynamically Rendered Role-Based Dashboard Link */}
                <Link
                  to={dashboardConfig.route}
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
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <SparkleIcon />
                  <span>{dashboardConfig.label}</span>
                </Link>

                {/* Additional candidate direct link to CV profile */}
                {userRole === 'candidate' && (
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
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <SparkleIcon />
                    <span>My Digital CV</span>
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
