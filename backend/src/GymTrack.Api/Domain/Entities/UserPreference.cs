using GymTrack.Domain.Common;

namespace GymTrack.Domain.Entities;

public class UserPreference : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Units { get; set; } = "metric";
    public int DefaultRestSeconds { get; set; } = 60;
}
