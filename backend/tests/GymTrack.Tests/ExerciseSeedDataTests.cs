using GymTrack.Infrastructure.Seed;

namespace GymTrack.Tests;

public class ExerciseSeedDataTests
{
    [Fact]
    public void Definitions_AreWellFormed()
    {
        var definitions = ExerciseSeedData.GetSeedDefinitions();

        Assert.True(definitions.Count >= 30);

        var duplicateNames = definitions
            .GroupBy(definition => definition.Name, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .ToList();

        Assert.Empty(duplicateNames);

        foreach (var definition in definitions)
        {
            Assert.False(string.IsNullOrWhiteSpace(definition.PrimaryMuscle));
            Assert.NotEmpty(definition.Engagements);

            foreach (var engagement in definition.Engagements)
            {
                Assert.False(string.IsNullOrWhiteSpace(engagement.MuscleGroup));
            }
        }
    }

    [Fact]
    public void CreateExercises_UsesDeterministicIds()
    {
        var definitions = ExerciseSeedData.GetSeedDefinitions();
        var exercises = ExerciseSeedData.CreateExercises();

        Assert.Equal(definitions.Count, exercises.Count);

        foreach (var definition in definitions)
        {
            var exercise = exercises.Single(e => e.Name == definition.Name);
            Assert.Equal(definition.ExerciseId, exercise.Id);
            Assert.Equal(definition.PrimaryMuscle, exercise.PrimaryMuscle);
            Assert.Equal(definition.SecondaryMuscle, exercise.SecondaryMuscle);
            Assert.Equal(definition.Engagements.Count, exercise.MuscleEngagements.Count);
        }
    }
}
