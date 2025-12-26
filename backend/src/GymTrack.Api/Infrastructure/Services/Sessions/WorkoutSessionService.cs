using System;
using System.Collections.Generic;
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
        return await MapSessionAsync(session, cancellationToken);
    }

    public async Task<WorkoutSessionDto> GetSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await BuildSessionAggregateQuery()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session is null)
        {
            throw new NotFoundException("Workout session not found.");
        }

        return await MapSessionAsync(session, cancellationToken);
    }

    public async Task<PagedResult<WorkoutSessionSummaryDto>> ListSessionsAsync(Guid userId, SessionListQuery query, CancellationToken cancellationToken = default)
    {
        if (query.StartedFrom.HasValue && query.StartedTo.HasValue && query.StartedFrom > query.StartedTo)
        {
            throw new ValidationException("startedFrom must be before startedTo.");
        }

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 5, 50);
        var now = _clock.UtcNow;
        var baseQuery = _dbContext.WorkoutSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId);

        baseQuery = query.Status switch
        {
            SessionListStatus.InProgress => baseQuery.Where(s => s.CompletedAt == null),
            SessionListStatus.Completed => baseQuery.Where(s => s.CompletedAt != null),
            _ => baseQuery
        };

        if (query.StartedFrom.HasValue)
        {
            baseQuery = baseQuery.Where(s => s.StartedAt >= query.StartedFrom.Value);
        }

        if (query.StartedTo.HasValue)
        {
            baseQuery = baseQuery.Where(s => s.StartedAt <= query.StartedTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = $"%{query.Search.Trim()}%";
            baseQuery = baseQuery.Where(s =>
                EF.Functions.Like(s.WorkoutProgram.Name, search) ||
                EF.Functions.Like(s.Notes ?? string.Empty, search));
        }

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        var results = await baseQuery
            .OrderByDescending(s => s.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new WorkoutSessionSummaryDto(
                s.Id,
                s.WorkoutProgramId,
                s.WorkoutProgram.Name,
                s.StartedAt,
                s.CompletedAt,
                (s.CompletedAt ?? s.UpdatedAt ?? now) - s.StartedAt,
                s.Exercises.Count,
                s.Exercises.SelectMany(e => e.Sets).Count(set =>
                    set.ActualDurationSeconds.HasValue ||
                    set.ActualReps.HasValue ||
                    set.ActualWeight.HasValue),
                s.Exercises.SelectMany(e => e.Sets).Count(),
                s.CompletedAt ?? s.UpdatedAt ?? s.StartedAt,
                s.TotalWeightLiftedKg))
            .ToListAsync(cancellationToken);

        return new PagedResult<WorkoutSessionSummaryDto>(results, page, pageSize, totalCount);
    }

    public async Task<IReadOnlyCollection<WorkoutSessionProgressPointDto>> GetProgramProgressionAsync(Guid userId, Guid programId, CancellationToken cancellationToken = default)
    {
        var points = await _dbContext.WorkoutSessions
            .AsNoTracking()
            .Where(s =>
                s.UserId == userId &&
                s.WorkoutProgramId == programId &&
                s.CompletedAt != null &&
                s.TotalWeightLiftedKg != null)
            .Select(s => new WorkoutSessionProgressPointDto(
                s.Id,
                s.CompletedAt!.Value,
                s.TotalWeightLiftedKg!.Value))
            .ToListAsync(cancellationToken);

        return points
            .OrderBy(point => point.CompletedAt)
            .ToList();
    }

    public async Task<IReadOnlyCollection<WorkoutSessionExerciseProgressPointDto>> GetExerciseProgressionAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, CancellationToken cancellationToken = default)
    {
        var sessionExercise = await _dbContext.WorkoutSessionExercises
            .Include(e => e.WorkoutSession)
            .FirstOrDefaultAsync(
                e =>
                    e.Id == sessionExerciseId &&
                    e.WorkoutSessionId == sessionId,
                cancellationToken);

        if (sessionExercise is null || sessionExercise.WorkoutSession.UserId != userId)
        {
            throw new NotFoundException("Session exercise not found.");
        }

        var programId = sessionExercise.WorkoutSession.WorkoutProgramId;
        var programExerciseId = sessionExercise.ProgramExerciseId;
        var referenceExerciseId = sessionExercise.ExerciseId;
        var customExerciseName = sessionExercise.CustomExerciseName;

        var progressionQuery = _dbContext.WorkoutSessionExercises
            .AsNoTracking()
            .Include(e => e.WorkoutSession)
            .Include(e => e.Sets)
            .Where(e =>
                e.WorkoutSession.UserId == userId &&
                e.WorkoutSession.WorkoutProgramId == programId &&
                e.WorkoutSession.CompletedAt != null);

        if (programExerciseId.HasValue)
        {
            progressionQuery = progressionQuery.Where(e => e.ProgramExerciseId == programExerciseId);
        }
        else if (referenceExerciseId.HasValue)
        {
            progressionQuery = progressionQuery.Where(e => e.ExerciseId == referenceExerciseId);
        }
        else if (!string.IsNullOrWhiteSpace(customExerciseName))
        {
            progressionQuery = progressionQuery.Where(e => e.CustomExerciseName == customExerciseName);
        }
        else
        {
            return Array.Empty<WorkoutSessionExerciseProgressPointDto>();
        }

        var progressionExercises = await progressionQuery
            .ToListAsync(cancellationToken);

        var results = progressionExercises
            .OrderBy(e => e.WorkoutSession.CompletedAt)
            .Select(e =>
            {
                var totalWeight = e.Sets
                    .Where(s => s.ActualWeight.HasValue && s.ActualReps.HasValue)
                    .Select(s => s.ActualWeight!.Value * s.ActualReps!.Value)
                    .DefaultIfEmpty(0m)
                    .Sum();

                return new WorkoutSessionExerciseProgressPointDto(
                    e.WorkoutSessionId,
                    e.Id,
                    e.WorkoutSession.CompletedAt!.Value,
                    totalWeight);
            })
            .ToList();

        return results;
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
            .Include(s => s.Exercises)
                .ThenInclude(e => e.Sets)
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
        session.TotalWeightLiftedKg = CalculateTotalWeightLifted(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetSessionAsync(userId, sessionId, cancellationToken);
    }

    public async Task<WorkoutSessionDto> AddExerciseAsync(Guid userId, Guid sessionId, AddSessionExerciseRequest request, CancellationToken cancellationToken = default)
    {
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

    public async Task<WorkoutSessionDto> RemoveSetAsync(
        Guid userId,
        Guid sessionId,
        Guid setId,
        bool allowPlannedRemoval = false,
        CancellationToken cancellationToken = default)
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

        if (!allowPlannedRemoval && !set.IsUserAdded && !set.WorkoutSessionExercise.IsAdHoc)
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

    public async Task DeleteSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.WorkoutSessions
            .Include(s => s.Exercises)
                .ThenInclude(e => e.Sets)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session is null)
        {
            throw new NotFoundException("Workout session not found.");
        }

        _dbContext.WorkoutSessions.Remove(session);
        await _dbContext.SaveChangesAsync(cancellationToken);
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

    private async Task<WorkoutSessionDto> MapSessionAsync(WorkoutSession session, CancellationToken cancellationToken)
    {
        var lastSetLookup = await BuildLastSetLookupAsync(session, cancellationToken);
        return MapSession(session, lastSetLookup);
    }

    private async Task<IReadOnlyDictionary<Guid, IReadOnlyDictionary<int, SetHistorySnapshot>>> BuildLastSetLookupAsync(
        WorkoutSession session,
        CancellationToken cancellationToken)
    {
        var exerciseKeys = session.Exercises
            .Select(exercise => new
            {
                Exercise = exercise,
                Key = ExerciseMatchKey.From(exercise)
            })
            .Where(pair => !pair.Key.IsEmpty)
            .ToList();

        if (exerciseKeys.Count == 0)
        {
            return new Dictionary<Guid, IReadOnlyDictionary<int, SetHistorySnapshot>>();
        }

        var previousExercises = await _dbContext.WorkoutSessionExercises
            .AsNoTracking()
            .Include(e => e.Sets)
            .Include(e => e.WorkoutSession)
            .Where(e =>
                e.WorkoutSession.UserId == session.UserId &&
                e.WorkoutSession.WorkoutProgramId == session.WorkoutProgramId &&
                e.WorkoutSession.CompletedAt != null &&
                e.WorkoutSession.StartedAt < session.StartedAt)
            .OrderByDescending(e => e.WorkoutSession.CompletedAt ?? e.WorkoutSession.StartedAt)
            .ThenByDescending(e => e.WorkoutSession.StartedAt)
            .ToListAsync(cancellationToken);

        if (previousExercises.Count == 0)
        {
            return new Dictionary<Guid, IReadOnlyDictionary<int, SetHistorySnapshot>>();
        }

        var latestByKey = new Dictionary<ExerciseMatchKey, WorkoutSessionExercise>(ExerciseMatchKeyComparer.Instance);

        foreach (var previousExercise in previousExercises)
        {
            var key = ExerciseMatchKey.From(previousExercise);
            if (key.IsEmpty)
            {
                continue;
            }

            if (!latestByKey.ContainsKey(key))
            {
                latestByKey[key] = previousExercise;
            }
        }

        var result = new Dictionary<Guid, IReadOnlyDictionary<int, SetHistorySnapshot>>();

        foreach (var pair in exerciseKeys)
        {
            if (!latestByKey.TryGetValue(pair.Key, out var historyExercise))
            {
                continue;
            }

            var setLookup = historyExercise.Sets
                .GroupBy(s => s.SetIndex)
                .ToDictionary(
                    group => group.Key,
                    group =>
                    {
                        var set = group
                            .OrderByDescending(s => s.UpdatedAt ?? s.CreatedAt)
                            .First();

                        return new SetHistorySnapshot(
                            set.ActualWeight ?? set.PlannedWeight,
                            set.ActualReps ?? set.PlannedReps,
                            set.ActualDurationSeconds ?? set.PlannedDurationSeconds);
                    });

            result[pair.Exercise.Id] = setLookup;
        }

        return result;
    }

    private static WorkoutSessionDto MapSession(
        WorkoutSession session,
        IReadOnlyDictionary<Guid, IReadOnlyDictionary<int, SetHistorySnapshot>> lastSetLookup)
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
                .Select(e =>
                {
                    lastSetLookup.TryGetValue(e.Id, out var historySets);

                    var mappedSets = e.Sets
                        .OrderBy(s => s.SetIndex)
                        .Select(s =>
                        {
                            SetHistorySnapshot? lastSnapshot = null;
                            if (historySets != null && historySets.TryGetValue(s.SetIndex, out var snapshot))
                            {
                                lastSnapshot = snapshot;
                            }

                            return new WorkoutSessionSetDto(
                                s.Id,
                                s.SetIndex,
                                s.PlannedWeight,
                                s.PlannedReps,
                                s.PlannedDurationSeconds,
                                s.ActualWeight,
                                s.ActualReps,
                                s.ActualDurationSeconds,
                                s.IsUserAdded,
                                lastSnapshot?.Weight,
                                lastSnapshot?.Reps,
                                lastSnapshot?.DurationSeconds);
                        })
                        .ToList();

                    return new WorkoutSessionExerciseDto(
                        e.Id,
                        e.ExerciseId,
                        e.IsAdHoc ? (e.CustomExerciseName ?? e.Exercise?.Name ?? "Custom Exercise") : e.Exercise?.Name ?? e.CustomExerciseName ?? string.Empty,
                        e.CustomExerciseName,
                        e.IsAdHoc,
                        e.ExerciseId.HasValue,
                        e.Notes,
                        e.OrderPerformed,
                        mappedSets);
                })
                .ToList(),
            session.TotalWeightLiftedKg);
    }

    private sealed record ExerciseMatchKey(Guid? ProgramExerciseId, Guid? ExerciseId, string? CustomExerciseName)
    {
        public bool IsEmpty => ProgramExerciseId is null && ExerciseId is null && CustomExerciseName is null;

        public static ExerciseMatchKey From(WorkoutSessionExercise exercise)
        {
            return new ExerciseMatchKey(
                exercise.ProgramExerciseId,
                exercise.ExerciseId,
                NormalizeCustomName(exercise.CustomExerciseName));
        }

        private static string? NormalizeCustomName(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return value.Trim().ToLowerInvariant();
        }
    }

    private sealed class ExerciseMatchKeyComparer : IEqualityComparer<ExerciseMatchKey>
    {
        public static ExerciseMatchKeyComparer Instance { get; } = new();

        public bool Equals(ExerciseMatchKey? x, ExerciseMatchKey? y)
        {
            if (ReferenceEquals(x, y))
            {
                return true;
            }

            if (x is null || y is null)
            {
                return false;
            }

            return x.ProgramExerciseId == y.ProgramExerciseId &&
                x.ExerciseId == y.ExerciseId &&
                string.Equals(x.CustomExerciseName, y.CustomExerciseName, StringComparison.Ordinal);
        }

        public int GetHashCode(ExerciseMatchKey obj)
        {
            return HashCode.Combine(obj.ProgramExerciseId, obj.ExerciseId, obj.CustomExerciseName);
        }
    }

    private sealed record SetHistorySnapshot(decimal? Weight, int? Reps, int? DurationSeconds);

    private static decimal CalculateTotalWeightLifted(WorkoutSession session)
    {
        var total = 0m;
        var loggedSetFound = false;

        foreach (var set in session.Exercises.SelectMany(e => e.Sets))
        {
            if (!set.ActualWeight.HasValue || !set.ActualReps.HasValue)
            {
                continue;
            }

            loggedSetFound = true;
            total += set.ActualWeight.Value * set.ActualReps.Value;
        }

        return loggedSetFound ? total : 0m;
    }
}
