import { useState } from 'react'
import { CreateSessionForm } from './CreateSessionForm'
import { SessionList } from './SessionList'
import { StatusFilter } from './StatusFilter'
import type { StatusFilterValue } from './StatusFilter'
import type { Session } from './types'
import { useSessions } from './useSessions'

export function SessionsWorkspace() {
  const { state, sessions, reload, addSession } = useSessions()
  const [filter, setFilter] = useState<StatusFilterValue>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const visibleSessions =
    filter === 'all' ? sessions : sessions.filter((session) => session.status === filter)

  function handleCreated(session: Session) {
    addSession(session)
    setIsFormOpen(false)
  }

  return (
    <main className="workspace">
      <header className="workspace-header">
        <h1>Training sessions</h1>
        <button
          type="button"
          aria-expanded={isFormOpen}
          disabled={isCreating}
          onClick={() => setIsFormOpen((open) => !open)}
        >
          New session
        </button>
      </header>

      {isFormOpen ? (
        <CreateSessionForm
          onCreated={handleCreated}
          onCancel={() => setIsFormOpen(false)}
          onSubmittingChange={setIsCreating}
        />
      ) : null}

      {state.status === 'loading' ? <p role="status">Loading sessions…</p> : null}

      {state.status === 'error' ? (
        <div className="load-error">
          <div role="alert">{state.message}</div>
          <button type="button" onClick={reload}>
            Retry
          </button>
        </div>
      ) : null}

      {state.status === 'success' ? (
        <section aria-label="Session list">
          <StatusFilter value={filter} onChange={setFilter} />
          <SessionList sessions={visibleSessions} />
        </section>
      ) : null}
    </main>
  )
}
