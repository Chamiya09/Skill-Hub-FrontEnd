import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Dashboard } from '../../pages/Dashboard'
import { useAuth } from '../../context/AuthContext'
import { dashboardApi, jobsApi, type JobDto } from '../../services/api'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../services/api', () => ({ dashboardApi: { getStats: vi.fn() }, jobsApi: { getJobs: vi.fn() } }))
vi.mock('../../components/dashboard/CompanyOverview', () => ({
  CompanyOverview: ({ companyName, jobs, loading }: { companyName: string; jobs: JobDto[]; loading: boolean }) =>
    <section><h1>{companyName} overview</h1><p>{loading ? 'Loading overview' : `${jobs.length} loaded jobs`}</p></section>,
}))
vi.mock('../../pages/JobVacancies', () => ({ JobVacancies: () => <h1>Vacancies workspace</h1> }))

const company = {
  id: 'company-1', fullName: 'Acme HR', companyName: 'Acme', email: 'hr@acme.test',
  role: 'Company', createdAt: '2026-01-01T00:00:00Z',
}
const logout = vi.fn()
const renderDashboard = () => render(
  <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/company-login" element={<h1>Company login destination</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  logout.mockReset()
  vi.mocked(useAuth).mockReturnValue({ currentUser: company, logout, isAuthenticated: true, isLoading: false } as unknown as ReturnType<typeof useAuth>)
  vi.mocked(dashboardApi.getStats).mockReset().mockResolvedValue({ activeVacanciesCount: 0, draftVacanciesCount: 0, closedVacanciesCount: 0, totalVacanciesCount: 0, totalDepartmentsCount: 0, recentVacancies: [] })
  vi.mocked(jobsApi.getJobs).mockReset().mockResolvedValue([])
})

describe('Employer dashboard', () => {
  it('TC038 renders the company overview after data loads', async () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'Acme overview' })).toBeInTheDocument()
    expect(await screen.findByText('0 loaded jobs')).toBeInTheDocument()
    expect(dashboardApi.getStats).toHaveBeenCalledOnce()
  })

  it('TC039 switches from overview to vacancies using navigation', async () => {
    renderDashboard()
    await screen.findByText('0 loaded jobs')
    await userEvent.setup().click(screen.getByRole('button', { name: /Job Vacancies/ }))
    expect(screen.getByRole('heading', { name: 'Vacancies workspace' })).toBeInTheDocument()
  })

  it('TC040 signs out and navigates to company login', async () => {
    renderDashboard()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign Out' }))
    expect(logout).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Company login destination' })).toBeInTheDocument())
  })
})
