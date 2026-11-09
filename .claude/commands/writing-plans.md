---
name: writing-plans
spawns: writing-plans
phase: planning
flow-next: [git-worktrees, coder]
---

# Writing Plans

Spawn the isolated `writing-plans` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: writing-plans
- description: Produce a file-level frontend implementation plan with contracts, tests, and verification while leaving production code unchanged.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

