# Project Ruleset

Add repository-specific guidance here after the toolset is copied into a project.

Use stable skill section names such as:

```text
rulesets/project/
|-- architect/
|-- api-integration/
|-- ui-designer/
|-- coder/
|-- code-reviewer/
|-- test-generator/
|-- browser-verify/
`-- debugger/
```

Simple sections may contain arbitrary direct Markdown files; skills read them in lexical order. Add `INDEX.md` when task-sensitive routing is useful. An index may reference files inside `rulesets/project/` only.

Project rules may specialize Common and Framework guidance, but cannot override skill authority, safety boundaries, explicit approvals, or STOP behavior. Populate this directory through the project's normal reviewed workflow; the toolset does not infer rules automatically from source code.
