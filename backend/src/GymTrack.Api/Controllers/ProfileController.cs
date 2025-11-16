using GymTrack.Api.Extensions;
using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Profile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IUserPreferenceService _preferenceService;

    public ProfileController(IUserPreferenceService preferenceService)
    {
        _preferenceService = preferenceService;
    }

    [HttpGet]
    public async Task<ActionResult<UserPreferenceDto>> GetPreferences(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var preferences = await _preferenceService.GetAsync(userId, cancellationToken);
        return Ok(preferences);
    }

    [HttpPatch]
    public async Task<ActionResult<UserPreferenceDto>> UpdatePreferences(UpdateUserPreferenceRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var updated = await _preferenceService.UpdateAsync(userId, request, cancellationToken);
        return Ok(updated);
    }
}
