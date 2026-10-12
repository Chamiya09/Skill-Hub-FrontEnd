import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Home } from '../../pages/Home'
import { About } from '../../pages/About'
import { Contact } from '../../pages/Contact'
import { PublicCompanyProfile } from '../../pages/PublicCompanyProfile'
import { useAuth } from '../../context/AuthContext'
import {
  adminApi,
  companyProfileApi,
  publicJobsApi,
  savedJobsApi,
  type CompanyProfileDto,
  type JobDto,
} from '../../services/api'
import { candidate } from '../utils/auth'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  adminApi: {
    submitInquiry: vi.fn(),
  },
  companyProfileApi: {
    getPublicProfile: vi.fn(),
  },
  publicJobsApi: {
    getJobs: vi.fn(),
  },
  savedJobsApi: {
    getIds: vi.fn(),
  },
}))

const mockFeaturedJob: JobDto = {
  id: 'job-101',
  companyId: 'comp-1',
  companyName: 'Anthropic Systems',
  title: 'Staff Security Engineer',
  department: 'Security',
  location: 'San Francisco, CA',
  employmentType: 'Full-time',
  experienceLevel: 'Senior Level (5+ Yrs)',
  salaryRange: '$220,000 - $280,000',
  description: 'Lead enterprise infrastructure security.',
  status: 'Active',
  applicantsCount: 12,
  createdAt: '2026-10-01T00:00:00Z',
  tags: ['Security', 'Rust', 'Kubernetes'],
}

const mockCompanyProfile: { company: CompanyProfileDto; jobs: JobDto[] } = {
  company: {
    id: 'comp-101',
    companyName: 'Nova Robotics Inc',
    about: 'Pioneering autonomous perception and robotics intelligence.',
    industry: 'Robotics & AI',
    website: 'https://novarobotics.ai',
    location: 'Boston, MA',
    logoUrl: 'https://example.com/logo.png',
  },
  jobs: [
    {
      id: 'job-robotics-1',
      companyId: 'comp-101',
      companyName: 'Nova Robotics Inc',
      title: 'Robotics Perception Specialist',
      department: 'Autonomous Systems',
      location: 'Boston, MA',
      employmentType: 'Full-time',
      experienceLevel: 'Senior Level (5+ Yrs)',
      status: 'Active',
      description: 'Design real-time SLAM algorithms.',
      createdAt: '2026-10-01T00:00:00Z',
    },
  ],
}

