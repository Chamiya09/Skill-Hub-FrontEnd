import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateSettings } from '../../pages/CandidateSettings'
import { useAuth } from '../../context/AuthContext'
import type { UserDto } from '../../services/api'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockCandidate: UserDto = {
  id: 'cand-1',
  fullName: 'Elena Rostova',
  email: 'elena.rostova@example.com',
  role: 'Candidate',
  createdAt: '2026-01-01T00:00:00Z',
  phone: '+1 555-0199',
}

describe('Candidate Settings - Account & Credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      currentUser: mockCandidate,
      token: 'jwt-token-123',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      candidateLogin: vi.fn(),
      candidateRegister: vi.fn(),
      setAuthData: vi.fn(),
      setUser: vi.fn(),
      updateUser: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    })
  })

  it('TC153 renders candidate account info and security card', () => {
    render(<CandidateSettings />)

    expect(screen.getByText('Account Settings')).toBeInTheDocument()
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument()
    expect(screen.getByText('elena.rostova@example.com')).toBeInTheDocument()
  })

  it('TC154 validates password length and match before updating', async () => {
    render(<CandidateSettings />)
    const user = userEvent.setup()

    const currentPwdInput = screen.getByPlaceholderText('Enter current password')
    const newPwdInput = screen.getByPlaceholderText('Minimum 6 characters')
    const confirmPwdInput = screen.getByPlaceholderText('Re-enter new password')
    const submitBtn = screen.getByRole('button', { name: /Update Password/i })

    // Test password too short
    await user.type(currentPwdInput, 'oldpass123')
    await user.type(newPwdInput, '123')
    await user.type(confirmPwdInput, '123')
    await user.click(submitBtn)
    expect(screen.getByText(/New password must be at least 6 characters long/i)).toBeInTheDocument()

    // Test mismatched passwords
    await user.clear(newPwdInput)
    await user.clear(confirmPwdInput)
    await user.type(newPwdInput, 'newpassword123')
    await user.type(confirmPwdInput, 'differentpass456')
    await user.click(submitBtn)
    expect(screen.getByText(/New passwords do not match/i)).toBeInTheDocument()
  })

  it('TC155 successfully submits valid password and clears form fields', async () => {
    render(<CandidateSettings />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter current password'), 'oldpass123')
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'securePassword999')
    await user.type(screen.getByPlaceholderText('Re-enter new password'), 'securePassword999')
    await user.click(screen.getByRole('button', { name: /Update Password/i }))

    expect(
      await screen.findByText(/Your account security credentials were updated successfully/i)
    ).toBeInTheDocument()

    expect(screen.getByPlaceholderText('Enter current password')).toHaveValue('')
    expect(screen.getByPlaceholderText('Minimum 6 characters')).toHaveValue('')
    expect(screen.getByPlaceholderText('Re-enter new password')).toHaveValue('')
  })
})
