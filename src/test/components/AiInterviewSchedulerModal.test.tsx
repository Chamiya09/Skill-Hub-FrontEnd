import { render, screen, within } from '@testing-library/react'
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
    getEvents: vi.fn(),
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

const pendingSubmission: SubmissionDetailDto = {
  id: 'sub-2',
  assessmentId: 'asm-1',
  assessmentTitle: 'Fullstack Test',
  candidateId: 'cand-2',
  candidateName: 'Nimali Silva',
  candidateEmail: 'nimali@test.lk',
  applicationId: 'app-2',
  jobVacancyId: 'job-101',
  jobTitle: 'Senior Full Stack Engineer',
  examScore: 85,
  cvScore: 80,
  finalWeightedScore: 83,
  passingThreshold: 60,
  status: 'Pending',
  scheduledEventId: undefined,
  scheduledDate: undefined,
  scheduledTime: undefined,
  scheduledMeetingMode: undefined,
  scheduledLocation: undefined,
  isSelectedForInterview: false,
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
  unscheduledCandidates: [
    {
      candidateId: 'cand-3',
      candidateName: 'Kamal Gunaratne',
      candidateEmail: 'kamal@test.lk',
      reason: 'No available slot within working hours',
    },
  ],
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
    totalCandidates: 3,
    scheduledCount: 1,
    unscheduledCount: 1,
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
  vi.mocked(assessmentsApi.getInterviewSelections).mockReset().mockResolvedValue([scheduledSubmission, pendingSubmission])
  vi.mocked(eventsApi.getEvents).mockReset().mockResolvedValue([])
  vi.mocked(eventsApi.generateInterviewSchedule).mockReset().mockResolvedValue(mockProposal)
})

