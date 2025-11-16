using GymTrack.Api.Extensions;
using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Programs;
using GymTrack.Application.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProgramsController : ControllerBase
{
    private readonly IWorkoutProgramService _programService;

    public ProgramsController(IWorkoutProgramService programService)
    {
        _programService = programService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<WorkoutProgramSummaryDto>>> GetPrograms(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var programs = await _programService.GetProgramsAsync(userId, cancellationToken);
        return Ok(programs);
    }

    [HttpGet("{programId:guid}")]
    public async Task<ActionResult<WorkoutProgramDetailDto>> GetProgram(Guid programId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var program = await _programService.GetProgramAsync(userId, programId, cancellationToken);
            return Ok(program);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<WorkoutProgramDetailDto>> CreateProgram(CreateWorkoutProgramRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var program = await _programService.CreateProgramAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetProgram), new { programId = program.Id }, program);
    }

    [HttpPut("{programId:guid}")]
    public async Task<ActionResult<WorkoutProgramDetailDto>> UpdateProgram(Guid programId, UpdateWorkoutProgramRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var updated = await _programService.UpdateProgramAsync(userId, programId, request, cancellationToken);
            return Ok(updated);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpDelete("{programId:guid}")]
    public async Task<IActionResult> DeleteProgram(Guid programId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            await _programService.DeleteProgramAsync(userId, programId, cancellationToken);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
