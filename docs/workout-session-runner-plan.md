# Workout Session Runner Implementation Plan

## 1. Objectives & Scope
- Deliver an end-to-end workout execution flow where users can start a program, reorder or substitute exercises, log every set with rest timers, and finish the session on desktop or mobile.
- Support ad-hoc ("custom") exercises during an active session so athletes can adapt on the fly when equipment or time constraints require adjustments.
- Keep the UX responsive-first (≤480px widths) while offering richer dual-pane layouts on tablets/desktop.
- Provide the backend primitives (APIs, persistence) required by the UI to add/remove exercises, mutate rest timers, append sets, and fetch real-time session state.

## 2. Current State Snapshot
- **Backend**
  - `SessionsController` supports: start session from a program, get session detail, update a single set, and mark complete.
  - `WorkoutSessionService` clones program structure into `WorkoutSessionExercises`/`Sets`, but exercises are immutable after creation; no support for ad-hoc entries or reordering.
  - Domain entities lack fields for custom exercise metadata or exercise-level notes.
- **Frontend**
  - Dashboard can trigger `sessionsApi.start(...)` and navigates to `/app/sessions/:sessionId`.
  - `SessionRunnerPage` is a placeholder stub with no UI logic.
  - No hooks/components exist for logging sets, timers, or DnD reordering.

## 3. Requirements & Assumptions
- Users must be able to:
  1. Pick a program on the dashboard and start a session (already possible).
  2. View the full exercise list with planned sets, rest guidance, and historic context while logging actuals per set.
  3. Reorder the remaining exercises (drag/drop on desktop, long-press reorder on mobile) and persist the order.
  4. Add an ad-hoc exercise at any time by either selecting from the catalog or keying in a quick custom name; optionally add notes/rest defaults and seed sets.
  5. Append or remove sets for any exercise during the session.
  6. Trigger rest timers (countdown loops for common presets) without blocking navigation; timers continue while the user scrolls.
  7. Mark the workout complete once all desired work is captured.
- Assumptions:
  - Ad-hoc entries primarily reference catalog exercises, but true free-text customs should also be supported (stored inline on the session exercise).
  - Writes continue to hit the API (no offline mutation queue for MVP).
  - All views must function down to 360px widths with touch-friendly targets ≥44px height.

## 4. Solution Overview
1. **Extend session data model** so each `WorkoutSessionExercise` can optionally hold `CustomExerciseName`, `Category`, and notes while allowing `ExerciseId` to be nullable.
2. **New REST endpoints** empower clients to add/remove/reorder exercises and manipulate sets without restarting the session.
3. **React Session Runner UI** fetches `WorkoutSessionDto`, renders a responsive layout (exercise rail + detail pane), and wires interactions to new APIs via React Query mutations.
4. **Local timer + focus state** lives in a lightweight Zustand slice or dedicated hook so countdowns persist while components re-render.
5. **Mobile-friendly design** uses sticky headers/actions, collapsible panels, and bottom sheets/drawers for add-exercise & rest timer controls.

## 5. Backend Implementation

### 5.1 Data Model Updates
| Entity | Changes |
|--------|---------|
| `WorkoutSessionExercise` | - Make `ExerciseId` nullable.<br>- Add `bool IsAdHoc` (default `false`).<br>- Add `string? CustomExerciseName` (≤128 chars).<br>- Add `string? CustomCategory` / `string? CustomPrimaryMuscle` (optional metadata).<br>- Add `string? Notes`.<br>- Maintain `RestSeconds` editable per session.<br>- Add `int` index for `DisplayOrder`? already `OrderPerformed`; continue using but make it mutable.
| `WorkoutSessionSet` | - Add optional `bool IsUserAdded` to distinguish appended sets (helps validations/removal).<br>- Keep planned vs actual fields as-is.
| `WorkoutSession` | - No schema change, but consider `bool HasAdHocExercises` computed column later.

