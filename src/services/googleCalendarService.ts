/**
 * Holiday Calendar Service for Public & National Holidays
 * 
 * Securely proxies holiday requests through the ASP.NET Core backend
 * (GET /api/Events/holidays?year={year}&month={month}&country={code})
 * which integrates with Google Calendar API and authentic Sri Lankan national holidays provider,
 * caching results for 24 hours.
 */

import { eventsApi, type NationalHolidayDto } from './api';

export interface GoogleCalendarHoliday {
  id: string;
  title: string;
  description?: string;
  date: string; // "YYYY-MM-DD"
  calendarId: string;
  countryName: string;
  countryCode: string;
}

export interface HolidayCalendarOption {
  id: string;
  country: string;
  code: string;
  flag: string;
}

export const DEFAULT_HOLIDAY_CALENDAR: HolidayCalendarOption = {
  id: 'LK',
  country: 'Sri Lanka',
  code: 'LK',
  flag: '🇱🇰',
};

export const HOLIDAY_CALENDARS: HolidayCalendarOption[] = [
  { id: 'LK', country: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
  { id: 'US', country: 'United States', code: 'US', flag: '🇺🇸' },
  { id: 'IN', country: 'India', code: 'IN', flag: '🇮🇳' },
  { id: 'GB', country: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { id: 'AU', country: 'Australia', code: 'AU', flag: '🇦🇺' },
  { id: 'CA', country: 'Canada', code: 'CA', flag: '🇨🇦' },
  { id: 'SG', country: 'Singapore', code: 'SG', flag: '🇸🇬' },
];

const STORAGE_KEYS = {
  COUNTRY_CODE: 'skillhub_holiday_country_code',
  ENABLED: 'skillhub_holiday_enabled',
};

// In-memory cache key: `${countryCode}_${year}_${month}` -> GoogleCalendarHoliday[]
const holidayCache = new Map<string, GoogleCalendarHoliday[]>();

export const googleCalendarService = {
  /**
   * Retrieves the currently selected country code (defaults to 'LK' for Sri Lanka).
   */
  getSelectedCalendarId(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.COUNTRY_CODE);
    if (!saved) return DEFAULT_HOLIDAY_CALENDAR.code;
    // Map any legacy Google Calendar IDs if previously stored in localStorage
    if (saved.includes('.lk#') || saved === 'LK') return 'LK';
    if (saved.includes('.usa#') || saved === 'US') return 'US';
    if (saved.includes('.indian#') || saved === 'IN') return 'IN';
    if (saved.includes('.uk#') || saved === 'GB') return 'GB';
    if (saved.includes('.australian#') || saved === 'AU') return 'AU';
    if (saved.includes('.canadian#') || saved === 'CA') return 'CA';
    if (saved.includes('.singapore#') || saved === 'SG') return 'SG';
    return saved;
  },

  /**
   * Saves the selected country code to localStorage.
   */
  setSelectedCalendarId(countryCode: string): void {
    const matched = HOLIDAY_CALENDARS.find(
      (c) => c.code.toLowerCase() === countryCode.toLowerCase() || c.id.toLowerCase() === countryCode.toLowerCase()
    );
    const code = matched ? matched.code : countryCode;
    localStorage.setItem(STORAGE_KEYS.COUNTRY_CODE, code);
  },

  /**
   * Checks whether national holidays display is enabled. Defaults to true.
   */
  isEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.ENABLED);
    return val === null ? true : val === 'true';
  },

  /**
   * Toggles national holidays display on/off.
   */
  setEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ENABLED, String(enabled));
  },

  /**
   * Fetches official holidays from ASP.NET Core backend.
   */
  async fetchHolidays(params: {
    year: number;
    month: number; // 1-12
    calendarId?: string;
  }): Promise<GoogleCalendarHoliday[]> {
    const calendarId = params.calendarId || this.getSelectedCalendarId();
    const matchedOption =
      HOLIDAY_CALENDARS.find(
        (c) => c.code.toLowerCase() === calendarId.toLowerCase() || c.id.toLowerCase() === calendarId.toLowerCase()
      ) || DEFAULT_HOLIDAY_CALENDAR;
    const countryCode = matchedOption.code;

    const cacheKey = `${countryCode}_${params.year}_${params.month}`;
    if (holidayCache.has(cacheKey)) {
      return holidayCache.get(cacheKey)!;
    }

    const data: NationalHolidayDto[] = await eventsApi.getHolidays({
      year: params.year,
      month: params.month,
      country: countryCode,
    });

    const holidays: GoogleCalendarHoliday[] = (data || []).map((h) => ({
      id: h.id || `${h.date}_${h.title}`,
      title: h.title,
      description: h.description || 'National / Public Holiday',
      date: h.date,
      calendarId: countryCode,
      countryName: h.country || matchedOption.country,
      countryCode: h.countryCode || countryCode,
    }));

    holidayCache.set(cacheKey, holidays);
    return holidays;
  },
};
