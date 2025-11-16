using GymTrack.Infrastructure.Persistence;
using GymTrack.Infrastructure.Seed;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace GymTrack.Tests;

public class DatabaseSeederTests : IDisposable
{
    private readonly SqliteConnection _connection;

    public DatabaseSeederTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        using var context = CreateContext();
        context.Database.EnsureCreated();
    }

    [Fact]
    public async Task SeedAsync_PopulatesCatalog()
    {
        await using (var context = CreateContext())
        {
            await DatabaseSeeder.SeedAsync(context, NullLogger.Instance);
        }

        await using (var verificationContext = CreateContext())
        {
            var count = await verificationContext.Exercises.CountAsync();
            Assert.Equal(ExerciseSeedData.GetSeedDefinitions().Count, count);
        }
    }

    [Fact]
    public async Task SeedAsync_IsIdempotent()
    {
        await using (var context = CreateContext())
        {
            await DatabaseSeeder.SeedAsync(context, NullLogger.Instance);
        }

        await using (var secondContext = CreateContext())
        {
            await DatabaseSeeder.SeedAsync(secondContext, NullLogger.Instance);
        }

        await using var verificationContext = CreateContext();
        var exercises = await verificationContext.Exercises.ToListAsync();
        Assert.Equal(ExerciseSeedData.GetSeedDefinitions().Count, exercises.Count);

        var duplicateNames = exercises
            .GroupBy(exercise => exercise.Name, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .ToList();

        Assert.Empty(duplicateNames);
    }

    private GymTrackDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<GymTrackDbContext>()
            .UseSqlite(_connection)
            .EnableSensitiveDataLogging()
            .Options;

        return new GymTrackDbContext(options);
    }

    public void Dispose()
    {
        _connection.Dispose();
    }
}
