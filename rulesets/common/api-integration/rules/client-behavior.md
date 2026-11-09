# Client Behavior

- Reuse the project's established transport, authentication, validation, error mapping, and remote-data patterns.
- Define cancellation, timeout, retry, cache invalidation, stale-data, deduplication, and idempotency expectations only when the contract supports them.
- Map transport failures to user-visible recovery without leaking sensitive details.
- Keep remote calls out of purely presentational code when the project has an integration boundary.
- Test success plus meaningful permission, malformed-data, empty, and failure behavior without relying on a live backend.

