using GymTrack.Domain.Common;

namespace GymTrack.Domain.Entities;

public class ExerciseSet : AuditableEntity
{
    public Guid WorkoutProgramExerciseId { get; set; }
    public WorkoutProgramExercise WorkoutProgramExercise { get; set; } = null!;
    public int Sequence { get; set; }
    public decimal? TargetWeight { get; set; }
    public int? TargetReps { get; set; }
    public int? TargetDurationSeconds { get; set; }
    public bool IsWarmup { get; set; }
}
