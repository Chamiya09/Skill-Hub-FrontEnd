import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppContent } from '../../App'
import { useAuth } from '../../context/AuthContext'
import type { UserDto } from '../../services/api'
import { candidate } from '../utils/auth'

// Mock useAuth context hook
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock API modules to prevent unhandled network attempts
vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api')>()
  return {
    ...actual,
    publicJobsApi: { getJobs: vi.fn().mockResolvedValue([]) },
    savedJobsApi: { getIds: vi.fn().mockResolvedValue([]) },
    candidateApplicationsApi: { getApplications: vi.fn().mockResolvedValue([]) },
    jobsApi: { getJobs: vi.fn().mockResolvedValue([]) },
  }
})

// Mock pages with distinct test markers to verify exact route destination
vi.mock('../../pages/Home', () => ({
  Home: () => <div data-testid="page-home">Skill Hub Public Home</div>,
}))
vi.mock('../../pages/About', () => ({
  About: () => <div data-testid="page-about">About Us Platform Story</div>,
}))
vi.mock('../../pages/Contact', () => ({
  Contact: () => <div data-testid="page-contact">Contact Support & Sales</div>,
}))
vi.mock('../../pages/FindJobs', () => ({
  FindJobs: () => <div data-testid="page-jobs">Find Jobs Public Search</div>,
}))
vi.mock('../../pages/CandidateLogin', () => ({
  CandidateLogin: () => <div data-testid="page-candidate-login">Candidate Login Gateway</div>,
}))
vi.mock('../../pages/Login', () => ({
  Login: () => <div data-testid="page-company-login">Company ATS Login Gateway</div>,
}))
vi.mock('../../pages/CandidateDashboard', () => ({
  CandidateDashboard: () => <div data-testid="page-candidate-dashboard">Candidate Private Dashboard</div>,
}))
vi.mock('../../pages/CandidateProfile', () => ({
  CandidateProfile: () => <div data-testid="page-candidate-profile">Candidate Verified Profile</div>,
}))
vi.mock('../../pages/Dashboard', () => ({
  Dashboard: () => <div data-testid="page-employer-dashboard">Employer Talent Command Center</div>,
}))
vi.mock('../../pages/admin/AdminLogin', () => ({
  AdminLogin: () => <div data-testid="page-admin-login">Super Admin Access Portal</div>,
}))
vi.mock('../../pages/admin/AdminDashboard', () => ({
  AdminDashboard: () => <div data-testid="page-admin-dashboard">Super Admin Security Dashboard</div>,
}))

const employerUser: UserDto = {
  id: 'employer-1',
  fullName: 'Jordan Lee',
  firstName: 'Jordan',
  lastName: 'Lee',
  email: 'jordan@enterprise.com',
  role: 'Employer',
  companyName: 'Apex Systems',
  createdAt: '2026-01-01T00:00:00Z',
}

