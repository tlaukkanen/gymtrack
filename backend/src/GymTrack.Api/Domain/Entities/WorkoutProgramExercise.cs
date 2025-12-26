using GymTrack.Domain.Common;

namespace GymTrack.Domain.Entities;

public class WorkoutProgramExercise : AuditableEntity
{
    public Guid WorkoutProgramId { get; set; }
    public WorkoutProgram WorkoutProgram { get; set; } = null!;
    public Guid ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
    public int DisplayOrder { get; set; }
    public string? Notes { get; set; }
    public ICollection<ExerciseSet> Sets { get; set; } = new List<ExerciseSet>();
}
