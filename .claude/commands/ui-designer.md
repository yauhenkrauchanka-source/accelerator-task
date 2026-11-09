---
name: ui-designer
spawns: ui-designer
phase: planning
flow-next: [architect, api-integration, writing-plans]
---

# Ui Designer

Spawn the isolated `ui-designer` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: ui-designer
- description: Design context-appropriate frontend structure, interactions, responsive behavior, accessibility, and user-visible states without writing production UI.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

