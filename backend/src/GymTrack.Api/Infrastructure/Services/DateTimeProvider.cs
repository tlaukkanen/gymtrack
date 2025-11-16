using GymTrack.Application.Abstractions;

namespace GymTrack.Infrastructure.Services;

internal sealed class DateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
