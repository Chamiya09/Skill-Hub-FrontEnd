import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateProfile } from '../../pages/CandidateProfile'
import { useAuth } from '../../context/AuthContext'
import { candidateCvApi, type CandidateProfileResponseDto } from '../../services/api'
import { candidate } from '../utils/auth'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

const profile: CandidateProfileResponseDto = {
  id: 'candidate-1', firstName: 'Alex', lastName: 'Rivera', fullName: 'Alex Rivera',
  email: 'alex@example.com', headline: 'React Engineer', keyHighlights: [],
  experiences: [], educations: [], projects: [], certifications: [],
  skills: [{ id: 'skill-1', skillName: 'React', category: 'Frontend', createdAt: '2026-01-01T00:00:00Z' }],
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ currentUser: candidate, updateUser: vi.fn() } as unknown as ReturnType<typeof useAuth>)
  vi.spyOn(candidateCvApi, 'getProfile').mockReset().mockResolvedValue(profile)
  vi.spyOn(candidateCvApi, 'getCv').mockReset()
  vi.spyOn(candidateCvApi, 'deleteSkill').mockReset().mockResolvedValue(undefined)
})

describe('Candidate digital CV', () => {
  it('TC074 loads profile details and skills', async () => {
    render(<CandidateProfile />)
    expect(await screen.findByRole('heading', { name: 'Alex Rivera' })).toBeInTheDocument()
    expect(screen.getByText('React Engineer')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('TC075 shows a loading skeleton while profile retrieval is pending', () => {
    vi.mocked(candidateCvApi.getProfile).mockReturnValue(new Promise(() => {}))
    const { container } = render(<CandidateProfile />)
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('TC076 shows an error and retries a failed profile request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(candidateCvApi.getProfile).mockRejectedValueOnce(new Error('Profile unavailable')).mockResolvedValueOnce(profile)
    vi.mocked(candidateCvApi.getCv).mockRejectedValue(new Error('CV unavailable'))
    render(<CandidateProfile />)
    expect(await screen.findByRole('heading', { name: 'Failed to Load Profile' })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Alex Rivera' })).toBeInTheDocument()
  })

  it('TC077 deletes a confirmed skill from the displayed CV', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    render(<CandidateProfile />)
    await screen.findByRole('heading', { name: 'Alex Rivera' })
    await userEvent.setup().click(screen.getByTitle('Remove skill React'))
    await waitFor(() => expect(candidateCvApi.deleteSkill).toHaveBeenCalledWith('skill-1'))
    expect(screen.queryByTitle('Remove skill React')).not.toBeInTheDocument()
  })
})
