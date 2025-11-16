namespace GymTrack.Infrastructure.Options;

public class JwtSettings
{
    public string Issuer { get; set; } = "GymTrack";
    public string Audience { get; set; } = "GymTrack";
    public string Secret { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 60;
}
