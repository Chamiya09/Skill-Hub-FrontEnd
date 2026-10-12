import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CompanySettings } from '../../pages/CompanySettings'
import { useAuth } from '../../context/AuthContext'
import { companyProfileApi, type UserDto, type CompanyProfileDto } from '../../services/api'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual<typeof import('../../services/api')>('../../services/api')
  return {
    ...actual,
    companyProfileApi: {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
    },
  }
})

const mockCompanyProfile: CompanyProfileDto = {
  id: 'company-123',
  companyName: 'Apex Cloud Systems',
  contactEmail: 'sarah@apexcloud.io',
  industry: 'Cloud Infrastructure & DevOps',
  website: 'https://apexcloud.io',
  phone: '+1 555-8822',
  location: 'Seattle, WA',
  companySize: '51-200 Employees (Growth Stage)',
  foundedYear: '2019',
  about: 'Building resilient hybrid-cloud monitoring solutions.',
  linkedinUrl: 'https://linkedin.com/company/apexcloud',
  twitterUrl: 'https://twitter.com/apexcloud',
  githubUrl: 'https://github.com/apexcloud',
}

const mockCompanyUser: UserDto = {
  ...mockCompanyProfile,
  fullName: 'Sarah Jenkins',
  email: 'sarah@apexcloud.io',
  role: 'Company',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('Employer Settings - Company Profile & Workspace Identity', () => {
  const mockSetUser = vi.fn()
  const mockUpdateUser = vi.fn()
  const mockRefreshProfile = vi.fn().mockResolvedValue(mockCompanyUser)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      currentUser: mockCompanyUser,
      token: 'company-token-123',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      candidateLogin: vi.fn(),
      candidateRegister: vi.fn(),
      setAuthData: vi.fn(),
      setUser: mockSetUser,
      updateUser: mockUpdateUser,
      logout: vi.fn(),
      refreshProfile: mockRefreshProfile,
    })
    vi.mocked(companyProfileApi.getProfile).mockResolvedValue(mockCompanyProfile)
  })

  it('TC156 renders company profile settings with prefilled corporate details', async () => {
    render(
      <MemoryRouter>
        <CompanySettings />
      </MemoryRouter>
    )

    expect(screen.getByText('Company Profile & Account Settings')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Apex Cloud Systems')).toBeInTheDocument()
    expect(screen.getByDisplayValue('sarah@apexcloud.io')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://apexcloud.io')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Building resilient hybrid-cloud monitoring solutions.')).toBeInTheDocument()
  })

  it('TC157 updates company details and displays a success alert', async () => {
    vi.mocked(companyProfileApi.updateProfile).mockResolvedValue({
      ...mockCompanyUser,
      companyName: 'Apex Cloud Global Technologies',
      location: 'San Francisco, CA',
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CompanySettings />
      </MemoryRouter>
    )

    // Wait until profile loads asynchronously
    const nameInput = await screen.findByDisplayValue('Apex Cloud Systems')
    fireEvent.change(nameInput, { target: { name: 'companyName', value: 'Apex Cloud Global Technologies' } })

    const locationInput = screen.getByDisplayValue('Seattle, WA')
    fireEvent.change(locationInput, { target: { name: 'location', value: 'San Francisco, CA' } })

    // Find the save button
    const saveButtons = screen.getAllByRole('button', { name: /Save Changes/i })
    await user.click(saveButtons[0])

    await waitFor(() => {
      expect(companyProfileApi.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: 'Apex Cloud Global Technologies',
          location: 'San Francisco, CA',
        })
      )
    })

    expect(
      await screen.findByText('Company profile and workspace identity successfully updated.')
    ).toBeInTheDocument()
  })

  it('TC158 handles API update failure and shows error alert with dismiss option', async () => {
    vi.mocked(companyProfileApi.updateProfile).mockRejectedValueOnce(
      new Error('Enterprise database lock error')
    )

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CompanySettings />
      </MemoryRouter>
    )

    await screen.findByDisplayValue('Apex Cloud Systems')
    const saveButtons = screen.getAllByRole('button', { name: /Save Changes/i })
    await user.click(saveButtons[0])

    expect(await screen.findByText('Enterprise database lock error')).toBeInTheDocument()

    const dismissBtn = screen.getByRole('button', { name: /Dismiss/i })
    await user.click(dismissBtn)

    expect(screen.queryByText('Enterprise database lock error')).not.toBeInTheDocument()
  })

  it('TC159 toggles layout mode between split view and full colspan', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <MemoryRouter>
        <CompanySettings />
      </MemoryRouter>
    )

    await screen.findByDisplayValue('Apex Cloud Systems')

    const fullColspanBtn = screen.getByRole('button', { name: /Full Colspan/i })
    await user.click(fullColspanBtn)

    expect(container.querySelector('.settings-workspace-layout--colspan')).toBeInTheDocument()

    const splitViewBtn = screen.getByRole('button', { name: /Split View/i })
    await user.click(splitViewBtn)

    expect(container.querySelector('.settings-workspace-layout--colspan')).not.toBeInTheDocument()
  })
})
