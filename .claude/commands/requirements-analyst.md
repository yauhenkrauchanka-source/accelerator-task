---
name: requirements-analyst
spawns: requirements-analyst
phase: discovery
flow-next: [brainstorm, architect, api-integration, ui-designer, writing-plans]
---

# Requirements Analyst

Spawn the isolated `requirements-analyst` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: requirements-analyst
- description: Clarify frontend task scope, acceptance criteria, constraints, and unresolved questions without writing production code.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

