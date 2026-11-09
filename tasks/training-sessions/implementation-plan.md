# training-sessions: Implementation Plan

Source requirements: `tasks/training-sessions/requirements.md` (AC-1 to AC-9, assumptions A1 to A8).
Application Root: `/Users/evgenijkravcenko/Documents/accelerator-onboarding-task` (single Vite app).

## 1. Inspected Context

| Item | Observation |
|------|-------------|
| `package.json` | npm, `"type": "module"`. Scripts: `dev` (vite), `build` (`tsc -b && vite build`), `lint` (oxlint), `preview`. No `test` script. Deps: react/react-dom `^19.3.1`. Dev deps: vite `^8.3.6` (8.3.6 installed), `@vitejs/plugin-react ^6.1.2`, typescript `~7.0.2`, oxlint. |
| Mock and test stack | None. No msw, vitest, jest, testing-library, or jsdom in `package.json` or `node_modules`. |
| `vite.config.ts` | Only `plugins: [react()]`. Covered by `tsconfig.node.json` (`types: ["node"]`). |
| `tsconfig.app.json` | `include: ["src"]`, `types: ["vite/client"]`, `verbatimModuleSyntax`, `noUnusedLocals/Parameters`, `erasableSyntaxOnly` (no `enum`s, no parameter properties). Not `strict`. Any test file under `src/` gets type-checked by `npm run build`. |
| `.oxlintrc.json` | `react/rules-of-hooks` error, `react/only-export-components` warn (one component per file, constant exports allowed). |
| `src/main.tsx` | Renders `<App />` inside `StrictMode`. In dev, effects run twice on mount, so the first GET fires twice. |
| `src/App.tsx`, `src/App.css` | Vite starter content. Replacing it is in scope. |
| `public/` | `favicon.svg`, `icons.svg`. This is where the MSW worker script will go. |

## 2. Decisions

