# Training Diary Implementation Plan

## 1. Objectives & Scope
- **Primary goal:** Add a top-level "Training Diary" experience so athletes can browse all historical sessions, quickly identify in-progress workouts, and reopen any session for continued logging.
- **Key capabilities:** Paginated session history with filters (status/date/program), inline stats (status, duration, exercise count, completion %), and context actions to resume logging or review results.
- **Non-goals (for this iteration):** Advanced analytics (volume graphs, PR trends), editing of completed sessions, CSV export, or coach sharing flows.

## 2. Current State Snapshot
- **Backend:** `SessionsController` only exposes per-session CRUD (start, get detail, mutate sets/exercises) and lacks any listing/search endpoints. `WorkoutSessionService` has no projection optimized for summaries.
- **Frontend:** Routing under `/app` covers dashboard, programs, profile, and the session runner (`/app/sessions/:sessionId`). There is no dedicated history page or navigation entry for past sessions.
- **UX gap:** Users who leave mid-session must know/bookmark the session URL; there is no consolidated view to resume or confirm completion later.

## 3. Product Experience Overview
1. **Entry point:** Sidebar gains a "Training Diary" item linking to `/app/sessions`.
2. **Session list view:** Displays paginated cards or rows sorted by `StartedAt desc`. Each row shows program name, started/completed timestamps, relative duration, exercise count, and completion status chip (In Progress / Completed).
3. **Filters & search:** Users can filter by status, optionally constrain by date range (Started between) and search by program name/notes text. Filters persist in URL query params.
4. **Actions per session:**
   - `Resume session` (for In Progress) navigates to `/app/sessions/{id}` runner to continue logging.
   - `View log` (for Completed) opens the runner in read-only mode; future iteration might use a modal summary.
5. **Empty states:** Show guidance to start a workout if no sessions exist, or adjust filters when zero results.

## 4. Backend Design
### 4.1 API Surface
Add listing endpoints to `SessionsController`:
- `GET /api/sessions` → returns paged `WorkoutSessionSummaryDto`.
- `GET /api/sessions/active` (optional, see §4.4) → lightweight endpoint returning the most recent in-progress session for quick badges.

Query parameters for `/api/sessions`:
| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `status` | `all | in-progress | completed` | `all` | Null-safe filtering on `CompletedAt`.
| `startedFrom` | ISO date | none | Inclusive lower bound on `StartedAt`.
| `startedTo` | ISO date | none | Inclusive upper bound on `StartedAt`.
| `search` | string | none | Case-insensitive search over program name + notes.
| `page` | int | 1 | Clamp ≥1.
| `pageSize` | int | 20 | Clamp between 5 and 50.

### 4.2 DTOs & Contracts
Add to `Application/Contracts/Sessions`:
```csharp
public record WorkoutSessionSummaryDto(
    Guid Id,
    Guid ProgramId,
    string ProgramName,
    DateTimeOffset StartedAt,
    DateTimeOffset? CompletedAt,
    TimeSpan Duration,
    int ExerciseCount,
    int LoggedSetCount,
    int TotalSetCount,
    DateTimeOffset LastUpdatedAt
);

public record SessionListResponse(
    IReadOnlyCollection<WorkoutSessionSummaryDto> Items,
    int Page,
    int PageSize,
    int TotalCount
);

public record SessionListQuery(int Page, int PageSize, string? Status, DateTimeOffset? StartedFrom, DateTimeOffset? StartedTo, string? Search);
```
(Alternatively reuse a generic `PagedResult<T>` record.)

### 4.3 Service Layer
- Extend `IWorkoutSessionService` with `Task<SessionListResponse> ListSessionsAsync(Guid userId, SessionListQuery query, CancellationToken ct = default);`.
- Implementation details:
  - Base query: `_dbContext.WorkoutSessions.AsNoTracking().Where(s => s.UserId == userId)`.
  - Join `WorkoutProgram` (for `ProgramName`) and aggregate `ExerciseCount`, `TotalSetCount`, `LoggedSetCount` via correlated subqueries (`SelectMany`).
  - Apply filters per `SessionListQuery` plus sorting `OrderByDescending(s => s.StartedAt)`.
  - Materialize total count and current page slice using `Skip/Take`.
  - Compute `Duration` server-side as `(session.CompletedAt ?? session.UpdatedAt ?? session.StartedAt) - session.StartedAt`, fallback to `clock.UtcNow` if session still active.
  - Map to DTO using projection to avoid loading full graph.

### 4.4 Active Session Helper (optional but recommended)
- Provide `Task<WorkoutSessionSummaryDto?> GetActiveSessionAsync(Guid userId, CancellationToken ct = default);` returning the latest session with `CompletedAt == null`. Enables frontend badge without paging entire list.

### 4.5 Persistence & Performance
- Add DB indexes if not already present: `IX_WorkoutSessions_UserId_StartedAt DESC` and `IX_WorkoutSessions_UserId_CompletedAt` to keep queries fast for large histories.
- Ensure `WorkoutSession.Exercises` navigation is not eagerly loaded in listings to keep payloads small.

### 4.6 Validation & Error Handling
- Sanitize pagination (max 50 per page) to avoid large scans.
- Treat invalid `status` as `400 BadRequest` with helpful message.
- For optional dates, reject ranges where `startedFrom > startedTo`.

### 4.7 Testing (Backend)
- Unit tests for `WorkoutSessionService.ListSessionsAsync` filtering/pagination logic.
- Integration test hitting `/api/sessions` verifying auth, JSON shape, and that counts/durations match seeded data.
- Regression test ensuring `sessions/:id` endpoint still works unchanged.

