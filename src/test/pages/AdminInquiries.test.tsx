import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InquiriesView } from '../../pages/admin/InquiriesView'
import { adminApi, type AdminInquiryDto } from '../../services/api'

vi.mock('../../services/api', () => ({ adminApi: { getInquiries: vi.fn(), toggleInquiryStatus: vi.fn() } }))

const inquiry: AdminInquiryDto = {
  id: 'inquiry-1', sender: 'Pat Lee', senderType: 'Guest', email: 'pat@example.test',
  subject: 'Account help', message: 'Please help', date: '2026-01-01', status: 'New', priority: 'Normal',
}

beforeEach(() => {
  vi.mocked(adminApi.getInquiries).mockReset().mockResolvedValue([inquiry])
  vi.mocked(adminApi.toggleInquiryStatus).mockReset().mockResolvedValue({ id: 'inquiry-1', status: 'Resolved' })
})

describe('Admin inquiry desk', () => {
  it('TC143 loads, searches, and resolves an inquiry', async () => {
    render(<InquiriesView />)
    expect(await screen.findByText('Account help')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Search by sender, email, subject, or message...'), 'missing')
    expect(screen.getByText(/No inquiries found matching/)).toBeInTheDocument()
    await user.clear(screen.getByPlaceholderText('Search by sender, email, subject, or message...'))
    await user.click(screen.getByRole('button', { name: 'Mark Resolved' }))
    await waitFor(() => expect(adminApi.toggleInquiryStatus).toHaveBeenCalledWith('inquiry-1'))
    expect(screen.getByRole('button', { name: 'Reopen' })).toBeInTheDocument()
  })

  it('TC144 restores unresolved status when persistence fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(adminApi.toggleInquiryStatus).mockRejectedValue(new Error('Update failed'))
    render(<InquiriesView />)
    await screen.findByText('Account help')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Mark Resolved' }))
    await waitFor(() => expect(adminApi.toggleInquiryStatus).toHaveBeenCalledWith('inquiry-1'))
    expect(await screen.findByRole('button', { name: 'Mark Resolved' })).toBeInTheDocument()
  })
})
