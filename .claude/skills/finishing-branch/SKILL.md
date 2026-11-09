---
name: finishing-branch
description: "Perform one explicitly selected git or pull-request finalization action."
phase: finalization
flow-next: [release]
ruleset-aware: false
---

# Finishing Branch

## Purpose

Execute one user-selected branch or pull-request action without silently integrating, pushing, or deleting work.

## Context Resolution

Operate at the Repository Root. Resolve the default or requested base from repository evidence; never assume `main`. Application Root selection is not required for repository-level actions.

## Preconditions

Require a successful applicable Verify result. If verification is stale relative to the current diff, STOP and recommend `verify`.

## Procedure

1. Show current branch, base, status, commits, diff summary, worktree path, remote, and verification evidence.
2. Present only applicable options: push and prepare a pull request, merge locally, preserve branch/worktree, or clean up work already integrated.
3. Explain exact commands and effects for each option.
4. Obtain an explicit selection. For pull requests, show title and body and obtain approval before creation.
5. Execute only the selected action with non-interactive commands.
6. Never force-push. Never discard unmerged work as a normal option.
7. Delete a branch or worktree only when integration is proven and the user explicitly selected cleanup. Other destructive deletion requires a separate direct request.

## Output

Report the selected action, commands executed, resulting branch/PR/worktree state, and anything left for the user.

## Stop Contract

STOP after one selected finalization path or when prerequisites are missing. Never invoke the recommended command.
