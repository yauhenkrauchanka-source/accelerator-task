# Verification: training-sessions (Training Sessions Workspace)

Date: 2026-11-09. Role: `verify` (read-only). Application Root: `/Users/evgenijkravcenko/Documents/accelerator-onboarding-task`.
Inputs: `tasks/training-sessions/requirements.md`, `tasks/training-sessions/review.md`, `tasks/training-sessions/implementation-plan.md`, and the workflow log. The prompt names `tasks/training-sessions/workflow-log.md`, but that file does not exist. The developer decisions were read from `frontend-accelerator-onboarding/workflow-log.md`.

## Verdict

**Checks: PASS.** Every documented check exited 0: tests, lint, typecheck, build, and dev-server start.

**Requirements:** 0 failed. 31 of 32 acceptance criteria are verified, either by an automated test or by code inspection; the evidence type is given for each one. AC-7.2 and AC-7.4 are verified in code and in tests, but their in-browser runtime behaviour was not observed. **AC-9.2 (manual browser check) is UNVERIFIED** because no browser session was run.

## Commands Run

All commands were run from the Application Root. Environment: Node v25.9.0, npm 11.12.1.

| # | Command (exactly as run) | Exit | Result |
|---|---|---|---|
| 1 | `npm test` | 0 | `vitest run` v4.1.12: 1 test file, **5 passed (5)**. Non-failing Node warning: ``--localstorage-file` was provided without a valid path``. |
| 2 | `npm run lint` | 0 | `oxlint` printed no findings. |
| 3 | `npx tsc -b` | 0 | No output (typecheck clean). This is the same `tsc -b` that runs as the first step of `npm run build`. |
| 4 | `npm run build` | 0 | `tsc -b && vite build`: 26 modules transformed. Output: `dist/index.html` 0.47 kB, `dist/assets/index-B9qobOVh.css` 3.10 kB, `dist/assets/index-h9LJuvH_.js` 225.79 kB. Built in 66 ms. |
| 5 | `npm run dev -- --port 5199 --strictPort` (background, then stopped) | n/a (killed on purpose) | `VITE v8.3.6 ready in 109 ms` at `http://localhost:5199/`. Probes: `curl` `GET /` -> 200, `GET /mockServiceWorker.js` -> 200, `GET /src/main.tsx` -> 200. Stopped with `pkill -f "vite --port 5199"`; a later probe confirmed the server was down. The port flags were added only to avoid a clash with any running dev server; the script itself is the documented `npm run dev`. |

Supporting read-only commands: `git status --short`, `git diff HEAD -- package.json`, and `grep -rn "mocks" src` (used for the mock-boundary check).

Failures: **none**. No check failed.

Side effects of running checks: `npm run build` rewrote `dist/` (it does not appear in `git status`). The dev server re-optimized the Vite dependency cache (`Re-optimizing dependencies because vite config has changed`). No source, test, config, or task artifact was modified, and `git status --short` was the same before and after.

## Requirement Results

Evidence key: **T** = covered by an assertion in `src/sessions/SessionsWorkspace.test.tsx` that passed in run #1. **C** = code inspection only (no test asserts it).

### AC-1 Sessions list

| AC | Status | Evidence |
|---|---|---|
| 1.1 GET through the boundary on open | Verified (T, C) | `useSessions.ts:22-38` calls `listSessions` from `api.ts:71-77`. The tests render `<App />` against MSW with `onUnhandledRequest: 'error'` (`src/test/setup.ts:7`) and the seed list loads. |
| 1.2 Loading indicator, no rows or error | Verified (T, C) | `SessionsWorkspace.tsx:45` renders `Loading sessions…`. The list and the error render only in the `success` and `error` states (`:47-61`). The test asserts the loading text appears and the alert disappears after Retry (test lines 100-102). The first-load loading state is not asserted directly. |
| 1.3 Title, status, local start date/time | Verified (T for title and status, C for date) | `SessionList.tsx:18-24` uses `Intl.DateTimeFormat(undefined, {dateStyle:'medium', timeStyle:'short'})` in a `<time dateTime>` element. The tests assert titles and the `Completed` label. No test asserts the date text. |
| 1.4 Empty message | Verified (C) | `SessionList.tsx:10-12` shows `No sessions to show.`. Not tested. |

