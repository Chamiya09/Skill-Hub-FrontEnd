import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiInterviewSchedulerModal } from '../../components/AiInterviewSchedulerModal'
import {
  assessmentsApi,
  eventsApi,
  jobsApi,
  type JobDto,
  type SubmissionDetailDto,
  type ScheduleProposalResponseDto,
} from '../../services/api'

vi.mock('../../services/api', () => ({
  assessmentsApi: {
    getInterviewSelections: vi.fn(),
  },
  jobsApi: {
    getJobs: vi.fn(),
  },
  eventsApi: {
    generateInterviewSchedule: vi.fn(),
    confirmInterviewSchedule: vi.fn(),
  },
}))

const mockJobs: JobDto[] = [
  {
    id: 'job-101',
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    experienceLevel: 'Senior',
    status: 'Active',
    companyId: 'company-1',
    location: 'Colombo',
    employmentType: 'Full-time',
    description: 'Tech lead role',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

const scheduledSubmission: SubmissionDetailDto = {
  id: 'sub-1',
  assessmentId: 'asm-1',
  assessmentTitle: 'Fullstack Test',
  candidateId: 'cand-1',
  candidateName: 'Kasun Perera',
  candidateEmail: 'kasun@test.lk',
  applicationId: 'app-1',
  jobVacancyId: 'job-101',
  jobTitle: 'Senior Full Stack Engineer',
  examScore: 92,
  cvScore: 88,
  finalWeightedScore: 90,
  passingThreshold: 60,
  status: 'Ready for Interview',
  scheduledEventId: 'event-999',
  scheduledDate: '2026-10-18',
  scheduledTime: '10:00 - 10:30',
  scheduledMeetingMode: 'Online',
  scheduledLocation: 'https://meet.google.com/test-room',
  isSelectedForInterview: true,
  answers: [],
  proctorSummary: { tabSwitches: 0, windowBlurs: 0, events: [] },
}

const mockProposal: ScheduleProposalResponseDto = {
  jobVacancyId: 'job-101',
  jobTitle: 'Senior Full Stack Engineer',
  proposedSlots: [
    {
      slotId: 'slot-1',
      candidateId: 'cand-2',
      candidateName: 'Nimali Silva',
      candidateEmail: 'nimali@test.lk',
      date: '2026-10-19',
      startTime: '09:00',
      endTime: '09:30',
      trackNumber: 1,
      trackName: 'Track 1',
      isExtendedSearch: false,
    },
  ],
  unscheduledCandidates: [],
  alreadyScheduledCandidates: [
    {
      candidateId: 'cand-1',
      candidateName: 'Kasun Perera',
      candidateEmail: 'kasun@test.lk',
      date: '2026-10-18',
      timeSlot: '10:00 - 10:30',
      meetingMode: 'Online',
      location: 'https://meet.google.com/test-room',
      status: 'Scheduled',
    },
  ],
  summary: {
    totalCandidates: 2,
    scheduledCount: 1,
    unscheduledCount: 0,
    alreadyScheduledCount: 1,
    originalDateRange: '2026-10-18 to 2026-10-22',
    effectiveDateRange: '2026-10-18 to 2026-10-22',
    forwardDaysExtended: 0,
    tracksUtilized: 1,
    assumptionsMade: ['Working hours set from 09:00 to 17:00'],
    aiValidationNotes: ['Generated 1 clash-free interview session'],
  },
  isDraft: true,
}

beforeEach(() => {
  vi.mocked(jobsApi.getJobs).mockReset().mockResolvedValue(mockJobs)
  vi.mocked(assessmentsApi.getInterviewSelections).mockReset().mockResolvedValue([scheduledSubmission])
  vi.mocked(eventsApi.generateInterviewSchedule).mockReset().mockResolvedValue(mockProposal)
})

describe('AI Interview Scheduler Modal - Already Scheduled Candidates Path', () => {
  it('TC205 renders already-scheduled candidates in View A configuration path', async () => {
    render(
      <AiInterviewSchedulerModal
        isOpen={true}
        onClose={vi.fn()}
        availableJobs={mockJobs}
        initialJobVacancyId="job-101"
      />
    )

    // Check title and badge
    expect(await screen.findByText('Already Scheduled Candidates')).toBeInTheDocument()
    expect(await screen.findByText('1 Scheduled')).toBeInTheDocument()

    // Check candidate details in table
    expect(await screen.findByText('Kasun Perera')).toBeInTheDocument()
    expect(screen.getByText('kasun@test.lk')).toBeInTheDocument()
    expect(screen.getByText('2026-10-18')).toBeInTheDocument()
    expect(screen.getByText(/10:00 AM/i)).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('TC206 displays Already Scheduled metric card and dedicated review panel in View B proposal review path', async () => {
    const user = userEvent.setup()
    render(
      <AiInterviewSchedulerModal
        isOpen={true}
        onClose={vi.fn()}
        availableJobs={mockJobs}
        initialJobVacancyId="job-101"
      />
    )

    // Wait for initial load
    await screen.findByText('Kasun Perera')

    // Submit form to generate proposal
    const generateBtn = screen.getByRole('button', { name: /Generate Clash-Free Schedule/i })
    await user.click(generateBtn)

    // View B: Proposal review path
    // 1. Metric card for Already Scheduled
    expect(await screen.findByText('Already Scheduled')).toBeInTheDocument()

    // 2. Dedicated Already Scheduled review panel with no action required
    expect(screen.getByText('No Action Required')).toBeInTheDocument()
    expect(screen.getByText(/safely protected these existing appointments/i)).toBeInTheDocument()

    // 3. Proposed new slots for unscheduled candidates
    expect(screen.getByText(/Proposed New Appointments/i)).toBeInTheDocument()
    expect(screen.getByText('Nimali Silva')).toBeInTheDocument()
  })
})
