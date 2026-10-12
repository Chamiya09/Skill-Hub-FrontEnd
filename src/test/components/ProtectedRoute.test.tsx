import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '../../components/common/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'
import { candidate } from '../utils/auth'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

const renderRoute = (path: string, role = 'Candidate') => render(
  <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/candidate/dashboard" element={<ProtectedRoute allowedRoles={[role]}><h1>Private workspace</h1></ProtectedRoute>} />
      <Route path="/candidate-login" element={<h1>Candidate login destination</h1>} />
      <Route path="/dashboard" element={<h1>Company dashboard destination</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    currentUser: null, isAuthenticated: false, isLoading: false,
    refreshProfile: vi.fn().mockResolvedValue(null), logout: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>)
})

describe('Protected routes', () => {
  it('TC020 redirects a signed out candidate to candidate login', async () => {
    renderRoute('/candidate/dashboard')
    expect(await screen.findByRole('heading', { name: 'Candidate login destination' })).toBeInTheDocument()
  })

  it('TC021 displays a loading state during session verification', () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: null, isAuthenticated: false, isLoading: true, refreshProfile: vi.fn() } as unknown as ReturnType<typeof useAuth>)
    renderRoute('/candidate/dashboard')
    expect(screen.getByRole('status')).toHaveTextContent('Loading your applications...')
  })

  it('TC022 renders the authorized candidate workspace', () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: candidate, isAuthenticated: true, isLoading: false, refreshProfile: vi.fn().mockResolvedValue(candidate), logout: vi.fn() } as unknown as ReturnType<typeof useAuth>)
    renderRoute('/candidate/dashboard')
    expect(screen.getByRole('heading', { name: 'Private workspace' })).toBeInTheDocument()
  })

  it('TC023 rejects a candidate from a company-only route', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: candidate, isAuthenticated: true, isLoading: false, refreshProfile: vi.fn().mockResolvedValue(candidate), logout: vi.fn() } as unknown as ReturnType<typeof useAuth>)
    render(
      <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Company']}><h1>Company workspace</h1></ProtectedRoute>} />
          <Route path="/candidate/dashboard" element={<h1>Candidate dashboard destination</h1>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: 'Candidate dashboard destination' })).toBeInTheDocument()
  })

  it('TC024 blocks the workspace when the account is suspended', () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: { ...candidate, isSuspended: true }, isAuthenticated: true, isLoading: false, refreshProfile: vi.fn().mockResolvedValue(candidate), logout: vi.fn() } as unknown as ReturnType<typeof useAuth>)
    renderRoute('/candidate/dashboard')
    expect(screen.getByRole('alertdialog', { name: 'Account Suspended' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Private workspace', hidden: true }).closest('[aria-hidden="true"]')).toHaveStyle({ pointerEvents: 'none' })
  })
})
