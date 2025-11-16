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

public enum SessionListStatus
{
    All,
    InProgress,
    Completed
}

public record SessionListQuery(
    int Page,
    int PageSize,
    SessionListStatus Status,
    DateTimeOffset? StartedFrom,
    DateTimeOffset? StartedTo,
    string? Search
);

public record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int TotalCount
);

public sealed class SessionListRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public SessionListStatus Status { get; set; } = SessionListStatus.All;
    public DateTimeOffset? StartedFrom { get; set; }
    public DateTimeOffset? StartedTo { get; set; }
    public string? Search { get; set; }
}
