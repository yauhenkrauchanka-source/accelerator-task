---
name: docs-generator
spawns: docs-generator
phase: finalization
flow-next: [verify, finishing-branch]
---

# Docs Generator

Spawn the isolated `docs-generator` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: docs-generator
- description: Update living specifications and affected project documentation from verified implementation truth without changing production code or rulesets.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

