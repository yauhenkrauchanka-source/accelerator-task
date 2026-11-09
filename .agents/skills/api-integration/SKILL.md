---
name: api-integration
description: "Define how frontend code consumes confirmed or provisional backend contracts without authoring backend endpoints."
phase: planning
flow-next: [architect, ui-designer, writing-plans]
ruleset-aware: true
---

# API Integration

## Purpose

Define the frontend side of an API integration without inventing backend truth.

## Context Resolution

Resolve the Repository Root and honor an explicit Application Root inside it. Use the Repository Root for a single frontend app. In a monorepo, inspect package manifests, source directories, and build configuration; use the only clear frontend candidate. If multiple candidates remain, list them and STOP for explicit selection. Never assume a fixed directory or framework.

## Ruleset Loading

Load available `api-integration` sections from `rulesets/common/`, `rulesets/framework/`, and `rulesets/project/` in that order. Missing sections, including all API-specific rules, are valid. Follow a present `INDEX.md`; otherwise read direct Markdown files lexically. Broken index references are configuration errors. When no rules exist, continue from repository evidence and general frontend integration practices.

## Runtime Toolchain

When a decision depends on current third-party library or API documentation, use the project adapter in two steps: `node "<Repository Root>/toolchain/bin/ctx7.mjs" library <name> "<specific question>"`, then `node "<Repository Root>/toolchain/bin/ctx7.mjs" docs <library-id> "<specific question>"`. Never use a global `ctx7`. If the recommended capability is unavailable, label the documentation evidence degraded and continue from repository evidence or a verified primary source without inventing an API contract.

## Procedure

1. Read requirements, existing client wrappers, generated clients, schemas, authentication handling, error mapping, mocks, and integration tests.
2. Classify every relevant contract element as confirmed, assumed, proposed, or blocked.
3. Define frontend request inputs, response shape, validation boundary, error and permission behavior, cancellation, retries, caching expectations, and user-visible states.
4. Reuse the project's transport and server-state patterns when present. Do not introduce a client library silently.
5. When the backend contract is missing, create a visibly provisional proposal or mock schema in `tasks/TASK-NNN/api-integration.md` and list questions for the backend owner.
6. Never present a proposed endpoint, field, status, or error as implemented backend behavior.
7. Update `specs/api-integration.md` only for confirmed integration truth.

## Output

Provide the contract classification, frontend integration plan, state/error matrix, test strategy, unresolved questions, and required external confirmation.

## Stop Contract

STOP after the frontend contract is clear or backend clarification is required. Never invoke the recommended command.
