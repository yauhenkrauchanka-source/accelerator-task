---
name: coder
spawns: coder
phase: execution
flow-next: [code-reviewer, test-generator, browser-verify, debugger, verify]
---

# Coder

Spawn the isolated `coder` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: coder
- description: Implement frontend production behavior and the tests directly required by that behavior using the selected application root and project conventions.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

