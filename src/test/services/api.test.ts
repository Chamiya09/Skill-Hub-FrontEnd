import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { authStorage, candidateAuthApi, publicJobsApi, type JobDto } from '../../services/api'
import { candidate } from '../utils/auth'

const base = 'http://localhost:5155/api'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const job: JobDto = {
  id: 'job-1', companyId: 'acme', companyName: 'Acme', title: 'React Engineer',
  department: 'Engineering', location: 'Remote', employmentType: 'Full-time',
  experienceLevel: 'Senior', status: 'Active', description: 'Build interfaces',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('HTTP service contracts', () => {
  it('TC027 sends candidate credentials and stores the returned session', async () => {
    server.use(http.post(`${base}/auth/candidate/login`, async ({ request }) => {
      expect(await request.json()).toEqual({ email: 'alex@example.com', password: 'secret123' })
      return HttpResponse.json({ token: 'test-token', tokenType: 'Bearer', expiresAt: '2027-01-01', user: candidate })
    }))
    const response = await candidateAuthApi.login({ email: 'alex@example.com', password: 'secret123' })
    expect(response.user.fullName).toBe('Alex Rivera')
    expect(authStorage.getToken()).toBe('test-token')
    expect(authStorage.getUser()).toEqual(candidate)
  })

  it('TC028 propagates an authentication error without storing a session', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(http.post(`${base}/auth/candidate/login`, () => HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })))
    await expect(candidateAuthApi.login({ email: 'alex@example.com', password: 'wrong' })).rejects.toThrow('Invalid credentials')
    expect(authStorage.getToken()).toBeNull()
  })

  it('TC029 applies public job filters and returns the matching data', async () => {
    server.use(http.get(`${base}/public/jobs`, ({ request }) => {
      const url = new URL(request.url)
      expect(url.searchParams.get('department')).toBe('Engineering')
      expect(url.searchParams.get('search')).toBe('React')
      return HttpResponse.json([job])
    }))
    const result = await publicJobsApi.getJobs({ department: 'Engineering', search: 'React' })
    expect(result).toEqual([expect.objectContaining({ id: 'job-1', title: 'React Engineer' })])
  })

  it('TC030 loads a public job detail by ID', async () => {
    server.use(http.get(`${base}/public/jobs/job-1`, () => HttpResponse.json(job)))
    expect(await publicJobsApi.getJobById('job-1')).toEqual(expect.objectContaining({ title: 'React Engineer' }))
  })

  it('TC031 clears the candidate session on logout', () => {
    authStorage.setAuth({ token: 'test-token', tokenType: 'Bearer', expiresAt: '2027-01-01', user: candidate })
    authStorage.clearAuth()
    expect(authStorage.getToken()).toBeNull()
    expect(authStorage.getUser()).toBeNull()
  })
})