## 5. Frontend Design
### 5.1 Routing & Navigation
- Update `App.tsx` nested routes so `/app/sessions` renders the new `TrainingDiaryPage`, while `/app/sessions/:sessionId` continues to load `SessionRunnerPage` (now nested route).
- Add sidebar nav entry (`AppLayout.navItems`) labeled "Training Diary" with icon (reuse `history` or `sessions`). Active styling should match others.

### 5.2 Data Layer
- Extend `types/api.ts` with `WorkoutSessionSummaryDto` and `PagedResult<T>` interfaces aligned with backend contract.
- Add `sessionsApi.list = (params) => apiClient.get<PagedResult<WorkoutSessionSummaryDto>>('/sessions', { params })` plus optional `sessionsApi.active()` helper.
- Build `useSessionFilters` hook using `useSearchParams` to sync query params (status, from, to, search, page).
- Use React Query for fetching: `useQuery(['sessions','list',filters], () => sessionsApi.list(filters))` with caching/pagination support.

### 5.3 UI Composition
Components for `TrainingDiaryPage` (place under `src/pages/sessions/TrainingDiaryPage.tsx`):
1. **Page Header** — title, brief description, quick stats (total sessions, active session badge), CTA to start new session if none are active (links to dashboard/program start flow).
2. **FilterBar** — status segmented control, date range picker (MUI `DatePicker` pair or simple inputs), search field, and clear-filters button.
3. **SessionList** — responsive list (cards on mobile, table on desktop). Each item displays:
   - Program name + status chip.
   - Started/completed timestamps and duration text.
   - Exercise/sets counts with logged progress bar (logged vs total sets).
   - Primary action button: `Continue` if in-progress, `View log` otherwise.
   - Secondary overflow menu (future). For now include `Open Program` link to `/app/programs/{programId}/edit` for quick context.
4. **Pagination controls** — previous/next buttons and page indicator; disable when boundaries reached.
5. **Empty/Error states** — skeleton rows during loading; friendly message with CTA when zero sessions.

### 5.4 Interaction Details
- Continue/View buttons navigate via `useNavigate` to `sessions/:id`.
- While filters change, reset page to 1.
- Persist filter state across reloads via URL.
- When user completes a session via runner, invalidate `['sessions','list']` and `['sessions','active']` queries to refresh list.
- Optionally display inline badge if an active session exists (data from `active` endpoint or deduced from list first page) to emphasize continuing workflow.

### 5.5 Styling & Responsiveness
- Reuse existing design tokens/classes (e.g., `Card`, `Button`, `ToastProvider`).
- Use CSS grid: single-column on <768px, split filters/list horizontally on desktop.
- Ensure cards remain clickable with 44px minimum touch target; use condensed layout for table on wide screens.

### 5.6 Accessibility & i18n
- Ensure status chips use `aria-label` describing state ("Session completed on …").
- Search input labeled properly.
- Buttons include `aria-disabled` and accessible text.

### 5.7 Frontend Testing
- Add unit test (Vitest + React Testing Library) for `TrainingDiaryPage` filtering logic (mock fetch via MSW, ensure status filter resets page).
- Snapshot/storybook for `SessionCard` to verify states.
- Cypress happy path: navigate to Training Diary, apply filters, resume session.

## 6. Work Breakdown
| Step | Owner | Details |
| --- | --- | --- |
| 1. Backend contracts | API dev | Introduce DTOs, service method signatures, controller endpoint, migration for indexes. |
| 2. Service implementation | API dev | Implement `ListSessionsAsync`, ensure tests. |
| 3. Client types & API | FE dev | Update `types/api.ts`, `sessionsApi`, add hooks. |
| 4. Routing & layout | FE dev | Adjust `App.tsx` and `AppLayout`. |
| 5. UI components | FE dev | Build page, filters, list, pagination, loading/empty states. |
| 6. QA & polish | Both | Manual testing, accessibility checks, docs updates. |

Estimated effort: ~2 backend days + 3 frontend days + 1 day integrated QA.

## 7. Acceptance Criteria
- Training Diary nav entry is visible after login and routes to `/app/sessions`.
- `/api/sessions` returns paginated summaries (status filter, date range, search) with ≤50 items per page.
- Frontend lists sessions sorted newest-first, respecting filters and showing accurate stats (exercise count and logged set counts match backend data for sampled sessions).
- Clicking `Continue` for an in-progress session opens the runner with existing data; editing there updates list after mutation (e.g., once completed, status chip flips to Completed on refresh).
- Empty states (no sessions or no filter matches) render helpful copy and CTA to start workouts.
- Automated tests cover backend list filtering and frontend filter state handling.

## 8. Risks & Mitigations
- **Large histories causing slow queries:** mitigate with projection-only query + indexes; paginate results.
- **Filter combinations leading to confusing empty states:** surface "No sessions for selected filters" message and highlight active filters for quick clearing.
- **Users wanting to edit completed sessions:** document current constraint; consider future "Reopen" workflow. For now show tooltip explaining read-only status.
- **Time zone display issues:** backend stores UTC; frontend should format using `toLocaleString()` respecting user locale and label timezone in tooltip if needed.

## 9. Deployment & Verification Checklist
1. Run EF migrations / ensure indexes applied.
2. Deploy backend; smoke-test `/api/sessions` via tools or e2e tests.
3. Deploy frontend; confirm new nav item and page load.
4. Walk through scenarios: (a) no sessions, (b) active session resumed after logout, (c) filtering completed sessions.
5. Monitor logs for slow queries; adjust indexes or caching if required.

## 10. Future Enhancements
- Session detail modal with set-by-set recap without leaving diary.
- Bulk actions (export, delete, tag) and advanced analytics (volume/time per muscle).
- Ability to reopen/combine sessions or mark as discarded.
- Calendar view with heatmap.
