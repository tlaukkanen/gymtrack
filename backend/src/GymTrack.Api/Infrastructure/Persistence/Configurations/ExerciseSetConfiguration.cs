using GymTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymTrack.Infrastructure.Persistence.Configurations;

public class ExerciseSetConfiguration : IEntityTypeConfiguration<ExerciseSet>
{
    public void Configure(EntityTypeBuilder<ExerciseSet> builder)
    {
        builder.ToTable("ExerciseSets");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TargetWeight).HasColumnType("decimal(10,2)");
    }
}
