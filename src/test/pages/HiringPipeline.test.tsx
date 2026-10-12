import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HiringPipeline } from '../../pages/HiringPipeline'
import {
  assessmentsApi,
  jobApplicationsApi,
  jobsApi,
  type JobDto,
  type ShortlistedApplicantDto,
  type AssessmentTrackSummaryDto,
  type DispatchAssessmentResponseDto,
} from '../../services/api'

vi.mock('../../services/api', () => ({
  jobsApi: { getJobs: vi.fn() },
  jobApplicationsApi: {
    getShortlisted: vi.fn(),
    getJobApplicants: vi.fn(),
    getCandidateProfileForEmployer: vi.fn(),
  },
  assessmentsApi: { getTracksByJob: vi.fn(), dispatch: vi.fn() },
}))

const job: JobDto = {
  id: 'job-1',
  companyId: 'company-1',
  title: 'React Engineer',
  department: 'Engineering',
  location: 'Remote',
  employmentType: 'Full-time',
  experienceLevel: 'Senior',
  status: 'Active',
  description: 'Build interfaces',
  createdAt: '2026-01-01T00:00:00Z',
}

const candidate: ShortlistedApplicantDto = {
  applicationId: 'application-1',
  candidateId: 'candidate-1',
  fullName: 'Alex Rivera',
  email: 'alex@example.test',
  location: 'Remote',
  skills: ['React', 'TypeScript'],
  appliedDate: '2026-01-02T00:00:00Z',
  aiMatchScore: 91,
}

const mockTrack: AssessmentTrackSummaryDto = {
  id: 'track-101',
  title: 'Full-Stack React Benchmark',
  timeLimitMinutes: 45,
  questionCount: 3,
  passingThreshold: 75,
  status: 'Active',
}

const mockDispatchResponse: DispatchAssessmentResponseDto = {
  submissionId: 'disp-1',
  assessmentId: 'track-101',
  assessmentTitle: 'Full-Stack React Benchmark',
  candidateId: 'cand-1',
  candidateEmail: 'alex@example.test',
  testLink: '/assessment/take/test-token-123',
  expiresInHours: 48,
  status: 'Sent',
  message: 'Assessment dispatched successfully',
}

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HiringPipeline />
    </MemoryRouter>
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(jobsApi.getJobs).mockReset().mockResolvedValue([job])
  vi.mocked(jobApplicationsApi.getShortlisted).mockReset().mockResolvedValue([candidate])
  vi.mocked(jobApplicationsApi.getJobApplicants).mockReset().mockResolvedValue([])
  vi.mocked(jobApplicationsApi.getCandidateProfileForEmployer).mockReset().mockResolvedValue({
    id: 'candidate-1',
    fullName: 'Alex Rivera',
    email: 'alex@example.test',
    skills: [],
    experiences: [],
    educations: [],
    projects: [],
    certifications: [],
  } as unknown as Awaited<ReturnType<typeof jobApplicationsApi.getCandidateProfileForEmployer>>)
  vi.mocked(assessmentsApi.getTracksByJob).mockReset().mockResolvedValue([])
  vi.mocked(assessmentsApi.dispatch).mockReset()
})

describe('Hiring pipeline', () => {
  it('TC117 loads published requisitions and their applicant counts', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'React Engineer' })).toBeInTheDocument()
    expect(jobApplicationsApi.getShortlisted).toHaveBeenCalledWith('job-1')
    expect(screen.getByText('1 Shortlisted')).toBeInTheDocument()
  })

  it('TC118 searches requisitions and clears a nonmatching filter', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'React Engineer' })
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Search requisitions by title, department, or location...'), 'missing')
    expect(screen.getByRole('heading', { name: 'No Jobs Match Filter' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expect(screen.getByRole('heading', { name: 'React Engineer' })).toBeInTheDocument()
  })

  it('TC119 displays an empty state when no requisitions exist', async () => {
    vi.mocked(jobsApi.getJobs).mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No Job Requisitions Found' })).toBeInTheDocument()
  })

  it('TC120 retries a failed requisition request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(jobsApi.getJobs).mockRejectedValueOnce(new Error('Pipeline unavailable')).mockResolvedValueOnce([job])
    renderPage()
    expect(await screen.findByText('Pipeline unavailable')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'React Engineer' })).toBeInTheDocument())
  })

  it('TC121 opens shortlisted candidates for a requisition', async () => {
    renderPage()
    await userEvent.setup().click(await screen.findByRole('heading', { name: 'React Engineer' }))
    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument()
    expect(jobApplicationsApi.getShortlisted).toHaveBeenCalledTimes(2)
  })

  it('TC122 searches and filters candidate within shortlisted modal', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('heading', { name: 'React Engineer' }))
    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText('Filter by name, skill, location, or email...')
    await user.type(searchInput, 'Nonexistent Candidate')

    expect(await screen.findByText('No candidates match your current filter query.')).toBeInTheDocument()

    await user.clear(searchInput)
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument()
  })

  it('TC123 opens Digital CV drawer when View CV is clicked', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('heading', { name: 'React Engineer' }))
    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument()

    const viewCvBtn = screen.getByRole('button', { name: /View CV/i })
    await user.click(viewCvBtn)

    await waitFor(() => {
      expect(jobApplicationsApi.getCandidateProfileForEmployer).toHaveBeenCalledWith('candidate-1')
    })
  })

  it('TC124 dispatches assessment to shortlisted candidate', async () => {
    vi.mocked(assessmentsApi.getTracksByJob).mockResolvedValue([mockTrack])
    vi.mocked(assessmentsApi.dispatch).mockResolvedValue(mockDispatchResponse)

    renderPage()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('heading', { name: 'React Engineer' }))
    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument()

    const connectBtn = screen.getByRole('button', { name: /Connect Assessment/i })
    await user.click(connectBtn)

    expect(await screen.findByText('Connect Skill Assessment')).toBeInTheDocument()

    const dispatchBtn = screen.getByRole('button', { name: /Dispatch to Candidate Profile/i })
    await user.click(dispatchBtn)

    await waitFor(() => {
      expect(assessmentsApi.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateId: 'candidate-1',
          applicationId: 'application-1',
          jobVacancyId: 'job-1',
        })
      )
    })

    expect(await screen.findByText('Assessment Delivered to Candidate Profile')).toBeInTheDocument()
  })
})
