using GymTrack.Domain.Common;

namespace GymTrack.Domain.Entities;

public class WorkoutSessionSet : AuditableEntity
{
    public Guid WorkoutSessionExerciseId { get; set; }
    public WorkoutSessionExercise WorkoutSessionExercise { get; set; } = null!;
    public int SetIndex { get; set; }
    public decimal? PlannedWeight { get; set; }
    public int? PlannedReps { get; set; }
    public int? PlannedDurationSeconds { get; set; }
    public decimal? ActualWeight { get; set; }
    public int? ActualReps { get; set; }
    public int? ActualDurationSeconds { get; set; }
}
