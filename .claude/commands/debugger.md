---
name: debugger
spawns: debugger
phase: execution
flow-next: [coder, test-generator, code-reviewer, browser-verify, verify]
---

# Debugger

Spawn the isolated `debugger` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: debugger
- description: Reproduce and prove a frontend root cause, then apply one minimal verified fix with regression coverage when appropriate.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

