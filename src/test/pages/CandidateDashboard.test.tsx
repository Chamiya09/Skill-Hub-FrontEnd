import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateDashboard } from '../../pages/CandidateDashboard'
import { eventsApi, type CandidateInterviewDto } from '../../services/api'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual<typeof import('../../services/api')>('../../services/api')
  return {
    ...actual,
    eventsApi: {
      getMyInterviews: vi.fn(),
    },
  }
})

const mockInterviews: CandidateInterviewDto[] = [
  {
    id: 'interview-1',
    title: 'Senior Frontend Tech Screen',
    jobTitle: 'Senior Frontend Tech Screen',
    companyName: 'TechCorp Solutions',
    eventDate: '2026-12-15',
    eventTime: '10:00:00',
    meetingMode: 'Online',
    location: 'https://meet.google.com/abc-defg-hij',
    status: 'Scheduled',
    description: 'Please prepare TypeScript and React hooks architecture.',
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'interview-2',
    title: 'On-site Cultural Round',
    jobTitle: 'On-site Cultural Round',
    companyName: 'Innovate Labs',
    eventDate: '2026-12-20',
    eventTime: '14:30:00',
    meetingMode: 'Physical',
    location: '123 Innovation Way, Floor 4',
    status: 'Scheduled',
    description: 'Bring ID for reception.',
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'interview-3',
    title: 'Past Technical Deep Dive',
    jobTitle: 'Past Technical Deep Dive',
    companyName: 'Legacy Systems',
    eventDate: '2025-01-01',
    eventTime: '09:00:00',
    meetingMode: 'Online',
    status: 'Completed',
    createdAt: '2026-01-01T00:00:00Z',
  },
]

describe('Candidate Dashboard - Interviews & Activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('TC148 renders dashboard with loading state then displays scheduled interviews', async () => {
    vi.mocked(eventsApi.getMyInterviews).mockResolvedValue(mockInterviews)

    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>
    )

    expect(await screen.findByText('Senior Frontend Tech Screen')).toBeInTheDocument()
    expect(screen.getByText('TechCorp Solutions')).toBeInTheDocument()
    expect(screen.getByText('On-site Cultural Round')).toBeInTheDocument()
  })

  it('TC149 filters interviews by mode and search keywords', async () => {
    vi.mocked(eventsApi.getMyInterviews).mockResolvedValue(mockInterviews)
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>
    )

    await screen.findByText('Senior Frontend Tech Screen')

    // Filter by online
    const modeSelect = screen.getByLabelText(/Mode/i)
    await user.selectOptions(modeSelect, 'online')
    expect(screen.getByText('Senior Frontend Tech Screen')).toBeInTheDocument()
    expect(screen.queryByText('On-site Cultural Round')).not.toBeInTheDocument()

    // Filter by keyword
    const searchInput = screen.getByPlaceholderText(/Search company, role, or location/i)
    await user.type(searchInput, 'TechCorp')
    expect(screen.getByText('Senior Frontend Tech Screen')).toBeInTheDocument()
  })

  it('TC150 copies meeting link to clipboard when button is clicked', async () => {
    vi.mocked(eventsApi.getMyInterviews).mockResolvedValue(mockInterviews)
    const user = userEvent.setup()

    const writeTextSpy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
    })

    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>
    )

    await screen.findByText('Senior Frontend Tech Screen')

    const copyBtn = screen.getByRole('button', { name: /Copy Link/i })
    await user.click(copyBtn)

    expect(writeTextSpy).toHaveBeenCalledWith('https://meet.google.com/abc-defg-hij')
    expect(await screen.findByText(/^Copied$/i)).toBeInTheDocument()
  })

  it('TC151 displays empty state when candidate has no interviews', async () => {
    vi.mocked(eventsApi.getMyInterviews).mockResolvedValue([])

    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/No Interviews Scheduled Yet/i)).toBeInTheDocument()
    })
  })

  it('TC152 handles API failure gracefully and allows retry', async () => {
    vi.mocked(eventsApi.getMyInterviews)
      .mockRejectedValueOnce(new Error('Network connectivity lost'))
      .mockResolvedValueOnce(mockInterviews)

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CandidateDashboard />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Network connectivity lost/i)).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    await user.click(retryBtn)

    expect(await screen.findByText('Senior Frontend Tech Screen')).toBeInTheDocument()
  })
})
