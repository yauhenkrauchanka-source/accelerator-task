---
name: release
description: "Prepare release artifacts and publish a GitHub release only after explicit confirmations."
phase: release
flow-next: []
ruleset-aware: false
---

# Release

## Purpose

Prepare a release and publish it only when GitHub, authentication, repository state, and explicit confirmations support publication.

## Context Resolution

Operate at the Repository Root. Discover the remote provider, default branch, version source, package locations, tag convention, and changelog format from repository evidence.

## Procedure

1. Verify the working tree, release base, verification evidence, existing tags, and remote provider.
2. Determine the proposed version from project policy or present valid choices; never guess a breaking version decision.
3. Draft version-file changes, changelog entries, and release notes from commits and verified behavior.
4. Show planned local file writes and obtain explicit confirmation before applying them.
5. Re-run or require fresh applicable verification after release-file changes.
6. If the remote is confirmed GitHub and `gh` authentication is available, show exact tag, push, and GitHub release effects and obtain a separate publication confirmation.
7. Do not publish to GitLab or Bitbucket in v1. Prepare local artifacts and report publication as blocked.
8. Never force-push, overwrite an existing tag, or claim publication without evidence.

## Output

Report prepared artifacts, version, tag, verification, publication URL when successful, or the exact publication blocker.

## Stop Contract

STOP after local preparation or one confirmed GitHub publication attempt. Never invoke another command.
