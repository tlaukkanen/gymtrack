using System;
using System.Security.Claims;

namespace GymTrack.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var id = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue(ClaimTypes.Name);
        if (Guid.TryParse(id, out var userId))
        {
            return userId;
        }

        throw new InvalidOperationException("Authenticated user id is missing from token.");
    }
}
