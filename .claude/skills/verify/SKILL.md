---
name: verify
description: "Run existing checks and return a read-only evidence-based verdict."
phase: quality
flow-next: [coder, debugger, test-generator, browser-verify, docs-generator, finishing-branch]
ruleset-aware: false
---

# Verify

## Purpose

Return an honest read-only verdict from the checks the selected frontend project already defines.

## Context Resolution

Resolve the Repository Root and selected Application Root without assuming a fixed layout, framework, package manager, or root package manifest. Require explicit selection when multiple frontend apps remain.

## Procedure

1. Inspect the Application Root for its package manager, scripts, TypeScript configuration, test setup, build setup, and repository-specific verification instructions.
2. Select only existing applicable checks such as formatting, lint, typecheck, unit/integration tests, end-to-end tests, or build.
3. Show potentially slow or state-writing commands and obtain approval when the environment requires it.
4. Run commands from the correct Application Root. Do not install dependencies, change lockfiles, edit configuration, or repair failures.
5. Capture exit codes and decisive output. Distinguish command failure, missing tooling, not-applicable checks, and environment blockage.
6. Inspect final diff/status only to report scope, never to modify it.
7. Write `tasks/TASK-NNN/verification.md` only when a task workspace exists and that write was requested; otherwise keep the verdict in the response.

## Verdict

Return `PASS` only when all applicable selected checks pass. Otherwise return `FAIL`, `BLOCKED`, or `NOT-APPLICABLE`, listing each command and result.

## Stop Contract

STOP after the verdict. Never repair a failure and never invoke the recommended command.
