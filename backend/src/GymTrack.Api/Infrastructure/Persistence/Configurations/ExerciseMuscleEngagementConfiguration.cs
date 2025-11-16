using GymTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymTrack.Infrastructure.Persistence.Configurations;

public class ExerciseMuscleEngagementConfiguration : IEntityTypeConfiguration<ExerciseMuscleEngagement>
{
    public void Configure(EntityTypeBuilder<ExerciseMuscleEngagement> builder)
    {
        builder.ToTable("ExerciseMuscleEngagements");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.MuscleGroup).IsRequired().HasMaxLength(100);
    }
}
