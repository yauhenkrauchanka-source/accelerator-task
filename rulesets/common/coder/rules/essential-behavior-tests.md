# Essential Behavior Tests

- Changed user-visible behavior and fixed regressions require tests in the same implementation scope when test tooling exists.
- Assert outcomes and contracts, not internal function calls or snapshots alone.
- Cover the success path and the failure or boundary that would cause the most damaging regression.
- Use existing project test utilities, providers, mocks, and naming conventions.
- Never make Test Generator the sole owner of tests required to prove implementation correctness.

