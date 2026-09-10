import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { authStorage, type UserDto } from '../../services/api'
import { SparkleIcon, ChevronDownIcon, UsersIcon } from './Icons'

export const Header = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    // Check local storage for authenticated user
    const user = authStorage.getUser()
    setCurrentUser(user)
  }, [])

  const handleLogout = () => {
    authStorage.clearAuth()
    setCurrentUser(null)
    setDropdownOpen(false)
    navigate('/company-login')
  }

  const initials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
    : 'HR'

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
        {currentUser && (
          <NavLink
            to="/users"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Team Users
          </NavLink>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        {currentUser ? (
          <div>
            <button
              className="user-profile-btn"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="avatar-circle">{initials}</div>
              <span className="user-name">{currentUser.fullName}</span>
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
                    {currentUser.companyName || 'Corporate Portal'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {currentUser.role === 'HR_Admin' ? 'HR Administrator' : currentUser.role}
                  </div>
                </div>

                <Link
                  to="/users"
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
                  <UsersIcon />
                  <span>User Management</span>
                </Link>

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
              to="/company-login"
              className="btn-secondary"
              style={{ padding: '8px 18px', fontSize: '13.5px' }}
            >
              Sign In
            </Link>
            <Link
              to="/company-register"
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '13.5px' }}
            >
              Register Company
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
