using GymTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymTrack.Infrastructure.Persistence.Configurations;

public class WorkoutSessionExerciseConfiguration : IEntityTypeConfiguration<WorkoutSessionExercise>
{
    public void Configure(EntityTypeBuilder<WorkoutSessionExercise> builder)
    {
        builder.ToTable("WorkoutSessionExercises");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CustomExerciseName).HasMaxLength(128);
        builder.Property(x => x.CustomCategory).HasMaxLength(64);
        builder.Property(x => x.CustomPrimaryMuscle).HasMaxLength(64);
        builder.Property(x => x.Notes).HasMaxLength(512);
        builder.Property(x => x.IsAdHoc).HasDefaultValue(false);
        builder.HasOne(x => x.Exercise)
            .WithMany(e => e.WorkoutSessionExercises)
            .HasForeignKey(x => x.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Sets)
            .WithOne(x => x.WorkoutSessionExercise)
            .HasForeignKey(x => x.WorkoutSessionExerciseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
