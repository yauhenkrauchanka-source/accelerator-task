# State And Failure Flow

- Give each state one clear owner and derive values instead of synchronizing duplicate state.
- Separate transient UI state, shareable URL state, persisted client state, and remote data according to their lifecycle.
- Define loading, empty, partial, error, permission, retry, cancellation, and stale-data behavior at integration boundaries.
- Contain failures near the boundary that can recover while preserving a usable application shell.
- Treat performance, security, observability, and testability as part of the design rather than cleanup work.

