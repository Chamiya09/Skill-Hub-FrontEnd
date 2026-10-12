import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { authStorage, companyAuthApi, candidateAuthApi, jobsApi, savedJobsApi, jobApplicationsApi, assessmentsApi, type JobDto, type UserDto } from '../../services/api'

const base = 'http://localhost:5155/api'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const company: UserDto = {
  id: 'company-1', fullName: 'Acme HR', companyName: 'Acme',
  email: 'hr@acme.test', role: 'Company', createdAt: '2026-01-01T00:00:00Z',
}
const job: JobDto = {
  id: 'job-1', companyId: 'company-1', title: 'React Engineer', department: 'Engineering',
  location: 'Remote', employmentType: 'Full-time', experienceLevel: 'Senior',
  status: 'Active', description: 'Build interfaces', createdAt: '2026-01-01T00:00:00Z',
}

describe('Business API contracts', () => {
  it('TC078 registers a company and stores its session', async () => {
    server.use(http.post(`${base}/company/register`, async ({ request }) => {
      expect(await request.json()).toEqual({ companyName: 'Acme', companyEmail: 'hr@acme.test', password: 'secret123' })
      return HttpResponse.json({ token: 'company-token', tokenType: 'Bearer', expiresAt: '2027-01-01', user: company })
    }))
    await companyAuthApi.register({ companyName: 'Acme', companyEmail: 'hr@acme.test', password: 'secret123' })
    expect(authStorage.getToken()).toBe('company-token')
  })

  it('TC079 sends the bearer token with a company vacancy request', async () => {
    authStorage.setAuth({ token: 'company-token', tokenType: 'Bearer', expiresAt: '2027-01-01', user: company })
    server.use(http.get(`${base}/jobs`, ({ request }) => {
      expect(request.headers.get('Authorization')).toBe('Bearer company-token')
      return HttpResponse.json([job])
    }))
    expect(await jobsApi.getJobs()).toEqual([expect.objectContaining({ id: 'job-1' })])
  })

  it('TC080 sends create and update vacancy payloads to the correct endpoints', async () => {
    server.use(
      http.post(`${base}/jobs`, async ({ request }) => {
        expect(await request.json()).toEqual(expect.objectContaining({ title: 'React Engineer' }))
        return HttpResponse.json(job)
      }),
      http.put(`${base}/jobs/job-1`, async ({ request }) => {
        expect(await request.json()).toEqual(expect.objectContaining({ title: 'Senior React Engineer' }))
        return HttpResponse.json({ ...job, title: 'Senior React Engineer' })
      }),
    )
    await jobsApi.createJob({ title: 'React Engineer', department: 'Engineering', location: 'Remote', employmentType: 'Full-time', experienceLevel: 'Senior', description: 'Build interfaces' })
    expect(await jobsApi.updateJob('job-1', {
      title: 'Senior React Engineer', department: 'Engineering', location: 'Remote',
      employmentType: 'Full-time', experienceLevel: 'Senior', description: 'Build interfaces',
    })).toEqual(expect.objectContaining({ title: 'Senior React Engineer' }))
  })

  it('TC081 deletes a vacancy with the expected HTTP method and ID', async () => {
    server.use(http.delete(`${base}/jobs/job-1`, () => new HttpResponse(null, { status: 204 })))
    await expect(jobsApi.deleteJob('job-1')).resolves.toBeNull()
  })

  it('TC082 applies to a job and removes a saved job through candidate endpoints', async () => {
    server.use(
      http.post(`${base}/jobs/job-1/apply`, () => HttpResponse.json({ message: 'Applied', applicationId: 'application-1', appliedDate: '2026-01-02' })),
      http.delete(`${base}/candidate/saved-jobs/job-1`, () => new HttpResponse(null, { status: 204 })),
    )
    expect(await jobApplicationsApi.apply('job-1')).toEqual(expect.objectContaining({ applicationId: 'application-1' }))
    await expect(savedJobsApi.remove('job-1')).resolves.toBeNull()
  })

  it('TC083 reports a rejected candidate profile update', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(http.put(`${base}/candidate/profile`, () => HttpResponse.json({ message: 'Profile update rejected' }, { status: 400 })))
    await expect(candidateAuthApi.updateProfile({ headline: 'Engineer' })).rejects.toThrow('Profile update rejected')
  })

  it('TC094 starts the selected exam session with a POST request', async () => {
    server.use(http.post(`${base}/Assessments/take/submission-1/start`, () =>
      HttpResponse.json({ submissionId: 'submission-1', status: 'In_Progress', questions: [] })))
    expect(await assessmentsApi.startExam('submission-1')).toEqual(expect.objectContaining({ status: 'In_Progress' }))
  })

  it('TC095 submits answer code and reports a rejected exam submission', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(http.post(`${base}/Assessments/take/submission-1/submit`, async ({ request }) => {
      expect(await request.json()).toEqual({ answers: [{ questionId: 'question-1', submittedCode: 'return 42', language: 'javascript' }] })
      return HttpResponse.json({ message: 'Submission window closed' }, { status: 409 })
    }))
    await expect(assessmentsApi.submitExam('submission-1', {
      answers: [{ questionId: 'question-1', submittedCode: 'return 42', language: 'javascript' }],
    })).rejects.toThrow('Submission window closed')
  })
})
