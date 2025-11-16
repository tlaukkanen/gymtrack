# GymTrack Implementation Plan

## 1. Vision & Scope
- **Goal:** Deliver a progressive web application (PWA) that helps authenticated users plan, run, and track strength or cardio workouts, backed by SQL Server and a .NET 9 API hosting a React SPA.
- **In-Scope (MVP):**
  - Secure login + JWT auth with persisted user accounts.
  - Workout program builder with ordered exercises, rest timers, set definitions, and notes per exercise.
  - Exercise catalog (strength + cardio) with muscle engagement tags (Yes/Some/No).
  - Workout runner that allows flexible exercise order, set-by-set logging, and defaulting to planned weights/reps.
  - EF Core domain model with automatic migrations on startup.
  - Single Docker image combining frontend + backend, ready for Azure Container Apps / Web App for Containers.
- **Out-of-Scope (Future):** Historical analytics, progress dashboards, social features, mobile-native app, wearables.

## 2. High-Level Architecture
- **Client:** React + Vite SPA, PWA enabled (service worker, manifest, offline shell caching). Uses React Router, React Query (or RTK Query) for API data, Zustand/Context for workout state, and component library (e.g., MUI) for UI scaffolding.
- **Server:** ASP.NET Core 9 minimal APIs or controllers, hosting compiled React assets via `wwwroot`. Implements JWT issuance, EF Core DbContext, domain services, and background tasks (e.g., migration runner).
- **Database:** Azure SQL / SQL Server container (dev). Schema managed through EF Core migrations.
- **Authentication:** ASP.NET Identity with Identity tables (SQL) issuing JWTs; password-based login for MVP.
- **Deployment:** Docker multi-stage build (already scaffolded) producing single image. Compose uses SQL Server + API. GitHub Actions later for CI/CD.

```
React SPA (PWA) ── HTTPS ──> ASP.NET Core API ──> SQL Server (EF Core)
                                   │
                          Static files (built SPA)
```

## 3. Domain & Data Model
| Entity | Key Fields | Relationships | Notes |
| --- | --- | --- | --- |
| `User` | Id (GUID), Email, PasswordHash, DisplayName | 1:N WorkoutPrograms, WorkoutSessions | ASP.NET Identity schema extension |
| `Exercise` | Id, Name, Category (Strength/Cardio), PrimaryMuscle, SecondaryMuscle, MuscleEngagement JSON (Yes/Some/No map), DefaultRestSeconds | Catalog seeded data |
| `WorkoutProgram` | Id, UserId, Name, Description, CreatedAt | 1:N WorkoutProgramExercises | Represents template |
| `WorkoutProgramExercise` | Id, WorkoutProgramId, ExerciseId, Order, RestSeconds, Notes | 1:N ExerciseSets | Maintains canonical plan order |
| `ExerciseSet` | Id, ProgramExerciseId, Sequence, TargetWeight, TargetReps, TargetDuration | `TargetDuration` for cardio time-based |
| `WorkoutSession` | Id, ProgramId, UserId, StartedAt, CompletedAt, Notes | 1:N WorkoutSessionExercises | Instance of performing program |
| `WorkoutSessionExercise` | Id, SessionId, ExerciseId, OrderPerformed, RestSeconds | 1:N WorkoutSessionSets |
| `WorkoutSessionSet` | Id, SessionExerciseId, ActualWeight, ActualReps, ActualDuration, SetIndex | Captures performed data |
| `RestTimerPreference` | (Optional) per-user defaults such as Off/30s/60s... |

## 4. API Design
- **Auth**
  - `POST /api/auth/register` – create account, return JWT + refresh token (optional).
  - `POST /api/auth/login` – authenticate, issue JWT.
  - `POST /api/auth/refresh` – optional for long sessions.
- **Exercises**
  - `GET /api/exercises` – list catalog, filter by muscle/group/category.
  - `POST /api/exercises` – admin/seed endpoint (protected role) if manual creation needed.
