import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateAssessments } from '../../pages/CandidateAssessments'
import { useAuth } from '../../context/AuthContext'
import { assessmentsApi, type CandidateAssessmentListItemDto } from '../../services/api'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../services/api', () => ({ assessmentsApi: {
  getMyAssessments: vi.fn(), getCandidateAssessments: vi.fn(), getSubmissionDetail: vi.fn(),
} }))

const assigned: CandidateAssessmentListItemDto = {
  submissionId: 'submission-1', assessmentId: 'assessment-1', assessmentTitle: 'React Challenge',
  jobVacancyId: 'job-1', jobTitle: 'React Engineer', companyName: 'Acme', department: 'Engineering',
  timeLimitMinutes: 60, questionCount: 2, passingThreshold: 70, status: 'Assigned', examScore: 0,
  finalWeightedScore: 0, isPassed: false, assignedAt: '2026-01-01T00:00:00Z',
}
const renderPage = () => render(
  <MemoryRouter initialEntries={['/candidate/assessments']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/candidate/assessments" element={<CandidateAssessments />} />
      <Route path="/exam/take/:id" element={<h1>Exam destination</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ currentUser: { id: 'candidate-1' } } as ReturnType<typeof useAuth>)
  vi.mocked(assessmentsApi.getMyAssessments).mockReset().mockResolvedValue([assigned])
  vi.mocked(assessmentsApi.getCandidateAssessments).mockReset()
  vi.mocked(assessmentsApi.getSubmissionDetail).mockReset()
})

describe('Candidate assessments', () => {
  it('TC086 lists assigned assessments and starts the selected exam', async () => {
    renderPage()
    expect(await screen.findByText('React Challenge')).toBeInTheDocument()
    expect(screen.getByText('React Engineer')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Start Assessment' }))
    expect(screen.getByRole('heading', { name: 'Exam destination' })).toBeInTheDocument()
  })

  it('TC087 filters by status and search without changing the assigned list', async () => {
    vi.mocked(assessmentsApi.getMyAssessments).mockResolvedValue([
      assigned,
      { ...assigned, submissionId: 'submission-2', assessmentTitle: 'Java Challenge', status: 'Graded', examScore: 85, isPassed: true },
    ])
    renderPage()
    await screen.findByText('Java Challenge')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Completed (1)' }))
    expect(screen.queryByText('React Challenge')).not.toBeInTheDocument()
    expect(screen.getByText('Java Challenge')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Search by job, track, or company...'), 'missing')
    expect(screen.getByRole('heading', { name: 'No Matching Assessments Found' })).toBeInTheDocument()
  })

  it('TC088 disables exam entry for expired assignments', async () => {
    vi.mocked(assessmentsApi.getMyAssessments).mockResolvedValue([{ ...assigned, isExpired: true }])
    renderPage()
    await screen.findByText('React Challenge')
    expect(screen.getByRole('button', { name: 'Expired' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Start Assessment' })).not.toBeInTheDocument()
  })

  it('TC089 falls back to candidate ID when the current-user endpoint fails', async () => {
    vi.mocked(assessmentsApi.getMyAssessments).mockRejectedValue(new Error('Claims unavailable'))
    vi.mocked(assessmentsApi.getCandidateAssessments).mockResolvedValue([assigned])
    renderPage()
    expect(await screen.findByText('React Challenge')).toBeInTheDocument()
    expect(assessmentsApi.getCandidateAssessments).toHaveBeenCalledWith('candidate-1')
  })

  it('TC090 reports failure and retries loading', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(assessmentsApi.getMyAssessments).mockRejectedValueOnce(new Error('Service unavailable')).mockResolvedValueOnce([assigned])
    vi.mocked(assessmentsApi.getCandidateAssessments).mockRejectedValueOnce(new Error('Service unavailable'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByText('React Challenge')).toBeInTheDocument())
  })
})
