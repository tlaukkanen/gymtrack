using GymTrack.Domain.Common;
using GymTrack.Domain.Enums;

namespace GymTrack.Domain.Entities;

public class Exercise : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public ExerciseCategory Category { get; set; }
    public string PrimaryMuscle { get; set; } = string.Empty;
    public string? SecondaryMuscle { get; set; }
    public int DefaultRestSeconds { get; set; }
    public ICollection<ExerciseMuscleEngagement> MuscleEngagements { get; set; } = new List<ExerciseMuscleEngagement>();
    public ICollection<WorkoutProgramExercise> WorkoutProgramExercises { get; set; } = new List<WorkoutProgramExercise>();
    public ICollection<WorkoutSessionExercise> WorkoutSessionExercises { get; set; } = new List<WorkoutSessionExercise>();
}
