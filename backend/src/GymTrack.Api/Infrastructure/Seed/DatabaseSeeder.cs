using GymTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GymTrack.Infrastructure.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(GymTrackDbContext dbContext, ILogger logger, CancellationToken cancellationToken = default)
    {
        var definitions = ExerciseSeedData.GetSeedDefinitions();

        var trackedExercises = await dbContext.Exercises
            .Include(x => x.MuscleEngagements)
            .ToListAsync(cancellationToken);

        var exercisesByName = trackedExercises
            .ToDictionary(x => x.Name, StringComparer.OrdinalIgnoreCase);

        var exercisesToInsert = new List<Domain.Entities.Exercise>();
        var updatedCount = 0;

        foreach (var definition in definitions)
        {
            if (!exercisesByName.TryGetValue(definition.Name, out var existing))
            {
                exercisesToInsert.Add(ExerciseSeedData.CreateExercise(definition));
                continue;
            }

            var changed = UpdateExercise(existing, definition);
            if (changed)
            {
                existing.UpdatedAt = DateTimeOffset.UtcNow;
                updatedCount++;
            }
        }

        if (exercisesToInsert.Count > 0)
        {
            logger.LogInformation("Adding {Count} missing exercises to catalog", exercisesToInsert.Count);
            await dbContext.Exercises.AddRangeAsync(exercisesToInsert, cancellationToken);
        }

        if (exercisesToInsert.Count == 0 && updatedCount == 0)
        {
            logger.LogInformation("Exercise catalog already up to date");
            return;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Exercise catalog seeding complete. Inserted {Inserted}, updated {Updated}", exercisesToInsert.Count, updatedCount);
    }

    private static bool UpdateExercise(Domain.Entities.Exercise existing, ExerciseSeedData.ExerciseSeedDefinition definition)
    {
        var changed = false;

        if (!string.Equals(existing.Name, definition.Name, StringComparison.Ordinal))
        {
            existing.Name = definition.Name;
            changed = true;
        }

        if (existing.Category != definition.Category)
        {
            existing.Category = definition.Category;
            changed = true;
        }

        if (!string.Equals(existing.PrimaryMuscle, definition.PrimaryMuscle, StringComparison.Ordinal))
        {
            existing.PrimaryMuscle = definition.PrimaryMuscle;
            changed = true;
        }

        if (!string.Equals(existing.SecondaryMuscle, definition.SecondaryMuscle, StringComparison.Ordinal))
        {
            existing.SecondaryMuscle = definition.SecondaryMuscle;
            changed = true;
        }

        if (existing.DefaultRestSeconds != definition.RestSeconds)
        {
            existing.DefaultRestSeconds = definition.RestSeconds;
            changed = true;
        }

        var engagementsByMuscle = existing.MuscleEngagements
            .ToDictionary(x => x.MuscleGroup, StringComparer.OrdinalIgnoreCase);

        foreach (var engagementDefinition in definition.Engagements)
        {
            if (engagementsByMuscle.TryGetValue(engagementDefinition.MuscleGroup, out var engagement))
            {
                if (engagement.Level != engagementDefinition.Level)
                {
                    engagement.Level = engagementDefinition.Level;
                    changed = true;
                }
            }
            else
            {
                existing.MuscleEngagements.Add(
                    ExerciseSeedData.CreateEngagement(existing.Id, definition.Name, engagementDefinition));
                changed = true;
            }
        }

        return changed;
    }
}
