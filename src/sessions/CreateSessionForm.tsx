import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, createSession } from './api'
import type { Session } from './types'
import { validateCreateSession } from './validation'
import type { CreateSessionErrors } from './validation'

const CREATE_FALLBACK_MESSAGE = 'Could not create session. Please try again.'

export function CreateSessionForm({
  onCreated,
  onCancel,
  onSubmittingChange,
}: {
  onCreated: (session: Session) => void
  onCancel: () => void
  onSubmittingChange: (isSubmitting: boolean) => void
}) {
  const [title, setTitle] = useState('')
  const [startsAtLocal, setStartsAtLocal] = useState('')
  const [errors, setErrors] = useState<CreateSessionErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const startsAtRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const result = validateCreateSession({ title, startsAtLocal }, new Date())
    if (!result.ok) {
      setErrors(result.errors)
      setFormError(null)
      if (result.errors.title !== undefined) titleRef.current?.focus()
      else startsAtRef.current?.focus()
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    onSubmittingChange(true)
    setErrors({})
    setFormError(null)
    try {
      const created = await createSession(result.value)
      onCreated(created)
    } catch (error: unknown) {
      setFormError(error instanceof ApiError ? error.message : CREATE_FALLBACK_MESSAGE)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
      onSubmittingChange(false)
    }
  }

  return (
    <form className="create-form" aria-label="New session" noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="session-title">Title</label>
        <input
          ref={titleRef}
          id="session-title"
          name="title"
          type="text"
          autoComplete="off"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={errors.title !== undefined}
          aria-describedby={errors.title !== undefined ? 'session-title-error' : undefined}
        />
        {errors.title !== undefined ? (
          <p id="session-title-error" className="field-error">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="session-starts-at">Start date and time</label>
        <input
          ref={startsAtRef}
          id="session-starts-at"
          name="startsAt"
          type="datetime-local"
          autoComplete="off"
          value={startsAtLocal}
          onChange={(event) => setStartsAtLocal(event.target.value)}
          aria-invalid={errors.startsAt !== undefined}
          aria-describedby={errors.startsAt !== undefined ? 'session-starts-at-error' : undefined}
        />
        {errors.startsAt !== undefined ? (
          <p id="session-starts-at-error" className="field-error">
            {errors.startsAt}
          </p>
        ) : null}
      </div>

      {formError !== null ? (
        <p role="alert" className="form-error">
          {formError}
        </p>
      ) : null}

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create session'}
        </button>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
