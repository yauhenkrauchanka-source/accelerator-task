---
name: git-worktrees
spawns: git-worktrees
phase: setup
flow-next: [coder]
---

# Git Worktrees

Spawn the isolated `git-worktrees` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: git-worktrees
- description: Create or select an isolated git worktree after explaining the branch and filesystem effects.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

