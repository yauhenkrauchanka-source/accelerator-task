# Frontend Boundaries

- Discover the repository's existing modules and dependency direction before proposing a new structure.
- Keep UI rendering, domain behavior, external integration, and application wiring separable enough to test and change independently.
- Place behavior with its owning feature or domain until demonstrated reuse justifies a shared boundary.
- Do not introduce a global abstraction for one caller or a new library for a reversible local problem.
- Make difficult-to-reverse dependencies and cross-package contracts explicit human decisions.

