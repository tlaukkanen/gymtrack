using GymTrack.Domain.Common;

namespace GymTrack.Domain.Entities;

public class WorkoutProgram : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<WorkoutProgramExercise> Exercises { get; set; } = new List<WorkoutProgramExercise>();
}
