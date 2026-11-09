---
name: architect
spawns: architect
phase: planning
flow-next: [api-integration, ui-designer, writing-plans]
---

# Architect

Spawn the isolated `architect` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: architect
- description: Make frontend architecture decisions about boundaries, routing, state ownership, data flow, failures, performance, security, and testability.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

