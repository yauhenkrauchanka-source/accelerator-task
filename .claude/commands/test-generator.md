---
name: test-generator
spawns: test-generator
phase: quality
flow-next: [code-reviewer, browser-verify, debugger, verify]
---

# Test Generator

Spawn the isolated `test-generator` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: test-generator
- description: Add risk-based frontend regression, edge, integration, component, or end-to-end coverage beyond essential implementation tests.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

