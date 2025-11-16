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
    int? ActualDurationSeconds
);

public record WorkoutSessionExerciseDto(
    Guid Id,
    Guid ExerciseId,
    string ExerciseName,
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
