using GymTrack.Domain.Common;

namespace GymTrack.Domain.Entities;

public class WorkoutSessionExercise : AuditableEntity
{
    public Guid WorkoutSessionId { get; set; }
    public WorkoutSession WorkoutSession { get; set; } = null!;
    public Guid ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
    public Guid? ProgramExerciseId { get; set; }
    public WorkoutProgramExercise? ProgramExercise { get; set; }
    public int OrderPerformed { get; set; }
    public int RestSeconds { get; set; }
    public ICollection<WorkoutSessionSet> Sets { get; set; } = new List<WorkoutSessionSet>();
}
