# Exercise Catalog Expansion Plan

## 1. Objectives
- Expand the built-in exercise catalog using the authoritative list from Wikipedia (https://en.wikipedia.org/wiki/List_of_weight_training_exercises).
- Ensure the catalog can evolve over time without requiring users to recreate databases; new exercises must flow into existing environments.
- Keep the seeding logic deterministic, observable, and re-runnable so CI environments and developer machines remain in sync.

## 2. Current State
- `ExerciseSeedData.CreateExercises()` returns a small, hard-coded list with random GUIDs generated per run.
- `DatabaseSeeder.SeedAsync()` aborts seeding as soon as any record exists (`if (!dbContext.Exercises.AnyAsync())`).
- Startup (`Program.cs`) runs `db.Database.Migrate()` and then `DatabaseSeeder.SeedAsync(...)`, so migrations are already applied on boot.
- The schema does not enforce uniqueness on `Exercises.Name`, so accidental duplicates are possible if manual inserts occur.

## 3. Proposed Solution Overview
1. Curate ~40 core exercises spanning compound lifts, unilateral movements, and cardio/conditioning entries derived from the Wikipedia list.
2. Give every seed a deterministic GUID so that code, migrations, and DB rows stay aligned.
3. Refactor `ExerciseSeedData` to surface metadata (name, category, muscles, default rest, engagement map) in a structured way that is easy to extend.
4. Update `DatabaseSeeder` to perform idempotent upserts: insert any missing exercises (by unique name) and optionally refresh muscle engagement details when definitions change.
5. Introduce a migration (`AddExpandedExerciseSeeds`) that inserts/updates the curated data set using the same deterministic GUIDs so that environments that skip runtime seeding (e.g., manual `dotnet ef database update`) still receive the catalog.
6. Add a unique index on `Exercises.Name` to enforce catalog integrity and support the upsert logic.

## 4. Detailed Design

### 4.1 Seed Data Structure
- Define an internal record (e.g., `ExerciseSeedDefinition`) holding `Guid Id`, `string Name`, `ExerciseCategory Category`, `string Primary`, `string? Secondary`, `int RestSeconds`, and `Dictionary<string, MuscleEngagementLevel> Engagements`.
- Replace `CreateExercise(...)` helper with a method that maps these definitions into `Exercise` entities.
- Store the curated list in a `private static readonly List<ExerciseSeedDefinition>` so it is easily searchable and immutable at runtime.
- Categorize exercises roughly as:
  - Lower body compounds (squat, deadlift variants, lunges, hip thrusts).
  - Upper body pushes/pulls (bench, incline, dips, push-ups, rows, pull-ups, curls).
  - Olympic/Power derivatives (clean, snatch pulls, high pulls).
  - Accessory/mobility (face pulls, farmer carries, calf raises, ab rollouts).
  - Conditioning (rower, assault bike, battle ropes, sled push).
- Default rest guidelines:
  - Heavy compounds: 150–180 seconds.
  - Accessories: 60–90 seconds.
  - Cardio/conditioning: 30–60 seconds.
  - Store rationales inline as minimal comments where ambiguity exists.

### 4.2 Deterministic IDs
- Pre-generate GUIDs (e.g., using tooling) and paste them into the seed definitions.
- Assign the same IDs in the EF migration to keep referential integrity (especially for `ExerciseMuscleEngagement` rows seeded within the migration).
- Document the ID generation approach in code comments to avoid accidental changes.

### 4.3 DatabaseSeeder Changes
- Remove the early exit that checks `AnyAsync`.
- Load existing exercise names into a `HashSet<string>(StringComparer.OrdinalIgnoreCase)`.
- For each seed definition:
  - If the name is missing, add the exercise plus its `ExerciseMuscleEngagement` children.
  - If the name exists, optionally ensure the engagement children align by comparing counts and levels; update when necessary.
- Log granular actions (e.g., "Inserted 15 exercises", "Updated 3 engagement maps") for observability.

### 4.4 EF Core Migration (`AddExpandedExerciseSeeds`)
- Add a unique index on `Exercises.Name`.
- Use `migrationBuilder.InsertData` for new exercises.
- For each exercise, also insert its muscle engagement rows using a deterministic GUID and the corresponding `ExerciseId`.
- Guard the data inserts with raw SQL MERGE statements (or `IF NOT EXISTS`) to prevent duplicate key violations when the migration runs multiple times (because of deterministic IDs and unique index, the extra guards are optional but recommended for clarity).
- Ensure the `Down` method removes the inserted rows by ID to keep reversibility.

### 4.5 Testing & Verification
- Create an integration test for `DatabaseSeeder` that runs against an in-memory or SQLite database verifying:
  - First run inserts the full list.
  - Second run does not duplicate rows and adds only newly introduced exercises.
- Add a unit test (or component test) for `ExerciseSeedData` to ensure every seed defines at least one muscle engagement and has non-empty primary muscle assignments.
- Execute `dotnet ef migrations add AddExpandedExerciseSeeds` followed by `dotnet ef database update` locally to verify the migration script and seeded data.
- Hit a read endpoint (e.g., `GET /exercises`) to confirm the API exposes the expanded catalog.

## 5. Task Breakdown
| # | Task | Owner | Dependencies | Acceptance Criteria |
|---|------|-------|--------------|---------------------|
| 1 | Curate exercise metadata from Wikipedia list | Backend dev | None | Spreadsheet/JSON source with ~40 well-defined exercises, categories, muscles, rest times |
| 2 | Refactor `ExerciseSeedData` to use deterministic definitions and expanded list | Backend dev | Task 1 | Method returns new dataset; IDs deterministic; unit test passes |
| 3 | Make `DatabaseSeeder` idempotent (insert missing, update engagements) | Backend dev | Task 2 | Seeder logs inserted counts; reruns produce no duplicates |
| 4 | Create EF migration `AddExpandedExerciseSeeds` (unique index + data inserts) | Backend dev | Tasks 2–3 | Migration applies cleanly; Down removes data/index |
| 5 | Write automated tests (seeder + validation) | Backend dev | Tasks 2–3 | Tests cover initial and subsequent seeding paths |
| 6 | Manual verification via API | QA/Dev | Tasks 1–5 | Endpoint returns expanded catalog on clean and existing DBs |

## 6. Acceptance Criteria
- The exercises table contains the curated list after upgrading an existing database that already held the original seeds.
- No duplicate exercise names exist (enforced by unique index).
- On every application start, `DatabaseSeeder` can safely re-run without errors, adding only new exercises introduced in future releases.
- EF migration history includes `AddExpandedExerciseSeeds` and `InitialCreate`.
- API consumers see the augmented catalog without manual intervention.

## 7. Risks & Mitigations
- **Risk:** Deterministic GUID list becomes unwieldy as catalog grows.
  - **Mitigation:** Centralize definitions in a JSON/CSV resource later if needed; keep current scope manageable (~40 items).
- **Risk:** Unique index migration fails if duplicates already exist (e.g., manually created records).
  - **Mitigation:** Run a pre-flight script (or manual query) to detect duplicates before deploying; document the requirement in release notes.
- **Risk:** Future seed edits might unintentionally modify existing user-facing data (e.g., rest times) when seeder updates records.
  - **Mitigation:** Limit updates to missing records for now; if updates become necessary, add explicit versioning/flags before mutating data.
- **Risk:** Migration SQL becomes large/noisy.
  - **Mitigation:** Group inserts in batches and keep helper documentation within the migration file for maintainability.

## 8. Follow-Up Enhancements (Optional)
- Externalize exercise catalog to a JSON file and load it through configuration for easier non-code updates.
- Provide admin UI to manage exercises rather than relying solely on seeding.
- Localize muscle group names and categories for internationalization.
