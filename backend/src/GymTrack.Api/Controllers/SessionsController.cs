using GymTrack.Api.Extensions;
using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Sessions;
using GymTrack.Application.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SessionsController : ControllerBase
{
    private readonly IWorkoutSessionService _sessionService;

    public SessionsController(IWorkoutSessionService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<WorkoutSessionSummaryDto>>> ListSessions([FromQuery] SessionListRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var query = new SessionListQuery(
                request.Page,
                request.PageSize,
                request.Status,
                request.StartedFrom,
                request.StartedTo,
                request.Search);
            var result = await _sessionService.ListSessionsAsync(userId, query, cancellationToken);
            return Ok(result);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("~/api/programs/{programId:guid}/sessions/progression")]
    public async Task<ActionResult<IReadOnlyCollection<WorkoutSessionProgressPointDto>>> GetProgramProgression(Guid programId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var progression = await _sessionService.GetProgramProgressionAsync(
                userId,
                programId,
                cancellationToken);
            return Ok(progression);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{sessionId:guid}/exercises/{sessionExerciseId:guid}/progression")]
    public async Task<ActionResult<IReadOnlyCollection<WorkoutSessionExerciseProgressPointDto>>> GetExerciseProgression(Guid sessionId, Guid sessionExerciseId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var progression = await _sessionService.GetExerciseProgressionAsync(
                userId,
                sessionId,
                sessionExerciseId,
                cancellationToken);
            return Ok(progression);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("~/api/programs/{programId:guid}/sessions")]
    public async Task<ActionResult<WorkoutSessionDto>> StartSession(Guid programId, StartWorkoutSessionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.StartSessionAsync(userId, programId, request, cancellationToken);
            return CreatedAtAction(nameof(GetSession), new { sessionId = session.Id }, session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpGet("{sessionId:guid}")]
    public async Task<ActionResult<WorkoutSessionDto>> GetSession(Guid sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.GetSessionAsync(userId, sessionId, cancellationToken);
            return Ok(session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPatch("{sessionId:guid}/sets/{setId:guid}")]
    public async Task<ActionResult<WorkoutSessionDto>> UpdateSet(Guid sessionId, Guid setId, UpdateSessionSetRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.UpdateSetAsync(userId, sessionId, setId, request, cancellationToken);
            return Ok(session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("{sessionId:guid}/complete")]
    public async Task<ActionResult<WorkoutSessionDto>> CompleteSession(Guid sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.CompleteSessionAsync(userId, sessionId, cancellationToken);
            return Ok(session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("{sessionId:guid}/exercises")]
    public async Task<ActionResult<WorkoutSessionDto>> AddExercise(Guid sessionId, AddSessionExerciseRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.AddExerciseAsync(userId, sessionId, request, cancellationToken);
            return Ok(session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpDelete("{sessionId:guid}/exercises/{sessionExerciseId:guid}")]
    public async Task<ActionResult<WorkoutSessionDto>> RemoveExercise(Guid sessionId, Guid sessionExerciseId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.RemoveExerciseAsync(userId, sessionId, sessionExerciseId, cancellationToken);
            return Ok(session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPatch("{sessionId:guid}/exercises/order")]
    public async Task<ActionResult<WorkoutSessionDto>> ReorderExercises(Guid sessionId, ReorderSessionExercisesRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.ReorderExercisesAsync(userId, sessionId, request, cancellationToken);
            return Ok(session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPatch("{sessionId:guid}/exercises/{sessionExerciseId:guid}")]
    public async Task<ActionResult<WorkoutSessionDto>> UpdateExercise(Guid sessionId, Guid sessionExerciseId, UpdateSessionExerciseRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.UpdateExerciseAsync(userId, sessionId, sessionExerciseId, request, cancellationToken);
            return Ok(session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("{sessionId:guid}/exercises/{sessionExerciseId:guid}/sets")]
    public async Task<ActionResult<WorkoutSessionDto>> AddSet(Guid sessionId, Guid sessionExerciseId, AddSessionSetRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.AddSetAsync(userId, sessionId, sessionExerciseId, request, cancellationToken);
            return Ok(session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpDelete("{sessionId:guid}/sets/{setId:guid}")]
    public async Task<ActionResult<WorkoutSessionDto>> RemoveSet(
        Guid sessionId,
        Guid setId,
        [FromQuery] bool force = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = User.GetUserId();
            var session = await _sessionService.RemoveSetAsync(
                userId,
                sessionId,
                setId,
                force,
                cancellationToken);
            return Ok(session);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpDelete("{sessionId:guid}")]
    public async Task<IActionResult> DeleteSession(Guid sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            await _sessionService.DeleteSessionAsync(userId, sessionId, cancellationToken);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
}
