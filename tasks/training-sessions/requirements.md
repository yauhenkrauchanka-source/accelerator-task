# training-sessions: Training Sessions Workspace

## Goal

Give a trainer a small workspace in which they can view training sessions loaded from a mock API, filter them by one status, and create a new session that then shows up in the list. Keep the product and technical scope deliberately small (onboarding exercise).

Source: `frontend-accelerator-onboarding/TASK.md`, `frontend-accelerator-onboarding/PASS_CRITERIA.md`.

## Users And Outcome

- **User:** a trainer (single role, no authentication or permissions).
- **Outcome:** in one screen the trainer can (1) see sessions loaded from a mock API, (2) filter by one status, (3) open a create form, (4) create a session with a title and a future date/time, and (5) see the created session in the list.

## Session Data Shape

Minimal shape the UI depends on. Field names are a proposal; see Open Questions Q1.

| Field      | Type                                         | Notes                                                                 |
|------------|----------------------------------------------|-----------------------------------------------------------------------|
| `id`       | `string`                                     | Unique. The mock server assigns it on create.                         |
| `title`    | `string`                                     | Trimmed, 3–80 characters.                                             |
| `status`   | `"scheduled" \| "completed" \| "cancelled"`  | Status values the filter offers. See Q2.                              |
| `startsAt` | `string` (ISO 8601 date-time, UTC)           | Start date/time. The UI shows it in the user's local time zone.       |

Create request payload: `{ title: string; startsAt: string }`. The server (mock) sets `id` and gives the new session a default `status` of `"scheduled"` (see A3).

## Mock API Endpoints

The base path is relative to the app origin (for example `/api`). The mock intercepts these requests at the HTTP level; there is no backend service.

| Method | Path            | Request body                           | Success response                  | Failure response                                  |
|--------|-----------------|----------------------------------------|-----------------------------------|---------------------------------------------------|
| `GET`  | `/api/sessions` | none                                   | `200` + `Session[]`               | `5xx` (or network error) for the error state      |
| `POST` | `/api/sessions` | `{ title, startsAt }` (JSON)           | `201` + created `Session`         | `400` + `{ message: string }` on invalid input; `5xx` on failure |

- Filtering is done on the client against the loaded list (A2). No query parameter is required.
- The UI reaches these endpoints only through one replaceable request boundary (an HTTP client module). Components must not import mock data directly.
- For manual checks and tests, the mock must be able to simulate a slow response (to show loading/pending) and a failing `GET` (to show the error state).

## Acceptance Criteria

### AC-1 Sessions list: load and display

- [ ] AC-1.1 When the workspace opens, it sends `GET /api/sessions` through the request boundary.
- [ ] AC-1.2 While that request is pending, a visible loading indicator is shown (for example the text "Loading sessions…"), and no session rows or error are shown.
- [ ] AC-1.3 When the request succeeds, every returned session is shown with its **title**, **status**, and **start date/time** in a human-readable local format.
- [ ] AC-1.4 When the request succeeds with zero sessions (or the filter matches none), a short empty message is shown instead of a blank area. (Implied by the behavior; keep it minimal.)

### AC-2 Sessions list: request error and recovery

- [ ] AC-2.1 When `GET /api/sessions` fails (non-2xx or network error), the loading indicator goes away and one understandable error message is shown (for example "Could not load sessions.").
- [ ] AC-2.2 The error state includes a **Retry** control. Using it sends the request again and shows the loading state again.
- [ ] AC-2.3 If the retry succeeds, the error disappears and the list is shown as in AC-1.3.

### AC-3 Status filter

- [ ] AC-3.1 A single filter control offers **All** plus each status value (one selection at a time). **All** is selected by default.
- [ ] AC-3.2 Choosing a status shows only sessions with that status. Choosing **All** shows every loaded session.
- [ ] AC-3.3 Changing the filter does not send a new network request (client-side filtering, A2).
- [ ] AC-3.4 A newly created session follows the active filter: it is visible when its status matches the filter or the filter is **All**.

### AC-4 Create form: open

- [ ] AC-4.1 A clearly labelled control (for example a "New session" button) opens a create form with a **Title** field and a **Start date/time** field, each with an accessible label.
- [ ] AC-4.2 The form can be closed or cancelled without creating anything. Nothing the user typed is submitted.

### AC-5 Create form: validation

- [ ] AC-5.1 The title is trimmed before validation and before it is sent.
- [ ] AC-5.2 An empty title (after trimming) blocks submission and shows a message such as "Title is required."
- [ ] AC-5.3 A trimmed title shorter than 3 or longer than 80 characters blocks submission and shows a message such as "Title must be 3–80 characters." Exactly 3 and exactly 80 characters are accepted.
- [ ] AC-5.4 An empty date/time blocks submission and shows a message such as "Start date and time are required."
- [ ] AC-5.5 A date/time that is not later than the current time at submission blocks submission and shows a message such as "Start time must be in the future."
- [ ] AC-5.6 Each validation message appears next to the field it relates to. No request is sent while any validation error remains.
- [ ] AC-5.7 If the server returns `400`, its message (or a generic fallback) is shown in the form, and the form stays open with the entered values kept.

### AC-6 Create form: submission

