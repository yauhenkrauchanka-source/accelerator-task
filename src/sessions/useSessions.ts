import { useCallback, useEffect, useState } from 'react'
import { ApiError, listSessions } from './api'
import type { Session } from './types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success' }

const LOAD_ERROR_MESSAGE = 'Could not load sessions.'

export function useSessions(): {
  state: LoadState
  sessions: Session[]
  reload: () => void
  addSession: (session: Session) => void
} {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [sessions, setSessions] = useState<Session[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listSessions(controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return
        setSessions(loaded)
        setState({ status: 'success' })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof ApiError ? error.message : LOAD_ERROR_MESSAGE
        setState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [reloadKey])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setReloadKey((key) => key + 1)
  }, [])

  const addSession = useCallback((session: Session) => {
    setSessions((current) => [session, ...current])
  }, [])

  return { state, sessions, reload, addSession }
}
