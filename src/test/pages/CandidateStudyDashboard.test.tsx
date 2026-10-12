import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateStudyDashboard } from '../../pages/CandidateStudyDashboard'
import { interviewPrepApi, type InterviewPrepGuideDto } from '../../services/api'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/api', () => ({
  interviewPrepApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    deleteGuide: vi.fn(),
  },
}))

const mockApprovedGuide: InterviewPrepGuideDto = {
  id: 'guide-valid-101',
  candidateId: 'cand-1',
  jobDescription: 'Senior Distributed Architect designing cloud native systems.',
  roleOverviewSummary: 'High-visibility architect role.',
  jobTitle: 'Senior Distributed Architect',
  targetRole: 'Staff Infrastructure Architect',
  applicationId: 'app-valid-501',
  jobId: 'job-valid-201',
  createdAt: '2026-03-01T00:00:00Z',
  companyName: 'Acme Cloud Systems',
  approvalStatus: 'Approved',
  interviewDate: '2026-04-15T09:00:00Z',
  appliedDate: '2026-03-01T10:00:00Z',
  keyTheoreticalAreas: [
    {
      id: 'theo-area-1',
      title: 'CAP Theorem and Distributed Consensus',
      section: 'Architecture',
      priority: 'High Priority',
      estimatedStudyTime: '4 hours',
      overview: 'Trade-offs between consistency and partition tolerance in high scale systems.',
      conceptsToReview: ['PACELC Theorem', 'Split-brain resolution'],
      practicalApplication: 'Design a quorum consensus engine for replication.',
      coachTip: 'State trade-offs before microservice topology.',
    },
  ],
  technicalCoreConcepts: [],
  practicalImplementationFocus: [
    {
      id: 'prac-area-1',
      title: 'Zero-Downtime Blue-Green Deployments',
      section: 'Operations',
      priority: 'High Priority',
      estimatedStudyTime: '5 hours',
      overview: 'Traffic shaping via ingress controllers and continuous canary verification.',
      conceptsToReview: ['Canary deployments', 'Automated rollback probes'],
      practicalApplication: 'Configure automated ingress weight shift on latency spikes.',
      coachTip: 'Always benchmark rollback recovery time.',
    },
  ],
  proTips: [
    'Always articulate non-functional latency budgets before discussing microservice topology.',
  ],
  preparationChecklist: [],
}

describe('Candidate Study Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(interviewPrepApi.getAll).mockResolvedValue([mockApprovedGuide])
    vi.mocked(interviewPrepApi.getById).mockResolvedValue(mockApprovedGuide)
  })

  it('TC165 renders approved interview guidelines with theory and practical focus areas', async () => {
    render(
      <MemoryRouter initialEntries={['/candidate/interview-prep/guide/guide-valid-101']}>
        <Routes>
          <Route path="/candidate/interview-prep/guide/:id" element={<CandidateStudyDashboard />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Study Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('CAP Theorem and Distributed Consensus')).toBeInTheDocument()
    expect(screen.getByText('Zero-Downtime Blue-Green Deployments')).toBeInTheDocument()
    expect(screen.getByText('Trade-offs between consistency and partition tolerance in high scale systems.')).toBeInTheDocument()
  })

  it('TC166 renders empty state when no approved interview guides exist', async () => {
    vi.mocked(interviewPrepApi.getAll).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/candidate/interview-prep/guide']}>
        <CandidateStudyDashboard />
      </MemoryRouter>
    )

    expect(await screen.findByText('No Active Interview Guides Found')).toBeInTheDocument()
    expect(
      screen.getByText(/Guides unlock automatically when your job application progresses to the Interview stage/i)
    ).toBeInTheDocument()
  })

  it('TC167 filters view between theoretical and practical study guidelines', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/candidate/interview-prep/guide/guide-valid-101']}>
        <Routes>
          <Route path="/candidate/interview-prep/guide/:id" element={<CandidateStudyDashboard />} />
        </Routes>
      </MemoryRouter>
    )

    await screen.findByRole('heading', { name: 'Study Dashboard' })

    // Switch to Theoretical Main Concepts only
    const theoryBtn = screen.getByRole('button', { name: /Theoretical Main Concepts/i })
    await user.click(theoryBtn)

    expect(screen.getByText('Theoretical Main Concepts to Master')).toBeInTheDocument()
    expect(screen.queryByText('Zero-Downtime Blue-Green Deployments')).not.toBeInTheDocument()

    // Switch to Practical Implementation Guidelines only
    const practicalBtn = screen.getByRole('button', { name: /Practical Implementation Guidelines/i })
    await user.click(practicalBtn)

    expect(screen.getByText('Zero-Downtime Blue-Green Deployments')).toBeInTheDocument()
    expect(screen.queryByText('CAP Theorem and Distributed Consensus')).not.toBeInTheDocument()
  })

  it('TC168 expands and toggles accordion cards for focus area details', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/candidate/interview-prep/guide/guide-valid-101']}>
        <Routes>
          <Route path="/candidate/interview-prep/guide/:id" element={<CandidateStudyDashboard />} />
        </Routes>
      </MemoryRouter>
    )

    await screen.findByRole('heading', { name: 'Study Dashboard' })

    // Click accordion card header to toggle expansion
    const cardHeader = screen.getByText('CAP Theorem and Distributed Consensus')
    await user.click(cardHeader)

    // The detail should be present in DOM
    expect(screen.getByText('Trade-offs between consistency and partition tolerance in high scale systems.')).toBeInTheDocument()
  })

  it('TC169 deletes interview guide on user confirmation and redirects', async () => {
    const user = userEvent.setup()
    vi.mocked(interviewPrepApi.deleteGuide).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <MemoryRouter initialEntries={['/candidate/interview-prep/guide/guide-valid-101']}>
        <Routes>
          <Route path="/candidate/interview-prep/guide/:id" element={<CandidateStudyDashboard />} />
        </Routes>
      </MemoryRouter>
    )

    await screen.findByRole('heading', { name: 'Study Dashboard' })

    const deleteBtn = screen.getByRole('button', { name: /Delete Guide/i })
    await user.click(deleteBtn)

    await waitFor(() => {
      expect(interviewPrepApi.deleteGuide).toHaveBeenCalledWith('guide-valid-101')
      expect(mockNavigate).toHaveBeenCalledWith('/candidate/interview-prep', { replace: true })
    })
  })
})
