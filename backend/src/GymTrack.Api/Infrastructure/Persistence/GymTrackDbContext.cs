using GymTrack.Domain.Entities;
using GymTrack.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GymTrack.Infrastructure.Persistence;

public class GymTrackDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public GymTrackDbContext(DbContextOptions<GymTrackDbContext> options) : base(options)
    {
    }

    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<ExerciseMuscleEngagement> ExerciseMuscleEngagements => Set<ExerciseMuscleEngagement>();
    public DbSet<WorkoutProgram> WorkoutPrograms => Set<WorkoutProgram>();
    public DbSet<WorkoutProgramExercise> WorkoutProgramExercises => Set<WorkoutProgramExercise>();
    public DbSet<ExerciseSet> ExerciseSets => Set<ExerciseSet>();
    public DbSet<WorkoutSession> WorkoutSessions => Set<WorkoutSession>();
    public DbSet<WorkoutSessionExercise> WorkoutSessionExercises => Set<WorkoutSessionExercise>();
    public DbSet<WorkoutSessionSet> WorkoutSessionSets => Set<WorkoutSessionSet>();
    public DbSet<UserPreference> UserPreferences => Set<UserPreference>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(GymTrackDbContext).Assembly);
    }
}
