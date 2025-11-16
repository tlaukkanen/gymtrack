using System.Security.Claims;
using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Auth;
using GymTrack.Infrastructure.Identity;
using GymTrack.Infrastructure.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace GymTrack.Infrastructure.Services.Auth;

internal sealed class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly OnboardingSettings _onboardingSettings;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IJwtTokenService jwtTokenService,
        IOptions<OnboardingSettings> onboardingOptions)
    {
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
        _onboardingSettings = onboardingOptions.Value;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var configuredCode = _onboardingSettings.InvitationCode?.Trim();
        if (string.IsNullOrWhiteSpace(configuredCode))
        {
            throw new InvalidOperationException("Registration is currently disabled. Please contact support.");
        }

        var providedCode = request.InvitationCode?.Trim();
        if (!string.Equals(providedCode, configuredCode, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Invalid invitation code.");
        }

        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email,
            DisplayName = request.DisplayName
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var message = string.Join(";", createResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException(message);
        }

        var token = _jwtTokenService.CreateToken(user, Array.Empty<Claim>());
        return new AuthResponse(token, user.Email!, user.DisplayName);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        var validPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!validPassword)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        var token = _jwtTokenService.CreateToken(user, Array.Empty<Claim>());
        return new AuthResponse(token, user.Email!, user.DisplayName);
    }
}
