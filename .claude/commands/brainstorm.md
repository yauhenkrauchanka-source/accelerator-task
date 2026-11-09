---
name: brainstorm
spawns: brainstorm
phase: discovery
flow-next: [requirements-analyst, architect, api-integration, ui-designer, writing-plans]
---

# Brainstorm

Spawn the isolated `brainstorm` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: brainstorm
- description: Explore frontend product behavior, users, flows, states, alternatives, and success criteria without selecting technical architecture.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

