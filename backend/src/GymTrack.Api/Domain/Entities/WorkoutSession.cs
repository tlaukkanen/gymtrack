using GymTrack.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace GymTrack.Domain.Entities;

public class WorkoutSession : AuditableEntity
{
    public Guid WorkoutProgramId { get; set; }
    public WorkoutProgram WorkoutProgram { get; set; } = null!;
    public Guid UserId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? Notes { get; set; }

    [Precision(18, 2)]
    public decimal? TotalWeightLiftedKg { get; set; }
    public ICollection<WorkoutSessionExercise> Exercises { get; set; } = new List<WorkoutSessionExercise>();
}