describe('Public Pages Suite (Section J)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      refreshProfile: vi.fn().mockResolvedValue(null),
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)
    vi.mocked(publicJobsApi.getJobs).mockResolvedValue([mockFeaturedJob])
    vi.mocked(savedJobsApi.getIds).mockResolvedValue([])
    vi.mocked(adminApi.submitInquiry).mockResolvedValue({ id: 'inq-1', message: 'Received' })
    vi.mocked(companyProfileApi.getPublicProfile).mockResolvedValue(mockCompanyProfile)
  })

  describe('Home Page', () => {
    it('TC187 renders hero, platform metrics, and featured public jobs', async () => {
      render(
        <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Home />
        </MemoryRouter>
      )

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Search jobs, companies, or skills/i)).toBeInTheDocument()

      expect(await screen.findByText('Staff Security Engineer')).toBeInTheDocument()
      expect(screen.getByText('Anthropic Systems')).toBeInTheDocument()
    })

    it('TC188 navigates to jobs search when search form is submitted', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<h1>Jobs Search Destination</h1>} />
          </Routes>
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/Search jobs, companies, or skills/i)
      await user.type(searchInput, 'Kubernetes')
      await user.keyboard('{Enter}')

      expect(await screen.findByRole('heading', { name: 'Jobs Search Destination' })).toBeInTheDocument()
    })
  })

  describe('About Page', () => {
    it('TC189 renders platform architecture story and leadership team members', () => {
      render(
        <MemoryRouter initialEntries={['/about']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <About />
        </MemoryRouter>
      )

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Empowering the next generation/i)
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument()
      expect(screen.getByText('Marcus Vance')).toBeInTheDocument()
      expect(screen.getByText('Elena Rostova')).toBeInTheDocument()
      expect(screen.getByText('David Kalu')).toBeInTheDocument()
    })
  })

  describe('Contact Page', () => {
    it('TC190 submits guest inquiry and shows confirmation message', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/contact']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Contact />
        </MemoryRouter>
      )

      const nameInput = screen.getByLabelText(/Your Full Name \/ Company Name/i)
      const emailInput = screen.getByLabelText(/^Email/i)
      const subjectInput = screen.getByLabelText(/Subject/i)
      const messageInput = screen.getByLabelText(/Detailed Message/i)

      await user.type(nameInput, 'Dr. Ada Lovelace')
      await user.type(emailInput, 'ada@lovelace.io')
      await user.type(subjectInput, 'Talent Graph Partnership')
      await user.type(messageInput, 'We would like to connect our enterprise recruitment API with Skill Hub.')

      const submitBtn = screen.getByRole('button', { name: /Send Message/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(adminApi.submitInquiry).toHaveBeenCalledWith(
          expect.objectContaining({
            sender: 'Dr. Ada Lovelace',
            email: 'ada@lovelace.io',
            subject: 'Talent Graph Partnership',
            senderType: 'Guest',
          })
        )
      })

      expect(await screen.findByText('Message Dispatched!')).toBeInTheDocument()
      expect(screen.getByText(/Thank you for reaching out/i)).toBeInTheDocument()
    })

    it('TC191 pre-fills candidate credentials and handles submission API error', async () => {
      vi.mocked(useAuth).mockReturnValue({
        currentUser: candidate,
        isAuthenticated: true,
        isLoading: false,
        refreshProfile: vi.fn(),
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuth>)

      vi.mocked(adminApi.submitInquiry).mockRejectedValueOnce(new Error('Gateway mail dispatch timeout'))

      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/contact']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Contact />
        </MemoryRouter>
      )

      // Verified candidate's full name is rendered readonly/prefilled
      expect(screen.getByDisplayValue(candidate.fullName)).toBeInTheDocument()
      expect(screen.getByDisplayValue(candidate.email)).toBeInTheDocument()

      const subjectInput = screen.getByLabelText(/Subject/i)
      const messageInput = screen.getByLabelText(/Detailed Message/i)
      await user.type(subjectInput, 'Assessment Issue')
      await user.type(messageInput, 'Need help updating my technical assessment.')

      const submitBtn = screen.getByRole('button', { name: /Send Message/i })
      await user.click(submitBtn)

      expect(await screen.findByText('Gateway mail dispatch timeout')).toBeInTheDocument()
    })
  })

  describe('Public Company Profile Page', () => {
    it('TC192 loads public company profile and its active requisitions', async () => {
      render(
        <MemoryRouter initialEntries={['/company/comp-101']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/company/:id" element={<PublicCompanyProfile />} />
          </Routes>
        </MemoryRouter>
      )

      expect(await screen.findByRole('heading', { level: 1, name: 'Nova Robotics Inc' })).toBeInTheDocument()
      expect(screen.getByText('Robotics & AI')).toBeInTheDocument()
      expect(screen.getByText('Robotics Perception Specialist')).toBeInTheDocument()
    })

    it('TC193 renders error banner when company profile is not found', async () => {
      vi.mocked(companyProfileApi.getPublicProfile).mockRejectedValueOnce(new Error('Company not found'))

      render(
        <MemoryRouter initialEntries={['/company/non-existent']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/company/:id" element={<PublicCompanyProfile />} />
          </Routes>
        </MemoryRouter>
      )

      expect(await screen.findByText('Company not found')).toBeInTheDocument()
    })
  })
})
