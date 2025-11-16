using GymTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymTrack.Infrastructure.Persistence.Configurations;

public class WorkoutProgramExerciseConfiguration : IEntityTypeConfiguration<WorkoutProgramExercise>
{
    public void Configure(EntityTypeBuilder<WorkoutProgramExercise> builder)
    {
        builder.ToTable("WorkoutProgramExercises");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.RestSeconds).HasDefaultValue(60);
        builder.HasMany(x => x.Sets)
            .WithOne(x => x.WorkoutProgramExercise)
            .HasForeignKey(x => x.WorkoutProgramExerciseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
