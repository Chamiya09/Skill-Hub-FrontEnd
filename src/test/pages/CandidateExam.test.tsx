import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CandidateExam } from '../../pages/CandidateExam'
import { assessmentsApi, type CandidateCodingQuestionDto, type StartExamResponseDto, type SubmissionDetailDto } from '../../services/api'

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) =>
    <textarea aria-label="Code editor" value={value} onChange={(event) => onChange(event.target.value)} />,
}))
vi.mock('../../services/api', () => ({
  API_BASE_URL: 'http://localhost:5155/api',
  assessmentsApi: {
    getExamPaper: vi.fn(), startExam: vi.fn(), saveDraft: vi.fn(), submitExam: vi.fn(),
    runCode: vi.fn(), logProctorEvent: vi.fn(), blockAssessment: vi.fn(),
  },
}))

const questions: CandidateCodingQuestionDto[] = [
  { id: 'q-1', title: 'Sum numbers', problemStatement: 'Return the sum.', language: 'javascript', difficulty: 'Easy', starterCode: 'function sum() {}', sampleTestCases: [], points: 50, order: 1 },
  { id: 'q-2', title: 'Sort numbers', problemStatement: 'Return sorted values.', language: 'javascript', difficulty: 'Medium', starterCode: 'function sort() {}', sampleTestCases: [], points: 50, order: 2 },
]
const paper: StartExamResponseDto = {
  submissionId: 'submission-1', assessmentId: 'assessment-1', assessmentTitle: 'Frontend Challenge',
  timeLimitMinutes: 30, status: 'Assigned', questions,
}
const submitted: SubmissionDetailDto = {
  id: 'submission-1', assessmentId: 'assessment-1', assessmentTitle: 'Frontend Challenge',
  candidateId: 'candidate-1', applicationId: 'application-1', jobVacancyId: 'job-1',
  examScore: 0, cvScore: 0, finalWeightedScore: 0, passingThreshold: 70,
  status: 'Under_Review', answers: [], proctorSummary: { tabSwitches: 0, windowBlurs: 0, events: [] },
}
const renderPage = () => render(
  <MemoryRouter initialEntries={['/exam/take/submission-1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/exam/take/:submissionId" element={<CandidateExam />} />
      <Route path="/candidate/assessments" element={<h1>Assessment list</h1>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  vi.mocked(assessmentsApi.getExamPaper).mockReset().mockResolvedValue(paper)
  vi.mocked(assessmentsApi.startExam).mockReset().mockResolvedValue({ ...paper, status: 'In_Progress' })
  vi.mocked(assessmentsApi.saveDraft).mockReset().mockResolvedValue({ success: true })
  vi.mocked(assessmentsApi.submitExam).mockReset().mockResolvedValue(submitted)
  vi.mocked(assessmentsApi.runCode).mockReset().mockResolvedValue({ stdout: '42', stderr: '', exitCode: 0, isRateLimited: false, isError: false, executionTimeMs: 5 })
  vi.mocked(assessmentsApi.logProctorEvent).mockReset().mockResolvedValue({ success: true })
  vi.mocked(assessmentsApi.blockAssessment).mockReset().mockResolvedValue({ success: true })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  localStorage.clear()
})

afterEach(() => vi.useRealTimers())

async function beginExam() {
  renderPage()
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Begin Assessment' }))
  expect(await screen.findByText('LIVE CODING ASSESSMENT')).toBeInTheDocument()
}

describe('Candidate examination', () => {
  it('TC096 loads the paper and displays the integrity briefing', async () => {
    renderPage()
    expect(screen.getByLabelText('Initializing Secure Assessment Environment')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Frontend Challenge' })).toBeInTheDocument()
    expect(screen.getByText(/Strict One-Attempt Security Policy/)).toBeInTheDocument()
    expect(assessmentsApi.getExamPaper).toHaveBeenCalledWith('submission-1')
  })

  it('TC097 shows a network failure instead of starting the exam', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(assessmentsApi.getExamPaper).mockRejectedValue(new Error('Network unavailable'))
    renderPage()
    expect(await screen.findByText('Network unavailable')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Begin Assessment' })).not.toBeInTheDocument()
  })

  it('TC098 blocks an already started attempt', async () => {
    vi.mocked(assessmentsApi.getExamPaper).mockResolvedValue({ ...paper, status: 'Started' })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Assessment Blocked' })).toBeInTheDocument()
    expect(assessmentsApi.blockAssessment).toHaveBeenCalledWith('submission-1')
    expect(assessmentsApi.startExam).not.toHaveBeenCalled()
  })

  it('TC099 keeps the exam unavailable when its start request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(assessmentsApi.startExam).mockRejectedValue(new Error('Start rejected'))
    renderPage()
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Begin Assessment' }))
    expect(await screen.findByText('Start rejected')).toBeInTheDocument()
    expect(screen.queryByText('LIVE CODING ASSESSMENT')).not.toBeInTheDocument()
  })

  it('TC100 starts the exam, navigates questions, and preserves edited code', async () => {
    await beginExam()
    expect(assessmentsApi.startExam).toHaveBeenCalledWith('submission-1')
    const editor = await screen.findByRole('textbox', { name: 'Code editor' })
    expect(editor).toHaveValue('function sum() {}')
    fireEvent.change(editor, { target: { value: 'return 42' } })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Q2' }))
    expect(screen.getByRole('textbox', { name: 'Code editor' })).toHaveValue('function sort() {}')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Q1' }))
    expect(screen.getByRole('textbox', { name: 'Code editor' })).toHaveValue('return 42')
    expect(JSON.parse(localStorage.getItem('exam_draft_submission-1') || '{}').answers['q-1'].code).toBe('return 42')
  })

  it('TC101 sends current code to the execution service and displays output', async () => {
    await beginExam()
    fireEvent.change(await screen.findByRole('textbox', { name: 'Code editor' }), { target: { value: 'return 42' } })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Run' }))
    await waitFor(() => expect(assessmentsApi.runCode).toHaveBeenCalledWith('submission-1', {
      questionId: 'q-1', code: 'return 42', language: 'javascript',
    }))
    expect(await screen.findByText('42')).toBeInTheDocument()
  })

  it('TC102 requires confirmation and submits edited answers', async () => {
    await beginExam()
    fireEvent.change(await screen.findByRole('textbox', { name: 'Code editor' }), { target: { value: 'return 42' } })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Submit Exam/ }))
    expect(screen.getByText('Submit Technical Assessment?')).toBeInTheDocument()
    expect(assessmentsApi.submitExam).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Confirm & Finalize' }))
    await waitFor(() => expect(assessmentsApi.submitExam).toHaveBeenCalledWith('submission-1', {
      answers: [
        { questionId: 'q-1', submittedCode: 'return 42', language: 'javascript' },
        { questionId: 'q-2', submittedCode: 'function sort() {}', language: 'javascript' },
      ],
    }))
    expect(await screen.findByText(/Your code has been securely submitted/)).toBeInTheDocument()
  })

  it('TC103 shows a submission error and keeps the editor available', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(assessmentsApi.submitExam).mockRejectedValue(new Error('Submission failed'))
    await beginExam()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Submit Exam/ }))
    await user.click(screen.getByRole('button', { name: 'Confirm & Finalize' }))
    expect(await screen.findByText('Submission failed')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Code editor' })).toBeInTheDocument()
  })

  it('TC104 records a window-blur proctoring event during the exam', async () => {
    await beginExam()
    fireEvent.blur(window)
    await waitFor(() => expect(assessmentsApi.logProctorEvent).toHaveBeenCalledWith('submission-1', expect.objectContaining({ eventType: 'TAB_SWITCH' })))
    expect(screen.getByText('1 alert')).toBeInTheDocument()
  })

  it('TC105 automatically submits when the timer reaches zero', async () => {
    vi.mocked(assessmentsApi.startExam).mockResolvedValue({ ...paper, status: 'In_Progress', remainingSeconds: 1 })
    renderPage()
    const start = await screen.findByRole('button', { name: 'Begin Assessment' })
    vi.useFakeTimers()
    await act(async () => { fireEvent.click(start) })
    expect(screen.getByText('LIVE CODING ASSESSMENT')).toBeInTheDocument()
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(assessmentsApi.submitExam).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Your code has been securely submitted/)).toBeInTheDocument()
  })

  it('TC145 persists edited code to the backend after the draft debounce', async () => {
    await beginExam()
    const editor = await screen.findByRole('textbox', { name: 'Code editor' })
    vi.useFakeTimers()
    const previousSaves = vi.mocked(assessmentsApi.saveDraft).mock.calls.length
    fireEvent.change(editor, { target: { value: 'return 42' } })
    expect(assessmentsApi.saveDraft).toHaveBeenCalledTimes(previousSaves)
    await act(async () => { vi.advanceTimersByTime(1500) })
    expect(vi.mocked(assessmentsApi.saveDraft).mock.calls.length).toBeGreaterThan(previousSaves)
    expect(assessmentsApi.saveDraft).toHaveBeenCalledWith('submission-1', expect.objectContaining({
      answers: expect.arrayContaining([expect.objectContaining({ questionId: 'q-1', submittedCode: 'return 42' })]),
    }))
  })

  it('TC146 reports a code execution failure without discarding the answer', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(assessmentsApi.runCode).mockRejectedValue(new Error('Execution service unavailable'))
    await beginExam()
    fireEvent.change(await screen.findByRole('textbox', { name: 'Code editor' }), { target: { value: 'return 42' } })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Run' }))
    expect(await screen.findByText('Execution service unavailable')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Code editor' })).toHaveValue('return 42')
  })

  it('TC147 reports an automatic submission failure after the timer expires', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(assessmentsApi.startExam).mockResolvedValue({ ...paper, status: 'In_Progress', remainingSeconds: 1 })
    vi.mocked(assessmentsApi.submitExam).mockRejectedValue(new Error('Network unavailable'))
    renderPage()
    const start = await screen.findByRole('button', { name: 'Begin Assessment' })
    vi.useFakeTimers()
    await act(async () => { fireEvent.click(start) })
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText(/Assessment time expired. An error occurred while submitting answers/)).toBeInTheDocument()
    expect(assessmentsApi.submitExam).toHaveBeenCalledTimes(1)
  })
})
