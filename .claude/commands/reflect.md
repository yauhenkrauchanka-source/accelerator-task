---
name: reflect
spawns: reflect
phase: utility
flow-next: []
---

# Reflect

Spawn the isolated `reflect` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: reflect
- description: Turn a demonstrated recurring correction into a proposed project rule and write it only after explicit approval.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

