import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InterviewSelection } from '../../pages/InterviewSelection'
import { assessmentsApi, jobsApi, type SubmissionDetailDto } from '../../services/api'

vi.mock('../../services/api', () => ({
  assessmentsApi: { getInterviewSelections: vi.fn(), reviewSubmission: vi.fn() },
  jobsApi: { getJobs: vi.fn() }, eventsApi: { deleteEvent: vi.fn() },
}))

const selected: SubmissionDetailDto = {
  id: 'submission-1', assessmentId: 'assessment-1', assessmentTitle: 'React Challenge',
  candidateId: 'candidate-1', candidateName: 'Alex Rivera', candidateEmail: 'alex@example.test',
  applicationId: 'application-1', jobVacancyId: 'job-1', jobTitle: 'React Engineer',
  examScore: 88, cvScore: 90, finalWeightedScore: 89, passingThreshold: 70,
  status: 'Passed', answers: [], proctorSummary: { tabSwitches: 0, windowBlurs: 0, events: [] },
  isSelectedForInterview: true,
}

beforeEach(() => {
  vi.mocked(assessmentsApi.getInterviewSelections).mockReset().mockResolvedValue([selected])
  vi.mocked(assessmentsApi.reviewSubmission).mockReset().mockResolvedValue({ ...selected, isSelectedForInterview: false })
  vi.mocked(jobsApi.getJobs).mockReset().mockResolvedValue([])
})

describe('Interview selection', () => {
  it('TC132 displays selected candidates and their scores', async () => {
    render(<InterviewSelection />)
    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument()
    expect(screen.getByText('React Engineer')).toBeInTheDocument()
    expect(assessmentsApi.getInterviewSelections).toHaveBeenCalledTimes(1)
  })

  it('TC133 filters candidates by search and restores the list', async () => {
    render(<InterviewSelection />)
    await screen.findByText('Alex Rivera')
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Search candidate name, email, or role...'), 'missing')
    expect(screen.getByText('No Candidates Found')).toBeInTheDocument()
    await user.clear(screen.getByPlaceholderText('Search candidate name, email, or role...'))
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument()
  })

  it('TC134 shows an empty state when no candidates are selected', async () => {
    vi.mocked(assessmentsApi.getInterviewSelections).mockResolvedValue([])
    render(<InterviewSelection />)
    expect(await screen.findByText('No Candidates Found')).toBeInTheDocument()
  })

  it('TC135 retries a failed selection request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(assessmentsApi.getInterviewSelections).mockRejectedValueOnce(new Error('Selection unavailable')).mockResolvedValueOnce([selected])
    render(<InterviewSelection />)
    expect(await screen.findByText('Selection unavailable')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByText('Alex Rivera')).toBeInTheDocument())
  })

  it('TC136 sends deselection to the review endpoint after confirmation', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    render(<InterviewSelection />)
    await screen.findByText('Alex Rivera')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove candidate from Interview Selection' }))
    await waitFor(() => expect(assessmentsApi.reviewSubmission).toHaveBeenCalledWith('submission-1', {
      examScore: 88, isSelectedForInterview: false, reviewerFeedback: undefined,
    }))
  })
})
