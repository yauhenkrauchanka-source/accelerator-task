---
name: finishing-branch
spawns: finishing-branch
phase: finalization
flow-next: [release]
---

# Finishing Branch

Spawn the isolated `finishing-branch` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: finishing-branch
- description: Perform one explicitly selected git or pull-request finalization action after successful verification.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

