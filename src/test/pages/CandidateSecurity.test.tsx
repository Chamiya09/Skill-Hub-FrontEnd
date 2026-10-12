import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CandidateSecurity } from '../../pages/CandidateSecurity'

describe('Candidate security without a self-service backend endpoint', () => {
  it('TC106 validates new password length before showing service availability', async () => {
    render(<CandidateSecurity />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Current Password/), 'oldpass1')
    await user.type(screen.getByLabelText(/^New Password/), 'short')
    await user.type(screen.getByLabelText(/Confirm New Password/), 'short')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))
    expect(screen.getByText('New password must be at least 6 characters in length.')).toBeInTheDocument()
  })

  it('TC107 does not claim a password was changed without a server request', async () => {
    render(<CandidateSecurity />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Current Password/), 'oldpass1')
    await user.type(screen.getByLabelText(/^New Password/), 'newpass2')
    await user.type(screen.getByLabelText(/Confirm New Password/), 'newpass2')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))
    expect(screen.getByText(/Candidate password changes are unavailable/)).toHaveTextContent('Your password was not changed.')
    expect(screen.queryByText(/successfully updated/)).not.toBeInTheDocument()
  })

  it('TC108 keeps the account and session intact after deletion confirmation', async () => {
    render(<CandidateSecurity />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Delete Account' }))
    const confirm = screen.getByRole('button', { name: 'Permanently Delete' })
    expect(confirm).toBeDisabled()
    await user.type(screen.getByPlaceholderText('Type DELETE to confirm'), 'DELETE')
    await user.click(confirm)
    expect(screen.getByText(/Candidate self-service account deletion is unavailable/)).toHaveTextContent('Your account and session are unchanged.')
    expect(screen.getByRole('dialog', { name: 'Delete Candidate Account?' })).toBeInTheDocument()
  })
})
