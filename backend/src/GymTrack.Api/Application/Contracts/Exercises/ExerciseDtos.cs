using GymTrack.Domain.Enums;

namespace GymTrack.Application.Contracts.Exercises;

public record ExerciseMuscleEngagementDto(string MuscleGroup, MuscleEngagementLevel Level);

public record ExerciseDto(
    Guid Id,
    string Name,
    ExerciseCategory Category,
    string PrimaryMuscle,
    string? SecondaryMuscle,
    IReadOnlyCollection<ExerciseMuscleEngagementDto> MuscleEngagements
);
