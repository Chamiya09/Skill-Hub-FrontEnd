import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../context/AuthContext'
import { AuthProvider } from '../../context/AuthProvider'
import { authApi, authStorage, candidateAuthApi, type UserDto } from '../../services/api'

const candidate: UserDto = {
  id: 'candidate-1', fullName: 'Alex Rivera', email: 'alex@example.com',
  role: 'Candidate', createdAt: '2026-01-01T00:00:00Z',
}

function AuthHarness() {
  const { currentUser, isAuthenticated, isLoading, candidateLogin, logout } = useAuth()
  return <div>
    <p>{isLoading ? 'Checking session' : isAuthenticated ? `Signed in: ${currentUser?.fullName}` : 'Signed out'}</p>
    <button onClick={() => void candidateLogin('alex@example.com', 'secret123').catch(() => {})}>Sign in</button>
    <button onClick={logout}>Sign out</button>
  </div>
}

beforeEach(() => {
  vi.spyOn(candidateAuthApi, 'login').mockReset()
})

describe('Real authentication provider', () => {
  it('TC052 stores candidate login state and clears it on logout', async () => {
    vi.spyOn(candidateAuthApi, 'login').mockResolvedValue({ token: 'candidate-token', tokenType: 'Bearer', expiresAt: '2027-01-01', user: candidate })
    render(<AuthProvider><AuthHarness /></AuthProvider>)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Signed in: Alex Rivera')).toBeInTheDocument()
    expect(authStorage.getToken()).toBe('candidate-token')
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(screen.getByText('Signed out')).toBeInTheDocument()
    expect(authStorage.getToken()).toBeNull()
  })

  it('TC053 keeps the user signed out after rejected credentials', async () => {
    vi.spyOn(candidateAuthApi, 'login').mockRejectedValue(new Error('Invalid credentials'))
    render(<AuthProvider><AuthHarness /></AuthProvider>)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Signed out')).toBeInTheDocument()
    expect(authStorage.getToken()).toBeNull()
  })

  it('TC054 restores a stored session after profile verification', async () => {
    authStorage.setAuth({ token: 'stored-token', tokenType: 'Bearer', expiresAt: '2027-01-01', user: candidate })
    vi.spyOn(authApi, 'getMe').mockResolvedValue(candidate)
    render(<AuthProvider><AuthHarness /></AuthProvider>)
    expect(await screen.findByText('Signed in: Alex Rivera')).toBeInTheDocument()
    expect(authApi.getMe).toHaveBeenCalledOnce()
  })
})
