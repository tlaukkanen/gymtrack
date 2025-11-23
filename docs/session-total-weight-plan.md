# Session Total Weight & Progression Plan

## Overview
We want to surface the total load actually lifted during a workout session so that:
- Dashboard cards can highlight how much weight was moved during completed workouts.
- Completing a session pre-computes and stores this value for quick access.
- Session details can visualize historical total weight progression over time.

Delivering this requires coordinated backend & frontend updates plus a DB migration.

## Goals
- Extract the Dashboard program card into a reusable component that can display richer stats.
- Persist `TotalWeightLiftedKg` (or similar) on every workout session when it is completed.
- Expose the stored value via existing session DTOs plus a lightweight progression feed for charting.
- Render total weight on the new Dashboard card and show a progression chart atop completed sessions in `SessionRunnerPage`.

## Backend Plan

### 1. Data Model Updates
- Add `decimal? TotalWeightLiftedKg { get; set; }` to `WorkoutSession`.
  - Nullable so in-progress sessions remain unset; completed ones store a value.
  - Default to `null` in code, `NULL` column with migration.
- Create EF Core migration:
  - Add nullable `decimal(18,2)` column to `WorkoutSessions` table.
  - Backfill existing completed sessions by summing actual sets (see calculation below).

### 2. Calculation Logic
- Define helper (private static) that computes total weight as:
  - Sum over all sets where both `ActualWeight` and `ActualReps` exist.
  - Contribution per set = `ActualWeight * ActualReps`.
  - Ignore sets missing either value.
- Update mutation flows:
  - `CompleteSessionAsync`: load session with exercises & sets, compute total, assign to `TotalWeightLiftedKg`, then save.
  - Defensive guard: if no sets logged, store `0`.
  - Since completed sessions are locked, no need to recalc elsewhere.

### 3. DTO & Mapping Changes
- Extend `WorkoutSessionDto` and `WorkoutSessionSummaryDto` to include `decimal? TotalWeightLiftedKg`.
- Update `MapSession` and LINQ projection in `ListSessionsAsync` to populate the new field.
- Ensure API contracts in `Application/Contracts/*` are updated accordingly.

### 4. Progression Feed
- Add new endpoint on `SessionsController`, e.g. `GET /api/programs/{programId}/sessions/progression`.
  - Returns ordered list of `(SessionId, CompletedAt, TotalWeightLiftedKg)` for completed sessions of the program.
  - Backed by new service method in `IWorkoutSessionService` and implementation that:
    - Filters `WorkoutSessions` by `programId`, `UserId`, `CompletedAt != null`, `TotalWeightLiftedKg != null`.
    - Orders by `CompletedAt` ascending.
- Define DTO such as `WorkoutSessionProgressPointDto` in contracts.

### 5. Tests
- Add unit tests (or service tests) covering:
  - Calculation handles mixed logged/unlogged sets.
  - `CompleteSessionAsync` persists the value.
  - Progression query respects user isolation and ordering.
- Extend existing integration/service tests to assert DTO fields are populated.

## Frontend Plan

### 1. Dashboard Component Extraction
- Create `src/components/dashboard/ProgramCard.tsx` (or similar) that encapsulates the current card UI & actions.
- Component props:
  - `program: WorkoutProgramSummaryDto`
  - `onEdit`, `onDelete`, `onStartSession`, `deletePending`, `startPending`, optional `latestSessionStats`.
- Update `DashboardPage` to render `<ProgramCard />` per item and keep queries/mutations there.

### 2. Display Total Weight
- Decide card layout: show `Total XXX kg` prior to duration text (clarify which duration: likely latest session duration).
- To supply data:
  - Fetch latest completed session summaries per program via new backend endpoint or by calling `sessionsApi.list` with filters.
  - Prefer dedicated endpoint returning `programId -> last completed session stats (duration, total weight)` to avoid client aggregation.
  - Store in local map so `ProgramCard` receives `TotalWeightLiftedKg` + `Duration`.
- Update UI to format numbers (e.g., `Intl.NumberFormat`) and guard empty state (show `—` if unavailable).

-### 3. Session Runner Progression Chart
- Add new hook/query that calls progression endpoint with the session's `programId` when `session.completedAt` is truthy.
- Add `recharts` (selected library) to `package.json`; leverage its responsive container components to minimize custom sizing logic.
- Create `ProgramLoadChart` component in `components/session-runner/` that:
  - Accepts progression points.
  - Renders a responsive line chart with time on x-axis, total weight on y-axis.
  - Highlights the current session point.
- In `SessionRunnerPage`, render the chart above the rest of the completed session details (per requirement "on top").

### 4. Types & API Client
- Extend `WorkoutSessionDto` & `WorkoutSessionSummaryDto` types with `totalWeightLiftedKg?: number | null`.
- Add TypeScript definition for progression DTO.
- Update `sessionsApi` with `progression(programId: string)` method.

## Acceptance Criteria
1. Completing a session persists `TotalWeightLiftedKg` and it appears in session detail/summary payloads.
2. Dashboard renders extracted `ProgramCard` component and displays `Total <value> kg` for cards backed by completed session data; falls back gracefully otherwise.
3. Session Runner shows a progression line chart (time vs total weight) when viewing a completed session; hides chart for in-progress sessions.
4. New backend endpoint requires authentication and only serves data for the owner’s programs.
5. Automated tests cover total weight computation and progression service logic; frontend has basic rendering tests or Storybook checks as feasible.

## Risks & Open Questions
- Clarify which “duration” the user referenced so the UI placement of the total weight matches expectations.
- Need to confirm chart library choice (bundle size, theming alignment with Tailwind/MUI mix).
- Migration backfill cost: for large datasets, summing all sets per session could be heavy; consider batched SQL update if needed.
- Ensure decimal precision/units align with how weights are input (kg vs lbs); may require localization later.

## Deployment & Verification
- Apply migration and verify schema.
- Run backend test suite plus targeted manual test: start session, log sets, complete, confirm API returns total weight.
- On frontend, smoke test Dashboard and Session Runner to ensure new components render and queries resolve.
