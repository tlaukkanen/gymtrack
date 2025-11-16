namespace GymTrack.Application.Contracts.Sessions;

public record StartWorkoutSessionRequest(string? Notes);

public record WorkoutSessionSetDto(
    Guid Id,
    int SetIndex,
    decimal? PlannedWeight,
    int? PlannedReps,
    int? PlannedDurationSeconds,
    decimal? ActualWeight,
    int? ActualReps,
    int? ActualDurationSeconds,
    bool IsUserAdded
);

public record WorkoutSessionExerciseDto(
    Guid Id,
    Guid? ExerciseId,
    string ExerciseName,
    string? CustomExerciseName,
    bool IsAdHoc,
    bool IsCatalogExercise,
    string? Notes,
    int OrderPerformed,
    int RestSeconds,
    IReadOnlyCollection<WorkoutSessionSetDto> Sets
);

public record WorkoutSessionDto(
    Guid Id,
    Guid ProgramId,
    DateTimeOffset StartedAt,
    DateTimeOffset? CompletedAt,
    string? Notes,
    IReadOnlyCollection<WorkoutSessionExerciseDto> Exercises
);

public record UpdateSessionSetRequest(
    decimal? ActualWeight,
    int? ActualReps,
    int? ActualDurationSeconds
);

public record AddSessionExerciseSetDto(
    decimal? PlannedWeight,
    int? PlannedReps,
    int? PlannedDurationSeconds
);

public record AddSessionExerciseRequest(
    Guid? ExerciseId,
    string? CustomExerciseName,
    string? CustomCategory,
    string? CustomPrimaryMuscle,
    string? Notes,
    int RestSeconds,
    IReadOnlyCollection<AddSessionExerciseSetDto>? Sets
);

public record UpdateSessionExerciseRequest(
    string? Notes,
    int? RestSeconds
);

public record ReorderSessionExercisesRequest(
    IReadOnlyCollection<Guid> OrderedExerciseIds
);

public record AddSessionSetRequest(
    decimal? PlannedWeight,
    int? PlannedReps,
    int? PlannedDurationSeconds
);
