import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminLogin } from '../../pages/admin/AdminLogin'
import { useAuth } from '../../context/AuthContext'
import { adminApi, authStorage, type UserDto } from '../../services/api'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

const admin: UserDto = {
  id: 'admin-1', fullName: 'Platform Admin', email: 'admin@skillhub.test',
  role: 'Admin', createdAt: '2026-01-01T00:00:00Z',
}
const setAuthData = vi.fn()
const renderLogin = () => render(
  <MemoryRouter initialEntries={['/skillhub-secure-admin']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/skillhub-secure-admin" element={<AdminLogin />} />
      <Route path="/skillhub-secure-admin/dashboard" element={<h1>Admin dashboard destination</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  setAuthData.mockReset()
  vi.mocked(useAuth).mockReturnValue({ setAuthData, currentUser: null, isLoading: false } as unknown as ReturnType<typeof useAuth>)
})

describe('Admin gateway', () => {
  it('TC049 requires admin email and password', async () => {
    const request = vi.spyOn(adminApi, 'adminLogin')
    renderLogin()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Access Master Console' }))
    expect(screen.getByLabelText('Admin Identity / Email')).toBeInvalid()
    expect(request).not.toHaveBeenCalled()
  })

  it('TC050 stores a successful admin session and navigates', async () => {
    const request = vi.spyOn(adminApi, 'adminLogin').mockResolvedValue({ token: 'admin-token', tokenType: 'Bearer', expiresAt: '2027-01-01', user: admin })
    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Admin Identity / Email'), 'admin@skillhub.test')
    await user.type(screen.getByLabelText('Master Security Key / Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Access Master Console' }))
    expect(request).toHaveBeenCalledWith({ email: 'admin@skillhub.test', password: 'secret123' })
    expect(setAuthData).toHaveBeenCalledWith(admin, 'admin-token')
    expect(authStorage.getToken()).toBe('admin-token')
    expect(await screen.findByRole('heading', { name: 'Admin dashboard destination' })).toBeInTheDocument()
  })

  it('TC051 displays a rejected admin login without storing a token', async () => {
    vi.spyOn(adminApi, 'adminLogin').mockRejectedValue(new Error('Access denied'))
    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Admin Identity / Email'), 'admin@skillhub.test')
    await user.type(screen.getByLabelText('Master Security Key / Password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Access Master Console' }))
    expect(await screen.findByText('Access denied')).toBeInTheDocument()
    expect(setAuthData).not.toHaveBeenCalled()
    expect(authStorage.getToken()).toBeNull()
  })
})
