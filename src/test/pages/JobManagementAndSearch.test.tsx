import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateJob } from '../../pages/CreateJob'
import { EditJob } from '../../pages/EditJob'
import { FindJobs } from '../../pages/FindJobs'
import { JobFormModal } from '../../components/jobs/JobFormModal'
import { jobsApi, publicJobsApi, savedJobsApi, type JobDto } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  jobsApi: {
    createJob: vi.fn(),
    getJobById: vi.fn(),
    updateJob: vi.fn(),
  },
  publicJobsApi: {
    getJobs: vi.fn(),
  },
  savedJobsApi: {
    getIds: vi.fn(),
  },
}))

const mockExistingJob: JobDto = {
  id: 'job-909',
  companyId: 'comp-1',
  companyName: 'Apex Cloud Systems',
  title: 'Principal Distributed Systems Engineer',
  department: 'Engineering',
  location: 'San Francisco, CA (Remote)',
  employmentType: 'Full-time',
  experienceLevel: 'Senior Level (5+ Yrs)',
  status: 'Active',
  salaryRange: '$180k - $220k',
  description: '<p>Architect distributed databases</p>',
  whatWeOffer: '<p>Comprehensive benefits</p>',
  createdAt: '2026-02-01T00:00:00Z',
}

describe('Job Management & Public Search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      currentUser: { id: 'u-1', role: 'Candidate' } as unknown as ReturnType<typeof useAuth>['currentUser'],
      isAuthenticated: true,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>)
    vi.mocked(savedJobsApi.getIds).mockResolvedValue([])
  })

  describe('CreateJob Page', () => {
    it('TC180 creates a new job requisition and submits to API', async () => {
      const user = userEvent.setup()
      vi.mocked(jobsApi.createJob).mockResolvedValue(mockExistingJob)

      render(
        <MemoryRouter>
          <CreateJob />
        </MemoryRouter>
      )

      expect(screen.getByRole('heading', { name: 'Create New Job' })).toBeInTheDocument()

      const titleInput = screen.getByPlaceholderText(/Senior Full Stack Engineer/i)
      fireEvent.change(titleInput, { target: { value: 'Staff Site Reliability Engineer' } })

      const submitBtn = screen.getByRole('button', { name: /Publish Job Vacancy/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(jobsApi.createJob).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Staff Site Reliability Engineer',
            department: 'Engineering',
            employmentType: 'Full-time',
          })
        )
      })
    })

    it('TC181 handles creation API error and shows alert', async () => {
      const user = userEvent.setup()
      vi.mocked(jobsApi.createJob).mockRejectedValueOnce(new Error('Quota limit reached'))
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      render(
        <MemoryRouter>
          <CreateJob />
        </MemoryRouter>
      )

      const titleInput = screen.getByPlaceholderText(/Senior Full Stack Engineer/i)
      fireEvent.change(titleInput, { target: { value: 'Staff Site Reliability Engineer' } })

      const submitBtn = screen.getByRole('button', { name: /Publish Job Vacancy/i })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Quota limit reached')
      })
    })
  })

  describe('EditJob Page', () => {
    it('TC182 loads existing job and submits update', async () => {
      const user = userEvent.setup()
      vi.mocked(jobsApi.getJobById).mockResolvedValue(mockExistingJob)
      vi.mocked(jobsApi.updateJob).mockResolvedValue(mockExistingJob)

      render(
        <MemoryRouter initialEntries={['/jobs/edit/job-909']}>
          <Routes>
            <Route path="/jobs/edit/:id" element={<EditJob />} />
          </Routes>
        </MemoryRouter>
      )

      expect(await screen.findByDisplayValue('Principal Distributed Systems Engineer')).toBeInTheDocument()

      const titleInput = screen.getByDisplayValue('Principal Distributed Systems Engineer')
      fireEvent.change(titleInput, { target: { value: 'VP of Distributed Infrastructure' } })

      const saveBtn = screen.getByRole('button', { name: /Save Changes/i })
      await user.click(saveBtn)

      await waitFor(() => {
        expect(jobsApi.updateJob).toHaveBeenCalledWith(
          'job-909',
          expect.objectContaining({
            title: 'VP of Distributed Infrastructure',
          })
        )
      })
    })

    it('TC183 displays error message when job fails to load', async () => {
      vi.mocked(jobsApi.getJobById).mockRejectedValueOnce(new Error('Job not found in enterprise records'))

      render(
        <MemoryRouter initialEntries={['/jobs/edit/job-909']}>
          <Routes>
            <Route path="/jobs/edit/:id" element={<EditJob />} />
          </Routes>
        </MemoryRouter>
      )

      expect(await screen.findByText('Job not found in enterprise records')).toBeInTheDocument()
    })
  })

  describe('JobFormModal Wizard', () => {
    it('TC184 navigates 3-step wizard validating requirements on each step', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const onClose = vi.fn()

      render(
        <JobFormModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )

      expect(screen.getByText('Basic & Status')).toBeInTheDocument()

      // Step 1: Missing Title should trigger validation error
      const step1NextBtn = screen.getByRole('button', { name: /Continue to Role Specs/i })
      await user.click(step1NextBtn)

      expect(await screen.findByText('Please enter a Job Title before proceeding.')).toBeInTheDocument()

      // Enter Title and Location
      fireEvent.change(screen.getByPlaceholderText(/Senior Full Stack Engineer/i), {
        target: { name: 'title', value: 'Lead Platform Architect' },
      })
      fireEvent.change(screen.getByPlaceholderText(/Remote \(APAC\) or San Francisco/i), {
        target: { name: 'location', value: 'Seattle, WA' },
      })

      // Advance to Step 2
      await user.click(step1NextBtn)
      expect(await screen.findByText('Employment Type')).toBeInTheDocument()

      // Add a skill tag in Step 2 using quick suggestions button
      const tagBtn = screen.getByRole('button', { name: /\+ Docker/i })
      await user.click(tagBtn)
      expect(screen.getByText('Docker')).toBeInTheDocument()

      // Advance to Step 3
      const step2NextBtn = screen.getByRole('button', { name: /Continue to Details/i })
      await user.click(step2NextBtn)

      // Submit wizard on Step 3
      const publishBtn = await screen.findByRole('button', { name: /Publish Job Vacancy/i })
      await user.click(publishBtn)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Lead Platform Architect',
            location: 'Seattle, WA',
          })
        )
      })
    })
  })

  describe('FindJobs Public Search Page', () => {
    it('TC185 loads public jobs and filters by search query and category', async () => {
      const user = userEvent.setup()
      const jobsList: JobDto[] = [
        mockExistingJob,
        {
          id: 'job-2',
          companyId: 'comp-2',
          companyName: 'Creative Design Studio',
          title: 'Lead UI/UX Product Designer',
          department: 'Design',
          location: 'New York, NY',
          employmentType: 'Full-time',
          experienceLevel: 'Mid Level',
          status: 'Active',
          salaryRange: '$110k - $140k',
          description: '<p>Design apps</p>',
          createdAt: '2026-02-05T00:00:00Z',
        },
      ]
      vi.mocked(publicJobsApi.getJobs).mockResolvedValue(jobsList)

      render(
        <MemoryRouter>
          <FindJobs />
        </MemoryRouter>
      )

      expect(await screen.findByText('Principal Distributed Systems Engineer')).toBeInTheDocument()
      expect(screen.getByText('Lead UI/UX Product Designer')).toBeInTheDocument()

      // Search for 'Designer'
      const searchInput = screen.getByPlaceholderText(/Search by job title, department, or company\.\.\./i)
      await user.type(searchInput, 'Designer')

      expect(screen.getByText('Lead UI/UX Product Designer')).toBeInTheDocument()
      expect(screen.queryByText('Principal Distributed Systems Engineer')).not.toBeInTheDocument()
    })

    it('TC186 displays API fetch error banner when public vacancies fail', async () => {
      vi.mocked(publicJobsApi.getJobs).mockRejectedValueOnce(new Error('Public gateway timeout'))

      render(
        <MemoryRouter>
          <FindJobs />
        </MemoryRouter>
      )

      expect(await screen.findByText('Public gateway timeout')).toBeInTheDocument()
    })
  })
})
