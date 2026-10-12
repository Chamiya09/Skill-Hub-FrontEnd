import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicRoute } from '../../components/common/PublicRoute'
import { useAuth } from '../../context/AuthContext'
import { candidate } from '../utils/auth'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

const renderRoute = (deferAuthenticatedRedirect = false) => render(
  <MemoryRouter initialEntries={['/candidate-register']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/candidate-register" element={<PublicRoute deferAuthenticatedRedirect={deferAuthenticatedRedirect}><h1>Public form</h1></PublicRoute>} />
      <Route path="/candidate/dashboard" element={<h1>Candidate destination</h1>} />
      <Route path="/skillhub-secure-admin/dashboard" element={<h1>Admin destination</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ currentUser: null, isAuthenticated: false, isLoading: false } as ReturnType<typeof useAuth>)
})

describe('Public auth routes', () => {
  it('TC055 allows a visitor to view the public form', () => {
    renderRoute()
    expect(screen.getByRole('heading', { name: 'Public form' })).toBeInTheDocument()
  })

  it('TC056 redirects an authenticated candidate away from registration', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: candidate, isAuthenticated: true, isLoading: false } as ReturnType<typeof useAuth>)
    renderRoute()
    expect(await screen.findByRole('heading', { name: 'Candidate destination' })).toBeInTheDocument()
  })

  it('TC057 always redirects an admin, including when the candidate redirect is deferred', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: { ...candidate, role: 'Admin' }, isAuthenticated: true, isLoading: false } as ReturnType<typeof useAuth>)
    renderRoute(true)
    expect(await screen.findByRole('heading', { name: 'Admin destination' })).toBeInTheDocument()
  })
})
