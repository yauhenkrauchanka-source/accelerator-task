---
name: skill-creator
description: "Create or improve a project-local skill without silently changing public workflow policy."
phase: utility
flow-next: []
ruleset-aware: false
---

# Skill Creator

## Purpose

Create or improve one project-local skill while preserving the fixed public command catalog and core workflow policy.

## Context Resolution

Operate at the Repository Root. Inspect existing skills and project instructions before choosing a name or location. Application Root is relevant only when the skill targets one frontend app.

## Procedure

1. Clarify the skill's recurring job, trigger phrases, inputs, authority, outputs, and failure boundaries.
2. Search existing project skills and the public catalog to avoid duplication.
3. Propose a kebab-case name and exact files.
4. Create or update `.claude/skills/<name>/SKILL.md` with focused instructions and only necessary references, scripts, or assets.
5. Test the skill against representative requests when the runtime supports it.
6. Do not create or rename a public command, agent, or catalog transition without a separate product decision.
7. Do not modify Common or Framework Rulesets as a side effect.
8. For Codex parity downstream, show the exact mirror change under `.agents/skills/<name>/` and apply that exact copy only after explicit approval. Keep `.claude/skills/` canonical and disclose that no downstream sync command is installed.

## Output

Report the skill path, trigger contract, files created, validation performed, runtime-parity state, and known limitations.

## Stop Contract

STOP after one skill is created or improved and its validation is reported. Never invoke another command.
