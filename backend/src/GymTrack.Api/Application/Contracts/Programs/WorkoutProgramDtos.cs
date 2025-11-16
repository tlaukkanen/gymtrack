namespace GymTrack.Application.Contracts.Programs;

public record ExerciseSetDto(
    Guid? Id,
    int Sequence,
    decimal? TargetWeight,
    int? TargetReps,
    int? TargetDurationSeconds,
    bool IsWarmup
);

public record WorkoutProgramExerciseDto(
    Guid? Id,
    Guid ExerciseId,
    int DisplayOrder,
    int RestSeconds,
    string? Notes,
    IReadOnlyCollection<ExerciseSetDto> Sets
);

public record WorkoutProgramSummaryDto(
    Guid Id,
    string Name,
    string? Description,
    int ExerciseCount,
    DateTimeOffset CreatedAt
);

public record WorkoutProgramDetailDto(
    Guid Id,
    string Name,
    string? Description,
    IReadOnlyCollection<WorkoutProgramExerciseDto> Exercises
);

public record CreateWorkoutProgramRequest(
    string Name,
    string? Description,
    IReadOnlyCollection<WorkoutProgramExerciseDto> Exercises
);

public record UpdateWorkoutProgramRequest(
    string Name,
    string? Description,
    IReadOnlyCollection<WorkoutProgramExerciseDto> Exercises
);
