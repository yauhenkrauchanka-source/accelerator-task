---
name: release
spawns: release
phase: release
flow-next: []
---

# Release

Spawn the isolated `release` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: release
- description: Prepare release artifacts and, after separate confirmations, publish a tag and GitHub release when the remote and authentication support it.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

