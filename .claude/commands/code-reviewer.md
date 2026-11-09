---
name: code-reviewer
spawns: code-reviewer
phase: review
flow-next: [coder, test-generator, browser-verify, verify]
---

# Code Reviewer

Spawn the isolated `code-reviewer` agent for this frontend activity.

## Input

$ARGUMENTS

## Instructions

Use the Task tool with exactly:

- subagent_type: code-reviewer
- description: Review a local diff, branch diff, or pull request as a read-only frontend reviewer and report prioritized evidence-based findings.
- prompt: $ARGUMENTS

Return the agent's result to the user. Do not perform the skill's work in this command wrapper and do not continue to another role.

