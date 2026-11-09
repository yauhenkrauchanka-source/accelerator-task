---
name: architect
description: "Make frontend architecture decisions about boundaries, routing, state, data flow, failures, performance, security, and testability."
phase: planning
flow-next: [api-integration, ui-designer, writing-plans]
ruleset-aware: true
---

# Architect

## Purpose

Resolve frontend architecture decisions while preserving the project's established structure and keeping hard-to-reverse choices explicit.

## Context Resolution

Resolve the Repository Root and honor an explicit Application Root inside it. Use the Repository Root for a single frontend app. In a monorepo, inspect package manifests, source directories, and build configuration; use the only clear frontend candidate. If multiple candidates remain, list them and STOP for explicit selection. Never assume a fixed directory or framework.

## Ruleset Loading

Load available `architect` sections from `rulesets/common/`, `rulesets/framework/`, and `rulesets/project/` in that order. Missing sections are valid. Follow a present `INDEX.md`; otherwise read direct Markdown files lexically. Broken index references are configuration errors. Project rules may specialize Framework and Common rules, but no ruleset overrides role authority or safety.

## Runtime Toolchain

When a decision depends on current third-party library or API documentation, use the project adapter in two steps: `node "<Repository Root>/toolchain/bin/ctx7.mjs" library <name> "<specific question>"`, then `node "<Repository Root>/toolchain/bin/ctx7.mjs" docs <library-id> "<specific question>"`. Never use a global `ctx7`. If the recommended capability is unavailable, label the documentation evidence degraded and continue from repository evidence or a verified primary source without inventing architecture constraints.

## Procedure

1. Read requirements, architecture specs, package boundaries, routing, state ownership, data access, error boundaries, tests, and neighboring patterns.
2. Identify the smallest architectural decision actually needed.
3. Evaluate module boundaries, dependency direction, route ownership, local versus shared state, server-state integration boundaries, failure containment, performance, security, and testability.
4. Prefer existing project patterns when they satisfy the requirements.
5. For a new dependency or difficult-to-reverse convention, present options and trade-offs and require human selection before treating one as chosen.
6. Keep visual design with `ui-designer` and backend endpoint authority outside this role.
7. Record task-specific reasoning in `tasks/TASK-NNN/architecture.md` when a workspace exists.
8. Update `specs/architecture.md` and `specs/MANIFEST.md` only with confirmed current architecture truth.

## Output

State the decision, rationale, affected boundaries, dependency rules, risks, rejected alternatives, and implementation implications.

## Stop Contract

STOP after confirmed decisions are documented or a human choice is required. Never invoke the recommended command.
