using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Profile;
using GymTrack.Domain.Entities;
using GymTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GymTrack.Infrastructure.Services.Profile;

internal sealed class UserPreferenceService : IUserPreferenceService
{
    private readonly GymTrackDbContext _dbContext;
    private readonly IDateTimeProvider _clock;

    public UserPreferenceService(GymTrackDbContext dbContext, IDateTimeProvider clock)
    {
        _dbContext = dbContext;
        _clock = clock;
    }

    public async Task<UserPreferenceDto> GetAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var preference = await EnsurePreferenceAsync(userId, cancellationToken);
        return Map(preference);
    }

    public async Task<UserPreferenceDto> UpdateAsync(Guid userId, UpdateUserPreferenceRequest request, CancellationToken cancellationToken = default)
    {
        var preference = await EnsurePreferenceAsync(userId, cancellationToken);
        preference.DefaultRestSeconds = Math.Clamp(request.DefaultRestSeconds, 0, 300);
        preference.Units = request.Units;
        preference.UpdatedAt = _clock.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(preference);
    }

    private async Task<UserPreference> EnsurePreferenceAsync(Guid userId, CancellationToken cancellationToken)
    {
        var preference = await _dbContext.UserPreferences.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (preference is not null)
        {
            return preference;
        }

        preference = new UserPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DefaultRestSeconds = 60,
            Units = "metric",
            CreatedAt = _clock.UtcNow
        };

        await _dbContext.UserPreferences.AddAsync(preference, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return preference;
    }

    private static UserPreferenceDto Map(UserPreference preference)
        => new(preference.UserId, preference.DefaultRestSeconds, preference.Units);
}