EF Steps:
- Create migration `AddSessionAdHocExercises` that alters `WorkoutSessionExercises` table (nullable FK, new columns) and `WorkoutSessionSets` table.
- Update configurations to enforce max lengths and default values.

### 5.2 Contracts & DTOs
Modify `GymTrack.Application.Contracts.Sessions`:
- Extend `WorkoutSessionExerciseDto` with `bool isAdHoc`, `string? customExerciseName`, `string? notes`, `bool isCatalogExercise`, `IReadOnlyCollection<WorkoutSessionSetDto> sets` (existing), and maybe `Guid? exerciseId` to signal nulls.
- New request records:
  - `AddSessionExerciseRequest` `{ Guid? exerciseId, string? customExerciseName, string? notes, int restSeconds, ICollection<NewSessionSetDto> sets }` (validation: at least one identifier, rest seconds 0–600).
  - `UpdateSessionExerciseRequest` `{ string? notes, int? restSeconds }`.
  - `ReorderSessionExercisesRequest` `{ IReadOnlyList<Guid> orderedExerciseIds }`.
  - `AddSessionSetRequest` `{ int? plannedReps, decimal? plannedWeight, int? plannedDurationSeconds }`.
- Update `WorkoutSessionSetDto` to expose `bool isUserAdded`.

### 5.3 Service Logic
Enhance `IWorkoutSessionService` + implementation:
- `Task<WorkoutSessionDto> AddExerciseAsync(Guid userId, Guid sessionId, AddSessionExerciseRequest request, CancellationToken ct)`.
- `Task<WorkoutSessionDto> RemoveExerciseAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, CancellationToken ct)` (restrict removal to ad-hoc exercises for now).
- `Task<WorkoutSessionDto> ReorderExercisesAsync(Guid userId, Guid sessionId, ReorderSessionExercisesRequest request, CancellationToken ct)`.
- `Task<WorkoutSessionDto> UpdateExerciseAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, UpdateSessionExerciseRequest request, CancellationToken ct)` (update restSeconds/notes).
- `Task<WorkoutSessionDto> AddSetAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, AddSessionSetRequest request, CancellationToken ct)`.
- `Task<WorkoutSessionDto> RemoveSetAsync(Guid userId, Guid sessionId, Guid setId, CancellationToken ct)` (guard to sets tied to session).
- Existing methods (`Start`, `Get`, `UpdateSet`, `Complete`) stay intact but ensure they include newly added columns in projections.
- Implement transactional integrity by reusing the existing DbContext transaction (single SaveChanges per call). Order updates should adjust `OrderPerformed` sequentially.

