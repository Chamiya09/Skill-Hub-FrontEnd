import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateRegister } from '../../pages/CandidateRegister'
import { useAuth } from '../../context/AuthContext'
import { candidate } from '../utils/auth'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
const register = vi.fn()
const renderRegistration = () => render(
  <MemoryRouter initialEntries={['/candidate-register']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/candidate-register" element={<CandidateRegister />} />
      <Route path="/candidate/profile" element={<h1>Candidate profile destination</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  register.mockReset()
  vi.mocked(useAuth).mockReturnValue({
    candidateRegister: register,
    isAuthenticated: false,
    currentUser: null,
    isLoading: false,
  } as unknown as ReturnType<typeof useAuth>)
})

async function reachSecurity() {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
  await user.type(screen.getByPlaceholderText('e.g. Rivera'), 'Rivera')
  await user.type(screen.getByPlaceholderText('alex.rivera@example.com'), 'Alex@Example.com')
  await user.click(screen.getByRole('button', { name: /Continue to Professional Profile/ }))
  await user.type(screen.getByPlaceholderText('e.g. Senior Full-Stack Engineer / UX Designer'), 'Software Engineer')
  await user.click(screen.getByRole('button', { name: /Continue to Security/ }))
  return user
}

describe('Candidate registration wizard', () => {
  it('TC007 renders the identity step', () => {
    renderRegistration()
    expect(screen.getByRole('heading', { name: 'Create Candidate Account' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Alex')).toBeInTheDocument()
  })

  it('TC008 blocks missing identity fields', async () => {
    renderRegistration()
    await userEvent.setup().click(screen.getByRole('button', { name: /Continue to Professional Profile/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your First Name.')
    expect(screen.queryByText('Professional Profile', { selector: 'h3' })).not.toBeInTheDocument()
  })

  it('TC009 rejects an invalid email before advancing', async () => {
    renderRegistration()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
    await user.type(screen.getByPlaceholderText('e.g. Rivera'), 'Rivera')
    await user.type(screen.getByPlaceholderText('alex.rivera@example.com'), 'invalid')
    await user.click(screen.getByRole('button', { name: /Continue to Professional Profile/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Please provide a valid personal email address.')
  })

  it('TC010 requires a professional headline', async () => {
    renderRegistration()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
    await user.type(screen.getByPlaceholderText('e.g. Rivera'), 'Rivera')
    await user.type(screen.getByPlaceholderText('alex.rivera@example.com'), 'alex@example.com')
    await user.click(screen.getByRole('button', { name: /Continue to Professional Profile/ }))
    await user.click(screen.getByRole('button', { name: /Continue to Security/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Please provide your Professional Headline')
  })

  it('TC011 rejects short and mismatched passwords', async () => {
    renderRegistration()
    const user = await reachSecurity()
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'short')
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'short')
    await user.click(screen.getByRole('button', { name: /Complete Candidate Registration/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 6 characters long.')
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'er')
    await user.clear(screen.getByPlaceholderText('Re-enter your password'))
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'different')
    await user.click(screen.getByRole('button', { name: /Complete Candidate Registration/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match')
    expect(register).not.toHaveBeenCalled()
  })

  it('TC012 submits valid candidate data', async () => {
    register.mockResolvedValue(candidate)
    renderRegistration()
    const user = await reachSecurity()
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'secret123')
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'secret123')
    await user.click(screen.getByRole('button', { name: /Complete Candidate Registration/ }))
    expect(register).toHaveBeenCalledWith({
      firstName: 'Alex', lastName: 'Rivera', email: 'alex@example.com',
      headline: 'Software Engineer', phone: undefined, password: 'secret123',
    })
    expect(await screen.findByText(/Welcome to Skill Hub, Alex Rivera/)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Candidate profile destination' }, { timeout: 1500 })).toBeInTheDocument()
  })

  it('TC013 displays registration API errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    register.mockRejectedValue(new Error('Email already registered'))
    renderRegistration()
    const user = await reachSecurity()
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'secret123')
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'secret123')
    await user.click(screen.getByRole('button', { name: /Complete Candidate Registration/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered')
  })
})