- [ ] AC-6.1 Submitting valid input sends exactly one `POST /api/sessions` with `{ title: <trimmed>, startsAt: <ISO string> }`.
- [ ] AC-6.2 While the POST is pending, the submit control is disabled and shows a pending indication (for example "Creating…"). More clicks or Enter key presses do not send more requests.
- [ ] AC-6.3 On success, the created session (as returned by the server) is added to the visible list without a full page reload and without needing a refetch. The form closes or resets.
- [ ] AC-6.4 On a non-validation failure (`5xx` or network error), an understandable error appears in the form, the entered values are kept, and the user can submit again.

### AC-7 Mock boundary

- [ ] AC-7.1 All session data comes through the HTTP request boundary. Swapping the mock for a real API requires no component changes.
- [ ] AC-7.2 The mock uses a conventional HTTP mocking tool (MSW is suggested, since the repository has no existing mock mechanism). It runs in the browser during `npm run dev` and in the test environment.
- [ ] AC-7.3 No backend service or server process is added.
- [ ] AC-7.4 Sessions created during a browser session stay in the mock's in-memory store until the page reloads (A4).

### AC-8 Automated test

- [ ] AC-8.1 At least one behavior-level automated test drives the UI the way a user would (rendered app plus mocked HTTP) and covers either:
  - **filtering:** after the list loads, choosing a status shows only matching sessions; or
  - **creation:** filling in a valid title and a future date/time, then submitting, makes the new session appear in the list.
- [ ] AC-8.2 The test passes with a documented npm script (for example `npm test`).

### AC-9 Run and manual check

- [ ] AC-9.1 The app starts with a documented repository command (`npm run dev`).
- [ ] AC-9.2 The list, filter, and create flow is tried once in a browser, and what was actually observed is recorded.

## Constraints

- Use the existing stack: Vite + React 19 + TypeScript and npm (`package-lock.json`). Keep the existing scripts. New dev dependencies are allowed only for the mock and test tooling.
- Do not rewrite unrelated code or configuration. Replacing the Vite starter content in `src/App.tsx` with the workspace is in scope.
- Report incomplete behavior honestly. Do not claim checks that were not run.

## Non-Goals

- Session details, drawers, or deep links. Editing or deleting sessions.
- Search, multiple or combined filters, sorting controls, pagination.
- A full API contract or scenario matrix. Authentication and permissions.
- Screenshot sets. Exhaustive responsive or accessibility work. Localization.
- Full test coverage. CI, deployment, public URL.
- Strict TypeScript migration. Unrelated refactoring.

## Facts

- Repository Root and Application Root: `/Users/evgenijkravcenko/Documents/accelerator-onboarding-task` (single frontend app).
- Framework: React `^19.3.1` with Vite `^8.3.6` and `@vitejs/plugin-react`. TypeScript `~7.0.2`. Lint: `oxlint`.
- Package manager: npm (`package-lock.json` present).
- Scripts: `dev`, `build`, `lint`, `preview`. **There is no `test` script.**
- No HTTP client, no mock mechanism, and no test stack (no vitest/jest/testing-library/jsdom/msw) in `package.json` or `package-lock.json`.
- `src/App.tsx` currently holds the Vite starter template. `src/main.tsx` renders `<App />` in `StrictMode`.

## Assumptions

- A1. The status set is `scheduled | completed | cancelled`. "One status filter" means one single-select control (All + statuses), not one fixed status.
- A2. Filtering happens on the client over the list already loaded. The mock returns every session.
- A3. The create form does not ask for status. New sessions default to `scheduled`.
- A4. The mock keeps data in memory, seeded with a few sessions that cover every status. It resets on page reload.
- A5. Date/time is entered with a native `datetime-local` input in the user's local time zone and sent as an ISO 8601 UTC string.
- A6. Sort order: sessions are shown in the order the API returns them, and a created session is added in a predictable spot (for example at the top or in start-time order). Exact order is not tested.
- A7. "Future" is checked against the client clock at submit time. The mock may check again and return `400`.
- A8. Test tooling: because none exists, the planning stage will choose and add conventional tooling (for example Vitest + React Testing Library + jsdom + MSW) together with a `test` script. Choosing the tools is a planning or architecture decision, not a requirements decision.

## Open Questions

- Q1. Are the field names (`id`, `title`, `status`, `startsAt`) and the endpoint path `/api/sessions` acceptable, or is there a target API to match? (Not blocking. The proposal stands unless changed.)
- Q2. Confirm the status values and their display labels (proposed: Scheduled / Completed / Cancelled).
- Q3. Should the create form appear inline, in a modal, or as a toggled panel? (Visual direction. Not blocking. The default is the simplest toggled inline form.)
- Q4. After a successful create while a non-matching filter is active, should the filter reset to **All** so the new session is visible, or stay as it is (AC-3.4)? Proposed: keep the filter.
- Q5. How should the error state be triggered for the manual check (for example a query flag, an environment toggle, or only in tests)? This decision belongs to planning.

## Readiness

**Ready for planning**, with assumptions A1–A8 accepted as defaults. No open question blocks planning. Q1–Q4 have proposed defaults, and Q5 together with the test-tooling choice (A8) belong to the planning or architecture stage.
