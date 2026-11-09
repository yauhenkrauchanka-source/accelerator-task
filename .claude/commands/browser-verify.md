---
name: browser-verify
spawns: browser-verify
phase: quality
flow-next: [coder, debugger, verify]
---

# Browser Verify

Spawn the isolated `browser-verify` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: browser-verify
- description: Verify rendered frontend behavior in a real browser, including responsive, accessibility, console, and network evidence, without editing production code.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

