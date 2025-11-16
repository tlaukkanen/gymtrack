using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Sessions;
using GymTrack.Application.Exceptions;
using GymTrack.Domain.Entities;
using GymTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GymTrack.Infrastructure.Services.Sessions;

internal sealed class WorkoutSessionService : IWorkoutSessionService
{
    private readonly GymTrackDbContext _dbContext;
    private readonly IDateTimeProvider _clock;

    public WorkoutSessionService(GymTrackDbContext dbContext, IDateTimeProvider clock)
    {
        _dbContext = dbContext;
        _clock = clock;
    }

    public async Task<WorkoutSessionDto> StartSessionAsync(Guid userId, Guid programId, StartWorkoutSessionRequest request, CancellationToken cancellationToken = default)
    {
        var program = await _dbContext.WorkoutPrograms
            .Include(p => p.Exercises)
                .ThenInclude(e => e.Sets)
            .Include(p => p.Exercises)
                .ThenInclude(e => e.Exercise)
            .FirstOrDefaultAsync(p => p.Id == programId && p.UserId == userId, cancellationToken);

        if (program is null)
        {
            throw new NotFoundException("Workout program not found.");
        }

        var session = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            WorkoutProgramId = program.Id,
            WorkoutProgram = program,
            UserId = userId,
            StartedAt = _clock.UtcNow,
            Notes = request.Notes,
            CreatedAt = _clock.UtcNow
        };

        session.Exercises = program.Exercises
            .OrderBy(e => e.DisplayOrder)
            .Select((exercise, index) => new WorkoutSessionExercise
            {
                Id = Guid.NewGuid(),
                WorkoutSession = session,
                ProgramExercise = exercise,
                ProgramExerciseId = exercise.Id,
                ExerciseId = exercise.ExerciseId,
                Exercise = exercise.Exercise,
                OrderPerformed = index + 1,
                RestSeconds = exercise.RestSeconds,
                CreatedAt = _clock.UtcNow,
                Sets = exercise.Sets
                    .OrderBy(s => s.Sequence)
                    .Select((set, idx) => new WorkoutSessionSet
                    {
                        Id = Guid.NewGuid(),
                        PlannedWeight = set.TargetWeight,
                        PlannedReps = set.TargetReps,
                        PlannedDurationSeconds = set.TargetDurationSeconds,
                        SetIndex = idx + 1,
                        CreatedAt = _clock.UtcNow
                    })
                    .ToList()
            })
            .ToList();

        await _dbContext.WorkoutSessions.AddAsync(session, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        await LoadSessionGraphAsync(session, cancellationToken);
        return MapSession(session);
    }

    public async Task<WorkoutSessionDto> GetSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.WorkoutSessions
            .Include(s => s.Exercises)
                .ThenInclude(e => e.Sets)
            .Include(s => s.Exercises)
                .ThenInclude(e => e.Exercise)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session is null)
        {
            throw new NotFoundException("Workout session not found.");
        }

        return MapSession(session);
    }

    public async Task<WorkoutSessionDto> UpdateSetAsync(Guid userId, Guid sessionId, Guid setId, UpdateSessionSetRequest request, CancellationToken cancellationToken = default)
    {
        var set = await _dbContext.WorkoutSessionSets
            .Include(s => s.WorkoutSessionExercise)
                .ThenInclude(e => e.WorkoutSession)
            .FirstOrDefaultAsync(s => s.Id == setId && s.WorkoutSessionExercise.WorkoutSessionId == sessionId, cancellationToken);

        if (set is null || set.WorkoutSessionExercise.WorkoutSession.UserId != userId)
        {
            throw new NotFoundException("Session set not found.");
        }

        set.ActualWeight = request.ActualWeight;
        set.ActualReps = request.ActualReps;
        set.ActualDurationSeconds = request.ActualDurationSeconds;
        set.UpdatedAt = _clock.UtcNow;
        set.WorkoutSessionExercise.WorkoutSession.UpdatedAt = _clock.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<WorkoutSessionDto> CompleteSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.WorkoutSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session is null)
        {
            throw new NotFoundException("Workout session not found.");
        }

        session.CompletedAt = _clock.UtcNow;
        session.UpdatedAt = _clock.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    private async Task LoadSessionGraphAsync(WorkoutSession session, CancellationToken cancellationToken)
    {
        await _dbContext.Entry(session)
            .Collection(s => s.Exercises)
            .Query()
            .Include(e => e.Sets)
            .Include(e => e.Exercise)
            .LoadAsync(cancellationToken);
    }

    private static WorkoutSessionDto MapSession(WorkoutSession session)
    {
        return new WorkoutSessionDto(
            session.Id,
            session.WorkoutProgramId,
            session.StartedAt,
            session.CompletedAt,
            session.Notes,
            session.Exercises
                .OrderBy(e => e.OrderPerformed)
                .Select(e => new WorkoutSessionExerciseDto(
                    e.Id,
                    e.ExerciseId,
                    e.Exercise?.Name ?? string.Empty,
                    e.OrderPerformed,
                    e.RestSeconds,
                    e.Sets
                        .OrderBy(s => s.SetIndex)
                        .Select(s => new WorkoutSessionSetDto(
                            s.Id,
                            s.SetIndex,
                            s.PlannedWeight,
                            s.PlannedReps,
                            s.PlannedDurationSeconds,
                            s.ActualWeight,
                            s.ActualReps,
                            s.ActualDurationSeconds))
                        .ToList()))
                .ToList());
    }
}
