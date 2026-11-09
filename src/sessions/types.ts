export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Session {
  id: string
  title: string
  status: SessionStatus
  startsAt: string
}

export interface CreateSessionInput {
  title: string
  startsAt: string
}

export const SESSION_STATUSES: readonly SessionStatus[] = [
  'scheduled',
  'completed',
  'cancelled',
]

export const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
