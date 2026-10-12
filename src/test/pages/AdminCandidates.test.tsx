import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidatesView } from '../../pages/admin/CandidatesView'
import { adminApi, type AdminCandidateDto } from '../../services/api'

vi.mock('../../services/api', () => ({ adminApi: {
  getCandidates: vi.fn(), toggleUserSuspend: vi.fn(), toggleCandidateStatus: vi.fn(),
} }))

const candidate: AdminCandidateDto = {
  id: 'candidate-1', name: 'Alex Rivera', avatar: '', role: 'Engineer', email: 'alex@example.test',
  topSkills: ['React'], aiMatchAverage: 91, status: 'Active', location: 'Colombo',
}

beforeEach(() => {
  vi.mocked(adminApi.getCandidates).mockReset().mockResolvedValue([candidate])
  vi.mocked(adminApi.toggleUserSuspend).mockReset().mockResolvedValue({ id: 'candidate-1', isSuspended: true, status: 'Suspended', message: 'Updated' })
  vi.mocked(adminApi.toggleCandidateStatus).mockReset()
})

describe('Admin candidate directory', () => {
  it('TC141 loads candidates and searches their skills', async () => {
    render(<CandidatesView />)
    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Search by candidate name, email, or skill...'), 'unknown')
    expect(screen.getByText(/No candidates found matching/)).toBeInTheDocument()
    await user.clear(screen.getByPlaceholderText('Search by candidate name, email, or skill...'))
    await user.type(screen.getByPlaceholderText('Search by candidate name, email, or skill...'), 'React')
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument()
  })

  it('TC142 restores active status if both suspension requests fail', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(adminApi.toggleUserSuspend).mockRejectedValue(new Error('Primary failed'))
    vi.mocked(adminApi.toggleCandidateStatus).mockRejectedValue(new Error('Fallback failed'))
    render(<CandidatesView />)
    await screen.findByText('Alex Rivera')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Suspend' }))
    await waitFor(() => expect(adminApi.toggleCandidateStatus).toHaveBeenCalledWith('candidate-1'))
    expect(await screen.findByRole('button', { name: 'Suspend' })).toBeInTheDocument()
  })
})
