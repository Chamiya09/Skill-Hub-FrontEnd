import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminOverviewView } from '../../pages/admin/AdminOverviewView'
import { adminApi, type AdminCandidateDto, type AdminCompanyDto, type AdminInquiryDto } from '../../services/api'

vi.mock('../../services/api', () => ({ adminApi: {
  getCandidates: vi.fn(), getCompanies: vi.fn(), getInquiries: vi.fn(),
} }))

const candidate: AdminCandidateDto = {
  id: 'candidate-1', name: 'Alex Rivera', avatar: '', role: 'Engineer', email: 'alex@example.test',
  topSkills: ['React'], aiMatchAverage: 91, status: 'Active', location: 'Colombo',
}
const company: AdminCompanyDto = {
  id: 'company-1', name: 'Acme Labs', logo: '', industry: 'Software', contactEmail: 'hr@acme.test',
  website: 'https://acme.test', activeJobPosts: 2, totalHires: 1, status: 'Active',
  tier: 'Startup', location: 'Colombo', joinedDate: '2026-01-01',
}
const inquiry: AdminInquiryDto = {
  id: 'inquiry-1', sender: 'Pat Lee', senderType: 'Guest', email: 'pat@example.test',
  subject: 'Help', message: 'Question', date: '2026-01-01', status: 'New', priority: 'Normal',
}

beforeEach(() => {
  vi.mocked(adminApi.getCandidates).mockReset().mockResolvedValue([candidate])
  vi.mocked(adminApi.getCompanies).mockReset().mockResolvedValue([company])
  vi.mocked(adminApi.getInquiries).mockReset().mockResolvedValue([inquiry])
})

describe('Admin overview', () => {
  it('TC130 loads candidate, employer, job and inquiry totals', async () => {
    render(<AdminOverviewView onNavigateTab={vi.fn()} />)
    const dashboard = screen.getByRole('region', { name: 'Admin Ecosystem Overview' })
    await waitFor(() => expect(within(dashboard).getByText('1 AI verified talent profiles')).toBeInTheDocument())
    expect(within(dashboard).getByText('1 active corporate accounts')).toBeInTheDocument()
    expect(within(dashboard).getByText('1 placements completed')).toBeInTheDocument()
    expect(adminApi.getCandidates).toHaveBeenCalledTimes(1)
  })

  it('TC131 retries when a platform metric request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(adminApi.getCompanies).mockRejectedValueOnce(new Error('Admin API unavailable')).mockResolvedValueOnce([company])
    render(<AdminOverviewView onNavigateTab={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Admin API unavailable')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(adminApi.getCompanies).toHaveBeenCalledTimes(2)
  })
})
