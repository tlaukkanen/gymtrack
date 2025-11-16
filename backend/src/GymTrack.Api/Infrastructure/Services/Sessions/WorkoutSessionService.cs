using System.Linq;
using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Sessions;
using GymTrack.Application.Exceptions;
using GymTrack.Domain.Entities;
using GymTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GymTrack.Infrastructure.Services.Sessions;

internal sealed class WorkoutSessionService : IWorkoutSessionService
{
    private const int MinRestSeconds = 0;
    private const int MaxRestSeconds = 600;

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
                IsAdHoc = false,
                CustomExerciseName = null,
                CustomCategory = null,
                CustomPrimaryMuscle = null,
                Notes = exercise.Notes,
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
                        CreatedAt = _clock.UtcNow,
                        IsUserAdded = false
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
        var session = await BuildSessionAggregateQuery()
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

        EnsureSessionNotCompleted(set.WorkoutSessionExercise.WorkoutSession);

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

        if (session.CompletedAt.HasValue)
        {
            throw new ConflictException("Workout session already completed.");
        }

        session.CompletedAt = _clock.UtcNow;
        session.UpdatedAt = _clock.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<WorkoutSessionDto> AddExerciseAsync(Guid userId, Guid sessionId, AddSessionExerciseRequest request, CancellationToken cancellationToken = default)
    {
        ValidateRestSeconds(request.RestSeconds);
        ValidateExerciseSelection(request);

        var session = await BuildSessionAggregateQuery()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session is null)
        {
            throw new NotFoundException("Workout session not found.");
        }

        EnsureSessionNotCompleted(session);

        Exercise? exercise = null;
        if (request.ExerciseId.HasValue)
        {
            exercise = await _dbContext.Exercises
                .FirstOrDefaultAsync(e => e.Id == request.ExerciseId.Value, cancellationToken);

            if (exercise is null)
            {
                throw new NotFoundException("Exercise not found.");
            }
        }

        var now = _clock.UtcNow;
        var nextOrder = session.Exercises.Any() ? session.Exercises.Max(e => e.OrderPerformed) + 1 : 1;
        var newExercise = new WorkoutSessionExercise
        {
            Id = Guid.NewGuid(),
            WorkoutSession = session,
            WorkoutSessionId = session.Id,
            ProgramExerciseId = null,
            ProgramExercise = null,
            ExerciseId = exercise?.Id,
            Exercise = exercise,
            IsAdHoc = true,
            CustomExerciseName = request.CustomExerciseName ?? exercise?.Name,
            CustomCategory = request.CustomCategory ?? exercise?.Category.ToString(),
            CustomPrimaryMuscle = request.CustomPrimaryMuscle ?? exercise?.PrimaryMuscle,
            Notes = request.Notes,
            RestSeconds = request.RestSeconds,
            OrderPerformed = nextOrder,
            CreatedAt = now,
            Sets = BuildSessionSetsFromDefinitions(request.Sets)
        };

        if (newExercise.Sets.Count == 0)
        {
            newExercise.Sets.Add(CreateDefaultSessionSet(1));
        }

        foreach (var pair in newExercise.Sets.Select((set, index) => (set, index)))
        {
            pair.set.SetIndex = pair.index + 1;
            pair.set.CreatedAt = now;
        }

