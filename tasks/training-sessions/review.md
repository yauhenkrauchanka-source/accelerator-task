# Code Review: training-sessions (Training Sessions Workspace)

## Context Summary

I reviewed the uncommitted working-tree changes against `HEAD` (`c6ed35e`). The review covered the modified `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/App.css` and `workflow-log.md`, and the new `src/sessions/*`, `src/mocks/*`, `src/test/setup.ts` and `public/mockServiceWorker.js`. I checked them against `tasks/training-sessions/requirements.md` (AC-1 to AC-9) and `implementation-plan.md`, using the `code-reviewer` skill and the Common and Framework code-reviewer rulesets. The implementation follows the plan closely, and every checklist item you asked about is implemented. Nothing I found blocks the happy path. One medium issue remains: cancelling the form while a create request is pending. There are also a few low-severity issues and test gaps. No files were changed.

## Requirement Checklist

| Item | Status | Evidence |
|---|---|---|
| List fields: title, status, start date/time | Met | `src/sessions/SessionList.tsx:18-24` (local `Intl.DateTimeFormat`, `<time dateTime>`) |
| Filter: "All" plus one status at a time | Met | `src/sessions/StatusFilter.tsx:20-33`; worked out at render time in `SessionsWorkspace.tsx:14-15`, so changing the filter sends no request (AC-3.3) and new sessions follow the active filter (AC-3.4) |
| Loading state | Met | `SessionsWorkspace.tsx:39` |
| Recoverable error state with Retry | Met | `SessionsWorkspace.tsx:41-48`, `useSessions.ts:40-43` |
| Title trimmed, 3–80 characters | Met (client and mock) | `validation.ts:17-22`, `handlers.ts:49-52`. The trimmed value is what gets sent (`validation.ts:39`) |
| Past date/time rejected | Met | `validation.ts:28-30` (`<= now`), checked again in `handlers.ts:53-56` |
| Duplicate submits prevented | Met | Ref guard `CreateSessionForm.tsx:28,39` plus disabled button and "Creating…" text (`:103-104`) |
| Created session appears in list | Met | `SessionsWorkspace.tsx:17-20` → `useSessions.ts:45-47` (added to the top, no refetch) |
| Mock data behind a replaceable request boundary | Met | Components and hooks import only `src/sessions/api.ts`. Mock code is reached only from `main.tsx` (dev only) and the test setup |
| At least one behavior-level test | Met | `SessionsWorkspace.test.tsx` renders `<App />` with the real `api.ts` and MSW. It covers filtering, creation, error and retry, validation, and duplicate submit |

## Findings (ordered by severity)

### M1. Medium (should fix, does not block the happy path): Cancelling during a pending create still creates the session and adds it to the list
- **Where:** `src/sessions/CreateSessionForm.tsx:106-108` (Cancel stays enabled while submitting), `src/sessions/SessionsWorkspace.tsx:26-36` ("New session" toggles the form off and unmounts it), `CreateSessionForm.tsx:44-45`.
- **Scenario:** Open `?mock=slow`, fill in valid values, click "Create session", then click "Cancel" (or "New session") while "Creating…" is shown. The form closes, which looks like a cancel. About 1.5 s later the POST finishes, `onCreated` runs from the unmounted form, and the session appears in the list and in the mock store. This goes against AC-4.2 ("can be closed or cancelled without creating anything"). Also, reopening the form mounts a new instance with a fresh `submittingRef`, so a second POST can start before the first one finishes.
- **Fix direction:** Disable Cancel and the "New session" toggle while a submit is pending. The alternative is to ignore or abort the result after unmount, but a created resource cannot be cleanly undone, so disabling is simpler.

### L1. Low: The creation test cannot detect a missing trim
- **Where:** `src/sessions/SessionsWorkspace.test.tsx:76,83`, together with `src/mocks/handlers.ts:49`.
- **Scenario:** Testing Library's default text matcher trims and collapses whitespace, so `findByText('Team retro')` also matches `"  Team retro  "`. On top of that, the mock trims the title itself. If someone removed `.trim()` from `validation.ts:17`, the test would still pass, so AC-5.1 ("trimmed before it is sent") is not actually proven. A fix is to check the POST body captured through `request:start` (`title === 'Team retro'`), or to match with `{ normalizer: (s) => s }`.

