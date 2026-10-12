import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MonthlyPlanner } from '../../pages/MonthlyPlanner'
import { eventsApi, jobsApi, type EventResponseDto } from '../../services/api'
import { googleCalendarService } from '../../services/googleCalendarService'

vi.mock('../../services/api', () => ({
  eventsApi: { getEvents: vi.fn(), getActiveDepartments: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  jobsApi: { getJobs: vi.fn() },
}))
vi.mock('../../services/googleCalendarService', () => ({
  HOLIDAY_CALENDARS: [{ id: 'LK', code: 'LK', country: 'Sri Lanka', flag: 'LK' }],
  DEFAULT_HOLIDAY_CALENDAR: { id: 'LK', code: 'LK', country: 'Sri Lanka', flag: 'LK' },
  googleCalendarService: {
    isEnabled: vi.fn(), getSelectedCalendarId: vi.fn(), fetchHolidays: vi.fn(),
    setEnabled: vi.fn(), setSelectedCalendarId: vi.fn(), clearCache: vi.fn(),
  },
}))

const event: EventResponseDto = {
  id: 'event-1', title: 'Team Review', eventDate: '2026-10-12', eventTime: '09:00 - 10:00',
  createdBy: 'company-1', createdAt: '2026-10-11T00:00:00Z',
}

beforeEach(() => {
  vi.mocked(eventsApi.getEvents).mockReset().mockResolvedValue([])
  vi.mocked(eventsApi.getActiveDepartments).mockReset().mockResolvedValue([])
  vi.mocked(eventsApi.create).mockReset().mockResolvedValue(event)
  vi.mocked(eventsApi.update).mockReset()
  vi.mocked(eventsApi.delete).mockReset()
  vi.mocked(jobsApi.getJobs).mockReset().mockResolvedValue([])
  vi.mocked(googleCalendarService.isEnabled).mockReturnValue(true)
  vi.mocked(googleCalendarService.getSelectedCalendarId).mockReturnValue('LK')
  vi.mocked(googleCalendarService.fetchHolidays).mockReset().mockResolvedValue([])
})

describe('Monthly planner', () => {
  it('TC126 loads the current month and holidays, then requests the next month', async () => {
    const today = new Date()
    render(<MonthlyPlanner />)
    await waitFor(() => expect(eventsApi.getEvents).toHaveBeenCalledWith({ year: today.getFullYear(), month: today.getMonth() + 1 }))
    expect(googleCalendarService.fetchHolidays).toHaveBeenCalledWith({ year: today.getFullYear(), month: today.getMonth() + 1, calendarId: 'LK' })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Next Month' }))
    const next = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    await waitFor(() => expect(eventsApi.getEvents).toHaveBeenCalledWith({ year: next.getFullYear(), month: next.getMonth() + 1 }))
  })

  it('TC127 creates an event with the selected date and time', async () => {
    render(<MonthlyPlanner />)
    await waitFor(() => expect(eventsApi.getEvents).toHaveBeenCalled())
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: 'Add Event' })[0])
    await user.type(screen.getByPlaceholderText('e.g., Technical Interview - Alex Johnson'), 'Team Review')
    await user.click(screen.getByRole('button', { name: 'Save Event' }))
    await waitFor(() => expect(eventsApi.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Team Review', eventTime: '09:00 - 10:00',
    })))
    expect(await screen.findByText(/scheduled successfully/)).toBeInTheDocument()
  }, 15000)

  it('TC128 keeps the event form open and reports a save failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(eventsApi.create).mockRejectedValue(new Error('Calendar unavailable'))
    render(<MonthlyPlanner />)
    await waitFor(() => expect(eventsApi.getEvents).toHaveBeenCalled())
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: 'Add Event' })[0])
    await user.type(screen.getByPlaceholderText('e.g., Technical Interview - Alex Johnson'), 'Team Review')
    await user.click(screen.getByRole('button', { name: 'Save Event' }))
    expect(await screen.findByText('Calendar unavailable')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Schedule New Event' })).toBeInTheDocument()
  }, 15000)

  it('TC129 reports event and holiday loading failures separately', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(eventsApi.getEvents).mockRejectedValue(new Error('Database unavailable'))
    vi.mocked(googleCalendarService.fetchHolidays).mockRejectedValue(new Error('Holiday authorization failed'))
    render(<MonthlyPlanner />)
    expect(await screen.findByText(/Could not load events from database/)).toBeInTheDocument()
    expect(await screen.findByText(/Holiday authorization failed/)).toBeInTheDocument()
  })
})