- **Workout Programs**
  - `GET /api/programs` – list user programs.
  - `POST /api/programs` – create program with exercises + sets (transactional create).
  - `GET /api/programs/{id}` – fetch detail with nested exercises/sets.
  - `PUT /api/programs/{id}` – update metadata and children (upsert semantics).
  - `DELETE /api/programs/{id}` – soft delete or hard delete.
- **Workout Sessions / Tracking**
  - `POST /api/programs/{id}/sessions` – start session, duplicates template data.
  - `PATCH /api/sessions/{id}/exercises/{exerciseId}` – reorder, update weight/reps per set.
  - `PATCH /api/sessions/{id}/sets/{setId}` – record actuals (weight, reps, duration).
  - `POST /api/sessions/{id}/complete` – finalize session, compute stats (tonnage, duration) for future analytics.
- **Metadata**
  - `GET /api/profile` & `PATCH /api/profile` – user preferences (default rest timer, units, etc.).

All endpoints require JWT except register/login. Utilize FluentValidation or data annotations for request validation. Responses follow JSON:API or simple envelope `{ data, meta }`.

## 5. Frontend Implementation Plan
1. **Project Setup**
   - Vite + React + TypeScript scaffold.
   - Install dependencies: React Router, React Query, Zustand/Recoil, Material UI (or Tailwind + Headless UI), date-fns, zod for schema validation.
   - Configure PWA manifest + service worker (workbox plugin) to cache shell and static assets; provide install prompt.
2. **State Management**
   - Auth store: persists tokens via Secure Storage (localStorage) with refresh handling.
   - Workout builder state: local drafts before persisting.
   - Active session state: tracks timer, per-set updates, offline queue (for future) but MVP can stay online-only.
3. **UI Modules**
   - **Auth flows:** login/register forms with validation and error surfaces.
   - **Dashboard:** list of programs, CTA to create new, quick start last session.
   - **Program Builder:** wizard-like UI (basic info → add exercises from catalog with search/filter → define sets + rest timers). Drag-and-drop ordering via `dnd-kit`.
   - **Exercise Catalog Modal:** includes filters by muscle group, tags for cardio vs strength, displays engagement levels (Yes/Some/No) via badges.
   - **Workout Runner:** two-column layout (exercise list + detail). Allows reordering / jump to any exercise, record sets, edit weight/reps inline (default from plan). Rest timer component supporting Off, 30s, 60s, 90s, 120s, 180s, 300s.
   - **History (MVP minimal):** show completed sessions with stats list for quick confirmation progress.
4. **API Integration**
   - Centralized `apiClient` with Axios/fetch interceptors for JWT.
   - React Query hooks per resource (useExercises, usePrograms, useSession).
   - Optimistic updates for session logging for snappy UX.
5. **PWA Enhancements**
   - Add install prompt component.
   - Cache exercise catalog for offline (read-only) access; degrade gracefully for writes.
6. **Testing & QA (Frontend)**
   - Unit tests with Vitest/RTL for key components.
   - Cypress E2E for critical flows: login, create program, run workout, log sets.

## 6. Backend Implementation Plan
1. **Solution Structure**
   - `backend/GymTrack.sln` containing projects:
     - `GymTrack.Api` (ASP.NET Core host + controllers/minimal APIs).
     - `GymTrack.Application` (CQRS handlers, DTOs, validators).
     - `GymTrack.Domain` (entities, value objects).
     - `GymTrack.Infrastructure` (EF Core DbContext, Identity, repositories, migrations).
2. **Authentication & Identity**
   - Integrate ASP.NET Identity with EF Core using SQL Server provider.
   - Configure JWT bearer tokens (symmetric secret `JWT_SECRET`).
   - Seed default demo user for dev via `IHostedService` or migration seed.
3. **EF Core & Migrations**
   - Define DbContext with DbSets for entities listed above.
   - Use Fluent configurations for relationships, cascade rules, indexes.
   - Implement migrations; at startup call `context.Database.Migrate()` before app run.
4. **Application Services**
   - Use MediatR or minimal service classes for commands/queries: CreateProgramCommand, StartSessionCommand, UpdateSessionSetCommand, etc.
   - Validation via FluentValidation.
5. **Controllers / Minimal APIs**
   - Group endpoints by resource (auth/programs/sessions/exercises).
   - Utilize DTO mappers (AutoMapper or manual) for API responses.
