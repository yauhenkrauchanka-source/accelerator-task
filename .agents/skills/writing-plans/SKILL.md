---
name: writing-plans
description: "Produce a file-level frontend implementation plan with contracts, tests, and verification."
phase: planning
flow-next: [git-worktrees, coder]
ruleset-aware: false
---

# Writing Plans

## Purpose

Produce an ordered, file-level handoff that another frontend developer can implement without rediscovering the task.

## Context Resolution

1. Resolve the Repository Root from git when available; otherwise use the nearest ancestor containing the copied `rulesets/` and `.claude/` directories.
2. Honor an explicit Application Root only when it resolves inside the Repository Root.
3. For code-related work, use the Repository Root when it is the only frontend application candidate.
4. In a monorepo, inspect package manifests, source directories, and build configuration. Use the only clear frontend candidate.
5. If multiple candidates remain, list them and STOP for explicit selection. Never assume `frontend/`, `web/`, `apps/*`, a root package manifest, a framework, or a dev-server port.

## Procedure

1. Read confirmed requirements, applicable task artifacts, living specifications, relevant source files, tests, scripts, and project conventions.
2. Check that architecture, API, UI direction, and dependency choices required by the work are resolved. Do not make missing specialist decisions silently.
3. Describe current behavior and intended behavior.
4. List exact files to create or modify, why each changes, and important contracts between steps.
5. Order implementation steps by dependency and identify which steps may proceed independently.
6. Include essential tests beside the behavior they protect and additional risk-based test opportunities separately.
7. List existing verification commands discovered from the selected Application Root. Do not invent commands or require dependency installation.
8. Record rollback or feature-flag considerations only when the task risk justifies them.
9. Write `tasks/TASK-NNN/implementation-plan.md` when a task workspace exists or durable handoff is requested.

## Plan Quality

Do not paste complete production implementations, prescribe artificial micro-commits, or turn unresolved assumptions into instructions.

## Stop Contract

STOP after the plan is actionable, or earlier when a required specialist decision is missing. Never invoke the recommended command.
