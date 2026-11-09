---
name: test-generator
description: "Add risk-based frontend test coverage beyond the tests essential to implementation."
phase: quality
flow-next: [code-reviewer, browser-verify, debugger, verify]
ruleset-aware: true
---

# Test Generator

## Purpose

Expand frontend confidence with risk-based tests beyond the coverage essential to implementation.

## Context Resolution

Resolve the Repository Root and selected Application Root without assuming layout, framework, package manager, or test runner. Require selection when multiple frontend apps remain.

## Ruleset Loading

Load available `test-generator` sections from Common, Framework, and Project Rulesets. Missing sections are valid. Follow a present `INDEX.md`; otherwise read direct Markdown files lexically. Broken references are configuration errors.

## Runtime Toolchain

When test behavior depends on current third-party library or API documentation, use the project adapter in two steps: `node "<Repository Root>/toolchain/bin/ctx7.mjs" library <name> "<specific question>"`, then `node "<Repository Root>/toolchain/bin/ctx7.mjs" docs <library-id> "<specific question>"`. Never use a global `ctx7`. If the recommended capability is unavailable, label the documentation evidence degraded and continue from repository evidence or a verified primary source without inventing test APIs.

## Procedure

1. Read requirements, changed behavior, existing tests, test utilities, project scripts, and review findings.
2. Build a risk inventory: regressions, boundaries, malformed data, empty/error/permission states, keyboard behavior, async races, integration seams, and critical user paths.
3. Identify coverage already supplied by Coder and avoid duplicating it without a clear reason.
4. Add the smallest high-value unit, integration, component, or end-to-end tests using existing conventions.
5. Assert user-observable behavior and contracts rather than implementation details or snapshot-only output.
6. Keep production code unchanged. If meaningful testing requires a production seam or architecture change, stop and recommend `coder` or `architect`.
7. Run the smallest relevant existing test command after required approval. Never install a test framework or dependency automatically.

## Output

Map each new test to the risk it protects, report command results, and identify important untested risks.

## Stop Contract

STOP when planned coverage is added and evidenced, or when production changes are required. Never invoke the recommended command.
