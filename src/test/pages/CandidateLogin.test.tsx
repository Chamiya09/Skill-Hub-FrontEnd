import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateLogin } from '../../pages/CandidateLogin'
import { useAuth } from '../../context/AuthContext'
import { candidate } from '../utils/auth'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

const login = vi.fn()
const renderLogin = () => render(
  <MemoryRouter initialEntries={['/candidate-login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/candidate-login" element={<CandidateLogin />} />
      <Route path="/candidate/profile" element={<h1>Candidate profile destination</h1>} />
      <Route path="/candidate/dashboard" element={<h1>Candidate dashboard destination</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  login.mockReset()
  vi.mocked(useAuth).mockReturnValue({
    candidateLogin: login,
    isAuthenticated: false,
    currentUser: null,
    isLoading: false,
  } as unknown as ReturnType<typeof useAuth>)
})

describe('Candidate login', () => {
  it('TC001 renders the sign in form and registration link', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: 'Candidate Sign In' })).toBeInTheDocument()
    expect(screen.getByLabelText('Candidate Email Address')).toBeRequired()
    expect(screen.getByLabelText('Password')).toBeRequired()
    expect(screen.getByRole('link', { name: 'Create Free Account' })).toHaveAttribute('href', '/candidate-register')
  })

  it('TC002 submits a normalized email and entered password', async () => {
    login.mockResolvedValue(candidate)
    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Candidate Email Address'), 'Alex@Example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In to Candidate Portal' }))
    expect(login).toHaveBeenCalledWith('alex@example.com', 'secret123')
  })

  it('TC003 rejects empty required fields in the browser', async () => {
    renderLogin()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign In to Candidate Portal' }))
    expect(screen.getByLabelText('Candidate Email Address')).toBeInvalid()
    expect(login).not.toHaveBeenCalled()
  })

  it('TC004 displays a failed authentication message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    login.mockRejectedValue(new Error('Invalid credentials'))
    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Candidate Email Address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Sign In to Candidate Portal' }))
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })

  it('TC005 navigates to the profile after successful login', async () => {
    login.mockResolvedValue(candidate)
    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Candidate Email Address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In to Candidate Portal' }))
    expect(await screen.findByText(/Welcome back, Alex Rivera!/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Candidate profile destination' })).toBeInTheDocument(), { timeout: 2000 })
  })

  it('TC006 redirects an already authenticated candidate', async () => {
    vi.mocked(useAuth).mockReturnValue({
      candidateLogin: login,
      isAuthenticated: true,
      currentUser: candidate,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>)
    renderLogin()
    expect(await screen.findByRole('heading', { name: 'Candidate dashboard destination' })).toBeInTheDocument()
  })
})
