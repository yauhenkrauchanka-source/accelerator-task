import type { Session } from '../sessions/types'

const DAY_MS = 24 * 60 * 60 * 1000

function atOffset(days: number, hour: number): string {
  const date = new Date(Date.now() + days * DAY_MS)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

function createSeed(): Session[] {
  return [
    { id: 'seed-1', title: 'Onboarding fundamentals', status: 'scheduled', startsAt: atOffset(2, 10) },
    { id: 'seed-2', title: 'Advanced React patterns', status: 'scheduled', startsAt: atOffset(5, 14) },
    { id: 'seed-3', title: 'Accessibility basics', status: 'completed', startsAt: atOffset(-3, 9) },
    { id: 'seed-4', title: 'Testing with Vitest', status: 'completed', startsAt: atOffset(-10, 15) },
    { id: 'seed-5', title: 'Performance clinic', status: 'cancelled', startsAt: atOffset(1, 11) },
  ]
}

let store: Session[] = createSeed()

export function getSessions(): Session[] {
  return store.map((session) => ({ ...session }))
}

export function addSession(session: Session): void {
  store = [session, ...store]
}

export function resetSessionsStore(): void {
  store = createSeed()
}