        session.Exercises.Add(newExercise);
        session.UpdatedAt = now;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<WorkoutSessionDto> RemoveExerciseAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, CancellationToken cancellationToken = default)
    {
        var session = await BuildSessionAggregateQuery()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session is null)
        {
            throw new NotFoundException("Workout session not found.");
        }

        EnsureSessionNotCompleted(session);

        var exercise = session.Exercises.FirstOrDefault(e => e.Id == sessionExerciseId);
        if (exercise is null)
        {
            throw new NotFoundException("Session exercise not found.");
        }

        if (!exercise.IsAdHoc && exercise.ProgramExerciseId.HasValue)
        {
            throw new ValidationException("Planned program exercises cannot be removed.");
        }

        _dbContext.WorkoutSessionExercises.Remove(exercise);
        session.Exercises.Remove(exercise);
        RenumberExerciseOrder(session.Exercises);
        session.UpdatedAt = _clock.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<WorkoutSessionDto> ReorderExercisesAsync(Guid userId, Guid sessionId, ReorderSessionExercisesRequest request, CancellationToken cancellationToken = default)
    {
        if (request.OrderedExerciseIds is null || request.OrderedExerciseIds.Count == 0)
        {
            throw new ValidationException("Reorder payload must include exercise ids.");
        }

        var session = await BuildSessionAggregateQuery()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session is null)
        {
            throw new NotFoundException("Workout session not found.");
        }

        EnsureSessionNotCompleted(session);

        if (session.Exercises.Count != request.OrderedExerciseIds.Count ||
            session.Exercises.Select(e => e.Id).Except(request.OrderedExerciseIds).Any())
        {
            throw new ValidationException("Reorder payload must reference all exercises exactly once.");
        }

        var orderLookup = request.OrderedExerciseIds
            .Select((id, index) => new { id, index = index + 1 })
            .ToDictionary(x => x.id, x => x.index);

        foreach (var exercise in session.Exercises)
        {
            exercise.OrderPerformed = orderLookup[exercise.Id];
            exercise.UpdatedAt = _clock.UtcNow;
        }

        session.UpdatedAt = _clock.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<WorkoutSessionDto> UpdateExerciseAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, UpdateSessionExerciseRequest request, CancellationToken cancellationToken = default)
    {
        var exercise = await _dbContext.WorkoutSessionExercises
            .Include(e => e.WorkoutSession)
            .FirstOrDefaultAsync(e => e.Id == sessionExerciseId && e.WorkoutSessionId == sessionId, cancellationToken);

        if (exercise is null || exercise.WorkoutSession.UserId != userId)
        {
            throw new NotFoundException("Session exercise not found.");
        }

        EnsureSessionNotCompleted(exercise.WorkoutSession);

        if (request.RestSeconds.HasValue)
        {
            ValidateRestSeconds(request.RestSeconds.Value);
            exercise.RestSeconds = request.RestSeconds.Value;
        }

        if (request.Notes is not null)
        {
            exercise.Notes = request.Notes;
        }

        exercise.UpdatedAt = _clock.UtcNow;
        exercise.WorkoutSession.UpdatedAt = _clock.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<WorkoutSessionDto> AddSetAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, AddSessionSetRequest request, CancellationToken cancellationToken = default)
    {
        var exercise = await _dbContext.WorkoutSessionExercises
            .Include(e => e.WorkoutSession)
            .Include(e => e.Sets)
            .FirstOrDefaultAsync(e => e.Id == sessionExerciseId && e.WorkoutSessionId == sessionId, cancellationToken);

        if (exercise is null || exercise.WorkoutSession.UserId != userId)
        {
            throw new NotFoundException("Session exercise not found.");
        }

        EnsureSessionNotCompleted(exercise.WorkoutSession);

        var nextIndex = exercise.Sets.Any() ? exercise.Sets.Max(s => s.SetIndex) + 1 : 1;
        var set = new WorkoutSessionSet
        {
            Id = Guid.NewGuid(),
            WorkoutSessionExercise = exercise,
            WorkoutSessionExerciseId = exercise.Id,
            PlannedWeight = request.PlannedWeight,
            PlannedReps = request.PlannedReps,
            PlannedDurationSeconds = request.PlannedDurationSeconds,
            SetIndex = nextIndex,
            IsUserAdded = true,
            CreatedAt = _clock.UtcNow
        };

        exercise.Sets.Add(set);
        exercise.UpdatedAt = _clock.UtcNow;
        exercise.WorkoutSession.UpdatedAt = _clock.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<WorkoutSessionDto> RemoveSetAsync(Guid userId, Guid sessionId, Guid setId, CancellationToken cancellationToken = default)
    {
        var set = await _dbContext.WorkoutSessionSets
            .Include(s => s.WorkoutSessionExercise)
                .ThenInclude(e => e.WorkoutSession)
            .FirstOrDefaultAsync(s => s.Id == setId && s.WorkoutSessionExercise.WorkoutSessionId == sessionId, cancellationToken);

        if (set is null || set.WorkoutSessionExercise.WorkoutSession.UserId != userId)
        {
            throw new NotFoundException("Session set not found.");
        }

        EnsureSessionNotCompleted(set.WorkoutSessionExercise.WorkoutSession);

        if (!set.IsUserAdded && !set.WorkoutSessionExercise.IsAdHoc)
        {
            throw new ValidationException("Only user-added sets can be removed for planned exercises.");
        }

        _dbContext.WorkoutSessionSets.Remove(set);
        set.WorkoutSessionExercise.Sets.Remove(set);
        RenumberSetIndexes(set.WorkoutSessionExercise);
        set.WorkoutSessionExercise.UpdatedAt = _clock.UtcNow;
        set.WorkoutSessionExercise.WorkoutSession.UpdatedAt = _clock.UtcNow;

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

    private IQueryable<WorkoutSession> BuildSessionAggregateQuery()
    {
        return _dbContext.WorkoutSessions
            .Include(s => s.Exercises)
                .ThenInclude(e => e.Sets)
            .Include(s => s.Exercises)
                .ThenInclude(e => e.Exercise);
    }

    private static void ValidateRestSeconds(int restSeconds)
    {
        if (restSeconds is < MinRestSeconds or > MaxRestSeconds)
        {
            throw new ValidationException($"Rest seconds must be between {MinRestSeconds} and {MaxRestSeconds}.");
        }
    }

    private static void ValidateExerciseSelection(AddSessionExerciseRequest request)
    {
        if (!request.ExerciseId.HasValue && string.IsNullOrWhiteSpace(request.CustomExerciseName))
        {
            throw new ValidationException("Select a catalog exercise or provide a custom name.");
        }
    }

    private static void EnsureSessionNotCompleted(WorkoutSession session)
    {
        if (session.CompletedAt.HasValue)
        {
            throw new ConflictException("Workout session already completed.");
        }
    }

    private static List<WorkoutSessionSet> BuildSessionSetsFromDefinitions(IReadOnlyCollection<AddSessionExerciseSetDto>? definitions)
    {
        if (definitions is null || definitions.Count == 0)
        {
            return new List<WorkoutSessionSet>();
        }

        return definitions
            .Select(def => new WorkoutSessionSet
            {
                Id = Guid.NewGuid(),
                PlannedWeight = def.PlannedWeight,
                PlannedReps = def.PlannedReps,
                PlannedDurationSeconds = def.PlannedDurationSeconds,
                IsUserAdded = true
            })
            .ToList();
    }

    private static WorkoutSessionSet CreateDefaultSessionSet(int index)
    {
        return new WorkoutSessionSet
        {
            Id = Guid.NewGuid(),
            PlannedReps = null,
            PlannedWeight = null,
            PlannedDurationSeconds = null,
            IsUserAdded = true,
            SetIndex = index
        };
    }

    private static void RenumberExerciseOrder(IEnumerable<WorkoutSessionExercise> exercises)
    {
        var ordered = exercises.OrderBy(e => e.OrderPerformed).ThenBy(e => e.CreatedAt).ToList();
        for (var i = 0; i < ordered.Count; i++)
        {
            ordered[i].OrderPerformed = i + 1;
        }
    }

    private static void RenumberSetIndexes(WorkoutSessionExercise exercise)
    {
        var sortedSets = exercise.Sets.OrderBy(s => s.SetIndex).ToList();
        for (var i = 0; i < sortedSets.Count; i++)
        {
            sortedSets[i].SetIndex = i + 1;
        }
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
                .ThenBy(e => e.CreatedAt)
                .Select(e => new WorkoutSessionExerciseDto(
                    e.Id,
                    e.ExerciseId,
                    e.IsAdHoc ? (e.CustomExerciseName ?? e.Exercise?.Name ?? "Custom Exercise") : e.Exercise?.Name ?? e.CustomExerciseName ?? string.Empty,
                    e.CustomExerciseName,
                    e.IsAdHoc,
                    e.ExerciseId.HasValue,
                    e.Notes,
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
                            s.ActualDurationSeconds,
                            s.IsUserAdded))
                        .ToList()))
                .ToList());
    }
}
