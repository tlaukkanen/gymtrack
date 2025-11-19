using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Programs;
using GymTrack.Domain.Entities;
using GymTrack.Domain.Enums;
using GymTrack.Infrastructure.Persistence;
using GymTrack.Infrastructure.Services.Programs;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace GymTrack.Tests;

public sealed class WorkoutProgramServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly GymTrackDbContext _dbContext;
    private readonly WorkoutProgramService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public WorkoutProgramServiceTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<GymTrackDbContext>()
            .UseSqlite(_connection)
            .Options;

        _dbContext = new GymTrackDbContext(options);
        _dbContext.Database.EnsureCreated();
        _service = new WorkoutProgramService(_dbContext, new FakeClock(), NullLogger<WorkoutProgramService>.Instance);
    }

    [Fact]
    public async Task UpdateProgramAsync_AddsSecondSetSuccessfully()
    {
        var exercise = new Exercise
        {
            Id = Guid.NewGuid(),
            Name = "Bench Press",
            Category = ExerciseCategory.Strength,
            PrimaryMuscle = "Chest"
        };
        _dbContext.Exercises.Add(exercise);

        var program = new WorkoutProgram
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            Name = "Push Day"
        };

        var programExercise = new WorkoutProgramExercise
        {
            Id = Guid.NewGuid(),
            WorkoutProgram = program,
            WorkoutProgramId = program.Id,
            ExerciseId = exercise.Id,
            DisplayOrder = 1,
            RestSeconds = 90,
            Notes = string.Empty,
            Sets =
            {
                new ExerciseSet
                {
                    Id = Guid.NewGuid(),
                    Sequence = 1,
                    TargetWeight = 100,
                    TargetReps = 5,
                    RestSeconds = 60
                }
            }
        };

        program.Exercises.Add(programExercise);
        _dbContext.WorkoutPrograms.Add(program);
        await _dbContext.SaveChangesAsync();

        var request = new UpdateWorkoutProgramRequest(
            program.Name,
            program.Description,
            new[]
            {
                new WorkoutProgramExerciseDto(
                    programExercise.Id,
                    programExercise.ExerciseId,
                    programExercise.DisplayOrder,
                    programExercise.RestSeconds,
                    programExercise.Notes,
                    new[]
                    {
                        new ExerciseSetDto(
                            programExercise.Sets.First().Id,
                            1,
                            programExercise.Sets.First().TargetWeight,
                            programExercise.Sets.First().TargetReps,
                            null,
                            60),
                        new ExerciseSetDto(
                            null,
                            2,
                            105,
                            5,
                            null,
                            60)
                    })
            });

        var result = await _service.UpdateProgramAsync(_userId, program.Id, request);

        var updatedExercise = result.Exercises.Single();
        Assert.Equal(2, updatedExercise.Sets.Count);
        Assert.Contains(updatedExercise.Sets, s => s.Sequence == 2 && s.TargetWeight == 105);
    }

    [Fact]
    public async Task UpdateProgramAsync_AddsNewExerciseWithSets()
    {
        var bench = new Exercise
        {
            Id = Guid.NewGuid(),
            Name = "Bench Press",
            Category = ExerciseCategory.Strength,
            PrimaryMuscle = "Chest"
        };

        var squat = new Exercise
        {
            Id = Guid.NewGuid(),
            Name = "Back Squat",
            Category = ExerciseCategory.Strength,
            PrimaryMuscle = "Quads"
        };

        _dbContext.Exercises.AddRange(bench, squat);

        var program = new WorkoutProgram
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            Name = "Push/Pull"
        };

        var existingExercise = new WorkoutProgramExercise
        {
            Id = Guid.NewGuid(),
            WorkoutProgram = program,
            WorkoutProgramId = program.Id,
            ExerciseId = bench.Id,
            DisplayOrder = 1,
            RestSeconds = 90,
            Notes = string.Empty,
            Sets =
            {
                new ExerciseSet
                {
                    Id = Guid.NewGuid(),
                    Sequence = 1,
                    TargetWeight = 95,
                    TargetReps = 5,
                    RestSeconds = 60
                }
            }
        };

        program.Exercises.Add(existingExercise);
        _dbContext.WorkoutPrograms.Add(program);
        await _dbContext.SaveChangesAsync();

        var request = new UpdateWorkoutProgramRequest(
            program.Name,
            program.Description,
            new[]
            {
                new WorkoutProgramExerciseDto(
                    existingExercise.Id,
                    existingExercise.ExerciseId,
                    existingExercise.DisplayOrder,
                    existingExercise.RestSeconds,
                    existingExercise.Notes,
                    new[]
                    {
                        new ExerciseSetDto(
                            existingExercise.Sets.First().Id,
                            1,
                            existingExercise.Sets.First().TargetWeight,
                            existingExercise.Sets.First().TargetReps,
                            null,
                            existingExercise.Sets.First().RestSeconds)
                    }),
                new WorkoutProgramExerciseDto(
                    null,
                    squat.Id,
                    2,
                    120,
                    "Add new squat work",
                    new[]
                    {
                        new ExerciseSetDto(
                            null,
                            1,
                            135,
                            8,
                            null,
                            90)
                    })
            });

        var result = await _service.UpdateProgramAsync(_userId, program.Id, request);

        Assert.Equal(2, result.Exercises.Count);
        var added = result.Exercises.Single(x => x.ExerciseId == squat.Id);
        Assert.Single(added.Sets);
        Assert.Equal(135, added.Sets.First().TargetWeight);
        Assert.Equal(2, added.DisplayOrder);
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
