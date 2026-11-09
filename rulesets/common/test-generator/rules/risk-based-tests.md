# Risk-Based Tests

- Start from a risk inventory and existing coverage rather than a target percentage.
- Prefer tests that would fail when acceptance criteria, contracts, permissions, recovery, or a known regression breaks.
- Choose the cheapest level that proves the behavior: unit, integration, component, or end-to-end.
- Avoid duplicate tests, implementation-detail assertions, arbitrary snapshots, and live external dependencies.
- Report valuable risks that remain untested because the project lacks a safe seam or environment.

