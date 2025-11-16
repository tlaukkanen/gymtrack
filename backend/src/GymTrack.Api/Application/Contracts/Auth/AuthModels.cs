namespace GymTrack.Application.Contracts.Auth;

public record RegisterRequest(string Email, string Password, string DisplayName, string InvitationCode);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string AccessToken, string Email, string DisplayName);
