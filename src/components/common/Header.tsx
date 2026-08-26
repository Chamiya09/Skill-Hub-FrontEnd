import { NavLink, Link } from 'react-router-dom'
import { SparkleIcon, ChevronDownIcon } from './Icons'

export const Header = () => {
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
        <a href="#find-jobs" className="nav-link">
          Find Jobs
        </a>
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

      <button className="user-profile-btn" type="button">
        <div className="avatar-circle">RJ</div>
        <span className="user-name">Riya J.</span>
        <span className="chevron-icon">
          <ChevronDownIcon />
        </span>
      </button>
    </header>
  )
}
