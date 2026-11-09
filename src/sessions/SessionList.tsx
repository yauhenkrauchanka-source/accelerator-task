import { STATUS_LABELS } from './types'
import type { Session } from './types'

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function SessionList({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return <p className="session-empty">No sessions to show.</p>
  }

  return (
    <ul className="session-list" aria-label="Sessions">
      {sessions.map((session) => (
        <li key={session.id} className="session-item">
          <span className="session-title">{session.title}</span>
          <span className={`session-status session-status--${session.status}`}>
            {STATUS_LABELS[session.status]}
          </span>
          <time dateTime={session.startsAt}>
            {dateTimeFormat.format(new Date(session.startsAt))}
          </time>
        </li>
      ))}
    </ul>
  )
}
