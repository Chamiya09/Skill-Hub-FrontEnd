import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SecuritySettings } from '../../pages/SecuritySettings'
import { useAuth } from '../../context/AuthContext'
import { companyAuthApi } from '../../services/api'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../services/api', () => ({ companyAuthApi: { changePassword: vi.fn() } }))

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ currentUser: { companyName: 'Acme', email: 'hr@acme.test' } } as ReturnType<typeof useAuth>)
  vi.mocked(companyAuthApi.changePassword).mockReset().mockResolvedValue({ message: 'Password updated' })
})

async function fillPasswords(current: string, next: string, confirm: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/Current Password/), current)
  await user.type(screen.getByLabelText(/^New Password/), next)
  await user.type(screen.getByLabelText(/Confirm New Password/), confirm)
  return user
}

describe('Company security settings', () => {
  it('TC091 rejects a password matching the current password', async () => {
    render(<SecuritySettings />)
    await fillPasswords('secret123', 'secret123', 'secret123')
    expect(screen.getByRole('button', { name: 'Update Corporate Password' })).toBeDisabled()
    expect(companyAuthApi.changePassword).not.toHaveBeenCalled()
  })

  it('TC092 submits valid credentials and clears the form', async () => {
    render(<SecuritySettings />)
    const user = await fillPasswords('oldpass1', 'newpass2', 'newpass2')
    await user.click(screen.getByRole('button', { name: 'Update Corporate Password' }))
    expect(companyAuthApi.changePassword).toHaveBeenCalledWith({
      currentPassword: 'oldpass1', newPassword: 'newpass2', confirmNewPassword: 'newpass2',
    })
    expect(await screen.findByText('Password updated')).toBeInTheDocument()
    expect(screen.getByLabelText(/Current Password/)).toHaveValue('')
  })

  it('TC093 reports a rejected password update', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(companyAuthApi.changePassword).mockRejectedValue(new Error('Current password incorrect'))
    render(<SecuritySettings />)
    const user = await fillPasswords('oldpass1', 'newpass2', 'newpass2')
    await user.click(screen.getByRole('button', { name: 'Update Corporate Password' }))
    expect(await screen.findByText('Current password incorrect')).toBeInTheDocument()
  })
})
