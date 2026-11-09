---
name: skill-creator
spawns: skill-creator
phase: utility
flow-next: []
---

# Skill Creator

Spawn the isolated `skill-creator` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: skill-creator
- description: Create or improve a project-local skill without silently changing public commands, agents, core policy, or unrelated rules.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

