import type { CreateSessionInput } from './types'

export interface CreateSessionErrors {
  title?: string
  startsAt?: string
}

export const TITLE_MIN_LENGTH = 3
export const TITLE_MAX_LENGTH = 80

export function validateCreateSession(
  raw: { title: string; startsAtLocal: string },
  now: Date,
): { ok: true; value: CreateSessionInput } | { ok: false; errors: CreateSessionErrors } {
  const errors: CreateSessionErrors = {}

  const title = raw.title.trim()
  if (title === '') {
    errors.title = 'Title is required.'
  } else if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
    errors.title = 'Title must be 3–80 characters.'
  }

  let startsAt = ''
  if (raw.startsAtLocal === '') {
    errors.startsAt = 'Start date and time are required.'
  } else {
    const time = new Date(raw.startsAtLocal).getTime()
    if (Number.isNaN(time) || time <= now.getTime()) {
      errors.startsAt = 'Start time must be in the future.'
    } else {
      startsAt = new Date(time).toISOString()
    }
  }

  if (errors.title !== undefined || errors.startsAt !== undefined) {
    return { ok: false, errors }
  }
  return { ok: true, value: { title, startsAt } }
}
