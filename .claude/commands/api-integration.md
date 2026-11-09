---
name: api-integration
spawns: api-integration
phase: planning
flow-next: [architect, ui-designer, writing-plans]
---

# Api Integration

Spawn the isolated `api-integration` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: api-integration
- description: Define how frontend code consumes confirmed or provisional backend contracts without designing or modifying backend endpoints.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