### L2. Low: A session created while the first load is still running can disappear
- **Where:** `src/sessions/useSessions.ts:26-29` (`setSessions(loaded)` replaces the whole list), `SessionsWorkspace.tsx:35` (the form can be opened in any load state).
- **Scenario:** With a real backend where the POST finishes before an earlier GET, `addSession` adds the new session to `[]`. The GET response, read from the server before the POST, then overwrites the list, and the new session is gone until a reload. The current mock timings make this unlikely, but AC-7.1 promises the mock can be swapped for a real API. A fix is to merge created sessions on load, or to allow creating only once the list has loaded.

### L3. Low: A malformed `startsAt` from the API crashes the whole workspace
- **Where:** `src/sessions/api.ts:35` only checks that `startsAt` is a string. `src/sessions/SessionList.tsx:23` calls `dateTimeFormat.format(new Date(...))`, which throws `RangeError: Invalid time value` for an unparseable date.
- **Scenario:** A real API returns `startsAt: ""` or another bad value. Rendering throws, there is no error boundary, and the screen goes blank instead of showing the error state. A fix is to also check that the date parses in `isSession` (so it becomes the existing `ApiError` path), or to guard the formatting.

### L4. Low: The duplicate-submit test never reaches the ref guard
- **Where:** `src/sessions/SessionsWorkspace.test.tsx:147-148`.
- `user.dblClick` and the later `{Enter}` both happen after React has re-rendered with the button disabled. A disabled default button blocks the browser's implicit Enter submission. So the test proves the disabled-button behavior, but the synchronous `submittingRef` guard (plan D7) is never exercised. AC-6.2 is still met as observed behavior, so this is a coverage note.

### N1. Nit: Title length counts UTF-16 code units
`validation.ts:20` and `handlers.ts:50`. A title with emoji or other astral characters hits the 80 limit sooner than it appears to. Client and mock agree, so this is acceptable for the exercise.

### N2. Nit: The same message strings are defined in more than one place
`'Could not create session. Please try again.'` is in both `CreateSessionForm.tsx:8` and `api.ts:5`. `'Could not load sessions.'` is in both `useSessions.ts:10` and `api.ts:4`. They could drift apart. Not a defect.

### N3. Nit: Setting `VITE_API_BASE_URL` stops the mock from matching
`api.ts:18` honours `VITE_API_BASE_URL`, but `handlers.ts:26,35` hardcode `/api/sessions`. This is fine as long as the variable is only meant for a real API. Worth one line of documentation.

## Scope Creep and Unrelated Changes
- **No functional scope creep.** There is no editing or deleting, search, sorting, pagination, state library or backend process. The new dev dependencies (`msw`, `vitest`, `jsdom`, `@testing-library/*`) and the `test` / `test:watch` scripts match plan Step 1. Existing scripts are unchanged.
- `src/App.css` was fully rewritten. That is in scope (plan step 19), and `src/index.css` and the starter assets were left alone as planned.
- `package.json` lost its trailing newline (`\ No newline at end of file`). Cosmetic only, probably from `msw init --save`.
- `frontend-accelerator-onboarding/workflow-log.md` changed. It is a process log, not application code, so it is acceptable but should not be counted as part of the feature.
- `package-lock.json` grew by about 2,000 lines. That is expected from the dependency install. I did not audit it line by line.

## Evidence
- Comparison base: working tree vs `HEAD` `c6ed35e` (`git diff`, plus reading the untracked files).
- Files inspected: all of `src/sessions/*`, `src/mocks/*`, `src/test/setup.ts`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `vite.config.ts`, `package.json`.
- Rulesets applied: `rulesets/common/code-reviewer/rules/evidence-first-review.md` and `rulesets/framework/code-reviewer/INDEX.md`. The project layer has no code-reviewer rules.
- **Checks not run:** `npm test`, `npm run build`, `npm run lint`, and a browser check (AC-9.2). Test pass/fail, type-check and lint results are not known from this review.

## Verdict

**NEEDS-CHANGES (minor).** Nothing blocks the happy path: load, filter, create, and the new session showing in the list are all implemented correctly against the requirements. Before calling this done, M1 should be fixed (Cancel or the toggle during a pending create). L1 should be fixed so the test actually proves trimming. L2 to L4 and the nits are optional.

## Next Step
- **Recommended:** `coder`, limited to M1 and L1 (and L3 if cheap). Condition: you accept M1 as a requirement gap under AC-4.2.
- **Alternatives:** `test-generator` if you only want to tighten L1 and L4 without changing behavior. `verify` (then `browser-verify` for AC-9.2) if you accept M1 as a known limitation, since tests, build and lint have not been run yet.
