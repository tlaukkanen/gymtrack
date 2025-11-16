using GymTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymTrack.Infrastructure.Persistence.Configurations;

public class WorkoutProgramConfiguration : IEntityTypeConfiguration<WorkoutProgram>
{
    public void Configure(EntityTypeBuilder<WorkoutProgram> builder)
    {
        builder.ToTable("WorkoutPrograms");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.HasMany(x => x.Exercises)
            .WithOne(x => x.WorkoutProgram)
            .HasForeignKey(x => x.WorkoutProgramId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
