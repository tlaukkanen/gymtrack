using GymTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymTrack.Infrastructure.Persistence.Configurations;

public class UserPreferenceConfiguration : IEntityTypeConfiguration<UserPreference>
{
    public void Configure(EntityTypeBuilder<UserPreference> builder)
    {
        builder.ToTable("UserPreferences");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Units).HasMaxLength(10).HasDefaultValue("metric");
        builder.Property(x => x.DefaultRestSeconds).HasDefaultValue(60);
        builder.HasIndex(x => x.UserId).IsUnique();
    }
}
