import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateInterviewPrep } from '../../pages/CandidateInterviewPrep'
import {
  interviewPrepApi,
  jobApplicationsApi,
  type CandidateApplicationItemDto,
  type InterviewPrepGuideDto,
} from '../../services/api'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/api', () => ({
  jobApplicationsApi: {
    getMyApplications: vi.fn(),
  },
  interviewPrepApi: {
    getAll: vi.fn(),
    generate: vi.fn(),
    approve: vi.fn(),
    regenerate: vi.fn(),
    getById: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockInterviewApp: CandidateApplicationItemDto = {
  id: 'app-int-1',
  jobId: 'job-501',
  jobTitle: 'Senior Cloud Architect',
  companyName: 'Apex Cloud Solutions',
  status: 'Interview',
  appliedDate: '2026-03-01T10:00:00Z',
  location: 'Remote',
  employmentType: 'Full-time',
  workplaceType: 'Remote',
}

const mockAppliedApp: CandidateApplicationItemDto = {
  id: 'app-applied-2',
  jobId: 'job-502',
  jobTitle: 'Frontend Engineer',
  companyName: 'Nova Web Inc',
  status: 'Applied',
  appliedDate: '2026-03-05T10:00:00Z',
  location: 'San Francisco, CA',
  employmentType: 'Full-time',
  workplaceType: 'On-site',
}

const mockReadyGuide: InterviewPrepGuideDto = {
  id: 'guide-101',
  candidateId: 'cand-1',
  jobDescription: 'Senior cloud architect leading hybrid cloud infrastructure.',
  roleOverviewSummary: 'Enterprise cloud engineering position.',
  applicationId: 'app-int-1',
  jobId: 'job-501',
  jobTitle: 'Senior Cloud Architect',
  targetRole: 'Senior Cloud Architect',
  companyName: 'Apex Cloud Solutions',
  approvalStatus: 'Approved',
  createdAt: '2026-03-01T00:00:00Z',
  keyTheoreticalAreas: [
    {
      id: 'theo-1',
      title: 'Distributed Consensus',
      section: 'Architecture',
      priority: 'High Priority',
      estimatedStudyTime: '4 hours',
      overview: 'Understanding Raft and Paxos protocols',
      conceptsToReview: ['Quorum', 'Leader Election'],
      practicalApplication: 'Clustered failover',
      coachTip: 'Focus on network partitions',
    },
  ],
  technicalCoreConcepts: [],
  practicalImplementationFocus: [],
  proTips: ['Review consistency trade-offs before interview'],
  preparationChecklist: [],
}

describe('Candidate Interview Preparation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(jobApplicationsApi.getMyApplications).mockResolvedValue([mockInterviewApp, mockAppliedApp])
    vi.mocked(interviewPrepApi.getAll).mockResolvedValue([])
  })

  it('TC160 loads applications and partitions interview stage jobs from other stages', async () => {
    render(
      <MemoryRouter>
        <CandidateInterviewPrep />
      </MemoryRouter>
    )

    expect(await screen.findByText('Senior Cloud Architect')).toBeInTheDocument()
    expect(screen.getByText('Apex Cloud Solutions')).toBeInTheDocument()

    // Non-interview application is present in other applications section
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Nova Web Inc')).toBeInTheDocument()
  })

  it('TC161 displays empty state when candidate has no interview applications', async () => {
    vi.mocked(jobApplicationsApi.getMyApplications).mockResolvedValue([mockAppliedApp])

    render(
      <MemoryRouter>
        <CandidateInterviewPrep />
      </MemoryRouter>
    )

    expect(await screen.findByText('No Interview Stages Unlocked Yet')).toBeInTheDocument()
  })

  it('TC162 opens review modal on AI generation and approves guide to navigate to study dashboard', async () => {
    const user = userEvent.setup()
    const generatedGuide: InterviewPrepGuideDto = {
      ...mockReadyGuide,
      id: 'guide-generated-202',
      approvalStatus: 'Pending Review',
    }

    vi.mocked(interviewPrepApi.generate).mockResolvedValue({
      id: 'guide-generated-202',
      guideId: 'guide-generated-202',
      message: 'Guide generated successfully',
      guide: generatedGuide,
    })

    vi.mocked(interviewPrepApi.approve).mockResolvedValue({
      ...generatedGuide,
      approvalStatus: 'Approved',
    })

    render(
      <MemoryRouter>
        <CandidateInterviewPrep />
      </MemoryRouter>
    )

    await screen.findByText('Senior Cloud Architect')

    const generateBtn = screen.getByRole('button', { name: /Generate AI Prep Guide/i })
    await user.click(generateBtn)

    await waitFor(() => {
      expect(interviewPrepApi.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job-501',
          targetRole: 'Senior Cloud Architect',
        })
      )
    })

    // Review Modal should appear
    expect(await screen.findByText('Review AI-Generated Study Guidelines')).toBeInTheDocument()

    const approveBtn = screen.getByRole('button', { name: /Approve & Save to Study Dashboard/i })
    await user.click(approveBtn)

    await waitFor(() => {
      expect(interviewPrepApi.approve).toHaveBeenCalledWith('guide-generated-202')
      expect(mockNavigate).toHaveBeenCalledWith('/candidate/interview-prep/guide/guide-generated-202')
    })
  })

  it('TC163 handles generation error gracefully displaying error notice', async () => {
    const user = userEvent.setup()
    vi.mocked(interviewPrepApi.generate).mockRejectedValueOnce(
      new Error('AI generation rate limit exceeded')
    )

    render(
      <MemoryRouter>
        <CandidateInterviewPrep />
      </MemoryRouter>
    )

    await screen.findByText('Senior Cloud Architect')

    const generateBtn = screen.getByRole('button', { name: /Generate AI Prep Guide/i })
    await user.click(generateBtn)

    expect(await screen.findByText(/AI generation rate limit exceeded/i)).toBeInTheDocument()
  })

  it('TC164 navigates directly to study dashboard when a guide is already ready', async () => {
    vi.mocked(interviewPrepApi.getAll).mockResolvedValue([mockReadyGuide])
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CandidateInterviewPrep />
      </MemoryRouter>
    )

    await screen.findByText('Senior Cloud Architect')

    const openGuideBtn = await screen.findByRole('button', { name: /View Saved Prep Guide/i })
    await user.click(openGuideBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/candidate/interview-prep/guide/guide-101')
  })
})
