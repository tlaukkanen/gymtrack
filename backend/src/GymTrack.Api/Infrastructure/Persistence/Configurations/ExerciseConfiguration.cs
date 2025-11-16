using GymTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymTrack.Infrastructure.Persistence.Configurations;

public class ExerciseConfiguration : IEntityTypeConfiguration<Exercise>
{
    public void Configure(EntityTypeBuilder<Exercise> builder)
    {
        builder.ToTable("Exercises");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.PrimaryMuscle).IsRequired().HasMaxLength(100);
        builder.Property(x => x.SecondaryMuscle).HasMaxLength(100);
        builder.Property(x => x.DefaultRestSeconds).HasDefaultValue(60);
        builder.HasIndex(x => x.Name).IsUnique();
        builder.HasMany(x => x.MuscleEngagements)
            .WithOne(x => x.Exercise)
            .HasForeignKey(x => x.ExerciseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
