import { delay, http, HttpResponse } from 'msw'
import type { Session } from '../sessions/types'
import { addSession, getSessions } from './data'

const SLOW_DELAY_MS = 1500

interface Scenario {
  slow: boolean
  error: boolean
}

// Manual scenario switch: `?mock=slow`, `?mock=error`, or `?mock=slow,error`.
function readScenario(): Scenario {
  if (typeof window === 'undefined') return { slow: false, error: false }
  const flags = (new URLSearchParams(window.location.search).get('mock') ?? '')
    .split(',')
    .map((flag) => flag.trim())
  return { slow: flags.includes('slow'), error: flags.includes('error') }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export const handlers = [
  http.get('/api/sessions', async () => {
    const scenario = readScenario()
    if (scenario.slow) await delay(SLOW_DELAY_MS)
    if (scenario.error) {
      return HttpResponse.json({ message: 'Mock server error.' }, { status: 500 })
    }
    return HttpResponse.json(getSessions())
  }),

  http.post('/api/sessions', async ({ request }) => {
    const scenario = readScenario()
    if (scenario.slow) await delay(SLOW_DELAY_MS)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json({ message: 'Request body must be JSON.' }, { status: 400 })
    }
    if (!isRecord(body) || typeof body.title !== 'string' || typeof body.startsAt !== 'string') {
      return HttpResponse.json({ message: 'Title and start time are required.' }, { status: 400 })
    }

    const title = body.title.trim()
    if (title.length < 3 || title.length > 80) {
      return HttpResponse.json({ message: 'Title must be 3–80 characters.' }, { status: 400 })
    }
    const time = new Date(body.startsAt).getTime()
    if (Number.isNaN(time) || time <= Date.now()) {
      return HttpResponse.json({ message: 'Start time must be in the future.' }, { status: 400 })
    }

    const session: Session = {
      id: crypto.randomUUID(),
      title,
      status: 'scheduled',
      startsAt: body.startsAt,
    }
    addSession(session)
    return HttpResponse.json(session, { status: 201 })
  }),
]
