import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminSecurityView } from '../../pages/admin/AdminSecurityView'
import { useAuth } from '../../context/AuthContext'
import { adminApi } from '../../services/api'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../services/api', () => ({ adminApi: { changePassword: vi.fn() } }))

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ currentUser: { fullName: 'Administrator', email: 'admin@example.test' } } as ReturnType<typeof useAuth>)
  vi.mocked(adminApi.changePassword).mockReset().mockResolvedValue({ message: 'Admin password updated' })
})

async function fillForm(current: string, next: string, confirm: string) {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('Enter current password'), current)
  await user.type(screen.getByPlaceholderText('Enter new password (min. 6 characters)'), next)
  await user.type(screen.getByPlaceholderText('Repeat your new password'), confirm)
  return user
}

describe('Admin security settings', () => {
  it('TC137 prevents reusing the current password', async () => {
    render(<AdminSecurityView />)
    await fillForm('secret123', 'secret123', 'secret123')
    expect(screen.getByRole('button', { name: 'Update Administrator Password' })).toBeDisabled()
    expect(adminApi.changePassword).not.toHaveBeenCalled()
  })

  it('TC138 sends a valid password change to the admin API', async () => {
    render(<AdminSecurityView />)
    const user = await fillForm('oldpass1', 'newpass2', 'newpass2')
    await user.click(screen.getByRole('button', { name: 'Update Administrator Password' }))
    expect(adminApi.changePassword).toHaveBeenCalledWith({
      currentPassword: 'oldpass1', newPassword: 'newpass2', confirmNewPassword: 'newpass2',
    })
    expect(await screen.findByText('Admin password updated')).toBeInTheDocument()
  })

  it('TC139 reports a rejected admin password change', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(adminApi.changePassword).mockRejectedValue(new Error('Wrong current password'))
    render(<AdminSecurityView />)
    const user = await fillForm('oldpass1', 'newpass2', 'newpass2')
    await user.click(screen.getByRole('button', { name: 'Update Administrator Password' }))
    expect(await screen.findByText('Wrong current password')).toBeInTheDocument()
  })
})
