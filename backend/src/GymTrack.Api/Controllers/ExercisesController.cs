using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Exercises;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExercisesController : ControllerBase
{
    private readonly IExerciseCatalogService _exerciseCatalogService;

    public ExercisesController(IExerciseCatalogService exerciseCatalogService)
    {
        _exerciseCatalogService = exerciseCatalogService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<ExerciseDto>>> GetExercises(CancellationToken cancellationToken)
    {
        var exercises = await _exerciseCatalogService.GetExercisesAsync(cancellationToken);
        return Ok(exercises);
    }
}