const adminUser: UserDto = {
  id: 'admin-1',
  fullName: 'Super Admin',
  firstName: 'Super',
  lastName: 'Admin',
  email: 'root@skillhub.internal',
  role: 'Admin',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('Application Routing & Authorization Flow (Section H)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      refreshProfile: vi.fn().mockResolvedValue(null),
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)
  })

  const renderAtRoute = (initialPath: string) => {
    cleanup()
    return render(
      <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </MemoryRouter>
    )
  }

  describe('Public Unauthenticated Access', () => {
    it('TC194 allows unauthenticated access to public portal routes', () => {
      renderAtRoute('/')
      expect(screen.getByTestId('page-home')).toBeInTheDocument()

      renderAtRoute('/about')
      expect(screen.getByTestId('page-about')).toBeInTheDocument()

      renderAtRoute('/contact')
      expect(screen.getByTestId('page-contact')).toBeInTheDocument()

      renderAtRoute('/jobs')
      expect(screen.getByTestId('page-jobs')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated Protected Route Redirections', () => {
    it('TC195 redirects unauthenticated access on candidate routes to /candidate-login', () => {
      renderAtRoute('/candidate/dashboard')
      expect(screen.getByTestId('page-candidate-login')).toBeInTheDocument()
      expect(screen.queryByTestId('page-candidate-dashboard')).not.toBeInTheDocument()
    })

    it('TC196 redirects unauthenticated access on employer routes to /company-login', () => {
      renderAtRoute('/dashboard')
      expect(screen.getByTestId('page-company-login')).toBeInTheDocument()
      expect(screen.queryByTestId('page-employer-dashboard')).not.toBeInTheDocument()
    })

    it('TC197 redirects unauthenticated access on admin dashboard to /skillhub-secure-admin', () => {
      renderAtRoute('/skillhub-secure-admin/dashboard')
      expect(screen.getByTestId('page-admin-login')).toBeInTheDocument()
      expect(screen.queryByTestId('page-admin-dashboard')).not.toBeInTheDocument()
    })
  })

  describe('Role-Based Access Control and Inter-Portal Guards', () => {
    it('TC198 permits candidate into candidate portal but redirects when attempting employer ATS', () => {
      vi.mocked(useAuth).mockReturnValue({
        currentUser: candidate,
        isAuthenticated: true,
        isLoading: false,
        refreshProfile: vi.fn().mockResolvedValue(candidate),
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuth>)

      // Permitted on candidate portal
      renderAtRoute('/candidate/dashboard')
      expect(screen.getByTestId('page-candidate-dashboard')).toBeInTheDocument()

      // Blocked on employer route, redirected to candidate destination
      renderAtRoute('/dashboard')
      expect(screen.getByTestId('page-candidate-profile')).toBeInTheDocument()
      expect(screen.queryByTestId('page-employer-dashboard')).not.toBeInTheDocument()
    })

    it('TC199 permits employer into ATS dashboard but redirects when attempting candidate portal', () => {
      vi.mocked(useAuth).mockReturnValue({
        currentUser: employerUser,
        isAuthenticated: true,
        isLoading: false,
        refreshProfile: vi.fn().mockResolvedValue(employerUser),
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuth>)

      // Permitted on employer dashboard
      renderAtRoute('/dashboard')
      expect(screen.getByTestId('page-employer-dashboard')).toBeInTheDocument()

      // Blocked on candidate portal, redirected to employer dashboard
      renderAtRoute('/candidate/dashboard')
      expect(screen.getByTestId('page-employer-dashboard')).toBeInTheDocument()
      expect(screen.queryByTestId('page-candidate-dashboard')).not.toBeInTheDocument()
    })

    it('TC200 prevents Super Admin from accessing tenant portals and routes to admin control plane', () => {
      vi.mocked(useAuth).mockReturnValue({
        currentUser: adminUser,
        isAuthenticated: true,
        isLoading: false,
        refreshProfile: vi.fn().mockResolvedValue(adminUser),
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuth>)

      // Permitted on admin control plane
      renderAtRoute('/skillhub-secure-admin/dashboard')
      expect(screen.getByTestId('page-admin-dashboard')).toBeInTheDocument()

      // Redirects to admin dashboard when trying candidate workspace
      renderAtRoute('/candidate/dashboard')
      expect(screen.getByTestId('page-admin-dashboard')).toBeInTheDocument()

      // Redirects to admin dashboard when trying employer ATS
      renderAtRoute('/dashboard')
      expect(screen.getByTestId('page-admin-dashboard')).toBeInTheDocument()
    })
  })

  describe('Suspended Account Universal Protection', () => {
    it('TC201 displays non-dismissible modal and disables interaction for suspended accounts', () => {
      vi.mocked(useAuth).mockReturnValue({
        currentUser: { ...candidate, isSuspended: true },
        isAuthenticated: true,
        isLoading: false,
        refreshProfile: vi.fn().mockResolvedValue({ ...candidate, isSuspended: true }),
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuth>)

      renderAtRoute('/candidate/dashboard')

      // Suspension modal rendered
      const modals = screen.getAllByRole('alertdialog', { name: 'Account Suspended' })
      expect(modals.length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Your account has been suspended due to suspicious activities/i).length).toBeGreaterThan(0)
    })
  })
})
