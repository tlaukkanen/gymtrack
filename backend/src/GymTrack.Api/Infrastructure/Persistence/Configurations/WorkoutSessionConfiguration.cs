using GymTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymTrack.Infrastructure.Persistence.Configurations;

public class WorkoutSessionConfiguration : IEntityTypeConfiguration<WorkoutSession>
{
    public void Configure(EntityTypeBuilder<WorkoutSession> builder)
    {
        builder.ToTable("WorkoutSessions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Notes).HasMaxLength(1000);
        builder.HasMany(x => x.Exercises)
            .WithOne(x => x.WorkoutSession)
            .HasForeignKey(x => x.WorkoutSessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
