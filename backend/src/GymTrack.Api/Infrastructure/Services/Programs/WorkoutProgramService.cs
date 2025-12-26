using System;
using System.Collections.Generic;
using System.Linq;
using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Programs;
using GymTrack.Application.Exceptions;
using GymTrack.Domain.Entities;
using GymTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.Extensions.Logging;

namespace GymTrack.Infrastructure.Services.Programs;

internal sealed class WorkoutProgramService : IWorkoutProgramService
{
    private readonly GymTrackDbContext _dbContext;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<WorkoutProgramService> _logger;

    public WorkoutProgramService(GymTrackDbContext dbContext, IDateTimeProvider clock, ILogger<WorkoutProgramService> logger)
    {
        _dbContext = dbContext;
        _clock = clock;
        _logger = logger;
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
        await SaveChangesWithConcurrencyLogging(program.Id, cancellationToken);

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

        UpdateProgramExercises(program, request.Exercises);

        await SaveChangesWithConcurrencyLogging(programId, cancellationToken);
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
        await SaveChangesWithConcurrencyLogging(program.Id, cancellationToken);
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
                    e.Notes,
                    e.Sets
                        .OrderBy(s => s.Sequence)
                        .Select(s => new ExerciseSetDto(
                            s.Id,
                            s.Sequence,
                            s.TargetWeight,
                            s.TargetReps,
                            s.TargetDurationSeconds,
                            s.RestSeconds))
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
                    RestSeconds = s.RestSeconds,
                    CreatedAt = _clock.UtcNow
                })
                .ToList();

            list.Add(programExercise);
        }

        return list;
    }

    private void UpdateProgramExercises(WorkoutProgram program, IReadOnlyCollection<WorkoutProgramExerciseDto> exercises)
    {
        var requestedExercises = exercises ?? Array.Empty<WorkoutProgramExerciseDto>();
        var existing = program.Exercises.ToDictionary(e => e.Id);
        var retained = new HashSet<Guid>();
        var orderedExercises = requestedExercises.OrderBy(e => e.DisplayOrder).ToList();

        foreach (var exerciseDto in orderedExercises)
        {
            if (exerciseDto.Id is Guid exerciseId && existing.TryGetValue(exerciseId, out var existingExercise))
            {
                retained.Add(existingExercise.Id);

                existingExercise.ExerciseId = exerciseDto.ExerciseId;
                existingExercise.DisplayOrder = exerciseDto.DisplayOrder;
                existingExercise.Notes = exerciseDto.Notes;
                existingExercise.UpdatedAt = _clock.UtcNow;

                SyncExerciseSets(existingExercise, exerciseDto.Sets ?? Array.Empty<ExerciseSetDto>());
                continue;
            }
            var exercise = new WorkoutProgramExercise
            {
                Id = Guid.NewGuid(),
                WorkoutProgramId = program.Id,
                WorkoutProgram = program,
                ExerciseId = exerciseDto.ExerciseId,
                CreatedAt = _clock.UtcNow,
                DisplayOrder = exerciseDto.DisplayOrder,
                Notes = exerciseDto.Notes,
                UpdatedAt = _clock.UtcNow
            };

            program.Exercises.Add(exercise);
            _dbContext.Entry(exercise).State = EntityState.Added;
            retained.Add(exercise.Id);
            SyncExerciseSets(exercise, exerciseDto.Sets ?? Array.Empty<ExerciseSetDto>());
        }

        var exercisesToRemove = program.Exercises
            .Where(e => !retained.Contains(e.Id))
            .ToList();

        foreach (var exercise in exercisesToRemove)
        {
            _dbContext.ExerciseSets.RemoveRange(exercise.Sets);
            _dbContext.WorkoutProgramExercises.Remove(exercise);
            program.Exercises.Remove(exercise);
        }
    }

    private void SyncExerciseSets(WorkoutProgramExercise exercise, IReadOnlyCollection<ExerciseSetDto> sets)
    {
        var requestedSets = sets ?? Array.Empty<ExerciseSetDto>();
        var existingSets = exercise.Sets.ToDictionary(s => s.Id);
        var retained = new HashSet<Guid>();
        var orderedSets = requestedSets.OrderBy(s => s.Sequence).ToList();

        for (var index = 0; index < orderedSets.Count; index++)
        {
            var setDto = orderedSets[index];
            if (setDto.Id is Guid setId && existingSets.TryGetValue(setId, out var existingSet))
            {
                retained.Add(existingSet.Id);
                UpdateSet(existingSet, setDto, index);
                continue;
            }

            var set = new ExerciseSet
            {
                Id = Guid.NewGuid(),
                WorkoutProgramExerciseId = exercise.Id,
                WorkoutProgramExercise = exercise,
                CreatedAt = _clock.UtcNow
            };

            exercise.Sets.Add(set);
            _dbContext.Entry(set).State = EntityState.Added;
            retained.Add(set.Id);
            UpdateSet(set, setDto, index);
        }

        var setsToRemove = exercise.Sets
            .Where(s => !retained.Contains(s.Id))
            .ToList();

        foreach (var set in setsToRemove)
        {
            exercise.Sets.Remove(set);
            _dbContext.ExerciseSets.Remove(set);
        }
    }

    private void UpdateSet(ExerciseSet set, ExerciseSetDto dto, int index)
    {
        set.Sequence = index + 1;
        set.TargetWeight = dto.TargetWeight;
        set.TargetReps = dto.TargetReps;
        set.TargetDurationSeconds = dto.TargetDurationSeconds;
        set.RestSeconds = dto.RestSeconds;
        set.UpdatedAt = _clock.UtcNow;
    }

    private async Task SaveChangesWithConcurrencyLogging(Guid programId, CancellationToken cancellationToken)
    {
#if DEBUG
        var trackedSets = _dbContext.ChangeTracker.Entries<ExerciseSet>()
            .Select(entry => $"{entry.Entity.Id}:{entry.State}");
        if (trackedSets.Any())
        {
            _logger.LogDebug("Tracked ExerciseSets before save: {Entries}", string.Join(" | ", trackedSets));
        }
#endif
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var details = ex.Entries
                .Select(entry =>
                {
                    var keyValues = entry.Properties
                        .Where(p => p.Metadata.IsPrimaryKey())
                        .Select(p => $"{p.Metadata.Name}={p.CurrentValue}");
                    return $"{entry.Metadata.Name}[{string.Join(";", keyValues)}] State={entry.State}";
                });
            _logger.LogError(ex, "Concurrency conflict while updating program {ProgramId}. Entries: {Entries}", programId, string.Join(" | ", details));
            throw;
        }
    }
}
