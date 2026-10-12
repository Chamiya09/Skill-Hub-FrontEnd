import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Login } from '../../pages/Login'
import { Register } from '../../pages/Register'
import { useAuth } from '../../context/AuthContext'
import type { UserDto } from '../../services/api'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

const company: UserDto = {
  id: 'company-1', fullName: 'Acme HR', companyName: 'Acme',
  email: 'hr@acme.test', role: 'Company', createdAt: '2026-01-01T00:00:00Z',
}
const login = vi.fn()
const register = vi.fn()
const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true }
const renderPage = (path: '/company-login' | '/company-register') => render(
  <MemoryRouter initialEntries={[path]} future={routerFuture}>
    <Routes>
      <Route path="/company-login" element={<Login />} />
      <Route path="/company-register" element={<Register />} />
      <Route path="/dashboard" element={<h1>Company dashboard destination</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  login.mockReset()
  register.mockReset()
  vi.mocked(useAuth).mockReturnValue({
    login, register, isAuthenticated: false, currentUser: null, isLoading: false,
  } as unknown as ReturnType<typeof useAuth>)
})

async function reachSecurity() {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('e.g. Acme Technologies Inc.'), 'Acme')
  await user.type(screen.getByPlaceholderText('contact@acmetech.com'), 'hr@acme.test')
  await user.click(screen.getByRole('button', { name: /Continue to Company Profile/ }))
  await user.click(screen.getByRole('button', { name: /Continue to Security/ }))
  return user
}

describe('Employer authentication', () => {
  it('TC042 renders company sign in and blocks empty fields', async () => {
    renderPage('/company-login')
    expect(screen.getByRole('heading', { name: 'Company Sign In' })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign In to Company Portal' }))
    expect(screen.getByLabelText('Company / Business Email')).toBeInvalid()
    expect(login).not.toHaveBeenCalled()
  })

  it('TC043 submits company credentials and navigates after success', async () => {
    login.mockResolvedValue(company)
    renderPage('/company-login')
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Company / Business Email'), 'hr@acme.test')
    await user.type(screen.getByLabelText('Account Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In to Company Portal' }))
    expect(login).toHaveBeenCalledWith('hr@acme.test', 'secret123')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Company dashboard destination' })).toBeInTheDocument(), { timeout: 2000 })
  })

  it('TC044 shows a company login error', async () => {
    login.mockRejectedValue(new Error('Account disabled'))
    renderPage('/company-login')
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Company / Business Email'), 'hr@acme.test')
    await user.type(screen.getByLabelText('Account Password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Sign In to Company Portal' }))
    expect(await screen.findByText('Account disabled')).toBeInTheDocument()
  })

  it('TC045 validates company identity before advancing', async () => {
    renderPage('/company-register')
    await userEvent.setup().click(screen.getByRole('button', { name: /Continue to Company Profile/ }))
    expect(screen.getByText('Please enter your Company Name.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Organization Profile' })).not.toBeInTheDocument()
  })

  it('TC046 validates registration password confirmation', async () => {
    renderPage('/company-register')
    const user = await reachSecurity()
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'secret123')
    await user.type(screen.getByPlaceholderText('Re-enter password'), 'different')
    await user.click(screen.getByRole('button', { name: /Complete Company Registration/ }))
    expect(screen.getByText('Passwords do not match. Please re-enter.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('TC047 registers a company and opens its dashboard', async () => {
    register.mockResolvedValue(company)
    renderPage('/company-register')
    const user = await reachSecurity()
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'secret123')
    await user.type(screen.getByPlaceholderText('Re-enter password'), 'secret123')
    await user.click(screen.getByRole('button', { name: /Complete Company Registration/ }))
    expect(register).toHaveBeenCalledWith({ companyName: 'Acme', companyEmail: 'hr@acme.test', industry: 'Software & Technology', website: '', password: 'secret123' })
    expect(await screen.findByRole('heading', { name: 'Company dashboard destination' })).toBeInTheDocument()
  })

  it('TC048 displays a company registration API failure', async () => {
    register.mockRejectedValue(new Error('Company email in use'))
    renderPage('/company-register')
    const user = await reachSecurity()
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'secret123')
    await user.type(screen.getByPlaceholderText('Re-enter password'), 'secret123')
    await user.click(screen.getByRole('button', { name: /Complete Company Registration/ }))
    expect(await screen.findByText('Company email in use')).toBeInTheDocument()
  })
})
