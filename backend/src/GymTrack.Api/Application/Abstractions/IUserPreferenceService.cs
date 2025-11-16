using GymTrack.Application.Contracts.Profile;

namespace GymTrack.Application.Abstractions;

public interface IUserPreferenceService
{
    Task<UserPreferenceDto> GetAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserPreferenceDto> UpdateAsync(Guid userId, UpdateUserPreferenceRequest request, CancellationToken cancellationToken = default);
}
