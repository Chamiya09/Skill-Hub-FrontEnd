import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JobVacancies } from '../../pages/JobVacancies'
import { jobsApi, type JobDto } from '../../services/api'

vi.mock('../../services/api', () => ({
  jobsApi: { getJobs: vi.fn(), createJob: vi.fn(), updateJob: vi.fn(), deleteJob: vi.fn() },
}))
vi.mock('../../components/jobs/JobFormModal', () => ({
  JobFormModal: ({ isOpen, onClose, onSubmit, isEditMode }: { isOpen: boolean; onClose: () => void; onSubmit: (data: object) => void; isEditMode: boolean }) =>
    isOpen ? <div role="dialog" aria-label="Vacancy editor"><button onClick={onClose}>Close editor</button><button onClick={() => onSubmit({ title: 'Updated Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', experienceLevel: 'Senior', status: 'Active', salaryRange: '', description: 'Updated', benefits: '', tags: [] })}>{isEditMode ? 'Save edit' : 'Create vacancy'}</button></div> : null,
}))
vi.mock('../../components/candidates/CandidatesListModal', () => ({ CandidatesListModal: () => null }))

const job: JobDto = {
  id: 'job-1', companyId: 'acme', title: 'React Engineer', department: 'Engineering',
  location: 'Remote', employmentType: 'Full-time', experienceLevel: 'Senior',
  status: 'Active', description: 'Build interfaces', createdAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.mocked(jobsApi.getJobs).mockReset().mockResolvedValue([job])
  vi.mocked(jobsApi.createJob).mockReset().mockResolvedValue(job)
  vi.mocked(jobsApi.updateJob).mockReset().mockResolvedValue(job)
  vi.mocked(jobsApi.deleteJob).mockReset().mockResolvedValue(undefined)
})

describe('Employer vacancies', () => {
  it('TC032 renders the employer job list', async () => {
    render(<JobVacancies />)
    expect(await screen.findByText('React Engineer')).toBeInTheDocument()
    expect(jobsApi.getJobs).toHaveBeenCalledOnce()
  })

  it('TC033 filters the employer job list', async () => {
    render(<JobVacancies />)
    await screen.findByText('React Engineer')
    await userEvent.setup().type(screen.getByPlaceholderText('Search by job title, department, or keyword...'), 'designer')
    expect(screen.getByText('No job vacancies found')).toBeInTheDocument()
  })

  it('TC034 opens and closes the create vacancy modal', async () => {
    render(<JobVacancies />)
    await screen.findByText('React Engineer')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Create New Job/ }))
    expect(screen.getByRole('dialog', { name: 'Vacancy editor' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close editor' }))
    expect(screen.queryByRole('dialog', { name: 'Vacancy editor' })).not.toBeInTheDocument()
  })

  it('TC035 updates an existing vacancy through the editor', async () => {
    vi.mocked(jobsApi.getJobs).mockResolvedValueOnce([job]).mockResolvedValueOnce([{ ...job, title: 'Updated Engineer' }])
    render(<JobVacancies />)
    await screen.findByText('React Engineer')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Edit React Engineer' }))
    await user.click(screen.getByRole('button', { name: 'Save edit' }))
    await waitFor(() => expect(jobsApi.updateJob).toHaveBeenCalledWith('job-1', expect.objectContaining({ title: 'Updated Engineer' })))
    expect(await screen.findByText('Updated Engineer')).toBeInTheDocument()
  })

  it('TC036 requires confirmation before deleting a vacancy', async () => {
    render(<JobVacancies />)
    await screen.findByText('React Engineer')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Delete React Engineer' }))
    expect(screen.getByText('Delete Job Vacancy?')).toBeInTheDocument()
    expect(jobsApi.deleteJob).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Delete Job Vacancy?')).not.toBeInTheDocument()
    expect(jobsApi.deleteJob).not.toHaveBeenCalled()
  })

  it('TC037 deletes the vacancy after confirmation', async () => {
    render(<JobVacancies />)
    await screen.findByText('React Engineer')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Delete React Engineer' }))
    await user.click(screen.getByRole('button', { name: 'Delete Permanently' }))
    await waitFor(() => expect(jobsApi.deleteJob).toHaveBeenCalledWith('job-1'))
    expect(screen.getByText('No job vacancies found')).toBeInTheDocument()
  })

  it('TC041 creates a vacancy and refreshes the displayed list', async () => {
    vi.mocked(jobsApi.getJobs).mockResolvedValueOnce([job]).mockResolvedValueOnce([job, { ...job, id: 'job-2', title: 'Updated Engineer' }])
    render(<JobVacancies />)
    await screen.findByText('React Engineer')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Create New Job/ }))
    await user.click(screen.getByRole('button', { name: 'Create vacancy' }))
    await waitFor(() => expect(jobsApi.createJob).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Engineer' })))
    expect(await screen.findByText('Updated Engineer')).toBeInTheDocument()
  })

  it('TC085 preserves a vacancy when deletion fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const alert = vi.fn()
    vi.stubGlobal('alert', alert)
    vi.mocked(jobsApi.deleteJob).mockRejectedValue(new Error('Delete unavailable'))
    render(<JobVacancies />)
    await screen.findByText('React Engineer')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Delete React Engineer' }))
    await user.click(screen.getByRole('button', { name: 'Delete Permanently' }))
    await waitFor(() => expect(jobsApi.deleteJob).toHaveBeenCalledWith('job-1'))
    expect(screen.getByText('React Engineer')).toBeInTheDocument()
    expect(alert).toHaveBeenCalledWith('Delete unavailable')
  })
})
