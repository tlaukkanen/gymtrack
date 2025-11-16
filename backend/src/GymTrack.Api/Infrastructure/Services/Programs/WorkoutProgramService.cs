using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Programs;
using GymTrack.Application.Exceptions;
using GymTrack.Domain.Entities;
using GymTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GymTrack.Infrastructure.Services.Programs;

internal sealed class WorkoutProgramService : IWorkoutProgramService
{
    private readonly GymTrackDbContext _dbContext;
    private readonly IDateTimeProvider _clock;

    public WorkoutProgramService(GymTrackDbContext dbContext, IDateTimeProvider clock)
    {
        _dbContext = dbContext;
        _clock = clock;
    }

    public async Task<IReadOnlyCollection<WorkoutProgramSummaryDto>> GetProgramsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var programs = await _dbContext.WorkoutPrograms
            .Where(p => p.UserId == userId)
            .Include(p => p.Exercises)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        return programs
            .Select(p => new WorkoutProgramSummaryDto(
                p.Id,
                p.Name,
                p.Description,
                p.Exercises.Count,
                p.CreatedAt))
            .ToList();
    }

    public async Task<WorkoutProgramDetailDto> GetProgramAsync(Guid userId, Guid programId, CancellationToken cancellationToken = default)
    {
        var program = await _dbContext.WorkoutPrograms
            .Include(p => p.Exercises)
                .ThenInclude(e => e.Sets)
            .FirstOrDefaultAsync(p => p.Id == programId && p.UserId == userId, cancellationToken);

        if (program is null)
        {
            throw new NotFoundException("Workout program not found.");
        }

        return MapToDetail(program);
    }

    public async Task<WorkoutProgramDetailDto> CreateProgramAsync(Guid userId, CreateWorkoutProgramRequest request, CancellationToken cancellationToken = default)
    {
        var program = new WorkoutProgram
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            CreatedAt = _clock.UtcNow
        };

        program.Exercises = BuildProgramExercises(request.Exercises);

        await _dbContext.WorkoutPrograms.AddAsync(program, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _dbContext.Entry(program).Collection(p => p.Exercises).LoadAsync(cancellationToken);
        foreach (var exercise in program.Exercises)
        {
            await _dbContext.Entry(exercise).Collection(e => e.Sets).LoadAsync(cancellationToken);
        }

        return MapToDetail(program);
    }

    public async Task<WorkoutProgramDetailDto> UpdateProgramAsync(Guid userId, Guid programId, UpdateWorkoutProgramRequest request, CancellationToken cancellationToken = default)
    {
        var program = await _dbContext.WorkoutPrograms
            .Include(p => p.Exercises)
                .ThenInclude(e => e.Sets)
            .FirstOrDefaultAsync(p => p.Id == programId && p.UserId == userId, cancellationToken);

        if (program is null)
        {
            throw new NotFoundException("Workout program not found.");
        }

        program.Name = request.Name;
        program.Description = request.Description;
        program.UpdatedAt = _clock.UtcNow;

        _dbContext.ExerciseSets.RemoveRange(program.Exercises.SelectMany(e => e.Sets));
        _dbContext.WorkoutProgramExercises.RemoveRange(program.Exercises);

        program.Exercises = BuildProgramExercises(request.Exercises);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await _dbContext.Entry(program).Collection(p => p.Exercises).LoadAsync(cancellationToken);
        foreach (var exercise in program.Exercises)
        {
            await _dbContext.Entry(exercise).Collection(e => e.Sets).LoadAsync(cancellationToken);
        }

        return MapToDetail(program);
    }

    public async Task DeleteProgramAsync(Guid userId, Guid programId, CancellationToken cancellationToken = default)
    {
        var program = await _dbContext.WorkoutPrograms
            .FirstOrDefaultAsync(p => p.Id == programId && p.UserId == userId, cancellationToken);

        if (program is null)
        {
            throw new NotFoundException("Workout program not found.");
        }

        _dbContext.WorkoutPrograms.Remove(program);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static WorkoutProgramDetailDto MapToDetail(WorkoutProgram program)
    {
        return new WorkoutProgramDetailDto(
            program.Id,
            program.Name,
            program.Description,
            program.Exercises
                .OrderBy(e => e.DisplayOrder)
                .Select(e => new WorkoutProgramExerciseDto(
                    e.Id,
                    e.ExerciseId,
                    e.DisplayOrder,
                    e.RestSeconds,
                    e.Notes,
                    e.Sets
                        .OrderBy(s => s.Sequence)
                        .Select(s => new ExerciseSetDto(
                            s.Id,
                            s.Sequence,
                            s.TargetWeight,
                            s.TargetReps,
                            s.TargetDurationSeconds,
                            s.IsWarmup))
                        .ToList()))
                .ToList());
    }

    private List<WorkoutProgramExercise> BuildProgramExercises(IReadOnlyCollection<WorkoutProgramExerciseDto> exercises)
    {
        var list = new List<WorkoutProgramExercise>();
        foreach (var exercise in exercises.OrderBy(e => e.DisplayOrder))
        {
            var programExercise = new WorkoutProgramExercise
            {
                Id = exercise.Id ?? Guid.NewGuid(),
                ExerciseId = exercise.ExerciseId,
                DisplayOrder = exercise.DisplayOrder,
                RestSeconds = exercise.RestSeconds,
                Notes = exercise.Notes,
                CreatedAt = _clock.UtcNow
            };

            programExercise.Sets = exercise.Sets
                .OrderBy(s => s.Sequence)
                .Select(s => new ExerciseSet
                {
                    Id = s.Id ?? Guid.NewGuid(),
                    Sequence = s.Sequence,
                    TargetWeight = s.TargetWeight,
                    TargetReps = s.TargetReps,
                    TargetDurationSeconds = s.TargetDurationSeconds,
                    IsWarmup = s.IsWarmup,
                    CreatedAt = _clock.UtcNow
                })
                .ToList();

            list.Add(programExercise);
        }

        return list;
    }
}
