import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateSavedJobs } from '../../pages/CandidateSavedJobs'
import { savedJobsApi, type SavedJobDto } from '../../services/api'

vi.mock('../../services/api', () => ({ savedJobsApi: { getAll: vi.fn(), remove: vi.fn() } }))

const saved: SavedJobDto = {
  id: 'saved-1', jobId: 'job-1', jobTitle: 'React Engineer', companyName: 'Acme',
  location: 'Remote', employmentType: 'Full-time', experienceLevel: 'Senior',
  postedAt: '2026-01-01T00:00:00Z', savedAt: '2026-01-02T00:00:00Z',
}
const renderPage = () => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CandidateSavedJobs /></MemoryRouter>)

beforeEach(() => {
  vi.mocked(savedJobsApi.getAll).mockReset().mockResolvedValue([saved])
  vi.mocked(savedJobsApi.remove).mockReset().mockResolvedValue(null)
})

describe('Candidate saved jobs', () => {
  it('TC058 displays saved opportunities and a job detail link', async () => {
    renderPage()
    expect(await screen.findByRole('link', { name: 'React Engineer' })).toHaveAttribute('href', '/jobs/job-1')
  })

  it('TC059 displays an empty state when no jobs are saved', async () => {
    vi.mocked(savedJobsApi.getAll).mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No Bookmarked Jobs' })).toBeInTheDocument()
  })

  it('TC060 removes a saved job after a successful request', async () => {
    renderPage()
    await screen.findByRole('link', { name: 'React Engineer' })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove React Engineer from saved jobs' }))
    await waitFor(() => expect(savedJobsApi.remove).toHaveBeenCalledWith('job-1'))
    expect(screen.getByRole('heading', { name: 'No Bookmarked Jobs' })).toBeInTheDocument()
  })

  it('TC061 restores the saved job when removal fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(savedJobsApi.remove).mockRejectedValue(new Error('Could not remove'))
    renderPage()
    await screen.findByRole('link', { name: 'React Engineer' })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove React Engineer from saved jobs' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not remove')
    expect(screen.getByRole('link', { name: 'React Engineer' })).toBeInTheDocument()
  })
})
