---
name: browser-verify
description: "Verify rendered frontend behavior in a real browser without editing production code."
phase: quality
flow-next: [coder, debugger, verify]
ruleset-aware: true
---

# Browser Verify

## Purpose

Collect real-browser evidence for frontend behavior without changing production code.

## Context Resolution

Resolve the Repository Root and selected Application Root without assuming a fixed layout or framework. If multiple frontend apps remain, require selection.

## Ruleset Loading

Load available `browser-verify` sections from Common, Framework, and Project Rulesets. Missing sections are valid. Follow a present `INDEX.md`; otherwise read direct Markdown files lexically. Broken references are configuration errors.

## Runtime Toolchain

Run `node "<Repository Root>/toolchain/bin/doctor.mjs" --json` before browser work. This project Doctor is the only browser-readiness gate. Do not run the browser adapter's `doctor` command as a readiness or launch check; it performs an independent diagnostic probe and does not create the verification session. Return `BLOCKED` when the project Doctor reports the required browser capability unavailable, the project hook registration conflicting, or the accelerator Node.js runtime unsupported. Use only `node "<Repository Root>/toolchain/bin/agent-browser.mjs"`; never fall back to a global `agent-browser`, Playwright CLI, or an implicit browser tool.

Browser launch and CDP control may require host/GUI execution approval in a sandboxed runtime. If the first `open` fails inside a sandbox with a browser-launch, CDP connection, or response-channel-closed error, request the required host/GUI execution approval and retry `open` once. Return `BLOCKED` only if that approved retry also fails or the approval is denied, and report both attempts. Do not escalate application failures or use escalation to change the verification target.

## Server Discovery And Ownership

1. Prefer a URL supplied by the user or emitted by an already-running project server.
2. Otherwise inspect project scripts and process output to identify the real start command and URL. Never assume `localhost:3000` or any fixed port.
3. Ask for explicit approval before starting a development server.
4. Record the exact process started and its emitted URL.
5. Stop only a server process started by this role. Never stop an existing user process.

## Verification Procedure

1. Choose a unique, non-secret session name for this verification and pass `--session <name>` on every adapter call.
2. The first browser-adapter command for the owned session must be `open <actual URL>`. Do not substitute the adapter's `doctor`, `get url`, or `snapshot` commands for this launch step. After `open` succeeds, set the evidence-relevant viewport with `set viewport` and capture an interactive accessibility snapshot with `snapshot -i`.
3. Exercise requested primary and recovery paths through element refs, re-snapshotting after navigation or material DOM changes.
4. Check relevant desktop and mobile viewports without inventing a fixed universal viewport set. Inspect loading, empty, error, permission, success, focus, keyboard, overflow, and long-content behavior.
5. Run `console`, `errors`, and `network requests`; record relevant failures, response status, and unexpected navigation.
6. Capture a screenshot when it materially supports the verdict.
7. Close the owned adapter session even when verification fails. Do not close another session or an existing user browser.
8. Do not edit source, tests, configuration, or data to make the check pass.

## Verdict

Return `PASS`, `FAIL`, `BLOCKED`, or `NOT-APPLICABLE` with exact URL, viewport, interactions, console/network evidence, and any server process stopped.

## Stop Contract

STOP after evidence and verdict are reported and any server owned by this role is handled. Never invoke the recommended command.
