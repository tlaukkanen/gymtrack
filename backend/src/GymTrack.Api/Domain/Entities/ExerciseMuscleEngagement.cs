using GymTrack.Domain.Common;
using GymTrack.Domain.Enums;

namespace GymTrack.Domain.Entities;

public class ExerciseMuscleEngagement : Entity
{
    public Guid ExerciseId { get; set; }
    public string MuscleGroup { get; set; } = string.Empty;
    public MuscleEngagementLevel Level { get; set; }
    public Exercise Exercise { get; set; } = null!;
}
