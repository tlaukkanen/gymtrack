using GymTrack.Domain.Common;

namespace GymTrack.Domain.Entities;

public class WorkoutSession : AuditableEntity
{
    public Guid WorkoutProgramId { get; set; }
    public WorkoutProgram WorkoutProgram { get; set; } = null!;
    public Guid UserId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public ICollection<WorkoutSessionExercise> Exercises { get; set; } = new List<WorkoutSessionExercise>();
}
