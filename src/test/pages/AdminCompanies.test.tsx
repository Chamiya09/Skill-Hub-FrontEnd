import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CompaniesView } from '../../pages/admin/CompaniesView'
import { adminApi, authStorage, type AdminCompanyDto } from '../../services/api'

vi.mock('../../services/api', () => ({
  adminApi: { getCompanies: vi.fn(), toggleUserSuspend: vi.fn(), toggleCompanyStatus: vi.fn() },
  authStorage: { syncAccountSuspension: vi.fn() },
}))

const company: AdminCompanyDto = {
  id: 'company-1', name: 'Acme Labs', logo: '', industry: 'Software',
  contactEmail: 'hr@acme.test', website: 'https://acme.test', activeJobPosts: 2,
  totalHires: 1, status: 'Active', tier: 'Startup', location: 'Colombo', joinedDate: '2026-01-01',
}

beforeEach(() => {
  vi.mocked(adminApi.getCompanies).mockReset().mockResolvedValue([company])
  vi.mocked(adminApi.toggleUserSuspend).mockReset().mockResolvedValue({ id: 'company-1', isSuspended: true, status: 'Suspended', message: 'Updated' })
  vi.mocked(adminApi.toggleCompanyStatus).mockReset()
  vi.mocked(authStorage.syncAccountSuspension).mockReset()
})

describe('Admin company directory', () => {
  it('TC122 loads registered companies and filters by email', async () => {
    render(<CompaniesView />)
    expect(await screen.findByText('Acme Labs')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Search by company name, HR email, or industry...'), 'missing')
    expect(screen.getByText(/No companies found matching/)).toBeInTheDocument()
    await user.clear(screen.getByPlaceholderText('Search by company name, HR email, or industry...'))
    await user.type(screen.getByPlaceholderText('Search by company name, HR email, or industry...'), 'hr@acme.test')
    expect(screen.getByText('Acme Labs')).toBeInTheDocument()
  })

  it('TC123 suspends and reactivates an employer through the admin API', async () => {
    render(<CompaniesView />)
    await screen.findByText('Acme Labs')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Suspend' }))
    await waitFor(() => expect(adminApi.toggleUserSuspend).toHaveBeenCalledWith('company-1'))
    expect(authStorage.syncAccountSuspension).toHaveBeenCalledWith('company-1', 'hr@acme.test', true)
    await user.click(screen.getByRole('button', { name: 'Activate' }))
    expect(adminApi.toggleUserSuspend).toHaveBeenCalledTimes(2)
  })

  it('TC124 uses the verified fallback endpoint when the main suspend request fails', async () => {
    vi.mocked(adminApi.toggleUserSuspend).mockRejectedValue(new Error('Primary route unavailable'))
    vi.mocked(adminApi.toggleCompanyStatus).mockResolvedValue({ id: 'company-1', status: 'Suspended' })
    render(<CompaniesView />)
    await screen.findByText('Acme Labs')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Suspend' }))
    await waitFor(() => expect(adminApi.toggleCompanyStatus).toHaveBeenCalledWith('company-1'))
  })

  it('TC125 exposes the current demo-data fallback after an API failure', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(adminApi.getCompanies).mockRejectedValue(new Error('Directory unavailable'))
    render(<CompaniesView />)
    await waitFor(() => expect(adminApi.getCompanies).toHaveBeenCalled())
    expect(await screen.findByRole('heading', { name: 'Companies Directory' })).toBeInTheDocument()
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('using mock dataset'), expect.any(Error))
  })

  it('TC140 preserves the active status when both suspension endpoints fail', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(adminApi.toggleUserSuspend).mockRejectedValue(new Error('Primary failed'))
    vi.mocked(adminApi.toggleCompanyStatus).mockRejectedValue(new Error('Fallback failed'))
    render(<CompaniesView />)
    await screen.findByText('Acme Labs')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Suspend' }))
    await waitFor(() => expect(adminApi.toggleCompanyStatus).toHaveBeenCalledWith('company-1'))
    expect(await screen.findByRole('button', { name: 'Suspend' })).toBeInTheDocument()
    expect(authStorage.syncAccountSuspension).not.toHaveBeenCalled()
  })
})