### AC-2 Error and recovery

| AC | Status | Evidence |
|---|---|---|
| 2.1 Error message, loading gone | Verified (T) | Test lines 88-97: a 500 response produces an alert reading `Could not load sessions.` and no loading text. |
| 2.2 Retry refetches and shows loading | Verified (T) | Test lines 100-102. `useSessions.ts:40-43`. |
| 2.3 Successful retry shows the list | Verified (T) | Test lines 104-106. |

### AC-3 Status filter

| AC | Status | Evidence |
|---|---|---|
| 3.1 Single control, All + statuses, All default | Verified (T, C) | `StatusFilter.tsx:20-33` is a native `<select>`. Default is `useState('all')` at `SessionsWorkspace.tsx:11`. The test selects `Completed` and `All` by label `Status`. |
| 3.2 Status narrows, All restores | Verified (T) | Test lines 55-67: two `Completed` rows, then all five seed titles. |
| 3.3 No refetch on filter change | Verified (T) | Test line 68: the GET count is unchanged. |
| 3.4 Created session follows the filter | Verified (C) | `SessionsWorkspace.tsx:15-16` derives the filtered list at render time from `sessions`, which includes created items. Creation is tested only with the filter on `All`. |

### AC-4 Create form open

| AC | Status | Evidence |
|---|---|---|
| 4.1 "New session" opens a form with labelled fields | Verified (T) | The tests click `New session` and use `getByLabelText('Title')` and `getByLabelText('Start date and time')`. Code: `CreateSessionForm.tsx:61,81`. |
| 4.2 Close or cancel without creating | Verified (C, partly T) | Cancel calls `onCancel` (`CreateSessionForm.tsx:110`) and sends no request. Review finding M1 is fixed: Cancel (`:110`) and the `New session` toggle (`SessionsWorkspace.tsx:30`) are disabled while a submit is pending, and test lines 152-153 assert both. Cancel-before-submit is not tested. |

### AC-5 Validation

| AC | Status | Evidence |
|---|---|---|
| 5.1 Trim before validating and sending | Verified (C) | `validation.ts:17,39`: the trimmed `title` is validated and returned as the payload. **The test cannot prove this** (review L1, accepted as a known limitation): Testing Library normalizes whitespace and the mock trims again. |
| 5.2 Empty title message | Verified (T) | Test lines 114, 120: `'   '` produces `Title is required.` |
| 5.3 3-80 characters, boundaries accepted | Verified (C) | `validation.ts:20` uses `< 3 \|\| > 80`, so 3 and 80 are accepted. No boundary test. |
| 5.4 Empty date/time message | Verified (C) | `validation.ts:25-26`. Not tested. |
| 5.5 Not-in-future rejected | Verified (T, C) | `validation.ts:29` uses `<= now`. Test lines 115-123 (past date). |
| 5.6 Message next to field, no request | Verified (T) | Messages are linked with `aria-describedby` (`CreateSessionForm.tsx:71-76,91-96`). The test asserts the accessible descriptions and a POST count of 0 (line 124). |
| 5.7 Server 400 message shown, values kept | Verified (C) | `api.ts:61-62` reads `{message}` on 400, with a fallback. `CreateSessionForm.tsx:49-50,100-104` shows it in `role="alert"`. The form stays mounted and its state is not cleared. Not tested. |

### AC-6 Submission

