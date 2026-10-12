import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FindJobs } from '../../pages/FindJobs'
import { useAuth } from '../../context/AuthContext'
import { publicJobsApi, type JobDto } from '../../services/api'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../services/api', () => ({
  publicJobsApi: { getJobs: vi.fn() },
  savedJobsApi: { getIds: vi.fn(), save: vi.fn(), remove: vi.fn() },
}))

const jobs: JobDto[] = [
  { id: '1', companyId: 'acme', companyName: 'Acme', title: 'React Engineer', department: 'Engineering', location: 'Remote', employmentType: 'Full-time', experienceLevel: 'Senior', status: 'Active', description: 'Build interfaces', createdAt: '2026-01-02T00:00:00Z' },
  { id: '2', companyId: 'beta', companyName: 'Beta', title: 'Product Designer', department: 'Design', location: 'Colombo', employmentType: 'Contract', experienceLevel: 'Mid', status: 'Active', description: 'Design interfaces', createdAt: '2026-01-01T00:00:00Z' },
]
const renderJobs = () => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><FindJobs /></MemoryRouter>)

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ currentUser: null } as ReturnType<typeof useAuth>)
  vi.mocked(publicJobsApi.getJobs).mockReset()
})

describe('Public job directory', () => {
  it('TC014 renders fetched job cards and detail links', async () => {
    vi.mocked(publicJobsApi.getJobs).mockResolvedValue(jobs)
    renderJobs()
    expect(await screen.findByRole('heading', { name: 'React Engineer' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Product Designer' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'React Engineer' })).toHaveAttribute('href', '/jobs/1')
  })

  it('TC015 filters jobs by keyword', async () => {
    vi.mocked(publicJobsApi.getJobs).mockResolvedValue(jobs)
    renderJobs()
    await screen.findByRole('heading', { name: 'React Engineer' })
    await userEvent.setup().type(screen.getByPlaceholderText('Search by job title, department, or company...'), 'designer')
    expect(screen.getByRole('heading', { name: 'Product Designer' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'React Engineer' })).not.toBeInTheDocument()
  })

  it('TC016 shows an empty result and clears filters', async () => {
    vi.mocked(publicJobsApi.getJobs).mockResolvedValue(jobs)
    renderJobs()
    await screen.findByRole('heading', { name: 'React Engineer' })
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Search by job title, department, or company...'), 'no such job')
    expect(screen.getByRole('heading', { name: 'No jobs match your filter criteria' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear All Filters' }))
    expect(screen.getByRole('heading', { name: 'React Engineer' })).toBeInTheDocument()
  })

  it('TC017 shows skeletons while the API request is pending', () => {
    vi.mocked(publicJobsApi.getJobs).mockReturnValue(new Promise(() => {}))
    const { container } = renderJobs()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('TC018 shows API errors and retries successfully', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(publicJobsApi.getJobs).mockRejectedValueOnce(new Error('Service unavailable')).mockResolvedValueOnce(jobs)
    renderJobs()
    expect(await screen.findByText('Service unavailable')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'React Engineer' })).toBeInTheDocument())
    expect(screen.queryByText('Service unavailable')).not.toBeInTheDocument()
  })

  it('TC019 handles a successful empty API response', async () => {
    vi.mocked(publicJobsApi.getJobs).mockResolvedValue([])
    renderJobs()
    expect(await screen.findByRole('heading', { name: 'No jobs match your filter criteria' })).toBeInTheDocument()
  })
})
