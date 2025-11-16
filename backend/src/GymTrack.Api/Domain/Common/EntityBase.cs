namespace GymTrack.Domain.Common;

public abstract class Entity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}

public abstract class AuditableEntity : Entity
{
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
}
