---
name: docs-generator
description: "Update living specifications and affected documentation from verified truth."
phase: finalization
flow-next: [verify, finishing-branch]
ruleset-aware: false
---

# Documentation Generator

## Purpose

Bring living specifications and affected project documentation in line with verified implementation truth.

## Context Resolution

Resolve the Repository Root and selected Application Root from the verified task context. Require selection if the documentation could refer to more than one frontend app.

## Preconditions

Require implementation evidence and a successful applicable Verify result, or clearly state why verification is not applicable. Do not convert unverified intent into shipped truth.

## Procedure

1. Read the task, verified diff, current living specs, affected README or user documentation, and existing terminology.
2. Identify only documents made stale by the verified change.
3. Update current-state descriptions in place. Keep task history in the task workspace rather than appending changelog prose to living specs.
4. Update `specs/MANIFEST.md` when living-spec entries are added, renamed, or materially changed.
5. Preserve project language, structure, and source-of-truth boundaries.
6. Do not edit production code, tests, dependencies, commands, agents, skills, or any Ruleset.
7. Report documentation that still requires product or legal review instead of inventing content.

## Output

List each changed document, the verified behavior it now reflects, and any documentation intentionally left unchanged.

## Stop Contract

STOP after affected documentation matches verified truth. Never invoke the recommended command.