describe('AI Interview Scheduler Modal - Unified Proposal Table Path', () => {
  it('TC205 verifies View A configuration form does not render a table, keeping clean parameter inputs', async () => {
    render(
      <AiInterviewSchedulerModal
        isOpen={true}
        onClose={vi.fn()}
        availableJobs={mockJobs}
        initialJobVacancyId="job-101"
      />
    )

    // Form inputs are present
    expect(await screen.findByRole('button', { name: /Generate Clash-Free Schedule/i })).toBeInTheDocument()

    // No table rendered in the first popup form (View A)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('Kasun Perera')).not.toBeInTheDocument()
  })

  it('TC206 displays 3 clean metric cards and table with only first-time schedule candidates and empty unscheduled rows', async () => {
    const user = userEvent.setup()
    render(
      <AiInterviewSchedulerModal
        isOpen={true}
        onClose={vi.fn()}
        availableJobs={mockJobs}
        initialJobVacancyId="job-101"
      />
    )

    // Submit form in View A to generate proposal
    const generateBtn = await screen.findByRole('button', { name: /Generate Clash-Free Schedule/i })
    await user.click(generateBtn)

    // View B: Proposal review path
    // 1. Clean 3 metric cards are shown (Already Scheduled card is not shown)
    expect(await screen.findByText('Candidates')).toBeInTheDocument()
    expect(screen.getByText('Proposed Slots')).toBeInTheDocument()
    expect(screen.getByText('Unscheduled')).toBeInTheDocument()
    expect(screen.queryByText('Already Scheduled')).not.toBeInTheDocument()

    // 2. Table rendered in second popup form (View B)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    // 3. First-time schedule candidate with interactive controls and status
    expect(within(table).getByText('Nimali Silva')).toBeInTheDocument()
    expect(within(table).getByText('2026-10-19')).toBeInTheDocument()
    expect(within(table).getByText('Proposed Slot')).toBeInTheDocument()

    // 4. Already scheduled candidate is NOT in the table (no need to show them in the table)
    expect(within(table).queryByText('Kasun Perera')).not.toBeInTheDocument()

    // 5. Unscheduled candidate (could not be scheduled in this first-time schedule) shown as Empty / Not Scheduled in table
    expect(within(table).getByText('Kamal Gunaratne')).toBeInTheDocument()
    expect(within(table).getByText('Empty')).toBeInTheDocument()
    expect(within(table).getAllByText('Not Scheduled').length).toBe(2)
  })

  it('TC207 verifies that when all candidates are already Selected or Scheduled, it shows a clear empty state message and disables Approve & Confirm', async () => {
    const user = userEvent.setup()
    const allScheduledProposal: ScheduleProposalResponseDto = {
      jobVacancyId: 'job-101',
      jobTitle: 'Senior Full Stack Engineer',
      proposedSlots: [],
      unscheduledCandidates: [],
      summary: {
        totalCandidates: 0,
        scheduledCount: 0,
        unscheduledCount: 0,
        originalDateRange: '2026-10-18 to 2026-10-22',
        effectiveDateRange: '2026-10-18 to 2026-10-22',
        forwardDaysExtended: 0,
        tracksUtilized: 1,
        assumptionsMade: ['All candidates have been scheduled. There are no new candidates to process at this time.'],
        aiValidationNotes: ['Zero pending candidates require new interview slots.'],
      },
      isDraft: true,
    }

    vi.mocked(eventsApi.generateInterviewSchedule).mockResolvedValueOnce(allScheduledProposal)

    render(
      <AiInterviewSchedulerModal
        isOpen={true}
        onClose={vi.fn()}
        availableJobs={mockJobs}
        initialJobVacancyId="job-101"
      />
    )

    const generateBtn = await screen.findByRole('button', { name: /Generate Clash-Free Schedule/i })
    await user.click(generateBtn)

    // View B: Proposal review path
    // 1. Clean 3 metric cards are shown
    expect(await screen.findByText('Candidates')).toBeInTheDocument()

    // 2. Table is NOT displayed (Requirement 3: do NOT display an empty table)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    // 3. User-friendly empty state message is displayed in empty card
    const emptyCard = screen.getByTestId('ai-scheduler-empty-state')
    expect(emptyCard).toBeInTheDocument()
    expect(
      within(emptyCard).getByText('All candidates have been scheduled. There are no new candidates to process at this time.')
    ).toBeInTheDocument()

    // 4. "Approve & Confirm" button is DISABLED
    const approveBtn = screen.getByRole('button', { name: /Approve & Confirm/i })
    expect(approveBtn).toBeDisabled()
  })

  it('TC208 blocks the Generate Clash-Free Schedule button in View A when all candidates are already scheduled', async () => {
    // Only return already scheduled candidate (no pending candidates)
    vi.mocked(assessmentsApi.getInterviewSelections).mockResolvedValueOnce([scheduledSubmission])
    vi.mocked(eventsApi.getEvents).mockResolvedValueOnce([
      {
        id: 'event-999',
        candidateId: 'cand-1',
        title: 'Interview: Kasun Perera',
        eventDate: '2026-10-18',
        eventTime: '10:00 - 10:30',
      } as any,
    ])

    render(
      <AiInterviewSchedulerModal
        isOpen={true}
        onClose={vi.fn()}
        availableJobs={mockJobs}
        initialJobVacancyId="job-101"
      />
    )

    // Blocked alert banner is displayed in View A
    expect(await screen.findByTestId('ai-scheduler-blocked-banner')).toBeInTheDocument()
    expect(screen.getByText('All Candidates Already Scheduled')).toBeInTheDocument()

    // The Generate Clash-Free Schedule button is disabled and blocked
    const generateBtn = screen.getByRole('button', { name: /Scheduling Blocked/i })
    expect(generateBtn).toBeDisabled()
    expect(generateBtn).toHaveClass('is-blocked')
  })

  it('TC209 empties the proposal table in View B and displays empty state when proposal candidates are already scheduled', async () => {
    const user = userEvent.setup()
    // Proposal returns already-scheduled candidate Kasun Perera (cand-1)
    const proposalWithScheduledCand: ScheduleProposalResponseDto = {
      ...mockProposal,
      proposedSlots: [
        {
          slotId: 'slot-1',
          candidateId: 'cand-1',
          candidateName: 'Kasun Perera',
          candidateEmail: 'kasun@test.lk',
          date: '2026-10-19',
          startTime: '09:00',
          endTime: '09:30',
          trackNumber: 1,
          trackName: 'Track 1',
          isExtendedSearch: false,
        },
      ],
      unscheduledCandidates: [],
    }

    vi.mocked(eventsApi.generateInterviewSchedule).mockResolvedValueOnce(proposalWithScheduledCand)

    render(
      <AiInterviewSchedulerModal
        isOpen={true}
        onClose={vi.fn()}
        availableJobs={mockJobs}
        initialJobVacancyId="job-101"
      />
    )

    const generateBtn = await screen.findByRole('button', { name: /Generate Clash-Free Schedule/i })
    await user.click(generateBtn)

    // View B: Because cand-1 is already scheduled, table must be emptied
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('Kasun Perera')).not.toBeInTheDocument()

    // Empty state card is displayed instead
    const emptyCard = screen.getByTestId('ai-scheduler-empty-state')
    expect(emptyCard).toBeInTheDocument()
    expect(
      within(emptyCard).getByText('All candidates have been scheduled. There are no new candidates to process at this time.')
    ).toBeInTheDocument()

    // Approve & Confirm button is disabled
    const approveBtn = screen.getByRole('button', { name: /Approve & Confirm/i })
    expect(approveBtn).toBeDisabled()
  })
})

