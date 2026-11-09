---
name: verify
spawns: verify
phase: quality
flow-next: [coder, debugger, test-generator, browser-verify, docs-generator, finishing-branch]
---

# Verify

Spawn the isolated `verify` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: verify
- description: Run existing project checks and return a read-only pass, fail, blocked, or not-applicable verdict without repairing failures.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

