import { SESSION_STATUSES } from './types'
import type { CreateSessionInput, Session, SessionStatus } from './types'

const LIST_FALLBACK_MESSAGE = 'Could not load sessions.'
const CREATE_FALLBACK_MESSAGE = 'Could not create session. Please try again.'

export class ApiError extends Error {
  status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function sessionsUrl(): string {
  const base: string = import.meta.env.VITE_API_BASE_URL ?? '/api'
  return new URL(`${base.replace(/\/$/, '')}/sessions`, window.location.origin).toString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSessionStatus(value: unknown): value is SessionStatus {
  return typeof value === 'string' && (SESSION_STATUSES as readonly string[]).includes(value)
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.startsAt === 'string' &&
    isSessionStatus(value.status)
  )
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json()
    if (isRecord(body) && typeof body.message === 'string' && body.message.trim() !== '') {
      return body.message
    }
  } catch {
    // Body is missing or not JSON; the caller uses its fallback message.
  }
  return null
}

async function send(url: string, init: RequestInit, fallback: string): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(fallback, null)
  }
  if (!response.ok) {
    const message = response.status === 400 ? await readErrorMessage(response) : null
    throw new ApiError(message ?? fallback, response.status)
  }
  try {
    return (await response.json()) as unknown
  } catch {
    throw new ApiError(fallback, response.status)
  }
}

export async function listSessions(signal?: AbortSignal): Promise<Session[]> {
  const data = await send(sessionsUrl(), { method: 'GET', signal }, LIST_FALLBACK_MESSAGE)
  if (!Array.isArray(data) || !data.every(isSession)) {
    throw new ApiError(LIST_FALLBACK_MESSAGE, null)
  }
  return data
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const data = await send(
    sessionsUrl(),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    CREATE_FALLBACK_MESSAGE,
  )
  if (!isSession(data)) {
    throw new ApiError(CREATE_FALLBACK_MESSAGE, null)
  }
  return data
}
