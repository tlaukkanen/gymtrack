namespace GymTrack.Application.Abstractions;

public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
}
