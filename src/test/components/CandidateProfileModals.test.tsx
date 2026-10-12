import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddEducationModal } from '../../components/candidates/modals/AddEducationModal'
import { AddExperienceModal } from '../../components/candidates/modals/AddExperienceModal'
import { AddProjectModal } from '../../components/candidates/modals/AddProjectModal'
import { AddCertificationModal } from '../../components/candidates/modals/AddCertificationModal'
import { AddSkillModal } from '../../components/candidates/modals/AddSkillModal'
import { EditAboutModal } from '../../components/candidates/modals/EditAboutModal'
import { CandidateProfileReadOnly } from '../../components/candidates/CandidateProfileReadOnly'
import {
  candidateCvApi,
  jobApplicationsApi,
  type EducationDto,
  type ProjectDto,
  type CertificationDto,
  type SkillDto,
  type CandidateProfileResponseDto,
} from '../../services/api'

vi.mock('../../services/api', () => ({
  candidateCvApi: {
    addEducation: vi.fn(),
    updateEducation: vi.fn(),
    addExperience: vi.fn(),
    updateExperience: vi.fn(),
    addProject: vi.fn(),
    updateProject: vi.fn(),
    addCertification: vi.fn(),
    updateCertification: vi.fn(),
    addSkill: vi.fn(),
    updateAbout: vi.fn(),
  },
  jobApplicationsApi: {
    getCandidateProfileForEmployer: vi.fn(),
  },
}))

