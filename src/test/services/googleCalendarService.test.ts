import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eventsApi, type HolidayConfigDto } from '../../services/api'
import { googleCalendarService } from '../../services/googleCalendarService'

vi.mock('../../services/api', () => ({ eventsApi: {
  getHolidays: vi.fn(), getHolidayConfig: vi.fn(), updateHolidayConfig: vi.fn(),
} }))

beforeEach(() => {
  localStorage.clear()
  googleCalendarService.clearCache()
  vi.mocked(eventsApi.getHolidays).mockReset().mockResolvedValue([])
  vi.mocked(eventsApi.getHolidayConfig).mockReset()
  vi.mocked(eventsApi.updateHolidayConfig).mockReset()
})

describe('Holiday calendar service', () => {
  it('TC109 maps legacy calendar IDs and persists selection and enabled state', () => {
    expect(googleCalendarService.getSelectedCalendarId()).toBe('LK')
    localStorage.setItem('skillhub_holiday_country_code', 'legacy.usa#holiday@group.calendar.google.com')
    expect(googleCalendarService.getSelectedCalendarId()).toBe('US')
    googleCalendarService.setSelectedCalendarId('in')
    expect(googleCalendarService.getSelectedCalendarId()).toBe('IN')
    expect(googleCalendarService.isEnabled()).toBe(true)
    googleCalendarService.setEnabled(false)
    expect(googleCalendarService.isEnabled()).toBe(false)
  })

  it('TC110 requests country and month from the backend and caches the mapped result', async () => {
    vi.mocked(eventsApi.getHolidays).mockResolvedValue([{
      id: 'holiday-1', title: 'Public Holiday', description: '', date: '2026-10-12',
      country: 'Sri Lanka', countryCode: 'LK', source: 'Google',
    }])
    const request = { year: 2026, month: 10, calendarId: 'LK' }
    const first = await googleCalendarService.fetchHolidays(request)
    const second = await googleCalendarService.fetchHolidays(request)
    expect(eventsApi.getHolidays).toHaveBeenCalledWith({ year: 2026, month: 10, country: 'LK' })
    expect(eventsApi.getHolidays).toHaveBeenCalledTimes(1)
    expect(second).toEqual(first)
    expect(first[0]).toEqual(expect.objectContaining({ id: 'holiday-1', calendarId: 'LK', description: 'National / Public Holiday' }))
  })

  it('TC111 propagates authorization and network errors without caching them', async () => {
    vi.mocked(eventsApi.getHolidays).mockRejectedValueOnce(new Error('Unauthorized')).mockResolvedValueOnce([])
    await expect(googleCalendarService.fetchHolidays({ year: 2026, month: 11 })).rejects.toThrow('Unauthorized')
    await expect(googleCalendarService.fetchHolidays({ year: 2026, month: 11 })).resolves.toEqual([])
    expect(eventsApi.getHolidays).toHaveBeenCalledTimes(2)
  })

  it('TC112 refreshes holiday data after the configuration changes', async () => {
    const config: HolidayConfigDto = { hasApiKey: true, source: 'Google', isGoogleConnected: true }
    vi.mocked(eventsApi.getHolidayConfig).mockResolvedValue(config)
    vi.mocked(eventsApi.updateHolidayConfig).mockResolvedValue(config)
    await googleCalendarService.fetchHolidays({ year: 2026, month: 12 })
    expect(await googleCalendarService.getHolidayConfig()).toEqual(config)
    expect(await googleCalendarService.updateHolidayConfig('test-key')).toEqual(config)
    await googleCalendarService.fetchHolidays({ year: 2026, month: 12 })
    expect(eventsApi.updateHolidayConfig).toHaveBeenCalledWith({ apiKey: 'test-key' })
    expect(eventsApi.getHolidays).toHaveBeenCalledTimes(2)
  })
})