| AC | Status | Evidence |
|---|---|---|
| 6.1 Exactly one POST `{title, startsAt ISO}` | Verified (T for count, C for payload) | Test line 85: POST count 1. Payload from `validation.ts:32,39` (`toISOString()`) and `api.ts:79-87`. The trimmed body is not asserted (L1). |
| 6.2 Disabled with "Creating…", no extra requests | Verified (T) | Test lines 147-156: double click plus Enter, button `Creating…` disabled, POST count 1. The `submittingRef` guard (`CreateSessionForm.tsx:30,41`) is not exercised by the test (review L4). |
| 6.3 Added without refetch, form closes | Verified (T, C) | Test lines 82-84: the row appears and the form is gone. `useSessions.ts:45-47` adds the row at the top with no refetch. The test does not assert the GET count after creating. |
| 6.4 5xx or network error shown, values kept, resubmit possible | Verified (C) | `api.ts:55-63` uses the fallback message. `CreateSessionForm.tsx:49-54` sets `formError` and resets the pending state in `finally`. Not tested. |

### AC-7 Mock boundary

| AC | Status | Evidence |
|---|---|---|
| 7.1 Data only through the HTTP boundary | Verified (C) | `grep -rn "mocks" src`: outside `src/mocks/`, only `main.tsx:7` (dev bootstrap), `src/test/setup.ts`, and the test file import mocks. No component or hook does. |
| 7.2 MSW in dev and in tests | Verified for tests (T). **Browser runtime unverified.** | Tests run on `msw/node` (`src/mocks/node.ts`). `main.tsx:6-9` starts `setupWorker` when `import.meta.env.DEV`, and `/mockServiceWorker.js` was served with status 200 (run #5). No browser was opened, so worker registration was not observed. |
| 7.3 No backend process | Verified (C) | The `package.json` diff adds only dev dependencies for mocking and testing. No server code is in the tree. |
| 7.4 In-memory store until reload | Verified (C). **Browser runtime unverified.** | `src/mocks/data.ts:21-29` is a module-level store, and `handlers.ts:64` adds to it. Not observed in a browser. |

### AC-8 Automated test

| AC | Status | Evidence |
|---|---|---|
| 8.1 Behaviour-level test for filtering or creation | Verified (T) | Filtering (test lines 49-69) and creation (lines 71-86) both render `<App />` with real `api.ts` and MSW. |
| 8.2 Passes with a documented npm script | Verified | `npm test` exit 0, 5/5 passed (run #1). |

### AC-9 Run and manual check

| AC | Status | Evidence |
|---|---|---|
| 9.1 Starts with `npm run dev` | Verified | Run #5: Vite was ready and `/` returned 200. Only HTTP serving was checked, not rendering in a browser. |
| 9.2 Manual browser check recorded | **UNVERIFIED** | No browser session was run. Not observed: the list, filter, and create flow in a browser; `?mock=slow` loading and `Creating…`; and `?mock=error` with Retry. |

## Constraints

| Constraint | Status | Evidence |
|---|---|---|
| Existing scripts kept | Verified | `git diff HEAD -- package.json`: `dev`, `build`, `lint`, and `preview` are unchanged. `test` and `test:watch` were added. |
| New dev dependencies only for mocking and testing | Verified | Added: `msw`, `vitest`, `jsdom`, and `@testing-library/{dom,jest-dom,react,user-event}`. No runtime dependencies were added. |
| No unrelated rewrites | Verified (by diff scope) | The changed files match the plan (`git status --short`). `package.json` lost its trailing newline (cosmetic). |

## Items Not Verified

1. **AC-9.2:** no manual browser check was performed.
2. **AC-7.2 (browser half) and AC-7.4:** MSW worker registration and in-memory persistence in a real browser were not observed.
3. **Not covered by any test (code inspection only):** AC-1.4 empty state, AC-1.3 date formatting, AC-3.4 under a non-`All` filter, AC-4.2 cancel-before-submit, AC-5.1 trimming (L1), AC-5.3 boundaries, AC-5.4, AC-5.7 server 400, AC-6.4 5xx or network error, and the `submittingRef` guard (L4).
4. **Known limitations from the review that the developer accepted as non-blocking and that remain open:** L1, L2 (create during first load can be overwritten), L3 (malformed `startsAt` crashes rendering), L4, and N1-N3. Verification did not re-test these.