describe('Candidate Profile & Digital CV Modals', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AddEducationModal', () => {
    it('TC170 displays validation error when submitting with empty required fields', async () => {
      const { container } = render(<AddEducationModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />)

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      expect(
        await screen.findByText(/Please provide degree, institution name, and start year/i)
      ).toBeInTheDocument()
      expect(candidateCvApi.addEducation).not.toHaveBeenCalled()
    })

    it('TC171 adds new education successfully when form is properly completed', async () => {
      const mockResult: EducationDto = {
        id: 'edu-1',
        degree: 'B.S. in Computer Science & Engineering',
        institution: 'Stanford University',
        startYear: '2020',
        endYear: '2024',
        createdAt: '2026-01-01T00:00:00Z',
      }
      vi.mocked(candidateCvApi.addEducation).mockResolvedValue(mockResult)

      const { container } = render(<AddEducationModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />)

      fireEvent.change(screen.getByPlaceholderText(/B\.S\. in Computer Science & Engineering/i), {
        target: { value: 'B.S. in Computer Science & Engineering' },
      })
      fireEvent.change(screen.getByPlaceholderText(/Stanford University/i), {
        target: { value: 'Stanford University' },
      })
      fireEvent.change(screen.getByPlaceholderText(/2018/i), {
        target: { value: '2020' },
      })

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(candidateCvApi.addEducation).toHaveBeenCalledWith(
          expect.objectContaining({
            degree: 'B.S. in Computer Science & Engineering',
            institution: 'Stanford University',
            startYear: '2020',
          })
        )
        expect(onSuccess).toHaveBeenCalledWith(mockResult)
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('TC172 updates existing education record when initialData is provided', async () => {
      const initial: EducationDto = {
        id: 'edu-existing',
        degree: 'B.S. Software Engineering',
        institution: 'MIT',
        startYear: '2019',
        endYear: '2023',
        createdAt: '2026-01-01T00:00:00Z',
      }
      vi.mocked(candidateCvApi.updateEducation).mockResolvedValue({
        ...initial,
        degree: 'M.S. Software Engineering',
      })

      const { container } = render(
        <AddEducationModal isOpen={true} onClose={onClose} onSuccess={onSuccess} initialData={initial} />
      )

      const degreeInput = screen.getByDisplayValue('B.S. Software Engineering')
      fireEvent.change(degreeInput, { target: { value: 'M.S. Software Engineering' } })

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(candidateCvApi.updateEducation).toHaveBeenCalledWith(
          'edu-existing',
          expect.objectContaining({
            degree: 'M.S. Software Engineering',
          })
        )
      })
    })
  })

  describe('AddExperienceModal', () => {
    it('TC173 validates required experience fields and supports isCurrent toggle', async () => {
      const user = userEvent.setup()
      const { container } = render(<AddExperienceModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />)

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      expect(
        await screen.findByText(/Please enter job title, company name, and start date/i)
      ).toBeInTheDocument()

      const currentCheckbox = screen.getByRole('checkbox', { name: /I am currently working in this role/i })
      await user.click(currentCheckbox)
      expect(currentCheckbox).toBeChecked()
    })

    it('TC174 creates new experience record and handles API rejection', async () => {
      vi.mocked(candidateCvApi.addExperience).mockRejectedValueOnce(new Error('Database timeout error'))

      const { container } = render(<AddExperienceModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />)

      fireEvent.change(screen.getByPlaceholderText(/Senior Software Engineer/i), {
        target: { value: 'Staff Platform Engineer' },
      })
      fireEvent.change(screen.getByPlaceholderText(/Acme Cloud Corp/i), {
        target: { value: 'Stripe' },
      })
      fireEvent.change(screen.getByPlaceholderText(/Jan 2022/i), {
        target: { value: 'Jan 2022' },
      })

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      expect(await screen.findByText(/Database timeout error/i)).toBeInTheDocument()
    })
  })

  describe('AddProjectModal', () => {
    it('TC175 validates project name and adds project with tech tags', async () => {
      const mockProj: ProjectDto = {
        id: 'proj-1',
        projectName: 'High-Throughput Message Queue',
        role: 'Lead Architect • Go, Kafka',
        createdAt: '2026-01-01T00:00:00Z',
      }
      vi.mocked(candidateCvApi.addProject).mockResolvedValue(mockProj)

      const { container } = render(<AddProjectModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />)

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      expect(await screen.findByText(/Please enter the project name/i)).toBeInTheDocument()

      fireEvent.change(screen.getByPlaceholderText(/Distributed Cache & In-Memory Store/i), {
        target: { value: 'High-Throughput Message Queue' },
      })

      fireEvent.submit(form)

      await waitFor(() => {
        expect(candidateCvApi.addProject).toHaveBeenCalledWith(
          expect.objectContaining({
            projectName: 'High-Throughput Message Queue',
          })
        )
      })
    })
  })

  describe('AddCertificationModal', () => {
    it('TC176 creates a new certification upon valid entry', async () => {
      const mockCert: CertificationDto = {
        id: 'cert-1',
        title: 'AWS Certified Solutions Architect - Professional',
        issuingOrganization: 'Amazon Web Services',
      }
      vi.mocked(candidateCvApi.addCertification).mockResolvedValue(mockCert)

      const { container } = render(
        <AddCertificationModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
      )

      fireEvent.change(screen.getByPlaceholderText(/AWS Certified Solutions Architect - Associate/i), {
        target: { value: 'AWS Certified Solutions Architect - Professional' },
      })
      fireEvent.change(screen.getByPlaceholderText(/Amazon Web Services \(AWS\) or Google Cloud/i), {
        target: { value: 'Amazon Web Services' },
      })

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(candidateCvApi.addCertification).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'AWS Certified Solutions Architect - Professional',
            issuingOrganization: 'Amazon Web Services',
          })
        )
      })
    })
  })

  describe('AddSkillModal', () => {
    it('TC177 creates a new skill item and prevents submission without skill name', async () => {
      const mockSkill: SkillDto = {
        id: 'skill-new',
        skillName: 'Rust',
        category: 'Languages & Core Stack',
        createdAt: '2026-01-01T00:00:00Z',
      }
      vi.mocked(candidateCvApi.addSkill).mockResolvedValue(mockSkill)

      const { container } = render(<AddSkillModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />)

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      expect(await screen.findByText(/Please enter a skill name/i)).toBeInTheDocument()

      fireEvent.change(screen.getByPlaceholderText(/Next\.js, Kubernetes, PostgreSQL/i), {
        target: { value: 'Rust' },
      })

      fireEvent.submit(form)

      await waitFor(() => {
        expect(candidateCvApi.addSkill).toHaveBeenCalledWith(
          expect.objectContaining({
            skillName: 'Rust',
          })
        )
      })
    })
  })

  describe('EditAboutModal', () => {
    it('TC178 updates candidate summary and key highlights', async () => {
      vi.mocked(candidateCvApi.updateAbout).mockResolvedValue({
        summary: 'Experienced cloud architect specializing in distributed consensus systems.',
        keyHighlights: [{ category: 'Total Experience', value: '8+ Years', subtext: 'Distributed Systems' }],
      })

      const { container } = render(
        <EditAboutModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
          initialSummary="Old summary"
          initialHighlights={[{ category: 'Total Experience', value: '8+ Years', subtext: 'Distributed Systems' }]}
        />
      )

      expect(screen.getByDisplayValue('Total Experience')).toBeInTheDocument()
      expect(screen.getByDisplayValue('8+ Years')).toBeInTheDocument()

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(candidateCvApi.updateAbout).toHaveBeenCalledWith(
          expect.objectContaining({
            keyHighlights: expect.arrayContaining([
              expect.objectContaining({ category: 'Total Experience', value: '8+ Years' }),
            ]),
          })
        )
      })
    })
  })

  describe('CandidateProfileReadOnly', () => {
    it('TC179 loads and displays read-only candidate Digital CV with verified credentials', async () => {
      const mockProfile: CandidateProfileResponseDto = {
        id: 'candidate-99',
        firstName: 'Elena',
        lastName: 'Rostova',
        fullName: 'Elena Rostova',
        email: 'elena@rostova.dev',
        phone: '+1 415-555-0199',
        location: 'Seattle, WA',
        headline: 'Staff Distributed Systems Engineer',
        summary: '10+ years architecting globally distributed storage engines.',
        skills: [{ id: 's-1', skillName: 'Kubernetes', category: 'DevOps', createdAt: '2026-01-01' }],
        experiences: [
          {
            id: 'exp-1',
            title: 'Principal Systems Architect',
            company: 'CloudScale Global',
            location: 'Seattle, WA',
            startDate: '2022',
            isCurrent: true,
            description: 'Led cross-region consensus replication system.',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
        educations: [],
        projects: [],
        certifications: [],
        keyHighlights: [],
      }

      vi.mocked(jobApplicationsApi.getCandidateProfileForEmployer).mockResolvedValue(mockProfile)

      render(<CandidateProfileReadOnly candidateId="candidate-99" onClose={onClose} />)

      expect(await screen.findByText('Elena Rostova')).toBeInTheDocument()
      expect(screen.getByText('Staff Distributed Systems Engineer')).toBeInTheDocument()
      expect(screen.getByText('elena@rostova.dev')).toBeInTheDocument()
      expect(screen.getByText('Kubernetes')).toBeInTheDocument()
      expect(screen.getByText('Principal Systems Architect')).toBeInTheDocument()
    })
  })
})