- **D1 Mock tool:** MSW 2.x (`msw`). `setupWorker` in the browser during `npm run dev`, `setupServer` (`msw/node`) in tests. The same handlers serve both (AC-7.2).
- **D2 Test stack:** Vitest + jsdom + React Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`). The Vitest config goes in the existing `vite.config.ts` so it reuses the React plugin. No Vitest globals: tests import `describe/it/expect` from `vitest` explicitly, so `tsconfig.app.json` `types` does not need to change.
- **D3 Request boundary:** one module, `src/sessions/api.ts`, built on `fetch`. Components and hooks import only from it, never from `src/mocks/*` (AC-7.1). The base URL is `import.meta.env.VITE_API_BASE_URL ?? '/api'`, resolved against `window.location.origin`. Node's `fetch` in jsdom rejects relative URLs, so the absolute URL is required for tests.
- **D4 State:** plain React state in one hook, `useSessions`. No new state or data-fetching library.
- **D5 Filter control:** a native `<select>` labelled "Status" with options All / Scheduled / Completed / Cancelled (A1, Q2). The filtered list is derived during render, so it never triggers a fetch (AC-3.3) and created sessions follow the active filter automatically (AC-3.4). The filter is kept after a create (Q4 default).
- **D6 Create form:** a toggled inline panel (Q3 default) opened by a "New session" button. The form uses `noValidate` so the custom messages are shown instead of the browser's native bubbles.
- **D7 Duplicate-submit guard:** an `isSubmitting` state disables the button and shows "Creating…". A synchronous `useRef` flag is checked at the start of `onSubmit`, so a double click or an Enter press before re-render cannot send a second POST (AC-6.2).
- **D8 Created session placement:** prepended to the list (A6).
- **D9 Manual scenario switch (answers Q5):** the handlers read the `mock` query parameter from `window.location.search` on each request:
  - `?mock=slow` adds about 1500 ms of delay to GET and POST (to observe loading and "Creating…").
  - `?mock=error` makes every `GET /api/sessions` return `500` (to observe the error state and see that Retry re-enters loading).
  - The two can be combined: `?mock=slow,error`.
  - Recovery after Retry (AC-2.3) is proven in the automated test with a one-time override (`{ once: true }`). A manual "fail once" mode is deliberately left out because the dev `StrictMode` double mount would use up the single failure on the discarded first request.

## 3. Contracts

```ts
// src/sessions/types.ts
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'
export interface Session { id: string; title: string; status: SessionStatus; startsAt: string }
export interface CreateSessionInput { title: string; startsAt: string }
export const SESSION_STATUSES: readonly SessionStatus[]          // order for the filter
export const STATUS_LABELS: Record<SessionStatus, string>        // Scheduled / Completed / Cancelled

// src/sessions/api.ts  (the only replaceable request boundary)
export class ApiError extends Error { status: number | null }    // null = network error; assign fields in the constructor body (erasableSyntaxOnly)
export function listSessions(signal?: AbortSignal): Promise<Session[]>   // GET /api/sessions, non-2xx -> ApiError
export function createSession(input: CreateSessionInput): Promise<Session> // POST /api/sessions, 400 -> ApiError(status 400, server message or fallback)

// src/sessions/validation.ts  (pure, so it is easy to test)
export interface CreateSessionErrors { title?: string; startsAt?: string }
export function validateCreateSession(
  raw: { title: string; startsAtLocal: string }, now: Date,
): { ok: true; value: CreateSessionInput } | { ok: false; errors: CreateSessionErrors }
// title: trim -> '' => "Title is required."; length <3 or >80 => "Title must be 3–80 characters."
// startsAtLocal ('YYYY-MM-DDTHH:mm' from datetime-local): '' => "Start date and time are required.";
//   new Date(local).getTime() <= now.getTime() (or NaN) => "Start time must be in the future."
// value.startsAt = new Date(local).toISOString()

// src/sessions/useSessions.ts
type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success' }
export function useSessions(): { state: LoadState; sessions: Session[]; reload(): void; addSession(s: Session): void }
// Effect keyed on a reload counter. An AbortController cancels on cleanup, and aborted results are ignored (StrictMode-safe).
```

Mock HTTP behavior (matches the requirements table):
- `GET /api/sessions` returns `200` with a copy of the store, or `500 { message }` under `?mock=error`.
- `POST /api/sessions` validates the trimmed title (3 to 80 characters) and that `startsAt` is a parseable future date (A7). It returns `400 { message }` on failure. Otherwise it creates `{ id: crypto.randomUUID(), title: trimmed, status: 'scheduled', startsAt }`, prepends it to the store, and returns `201`.
- The store is a module-level array seeded with 5 sessions covering all three statuses (at least one per status, with two `scheduled`). It has a `resetSessionsStore()` export for test isolation. In-memory only, so it resets on reload (A4, AC-7.4).

## 4. Ordered Steps (files to add or change)

### Step 1: Tooling (needs approval: network and package install)
1. `npm install -D msw vitest jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom`
   - Check that the resolved `vitest` peer range accepts `vite@8`. If npm reports a peer conflict, stop and report it. Do not use `--force` or `--legacy-peer-deps` without approval.
2. `npx msw init public --save` generates `public/mockServiceWorker.js` and adds `"msw": { "workerDirectory": ["public"] }` to `package.json`.
3. **Change `package.json`:** add `"test": "vitest run"` and `"test:watch": "vitest"`. Leave the existing scripts unchanged.
4. **Change `vite.config.ts`:** add `/// <reference types="vitest/config" />` and
   `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], restoreMocks: true }`.

### Step 2: Domain and boundary
5. **Add `src/sessions/types.ts`** (contracts above).
6. **Add `src/sessions/api.ts`**. It uses `fetch` with `Content-Type: application/json` on POST. It parses `{ message }` from error bodies when present. Generic fallbacks: "Could not load sessions." and "Could not create session. Please try again." Network failures become `ApiError` with `status: null`.
7. **Add `src/sessions/validation.ts`** (contract above, messages exactly as listed).

### Step 3: Mock layer
8. **Add `src/mocks/data.ts`**: the seed, the in-memory store, `getSessions()`, `addSession()`, `resetSessionsStore()`.
9. **Add `src/mocks/handlers.ts`**: MSW `http.get` / `http.post` on `'/api/sessions'`, the D9 scenario parsing, and `delay()` for `slow`.
10. **Add `src/mocks/browser.ts`**: `export const worker = setupWorker(...handlers)`.
11. **Add `src/mocks/node.ts`**: `export const server = setupServer(...handlers)`.
12. **Change `src/main.tsx`**: before `createRoot(...).render`, run `if (import.meta.env.DEV) { const { worker } = await import('./mocks/browser'); await worker.start({ onUnhandledRequest: 'bypass' }) }`. Top-level await works with target es2023. Without this, the first GET could fire before the worker is active.

### Step 4: UI
13. **Add `src/sessions/useSessions.ts`** (contract above).
14. **Add `src/sessions/StatusFilter.tsx`**: a `<label>Status <select>` with All and the statuses. Props: `{ value: SessionStatus | 'all'; onChange }`.
15. **Add `src/sessions/SessionList.tsx`**: a `<ul aria-label="Sessions">`. Each `<li>` shows the title, the status label, and `<time dateTime={startsAt}>` formatted with `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })` (local time zone, AC-1.3). Shows "No sessions to show." when empty (AC-1.4).
16. **Add `src/sessions/CreateSessionForm.tsx`**: props `{ onCreated(s: Session): void; onCancel(): void }`.
    - Inputs: `Title` (text) and `Start date and time` (`type="datetime-local"`), each with a `<label htmlFor>`.
    - On submit: check the ref guard, then validate with `new Date()`. If there are errors, show them next to their fields (using `aria-describedby` and `aria-invalid`) and send no request. If valid, call `createSession`, then `onCreated(created)` on success.
    - A `400` or other `ApiError` sets a form-level `role="alert"` message. Field values are kept and the user can resubmit (AC-5.7, AC-6.4).
    - Submit button: "Create session", which becomes disabled with the text "Creating…" while pending. A "Cancel" button calls `onCancel` without submitting (AC-4.2).
17. **Add `src/sessions/SessionsWorkspace.tsx`**: a heading "Training sessions" and a "New session" button that toggles the form. It uses `useSessions`, holds the filter state, and renders by load state:
    - `loading` shows `<p role="status">Loading sessions…</p>` and no list or error (AC-1.2).
    - `error` shows `<div role="alert">Could not load sessions.</div>` and a `<button>Retry</button>` that calls `reload()` (AC-2).
    - `success` shows the filter and the list.
    - `onCreated` calls `addSession(s)` and closes the form (AC-6.3).
18. **Change `src/App.tsx`**: replace the starter with `export default function App() { return <SessionsWorkspace /> }`. Remove the imports of the starter assets.
19. **Change `src/App.css`**: replace the starter styles with a few minimal layout rules for the workspace (field error colour, list spacing). Leave `src/index.css` and the asset files alone (no unrelated cleanup).

### Step 5: Tests
20. **Add `src/test/setup.ts`**: `import '@testing-library/jest-dom/vitest'`. `beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))`. `afterEach(() => { cleanup(); server.resetHandlers(); resetSessionsStore() })`. `afterAll(() => server.close())`. `cleanup` is explicit because Vitest globals are off.
21. **Add `src/sessions/SessionsWorkspace.test.tsx`** (behavior-level: render `<App />`, real `api.ts`, MSW server):
    - **T1 Filtering (AC-3, AC-8.1, required):** wait for the rows to appear. Choose "Completed" with `user.selectOptions`. Assert that every visible row shows "Completed" and that a known scheduled title is gone. Choose "All" and assert all seed titles are back. Count GET requests with `server.events.on('request:start')` and assert the count did not grow (AC-3.3).
    - **T2 Creation (AC-5/6, AC-8.1, required):** click "New session". Type `"  Team retro  "` into Title. Set the date field with `fireEvent.change` to a local `YYYY-MM-DDTHH:mm` value for now + 1 day (computed in the test). Click "Create session". Assert "Team retro" appears in the list and the form has closed.
    - **T3 Error and retry (AC-2):** `server.use(http.get('/api/sessions', () => HttpResponse.json({ message: 'x' }, { status: 500 }), { once: true }))`. Assert the alert appears, click Retry, assert "Loading sessions…" appears and then the rows appear.
    - **T4 Validation blocks the request (AC-5.2/5.5/5.6):** submit with an empty title and a past date. Assert both field messages are shown and that no POST was observed.
    - **T5 Duplicate submit (AC-6.2):** override POST with `await delay(200)`. Fill valid values, then click submit twice and press Enter. Assert the button shows "Creating…" and is disabled, and that exactly one POST was observed.
    - T1 and T2 are the minimum that meets AC-8. Include T3 to T5 if they stay small. Drop them before adding scope elsewhere.

## 5. Commands

| Purpose | Command |
|---------|---------|
| Install new dev deps (one time, approval needed) | `npm install -D msw vitest jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom` |
| Generate the MSW worker (one time) | `npx msw init public --save` |
| Run the app (mock active) | `npm run dev`, then open the printed URL (default `http://localhost:5173/`) |
| Manual loading / error scenarios | `http://localhost:5173/?mock=slow`, `http://localhost:5173/?mock=error` |
| Run tests | `npm test` (`vitest run`) |
| Type-check and build | `npm run build` |
| Lint | `npm run lint` |

## 6. Verification Checklist (for the verify stage)

- `npm test`: T1 and T2 pass (and T3 to T5 if they were implemented).
- `npm run build` passes (tests and mocks under `src/` are type-checked too).
- `npm run lint` shows no errors.
- Manual check in the browser under `npm run dev`: the list loads, the filter narrows and restores, "New session" opens the form, an invalid submit shows field messages, a valid submit adds a row at the top and it respects the filter, `?mock=slow` shows "Loading sessions…" and "Creating…", and `?mock=error` shows the alert and Retry re-enters loading. Record what was actually observed (AC-9.2).

## 7. Out of Scope (not planned)

Backend or server process, editing or deleting sessions, details views or deep links, search, sorting controls, pagination, multiple filters, auth, localization, screenshot sets, CI or deployment, strict TS migration, removing starter assets or `index.css` styles, and any state or data-fetching library.

## 8. Risks

- **R1 Tool compatibility:** Vite 8 and TypeScript 7 are recent. The Vitest release installed must declare Vite 8 support in its peers. This could not be checked here because no doc lookup or install was run. If it conflicts, stop and report. Do not force-install.
- **R2 Relative fetch in tests:** Node's `fetch` rejects `/api/...`. D3 (resolving against `window.location.origin`) handles this. If it is skipped, every test fails with "Invalid URL".
- **R3 `datetime-local` in jsdom:** `user.type` is unreliable on this input type, so T2 sets it with `fireEvent.change`. The test's future value must be built in local time, not with `toISOString()`, or a time-zone offset could make it look like the past.
- **R4 StrictMode double fetch in dev:** two GETs on mount are expected. The hook must ignore the aborted one. Do not "fix" this by removing `StrictMode` (unrelated change).
- **R5 MSW worker in builds:** `public/mockServiceWorker.js` gets copied into `dist/`, but the worker only starts when `import.meta.env.DEV` is true. As a result, `npm run preview` has no mock and shows the error state. This is expected, and `npm run dev` is the documented run command.
- **R6 Manual recovery path:** `?mock=error` fails every GET, so AC-2.3 (retry succeeds) is shown by automated test T3, not by hand (see D9).
- **R7 Client clock:** "future" uses the client clock (A7). The mock checks again and may return 400, which the form shows (AC-5.7).
