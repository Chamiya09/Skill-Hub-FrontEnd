import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TechnicalAssessments } from '../../pages/TechnicalAssessments'
import { assessmentsApi, jobsApi, type AssessmentResponseDto, type JobDto } from '../../services/api'

vi.mock('../../services/api', () => ({
  jobsApi: { getJobs: vi.fn() },
  assessmentsApi: {
    getAssessmentsByJob: vi.fn(), getSubmissionsByJob: vi.fn(), getLeaderboard: vi.fn(),
    getInterviewSelections: vi.fn(), createManual: vi.fn(), delete: vi.fn(),
  },
  eventsApi: {},
}))

const job: JobDto = {
  id: 'job-1', companyId: 'company-1', title: 'React Engineer', department: 'Engineering',
  location: 'Remote', employmentType: 'Full-time', experienceLevel: 'Senior',
  status: 'Active', description: 'Build interfaces', createdAt: '2026-01-01T00:00:00Z',
}
const track: AssessmentResponseDto = {
  id: 'track-1', jobVacancyId: 'job-1', title: 'Frontend Fundamentals', generatedQuestions: [],
  finalQuestions: [], passingThreshold: 70, timeLimitMinutes: 60, createdBy: 'company-1',
  status: 'Draft', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', totalSubmissions: 0,
}

beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(jobsApi.getJobs).mockReset().mockResolvedValue([job])
  vi.mocked(assessmentsApi.getAssessmentsByJob).mockReset().mockResolvedValue([track])
  vi.mocked(assessmentsApi.getSubmissionsByJob).mockReset().mockResolvedValue([])
  vi.mocked(assessmentsApi.getLeaderboard).mockReset().mockResolvedValue([])
  vi.mocked(assessmentsApi.getInterviewSelections).mockReset().mockResolvedValue([])
  vi.mocked(assessmentsApi.createManual).mockReset().mockResolvedValue({ ...track, id: 'track-2', title: 'New Challenge' })
  vi.mocked(assessmentsApi.delete).mockReset().mockResolvedValue(undefined)
})

describe('Employer technical assessments', () => {
  it('TC113 loads tracks for the selected requisition and filters draft status', async () => {
    vi.mocked(assessmentsApi.getAssessmentsByJob).mockResolvedValue([track, { ...track, id: 'track-2', title: 'Advanced React', status: 'Published' }])
    render(<TechnicalAssessments />)
    expect(await screen.findByText('Frontend Fundamentals')).toBeInTheDocument()
    expect(assessmentsApi.getAssessmentsByJob).toHaveBeenCalledWith('job-1')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Published (1)' }))
    expect(screen.queryByText('Frontend Fundamentals')).not.toBeInTheDocument()
    expect(screen.getByText('Advanced React')).toBeInTheDocument()
  })

  it('TC114 validates a manual assessment before saving', async () => {
    render(<TechnicalAssessments />)
    await screen.findByText('Frontend Fundamentals')
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: 'Create Coding Assessment' })[0])
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }))
    expect(screen.getByText('Add at least one coding problem to the assessment.')).toBeInTheDocument()
    expect(assessmentsApi.createManual).not.toHaveBeenCalled()
  })

  it('TC115 creates a manual coding assessment with its problem', async () => {
    vi.mocked(assessmentsApi.getAssessmentsByJob).mockResolvedValue([])
    render(<TechnicalAssessments />)
    await waitFor(() => expect(assessmentsApi.getAssessmentsByJob).toHaveBeenCalled())
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: 'Create Coding Assessment' })[0])
    await user.clear(screen.getByPlaceholderText('e.g. Lead Full-Stack Engineer (AI & Enterprise Systems) Skill Assessment'))
    await user.type(screen.getByPlaceholderText('e.g. Lead Full-Stack Engineer (AI & Enterprise Systems) Skill Assessment'), 'New Challenge')
    await user.type(screen.getByPlaceholderText('e.g. Reverse Linked List, LRU Cache, Distributed Lock'), 'Sum numbers')
    await user.type(screen.getByPlaceholderText('Describe the task, expected inputs/outputs, performance constraints, and edge cases...'), 'Return a sum')
    await user.click(screen.getByRole('button', { name: 'Add Problem to Assessment' }))
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }))
    await waitFor(() => expect(assessmentsApi.createManual).toHaveBeenCalledWith(expect.objectContaining({
      jobVacancyId: 'job-1', title: 'New Challenge', publishImmediately: false,
      questions: [expect.objectContaining({ title: 'Sum numbers', problemStatement: 'Return a sum' })],
    })))
    expect(await screen.findByText('New Challenge')).toBeInTheDocument()
  })

  it('TC116 preserves an assessment when deletion fails', async () => {
    vi.mocked(assessmentsApi.delete).mockRejectedValue(new Error('Deletion rejected'))
    vi.stubGlobal('confirm', vi.fn(() => true))
    render(<TechnicalAssessments />)
    await screen.findByText('Frontend Fundamentals')
    await userEvent.setup().click(screen.getByRole('button', { name: /Delete/ }))
    expect(await screen.findByText('Deletion rejected')).toBeInTheDocument()
    expect(screen.getByText('Frontend Fundamentals')).toBeInTheDocument()
  })
})