6. **Seed Data**
   - Provide JSON or configuration seeding for exercise catalog (common lifts + cardio) inserted if empty.
7. **Rest Timer Suggestions & Defaults**
   - Store rest seconds per program exercise; ensure API enforces 0–300s range.
8. **Logging & Observability**
   - Configure Serilog (console + structured logs) for container diagnostics.
   - Add HealthChecks endpoint for container readiness.
9. **Testing (Backend)**
   - Unit tests for domain logic (set progression, default suggestions).
   - Integration tests using `WebApplicationFactory` + Testcontainers SQL instance.

## 7. Infrastructure & Deployment
- **Docker Compose (dev):** Already defines SQL Server + API container. Ensure `frontend/` and `backend/` directories exist with project files; `docker-compose up` builds multi-stage Dockerfile.
- **Environment Variables:** `.env` with `AOAI_*` placeholders, `JWT_SECRET`, `INVITATION_CODE`, DB credentials.
- **Azure Deployment:** Push image to ACR, deploy to Azure Container Apps/Web App. Bind Azure SQL connection string via env vars.
- **Migrations on Startup:** In `Program.cs`, resolve DbContext + `Database.Migrate()`; ensure container has network access to SQL on startup (wait for DB via `depends_on` healthcheck or retry policy).
- **Storage:** Map `./photos` volume for future media; consider Azure Blob for production later.

## 8. Testing Strategy
- **Unit Tests:** Domain (set defaults, rest timer constraints), application services, React components.
- **Integration Tests:** API endpoints hitting in-memory or containerized SQL, verifying auth, CRUD flows.
- **E2E:** Cypress pipeline hitting Docker-compose environment, simulating user creation of program + logging session.
- **Performance Smoke:** Simple load test (k6) on `GET /api/programs` and session updates.

## 9. Work Breakdown & Milestones
1. **Foundation (Week 1)**
   - Scaffold solution/projects, configure Identity/JWT, implement EF entities, create initial migrations, seed exercises.
   - Set up Vite React app with routing, auth forms, API client.
2. **Program Builder (Week 2)**
   - Backend endpoints for exercises/programs.
   - Frontend UI for catalog selection, set definitions, rest timer configuration.
3. **Workout Runner (Week 3)**
   - Session creation + update endpoints.
   - UI for active session, rest timers, set logging, reorder ability.
4. **PWA & Polish (Week 4)**
   - Service worker, manifest, install experience.
   - Unit/E2E tests, accessibility pass, dockerized build validation.
5. **Deployment Readiness (Week 5)**
   - CI pipeline (GitHub Actions) building Docker image, running tests, pushing to registry.
   - Azure infrastructure scripts (Bicep/Terraform optional for future).

## 10. Risks & Mitigations
- **Migration race conditions:** ensure retry policy if DB not ready; maybe add entrypoint script waiting for SQL.
- **PWA offline complexity:** Start with basic caching; defer offline write sync.
- **Exercise catalog maintenance:** Keep JSON seeds versioned; provide admin UI later.
- **State divergence between template & session:** Use snapshotting when session starts; store references for analytics.
- **Security:** Enforce strong password policy, secure JWT secret storage, consider rate limiting login.

## 11. Acceptance Criteria
- Users can register/login, create workout programs with exercises + sets + rest timers, and start a workout session that allows modifying weights/reps per set during execution.
- Exercise catalog displays muscle engagement levels with clear visual tags.
- Workout runner works on desktop + mobile, supports reordering exercises mid-session.
- All API operations persist data in SQL Server via EF Core, with migrations applying automatically on container start.
- SPA is installable as a PWA and served from the same .NET host via Dockerized deployment.
- `docker-compose up` launches API + SQL locally, with seeded exercises accessible via API.

## 12. Future Enhancements
- Progress analytics (volume graphs, PR tracking, per-muscle load trends).
- Social sharing, coaching, program marketplace.
- Wearable integration, real-time timers/notifications.
- Advanced cardio metrics (pace, HR) and RPE logging.
- Offline-first data sync + push notifications (Service Worker + Web Push).