### 5.4 API Surface
| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/sessions/{sessionId}/exercises` | Add ad-hoc exercise (catalog or custom) with optional starter sets.
| `DELETE` | `/api/sessions/{sessionId}/exercises/{sessionExerciseId}` | Remove ad-hoc exercise (planned ones remain, or allow removal with confirmation flag in request later).
| `PATCH` | `/api/sessions/{sessionId}/exercises/order` | Persist new ordering for remaining exercises.
| `PATCH` | `/api/sessions/{sessionId}/exercises/{sessionExerciseId}` | Update rest seconds or notes.
| `POST` | `/api/sessions/{sessionId}/exercises/{sessionExerciseId}/sets` | Append a planned set scaffold (auto-assign next `SetIndex`).
| `DELETE` | `/api/sessions/{sessionId}/sets/{setId}` | Drop an unwanted set (only if user-added or session not completed).
| `PATCH` | `/api/sessions/{sessionId}/sets/{setId}` | Already exists for logging actuals (reuse for set logging UI).

Controller updates should surface `NotFound` (404), `BadRequest` (validation), and `403` if session belongs to another user.

### 5.5 Validation & Authorization
- Use FluentValidation (if available) or manual `ModelState` checks to enforce request invariants.
- Ensure every mutation verifies ownership via `User.GetUserId()`.
- Prevent modifications once a session is completed (return 409 Conflict) except for read operations.

### 5.6 Persistence & Seeding
- Update EF Core configurations to reflect new nullable FK and string lengths.
- Add integration test coverage (see §7) to confirm migrations run and data columns persist.

## 6. Frontend Implementation

### 6.1 Routing & Data Fetching
- Expand `SessionRunnerPage` to load session data via `useQuery(['sessions', sessionId], () => sessionsApi.detail(sessionId))` with polling or WebSocket later (optional). Use React Router loader if desired.
- Invalidate session query after any mutation (set update, reorder, add exercise) for eventual consistency; consider optimistic updates for set logging to reduce latency.

### 6.2 State & Hooks
- Create `useSessionRunner` hook encapsulating:
  - `activeExerciseId` + setter.
  - `startTimer(restSeconds)` returning countdown state (mins/secs, isRunning) using `useEffect` + `setInterval`.
  - `expandedExerciseIds` for accordion view on mobile.
- Introduce a lightweight Zustand slice (`useSessionRunnerStore`) if cross-component sharing becomes complex; otherwise stick to React state inside page-level component.
- Provide React Query mutations for new API operations (add exercise, reorder, add/remove set, update exercise, update set, complete session).

### 6.3 UI Composition
Key components:
1. `SessionHeader` (program name, start time, "Complete Workout" button, timer summary, session notes quick-edit modal).
2. `ExerciseRail`
   - Desktop: left column list of exercises with drag handles (via `@dnd-kit/core` + `@dnd-kit/sortable`).
   - Mobile: collapsible accordion; reorder triggered via dedicated "Reorder" mode screen.
3. `ExerciseDetailPanel`
   - Shows selected exercise metadata (name/custom label, rest timer chips, notes input, add-set button).
   - Renders `SetLogTable`: each row has planned + actual values with inline inputs (weight, reps, duration) and Save button (debounced to call `sessionsApi.updateSet`).
   - Provide quick actions: `Start Rest Timer`, `Mark Completed`, `Remove Exercise` (if ad-hoc).
4. `AddExerciseDrawer`
   - Modal/drawer containing search (re-use `exerciseApi.list`).
   - Sections: "Catalog" tab (list + filters) and "Custom" tab (free-text name, category select, rest default, initial sets builder with replicable rows).

### 6.4 Rest Timer UX
- Predefined chips (Off/30/60/90/120/180/300). Selecting one fires `startTimer(restSeconds)` and optionally updates the exercise rest default via API.
- Display countdown inline near the selected exercise; include pause/reset controls.
- When timer finishes, fire toast/haptic (navigator.vibrate when available) and highlight the next set.
- Keep timers per exercise using a dictionary keyed by exerciseId so multiple timers can exist but only one active at a time; auto-stop old timers when user starts a new one on same exercise.

### 6.5 Custom Exercise Flow
1. User taps "Add Exercise" CTA (visible in header and after last exercise).
2. Drawer opens with two paths:
   - Select from catalog: choose exercise, confirm rest seconds (prefill with default), optionally supply notes, specify how many sets to clone (prefill from program default or 3x10).
   - Create custom: enter name, optional category (Strength/Cardio) and muscle tags, set rest + sets template.
3. On submit, call `sessionsApi.addExercise(sessionId, payload)`; on success, close drawer, select new exercise, show toast.
4. Provide ability to remove ad-hoc exercise via overflow menu (calls `sessionsApi.removeExercise`).

### 6.6 Responsiveness Guidelines
- Use CSS grid with `grid-template-columns: 1fr` for <900px, switching to `320px minmax(0, 1fr)` for larger screens.
- Keep sticky header + sticky footer action bar (Complete workout, Add exercise) on mobile for easy reach.
- Replace drag handles with explicit "Move Up/Down" buttons on mobile to avoid DnD friction; optionally open reorder modal listing exercises where user can reorder via up/down buttons.
- Ensure inputs are large enough (use MUI `TextField` full width). Use `position: sticky` for set table header on tall screens.

### 6.7 Error, Loading & Empty States
- Show skeleton loader while fetching session.
- Inline error banners if session fails to load with CTA to retry.
- If session already completed, show read-only banner and disable editing actions.
- Provide confirmation dialog before completing session or deleting ad-hoc exercise.

### 6.8 API Client Updates
- Extend `sessionsApi` with new methods: `addExercise`, `removeExercise`, `reorderExercises`, `updateExercise`, `addSet`, `removeSet`.
- Update `types/api.ts` to mirror backend DTO additions.

## 7. Testing Strategy
| Layer | Tests |
|-------|-------|
| Backend unit/integration | - `WorkoutSessionServiceTests` covering add/remove/reorder operations, ensuring order indexes stay contiguous.<br>- Tests for ad-hoc exercises validation (must supply exerciseId or custom name).<br>- EF migration test ensuring nullable `ExerciseId` persists and cascade rules intact.<br>- Controller tests (or minimal API tests) verifying authorization rejections when user mismatches session owner.<br>- Set logging regression tests verifying existing update endpoints still work with new data. |
| Frontend unit | - Component tests for `SetLogRow` (renders planned/actual, triggers mutation on blur).<br>- `useRestTimer` hook tests using Jest fake timers.<br>- `ExerciseRail` reorder logic with `@testing-library/react` + DnD interactions mocked. |
| Frontend integration/E2E | - Cypress happy path: start session → log sets → add ad-hoc exercise → reorder → complete.<br>- E2E case for mobile viewport verifying responsive layout toggles to accordion and reorder flow still works.<br>- API contract tests using MSW or Pact to ensure DTO shape stays aligned. |

## 8. Work Breakdown & Timeline
| Phase | Duration (est.) | Dependencies | Key Tasks |
|-------|-----------------|--------------|-----------|
| 1. Backend groundwork | 2–3 days | None | Design DTOs, update entities/migrations, implement new service methods + controller routes, add unit/integration tests. |
| 2. API client & shared hooks | 1 day | Phase 1 | Update TypeScript types, `sessionsApi`, create React Query hooks, wire Toast patterns. |
| 3. UI scaffolding | 3 days | Phase 2 | Build `SessionRunnerPage` layout, header, exercise list/detail components, responsive styles. |
| 4. Interactions & timers | 2 days | Phase 3 | Implement DnD reorder, rest timer hook, add-set/ad-hoc flow, confirm toasts + optimistic updates. |
| 5. QA & polish | 1–2 days | Phases 1–4 | Cross-browser/mobile testing, accessibility pass, regression tests, docs update. |

Adjust durations per team capacity; tasks can overlap where frontend can stub APIs with MSW while backend finalizes.

## 9. Risks & Mitigations
- **Complex reorder UX on mobile** → Provide simplified reorder modal for touch, fallback to move up/down buttons.
- **Nullable Exercise FK may break analytics relying on non-null** → Update queries to handle nulls, add guard rails/tests.
- **Timer drift in background tabs** → Use `Date.now()` deltas instead of decrementing counters each second to keep accurate time.
- **High API chatter from per-set updates** → Debounce `updateSet` mutation (submit on blur) and show pending indicator; consider batching later.
- **Ad-hoc exercise validations** → Enforce backend constraints and surface friendly frontend errors (highlight missing name or rest timer).

## 10. Acceptance Criteria
- Session runner page shows full exercise list and allows selecting an exercise on desktop/mobile with responsive layout.
- Users can drag/drop (desktop) or use reorder controls (mobile) to persist a new order; reloading the page shows the saved order from API.
- Rest timer chips start/pause/reset a countdown independent of navigation; timer defaults to exercise rest seconds but can be overridden per run.
- Tapping any planned set opens inputs for weight/reps/duration and on save the API reflects the latest values.
- "Add Exercise" flow supports both catalog selection and custom free-text entry; new exercise appears immediately with editable sets.
- Extra sets can be added/removed for any exercise, including ad-hoc entries.
- Completing the workout locks further edits and surfaces a success toast; dashboard reflects the finished session when reloaded.
- All touch targets and layout elements remain usable at 360px width without horizontal scrolling.
