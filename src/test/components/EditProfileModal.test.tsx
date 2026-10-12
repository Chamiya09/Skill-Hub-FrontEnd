import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditProfileModal } from '../../components/candidates/modals/EditProfileModal'
import { candidateAuthApi } from '../../services/api'
import { candidate } from '../utils/auth'

const close = vi.fn()
const success = vi.fn()
const initialData = { firstName: 'Alex', lastName: 'Rivera', headline: 'Engineer' }

beforeEach(() => {
  close.mockReset()
  success.mockReset()
})

describe('Candidate profile editor', () => {
  it('TC066 blocks submission when required profile fields are empty', async () => {
    const update = vi.spyOn(candidateAuthApi, 'updateProfile')
    render(<EditProfileModal isOpen onClose={close} onSuccess={success} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save Profile Details' }))
    expect(screen.getByPlaceholderText('e.g. Jessica')).toBeInvalid()
    expect(update).not.toHaveBeenCalled()
  })

  it('TC067 submits updated profile information and closes the editor', async () => {
    const update = vi.spyOn(candidateAuthApi, 'updateProfile').mockResolvedValue(candidate)
    render(<EditProfileModal isOpen onClose={close} onSuccess={success} initialData={initialData} />)
    const user = userEvent.setup()
    await user.clear(screen.getByPlaceholderText('e.g. Senior Full-Stack Cloud Architect • React & .NET Core'))
    await user.type(screen.getByPlaceholderText('e.g. Senior Full-Stack Cloud Architect • React & .NET Core'), 'Lead Engineer')
    await user.click(screen.getByRole('button', { name: 'Save Profile Details' }))
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Alex', lastName: 'Rivera', fullName: 'Alex Rivera', headline: 'Lead Engineer' }))
    expect(success).toHaveBeenCalledWith(candidate)
    expect(close).toHaveBeenCalledOnce()
  })

  it('TC068 keeps the editor open and shows API errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(candidateAuthApi, 'updateProfile').mockRejectedValue(new Error('Update unavailable'))
    render(<EditProfileModal isOpen onClose={close} onSuccess={success} initialData={initialData} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save Profile Details' }))
    expect(await screen.findByText(/Update unavailable/)).toBeInTheDocument()
    expect(close).not.toHaveBeenCalled()
    expect(success).not.toHaveBeenCalled()
  })
})
