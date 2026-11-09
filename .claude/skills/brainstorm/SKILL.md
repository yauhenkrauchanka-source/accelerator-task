---
name: brainstorm
description: "Explore frontend product behavior, users, flows, states, alternatives, and success criteria."
phase: discovery
flow-next: [requirements-analyst, architect, api-integration, ui-designer, writing-plans]
ruleset-aware: false
---

# Brainstorm

## Purpose

Explore product and interaction possibilities before implementation decisions harden.

## Context Resolution

1. Resolve the Repository Root from git when available; otherwise use the nearest ancestor containing the copied `rulesets/` and `.claude/` directories.
2. Honor an explicit Application Root only when it resolves inside the Repository Root.
3. For code-related work, use the Repository Root when it is the only frontend application candidate.
4. In a monorepo, inspect package manifests, source directories, and build configuration. Use the only clear frontend candidate.
5. If multiple candidates remain, list them and STOP for explicit selection. Never assume `frontend/`, `web/`, `apps/*`, a root package manifest, a framework, or a dev-server port.

## Procedure

1. Read the current request, requirements, relevant product documentation, and existing user-facing behavior.
2. Clarify target users, jobs, frequency of use, constraints, and what a successful experience feels like.
3. Map the primary flow plus meaningful alternate, empty, error, permission, and recovery paths.
4. Generate two or three materially different product or interaction approaches.
5. Compare approaches by user value, complexity, risk, reversibility, and consistency with the existing product.
6. Keep framework, library, module-boundary, and dependency choices outside this role.
7. Record the exploration in `tasks/TASK-NNN/brainstorm.md` only when a task workspace exists or durable handoff is requested.

## Output

Summarize the problem framing, explored alternatives, trade-offs, recommended product direction, and decisions still requiring the user or a specialist.

## Write Boundary

Write only the task brainstorm artifact. Do not change source code or living specifications.

## Stop Contract

STOP after the options and recommendation are clear. Never invoke the recommended command.
