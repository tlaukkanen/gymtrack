using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GymTrack.Infrastructure.Identity;
using GymTrack.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace GymTrack.Infrastructure.Services.Auth;

internal interface IJwtTokenService
{
    string CreateToken(ApplicationUser user, IEnumerable<Claim> additionalClaims);
}

internal sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IOptions<JwtSettings> options)
    {
        _settings = options.Value;
    }

    public string CreateToken(ApplicationUser user, IEnumerable<Claim> additionalClaims)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.GivenName, user.DisplayName)
        };

        claims.AddRange(additionalClaims);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
