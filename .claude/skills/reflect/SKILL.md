---
name: reflect
description: "Turn a demonstrated recurring correction into an approved project rule."
phase: utility
flow-next: []
ruleset-aware: false
---

# Reflect

## Purpose

Convert a demonstrated recurring agent mistake or user correction into a narrowly scoped project rule.

## Context Resolution

Operate at the Repository Root. Application Root selection is needed only to inspect evidence; all writes remain under `rulesets/project/`.

## Procedure

1. Capture the concrete incident, correction, affected context, and evidence that the behavior can recur.
2. Decide whether a durable rule is justified. Do not create rules for one-off preferences without explicit user direction.
3. Classify the proposal by the matching stable skill section.
4. Draft a concise rule with trigger, required behavior, prohibited behavior, and an example when useful.
5. If the gap belongs to Common or Framework guidance, report it as an owner proposal; do not edit those Rulesets.
6. Show the exact target file and full proposed text.
7. Write only after explicit approval, and only under `rulesets/project/`. Update the section `INDEX.md` when one exists and routing must change.
8. Do not edit `AGENTS.md`, `CLAUDE.md`, commands, agents, skills, source code, or generated mirrors.

## Output

Report whether a rule was warranted, the evidence, approved file change if any, and how future matching work should route it.

## Stop Contract

STOP after the proposal or approved project-rule write. Never invoke another command.
