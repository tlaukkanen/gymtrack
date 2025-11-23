using System;
using System.Linq;
using System.Threading.Tasks;
using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Sessions;
using GymTrack.Domain.Entities;
using GymTrack.Domain.Enums;
using GymTrack.Infrastructure.Persistence;
using GymTrack.Infrastructure.Services.Sessions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymTrack.Tests;

public sealed class WorkoutSessionServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly GymTrackDbContext _dbContext;
    private readonly WorkoutSessionService _service;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly FakeClock _clock = new();

    public WorkoutSessionServiceTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<GymTrackDbContext>()
            .UseSqlite(_connection)
            .Options;

        _dbContext = new GymTrackDbContext(options);
        _dbContext.Database.EnsureCreated();
        _service = new WorkoutSessionService(_dbContext, _clock);
    }

    [Fact]
    public async Task CompleteSessionAsync_ComputesTotalWeight()
    {
        var (program, exercise) = await SeedProgramAsync();
        var session = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            WorkoutProgramId = program.Id,
            WorkoutProgram = program,
            UserId = _userId,
            StartedAt = _clock.UtcNow.AddHours(-1),
            CreatedAt = _clock.UtcNow.AddHours(-1),
            Exercises =
            {
                new WorkoutSessionExercise
                {
                    Id = Guid.NewGuid(),
                    WorkoutSessionId = Guid.Empty,
                    WorkoutSession = null!,
                    ProgramExerciseId = null,
                    ExerciseId = exercise.Id,
                    IsAdHoc = true,
                    CustomExerciseName = "Bench",
                    OrderPerformed = 1,
                    RestSeconds = 90,
                    CreatedAt = _clock.UtcNow.AddHours(-1),
                    Sets =
                    {
                        new WorkoutSessionSet
                        {
                            Id = Guid.NewGuid(),
                            SetIndex = 1,
                            ActualWeight = 100,
                            ActualReps = 5,
                            CreatedAt = _clock.UtcNow.AddHours(-1)
                        },
                        new WorkoutSessionSet
                        {
                            Id = Guid.NewGuid(),
                            SetIndex = 2,
                            ActualWeight = 80,
                            ActualReps = 10,
                            CreatedAt = _clock.UtcNow.AddHours(-1)
                        }
                    }
                }
            }
        };

        foreach (var sessionExercise in session.Exercises)
        {
            sessionExercise.WorkoutSession = session;
            sessionExercise.WorkoutSessionId = session.Id;
            foreach (var set in sessionExercise.Sets)
            {
                set.WorkoutSessionExercise = sessionExercise;
                set.WorkoutSessionExerciseId = sessionExercise.Id;
            }
        }

        _dbContext.WorkoutSessions.Add(session);
        await _dbContext.SaveChangesAsync();

        var result = await _service.CompleteSessionAsync(_userId, session.Id);

        Assert.Equal(100 * 5 + 80 * 10, result.TotalWeightLiftedKg);
        var persisted = await _dbContext.WorkoutSessions.SingleAsync(s => s.Id == session.Id);
        Assert.Equal(100 * 5 + 80 * 10, persisted.TotalWeightLiftedKg);
    }

    [Fact]
    public async Task GetProgramProgressionAsync_ReturnsOrderedPoints()
    {
        var (program, exercise) = await SeedProgramAsync();
        var (otherProgram, otherExercise) = await SeedProgramAsync("Other");

        var firstSession = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            WorkoutProgramId = program.Id,
            WorkoutProgram = program,
            UserId = _userId,
            StartedAt = _clock.UtcNow.AddDays(-3),
            CompletedAt = _clock.UtcNow.AddDays(-3).AddHours(1),
            TotalWeightLiftedKg = 500,
            CreatedAt = _clock.UtcNow.AddDays(-3)
        };

        var secondSession = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            WorkoutProgramId = program.Id,
            WorkoutProgram = program,
            UserId = _userId,
            StartedAt = _clock.UtcNow.AddDays(-1),
            CompletedAt = _clock.UtcNow.AddDays(-1).AddHours(1),
            TotalWeightLiftedKg = 750,
            CreatedAt = _clock.UtcNow.AddDays(-1)
        };

        var unrelated = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            WorkoutProgramId = otherProgram.Id,
            WorkoutProgram = otherProgram,
            UserId = _userId,
            StartedAt = _clock.UtcNow.AddDays(-2),
            CompletedAt = _clock.UtcNow.AddDays(-2).AddHours(1),
            TotalWeightLiftedKg = 900,
            CreatedAt = _clock.UtcNow.AddDays(-2)
        };

        _dbContext.WorkoutSessions.AddRange(firstSession, secondSession, unrelated);
        await _dbContext.SaveChangesAsync();

        var points = await _service.GetProgramProgressionAsync(_userId, program.Id);

        Assert.Equal(2, points.Count);
        Assert.Collection(points,
            p =>
            {
                Assert.Equal(firstSession.Id, p.SessionId);
                Assert.Equal(500, p.TotalWeightLiftedKg);
            },
            p =>
            {
                Assert.Equal(secondSession.Id, p.SessionId);
                Assert.Equal(750, p.TotalWeightLiftedKg);
            });
    }

    [Fact]
    public async Task GetExerciseProgressionAsync_ReturnsOrderedPoints()
    {
        var (program, catalogExercise) = await SeedProgramAsync();
        var (_, otherCatalogExercise) = await SeedProgramAsync("Other");

        var firstSession = CreateCompletedSession(
            program,
            catalogExercise.Id,
            _clock.UtcNow.AddDays(-5),
            100,
            5);
        var secondSession = CreateCompletedSession(
            program,
            catalogExercise.Id,
            _clock.UtcNow.AddDays(-2),
            120,
            5);
        var otherSession = CreateCompletedSession(
            program,
            otherCatalogExercise.Id,
            _clock.UtcNow.AddDays(-1),
            150,
            5);

        _dbContext.WorkoutSessions.AddRange(firstSession, secondSession, otherSession);
        await _dbContext.SaveChangesAsync();

        var targetExercise = firstSession.Exercises.First();

        var points = await _service.GetExerciseProgressionAsync(
            _userId,
            firstSession.Id,
            targetExercise.Id);

        Assert.Equal(2, points.Count);
        Assert.Collection(points,
            p =>
            {
                Assert.Equal(firstSession.Id, p.SessionId);
                Assert.Equal(500, p.TotalWeightLiftedKg);
            },
            p =>
            {
                Assert.Equal(secondSession.Id, p.SessionId);
                Assert.Equal(600, p.TotalWeightLiftedKg);
            });
    }

    private async Task<(WorkoutProgram Program, Exercise Exercise)> SeedProgramAsync(string name = "Test Program")
    {
        var exercise = new Exercise
        {
            Id = Guid.NewGuid(),
            Name = $"{name} Exercise {Guid.NewGuid():N}",
            Category = ExerciseCategory.Strength,
            PrimaryMuscle = "Chest"
        };

        var program = new WorkoutProgram
        {
            Id = Guid.NewGuid(),
            Name = name,
            UserId = _userId,
            CreatedAt = _clock.UtcNow.AddDays(-7)
        };

        _dbContext.Exercises.Add(exercise);
        _dbContext.WorkoutPrograms.Add(program);
        await _dbContext.SaveChangesAsync();
        return (program, exercise);
    }

    private WorkoutSession CreateCompletedSession(WorkoutProgram program, Guid exerciseId, DateTimeOffset completedAt, decimal weight, int reps)
    {
        var session = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            WorkoutProgramId = program.Id,
            WorkoutProgram = program,
            UserId = _userId,
            StartedAt = completedAt.AddHours(-1),
            CompletedAt = completedAt,
            CreatedAt = completedAt.AddHours(-1)
        };

        var sessionExercise = new WorkoutSessionExercise
        {
            Id = Guid.NewGuid(),
            WorkoutSession = session,
            WorkoutSessionId = session.Id,
            ExerciseId = exerciseId,
            ProgramExerciseId = null,
            OrderPerformed = 1,
            RestSeconds = 60,
            CreatedAt = completedAt.AddHours(-1),
            Sets =
            {
                new WorkoutSessionSet
                {
                    Id = Guid.NewGuid(),
                    WorkoutSessionExerciseId = Guid.Empty,
                    WorkoutSessionExercise = null!,
                    SetIndex = 1,
                    ActualWeight = weight,
                    ActualReps = reps,
                    CreatedAt = completedAt.AddHours(-1)
                }
            }
        };

        foreach (var set in sessionExercise.Sets)
        {
            set.WorkoutSessionExercise = sessionExercise;
            set.WorkoutSessionExerciseId = sessionExercise.Id;
        }

        session.Exercises.Add(sessionExercise);

        return session;
    }

    public void Dispose()
    {
        _dbContext.Dispose();
        _connection.Dispose();
    }

    private sealed class FakeClock : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = DateTimeOffset.UtcNow;
    }
}
