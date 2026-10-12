import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JobDetailsPublic } from '../../pages/JobDetailsPublic'
import { useAuth } from '../../context/AuthContext'
import { jobApplicationsApi, publicJobsApi, savedJobsApi, type JobDto } from '../../services/api'
import { candidate } from '../utils/auth'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../services/api', () => ({
  publicJobsApi: { getJobById: vi.fn(), getJobs: vi.fn() },
  jobApplicationsApi: { getStatus: vi.fn(), apply: vi.fn() },
  savedJobsApi: { getIds: vi.fn(), save: vi.fn(), remove: vi.fn() },
}))

const job: JobDto = {
  id: 'job-1', companyId: 'company-1', companyName: 'Acme', title: 'React Engineer',
  department: 'Engineering', location: 'Remote', employmentType: 'Full-time',
  experienceLevel: 'Senior', status: 'Active', description: 'Build interfaces',
  createdAt: '2026-01-01T00:00:00Z',
}
const renderPage = () => render(
  <MemoryRouter initialEntries={['/jobs/job-1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/jobs/:id" element={<JobDetailsPublic />} />
      <Route path="/candidate/login" element={<h1>Candidate login destination</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.mocked(useAuth).mockReturnValue({ currentUser: candidate } as ReturnType<typeof useAuth>)
  vi.mocked(publicJobsApi.getJobById).mockReset().mockResolvedValue(job)
  vi.mocked(publicJobsApi.getJobs).mockReset().mockResolvedValue([])
  vi.mocked(jobApplicationsApi.getStatus).mockReset().mockResolvedValue({ hasApplied: false })
  vi.mocked(jobApplicationsApi.apply).mockReset().mockResolvedValue({ message: 'Applied', applicationId: 'application-1', appliedDate: '2026-01-02' })
  vi.mocked(savedJobsApi.getIds).mockReset().mockResolvedValue([])
  vi.mocked(savedJobsApi.save).mockReset().mockResolvedValue({ message: 'Saved', jobId: 'job-1' })
  vi.mocked(savedJobsApi.remove).mockReset().mockResolvedValue(null)
})

describe('Public job detail and candidate actions', () => {
  it('TC069 loads the real job detail page', async () => {
    renderPage()
    expect(await screen.findByText('React Engineer')).toBeInTheDocument()
    expect(publicJobsApi.getJobById).toHaveBeenCalledWith('job-1')
  })

  it('TC070 submits a candidate application and prevents a second application', async () => {
    renderPage()
    await screen.findByText('React Engineer')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Apply Now' }))
    await waitFor(() => expect(jobApplicationsApi.apply).toHaveBeenCalledWith('job-1'))
    expect(await screen.findByRole('button', { name: 'Already Applied' })).toBeDisabled()
  })

  it('TC071 displays an application API failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(jobApplicationsApi.apply).mockRejectedValue(new Error('Application service unavailable'))
    renderPage()
    await screen.findByText('React Engineer')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Apply Now' }))
    expect(await screen.findByText('Application service unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply Now' })).toBeEnabled()
  })

  it('TC072 sends a signed out visitor to candidate login before applying', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: null } as ReturnType<typeof useAuth>)
    renderPage()
    await screen.findByText('React Engineer')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Apply Now' }))
    expect(await screen.findByRole('heading', { name: 'Candidate login destination' })).toBeInTheDocument()
    expect(jobApplicationsApi.apply).not.toHaveBeenCalled()
  })

  it('TC073 rolls back a failed bookmark save', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(savedJobsApi.save).mockRejectedValue(new Error('Save failed'))
    renderPage()
    await screen.findByText('React Engineer')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save Job' }))
    await waitFor(() => expect(savedJobsApi.save).toHaveBeenCalledWith('job-1'))
    expect(await screen.findByRole('button', { name: 'Save Job' })).toBeInTheDocument()
  })
})
