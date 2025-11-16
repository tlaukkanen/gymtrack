using System.Text;
using System;
using GymTrack.Application.Abstractions;
using GymTrack.Infrastructure.Identity;
using GymTrack.Infrastructure.Options;
using GymTrack.Infrastructure.Persistence;
using GymTrack.Infrastructure.Services;
using GymTrack.Infrastructure.Services.Auth;
using GymTrack.Infrastructure.Services.Exercises;
using GymTrack.Infrastructure.Services.Programs;
using GymTrack.Infrastructure.Services.Profile;
using GymTrack.Infrastructure.Services.Sessions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace GymTrack.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(options =>
        {
            configuration.GetSection("Jwt").Bind(options);
            options.Secret = string.IsNullOrWhiteSpace(options.Secret)
                ? configuration["JWT_SECRET"] ?? throw new InvalidOperationException("JWT secret is not configured.")
                : options.Secret;
            options.Issuer = string.IsNullOrWhiteSpace(options.Issuer) ? "GymTrack" : options.Issuer;
            options.Audience = string.IsNullOrWhiteSpace(options.Audience) ? "GymTrack" : options.Audience;
            options.ExpirationMinutes = options.ExpirationMinutes <= 0 ? 60 : options.ExpirationMinutes;
        });

        services.Configure<OnboardingSettings>(options =>
        {
            configuration.GetSection("Onboarding").Bind(options);
            var inviteFromEnv = configuration["INVITATION_CODE"];
            if (!string.IsNullOrWhiteSpace(inviteFromEnv))
            {
                options.InvitationCode = inviteFromEnv.Trim();
            }
        });

        var connectionString = ResolveConnectionString(configuration);
        services.AddDbContext<GymTrackDbContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireUppercase = true;
                options.Password.RequiredLength = 8;
            })
            .AddEntityFrameworkStores<GymTrackDbContext>()
            .AddDefaultTokenProviders();

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                var jwtSettings = GetJwtSettings(configuration);
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
                };
            });

        services.AddAuthorization();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IExerciseCatalogService, ExerciseCatalogService>();
        services.AddScoped<IWorkoutProgramService, WorkoutProgramService>();
        services.AddScoped<IWorkoutSessionService, WorkoutSessionService>();
        services.AddScoped<IUserPreferenceService, UserPreferenceService>();
        services.AddScoped<IDateTimeProvider, DateTimeProvider>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        return services;
    }

    private static string ResolveConnectionString(IConfiguration configuration)
    {
        var configured = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured!;
        }

        var host = configuration["DB_HOST"] ?? "localhost";
        var db = configuration["DB_NAME"] ?? "GymTrack";
        var user = configuration["DB_USER"] ?? "sa";
        var password = configuration["DB_PASSWORD"] ?? "Your_strong_password123";
        var connectTimeout = configuration["DB_CONNECT_TIMEOUT"] ?? "30";

        return $"Server={host};Database={db};User Id={user};Password={password};TrustServerCertificate=True;Encrypt=False;MultipleActiveResultSets=true;Connection Timeout={connectTimeout}";
    }

    private static JwtSettings GetJwtSettings(IConfiguration configuration)
    {
        var settings = new JwtSettings();
        configuration.GetSection("Jwt").Bind(settings);
        settings.Secret = string.IsNullOrWhiteSpace(settings.Secret)
            ? configuration["JWT_SECRET"] ?? throw new InvalidOperationException("JWT secret is not configured.")
            : settings.Secret;
        settings.Issuer = string.IsNullOrWhiteSpace(settings.Issuer) ? "GymTrack" : settings.Issuer;
        settings.Audience = string.IsNullOrWhiteSpace(settings.Audience) ? "GymTrack" : settings.Audience;
        settings.ExpirationMinutes = settings.ExpirationMinutes <= 0 ? 60 : settings.ExpirationMinutes;
        return settings;
    }
}
