namespace GymTrack.Application.Contracts.Profile;

public record UserPreferenceDto(Guid UserId, int DefaultRestSeconds, string Units);
public record UpdateUserPreferenceRequest(int DefaultRestSeconds, string Units);
