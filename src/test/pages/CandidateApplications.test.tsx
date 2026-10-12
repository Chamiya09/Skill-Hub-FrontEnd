import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateApplications } from '../../pages/CandidateApplications'
import { jobApplicationsApi, type CandidateApplicationItemDto } from '../../services/api'

vi.mock('../../services/api', () => ({ jobApplicationsApi: { getMyApplications: vi.fn() } }))
vi.mock('../../components/jobs/ApplicationProgressModal', () => ({
  ApplicationProgressModal: ({ application, onClose }: { application: CandidateApplicationItemDto; onClose: () => void }) =>
    <div role="dialog" aria-label="Application progress"><p>{application.jobTitle} journey</p><button onClick={onClose}>Close progress</button></div>,
}))

const application: CandidateApplicationItemDto = {
  id: 'application-1', jobId: 'job-1', jobTitle: 'React Engineer',
  companyName: 'Acme', location: 'Remote', employmentType: 'Full-time',
  workplaceType: 'Remote', appliedDate: '2026-01-02T00:00:00Z', status: 'Shortlisted',
}
const renderPage = () => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CandidateApplications /></MemoryRouter>)

beforeEach(() => {
  vi.mocked(jobApplicationsApi.getMyApplications).mockReset().mockResolvedValue([application])
})

describe('Candidate application tracker', () => {
  it('TC062 shows applications and their current stage', async () => {
    renderPage()
    expect(await screen.findByText('React Engineer')).toBeInTheDocument()
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
  })

  it('TC063 opens and closes the progress view', async () => {
    renderPage()
    await screen.findByText('React Engineer')
    const user = userEvent.setup()
    await user.click(screen.getByText(/Track Progress/))
    expect(screen.getByRole('dialog', { name: 'Application progress' })).toHaveTextContent('React Engineer journey')
    await user.click(screen.getByRole('button', { name: 'Close progress' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('TC064 shows the no-applications state', async () => {
    vi.mocked(jobApplicationsApi.getMyApplications).mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No Job Applications Yet' })).toBeInTheDocument()
  })

  it('TC065 retries after an application loading failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(jobApplicationsApi.getMyApplications).mockRejectedValueOnce(new Error('Tracker unavailable')).mockResolvedValueOnce([application])
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Tracker unavailable')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByText('React Engineer')).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
