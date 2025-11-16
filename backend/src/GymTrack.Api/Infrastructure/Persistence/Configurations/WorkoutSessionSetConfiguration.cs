using GymTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymTrack.Infrastructure.Persistence.Configurations;

public class WorkoutSessionSetConfiguration : IEntityTypeConfiguration<WorkoutSessionSet>
{
    public void Configure(EntityTypeBuilder<WorkoutSessionSet> builder)
    {
        builder.ToTable("WorkoutSessionSets");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PlannedWeight).HasColumnType("decimal(10,2)");
        builder.Property(x => x.ActualWeight).HasColumnType("decimal(10,2)");
    }
}
