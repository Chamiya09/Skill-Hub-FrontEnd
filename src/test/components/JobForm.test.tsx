import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { JobForm } from '../../components/jobs/JobForm'

vi.mock('react-quill-new', () => ({
  default: ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) =>
    <textarea aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />,
}))

const renderForm = (onSubmit = vi.fn(), initialData = {}) => render(
  <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <JobForm onSubmit={onSubmit} initialData={initialData} formTitle="Post a Job" formSubtitle="Tell candidates about the role" backLinkUrl="/vacancies" />
  </MemoryRouter>,
)

describe('Job form', () => {
  it('TC025 requires a job title and location', async () => {
    const submit = vi.fn()
    renderForm(submit)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Publish Job Vacancy' }))
    expect(screen.getByLabelText(/Job Title/)).toBeInvalid()
    await user.type(screen.getByLabelText(/Job Title/), 'React Engineer')
    await user.click(screen.getByRole('button', { name: 'Publish Job Vacancy' }))
    expect(screen.getByLabelText(/Location/)).toBeInvalid()
    expect(submit).not.toHaveBeenCalled()
  })

  it('TC026 submits edited job information', async () => {
    const submit = vi.fn()
    renderForm(submit, { title: 'Old title', location: 'Remote', description: 'Original' })
    const user = userEvent.setup()
    await user.clear(screen.getByLabelText(/Job Title/))
    await user.type(screen.getByLabelText(/Job Title/), 'New title')
    await user.click(screen.getByRole('button', { name: 'Publish Job Vacancy' }))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ title: 'New title', location: 'Remote', description: 'Original' }))
  })

  it('TC084 passes edited rich text fields into the vacancy payload', async () => {
    const submit = vi.fn()
    renderForm(submit, { title: 'React Engineer', location: 'Remote' })
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /Enter the role overview/ }), '<p>Build interfaces</p>')
    await user.type(screen.getByRole('textbox', { name: /Highlight company perks/ }), '<p>Remote work</p>')
    await user.click(screen.getByRole('button', { name: 'Publish Job Vacancy' }))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ description: '<p>Build interfaces</p>', benefits: '<p>Remote work</p>' }))
  })
})
