---
name: git-worktrees
description: "Create or select an isolated git worktree after explaining branch and filesystem effects."
phase: setup
flow-next: [coder]
ruleset-aware: false
---

# Git Worktrees

## Purpose

Prepare an isolated worktree without surprising branch, path, or cleanup effects.

## Context Resolution

Operate at the Repository Root. Application Root selection is not required because worktrees are repository-level state.

## Procedure

1. Inspect current status, branch, configured worktrees, and candidate base branch.
2. Refuse to hide, discard, or overwrite unrelated uncommitted work.
3. Propose a branch name and absolute worktree path. Paths with spaces are valid and must be passed without string-built shell interpolation.
4. Explain the exact `git worktree add` effect and ask for approval before creation.
5. After approval, create one worktree with a non-interactive git command and verify its branch and path.
6. Do not install dependencies, copy secrets, start a dev server, merge, push, or remove any worktree.
7. If an appropriate existing worktree already exists, report it rather than creating a duplicate.

## Output

Report the selected base, branch, absolute worktree path, status, and the command the user should run next from that worktree.

## Stop Contract

STOP after one worktree is selected or created, or when repository state requires user resolution. Never invoke the recommended command.
