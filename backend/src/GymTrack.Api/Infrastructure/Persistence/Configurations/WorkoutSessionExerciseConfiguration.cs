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
        builder.HasMany(x => x.Sets)
            .WithOne(x => x.WorkoutSessionExercise)
            .HasForeignKey(x => x.WorkoutSessionExerciseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
