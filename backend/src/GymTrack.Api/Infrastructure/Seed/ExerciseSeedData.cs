using System.Security.Cryptography;
using System.Text;
using GymTrack.Domain.Entities;
using GymTrack.Domain.Enums;

namespace GymTrack.Infrastructure.Seed;

internal static class ExerciseSeedData
{
    private static readonly IReadOnlyList<ExerciseSeedDefinition> SeedDefinitions = new List<ExerciseSeedDefinition>
    {
        BuildDefinition("Barbell Back Squat", ExerciseCategory.Strength, "Quadriceps", "Glutes", 150,
            ("Quadriceps", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Yes),
            ("Hamstrings", MuscleEngagementLevel.Some)),
        BuildDefinition("Front Squat", ExerciseCategory.Strength, "Quadriceps", "Core", 150,
            ("Quadriceps", MuscleEngagementLevel.Yes),
            ("Core", MuscleEngagementLevel.Some),
            ("Upper Back", MuscleEngagementLevel.Some)),
        BuildDefinition("Romanian Deadlift", ExerciseCategory.Strength, "Hamstrings", "Glutes", 150,
            ("Hamstrings", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Yes),
            ("Lower Back", MuscleEngagementLevel.Some)),
        BuildDefinition("Deadlift", ExerciseCategory.Strength, "Posterior Chain", "Back", 180,
            ("Hamstrings", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Yes),
            ("Back", MuscleEngagementLevel.Some)),
        BuildDefinition("Sumo Deadlift", ExerciseCategory.Strength, "Hamstrings", "Adductors", 180,
            ("Hamstrings", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Some),
            ("Adductors", MuscleEngagementLevel.Some)),
        BuildDefinition("Walking Lunge", ExerciseCategory.Strength, "Quadriceps", "Glutes", 90,
            ("Quadriceps", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Yes),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Bulgarian Split Squat", ExerciseCategory.Strength, "Quadriceps", "Glutes", 120,
            ("Quadriceps", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Hip Thrust", ExerciseCategory.Strength, "Glutes", "Hamstrings", 120,
            ("Glutes", MuscleEngagementLevel.Yes),
            ("Hamstrings", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Glute Bridge", ExerciseCategory.Strength, "Glutes", "Hamstrings", 90,
            ("Glutes", MuscleEngagementLevel.Yes),
            ("Hamstrings", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Leg Press", ExerciseCategory.Strength, "Quadriceps", "Glutes", 120,
            ("Quadriceps", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Some),
            ("Hamstrings", MuscleEngagementLevel.Some)),
        BuildDefinition("Standing Calf Raise", ExerciseCategory.Strength, "Calves", null, 60,
            ("Calves", MuscleEngagementLevel.Yes),
            ("Ankles", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Seated Calf Raise", ExerciseCategory.Strength, "Calves", null, 60,
            ("Calves", MuscleEngagementLevel.Yes),
            ("Ankles", MuscleEngagementLevel.Some),
            ("Hamstrings", MuscleEngagementLevel.Some)),
        BuildDefinition("Barbell Bench Press", ExerciseCategory.Strength, "Chest", "Triceps", 150,
            ("Chest", MuscleEngagementLevel.Yes),
            ("Triceps", MuscleEngagementLevel.Some),
            ("Shoulders", MuscleEngagementLevel.Some)),
        BuildDefinition("Incline Barbell Bench Press", ExerciseCategory.Strength, "Upper Chest", "Shoulders", 150,
            ("Chest", MuscleEngagementLevel.Yes),
            ("Shoulders", MuscleEngagementLevel.Some),
            ("Triceps", MuscleEngagementLevel.Some)),
        BuildDefinition("Dumbbell Bench Press", ExerciseCategory.Strength, "Chest", "Triceps", 120,
            ("Chest", MuscleEngagementLevel.Yes),
            ("Triceps", MuscleEngagementLevel.Some),
            ("Shoulders", MuscleEngagementLevel.Some)),
        BuildDefinition("Overhead Press", ExerciseCategory.Strength, "Shoulders", "Triceps", 150,
            ("Shoulders", MuscleEngagementLevel.Yes),
            ("Triceps", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Push-Up", ExerciseCategory.Strength, "Chest", "Triceps", 60,
            ("Chest", MuscleEngagementLevel.Yes),
            ("Triceps", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Parallel Bar Dip", ExerciseCategory.Strength, "Chest", "Triceps", 90,
            ("Triceps", MuscleEngagementLevel.Yes),
            ("Chest", MuscleEngagementLevel.Some),
            ("Shoulders", MuscleEngagementLevel.Some)),
        BuildDefinition("Dumbbell Fly", ExerciseCategory.Strength, "Chest", "Shoulders", 90,
            ("Chest", MuscleEngagementLevel.Yes),
            ("Shoulders", MuscleEngagementLevel.Some),
            ("Biceps", MuscleEngagementLevel.Some)),
        BuildDefinition("Pull-Up", ExerciseCategory.Strength, "Back", "Biceps", 120,
            ("Lats", MuscleEngagementLevel.Yes),
            ("Biceps", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Chin-Up", ExerciseCategory.Strength, "Back", "Biceps", 120,
            ("Biceps", MuscleEngagementLevel.Yes),
            ("Lats", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Barbell Bent-Over Row", ExerciseCategory.Strength, "Back", "Biceps", 120,
            ("Back", MuscleEngagementLevel.Yes),
            ("Biceps", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Seated Cable Row", ExerciseCategory.Strength, "Back", "Biceps", 120,
            ("Back", MuscleEngagementLevel.Yes),
            ("Biceps", MuscleEngagementLevel.Some),
            ("Rear Delts", MuscleEngagementLevel.Some)),
        BuildDefinition("Lat Pulldown", ExerciseCategory.Strength, "Back", "Biceps", 120,
            ("Lats", MuscleEngagementLevel.Yes),
            ("Biceps", MuscleEngagementLevel.Some),
            ("Shoulders", MuscleEngagementLevel.Some)),
        BuildDefinition("Single-Arm Dumbbell Row", ExerciseCategory.Strength, "Back", "Core", 90,
            ("Back", MuscleEngagementLevel.Yes),
            ("Core", MuscleEngagementLevel.Some),
            ("Biceps", MuscleEngagementLevel.Some)),
        BuildDefinition("Face Pull", ExerciseCategory.Strength, "Rear Delts", "Upper Back", 60,
            ("Rear Delts", MuscleEngagementLevel.Yes),
            ("Upper Back", MuscleEngagementLevel.Some),
            ("Rotator Cuff", MuscleEngagementLevel.Some)),
        BuildDefinition("Barbell Curl", ExerciseCategory.Strength, "Biceps", "Forearms", 60,
            ("Biceps", MuscleEngagementLevel.Yes),
            ("Forearms", MuscleEngagementLevel.Some),
            ("Shoulders", MuscleEngagementLevel.Some)),
        BuildDefinition("Hammer Curl", ExerciseCategory.Strength, "Brachialis", "Forearms", 60,
            ("Brachialis", MuscleEngagementLevel.Yes),
            ("Forearms", MuscleEngagementLevel.Some),
            ("Biceps", MuscleEngagementLevel.Some)),
        BuildDefinition("Tricep Rope Pushdown", ExerciseCategory.Strength, "Triceps", "Forearms", 60,
            ("Triceps", MuscleEngagementLevel.Yes),
            ("Forearms", MuscleEngagementLevel.Some),
            ("Shoulders", MuscleEngagementLevel.Some)),
        BuildDefinition("Skull Crusher", ExerciseCategory.Strength, "Triceps", "Chest", 90,
            ("Triceps", MuscleEngagementLevel.Yes),
            ("Chest", MuscleEngagementLevel.Some),
            ("Shoulders", MuscleEngagementLevel.Some)),
        BuildDefinition("Lateral Raise", ExerciseCategory.Strength, "Shoulders", "Trapezius", 60,
            ("Shoulders", MuscleEngagementLevel.Yes),
            ("Trapezius", MuscleEngagementLevel.Some),
            ("Forearms", MuscleEngagementLevel.Some)),
        BuildDefinition("Plank", ExerciseCategory.Strength, "Core", "Shoulders", 45,
            ("Core", MuscleEngagementLevel.Yes),
            ("Shoulders", MuscleEngagementLevel.Some),
            ("Glutes", MuscleEngagementLevel.Some)),
        BuildDefinition("Hanging Leg Raise", ExerciseCategory.Strength, "Core", "Hip Flexors", 60,
            ("Core", MuscleEngagementLevel.Yes),
            ("Hip Flexors", MuscleEngagementLevel.Some),
            ("Grip", MuscleEngagementLevel.Some)),
        BuildDefinition("Russian Twist", ExerciseCategory.Strength, "Core", "Obliques", 60,
            ("Obliques", MuscleEngagementLevel.Yes),
            ("Core", MuscleEngagementLevel.Some),
            ("Hip Flexors", MuscleEngagementLevel.Some)),
        BuildDefinition("Kettlebell Swing", ExerciseCategory.Strength, "Posterior Chain", "Core", 90,
            ("Glutes", MuscleEngagementLevel.Yes),
            ("Hamstrings", MuscleEngagementLevel.Yes),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Farmer Carry", ExerciseCategory.Strength, "Grip", "Core", 90,
            ("Grip", MuscleEngagementLevel.Yes),
            ("Core", MuscleEngagementLevel.Some),
            ("Shoulders", MuscleEngagementLevel.Some)),
        BuildDefinition("Box Jump", ExerciseCategory.Strength, "Legs", "Core", 60,
            ("Quadriceps", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Some),
            ("Calves", MuscleEngagementLevel.Some)),
        BuildDefinition("Battle Ropes", ExerciseCategory.Cardio, "Shoulders", "Core", 45,
            ("Shoulders", MuscleEngagementLevel.Yes),
            ("Forearms", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Rowing Machine", ExerciseCategory.Cardio, "Full Body", null, 60,
            ("Back", MuscleEngagementLevel.Some),
            ("Legs", MuscleEngagementLevel.Some),
            ("Cardio", MuscleEngagementLevel.Yes)),
        BuildDefinition("Assault Bike", ExerciseCategory.Cardio, "Full Body", null, 45,
            ("Cardio", MuscleEngagementLevel.Yes),
            ("Legs", MuscleEngagementLevel.Some),
            ("Arms", MuscleEngagementLevel.Some)),
        BuildDefinition("Sled Push", ExerciseCategory.Strength, "Legs", "Core", 90,
            ("Quadriceps", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Burpee", ExerciseCategory.Cardio, "Full Body", null, 45,
            ("Cardio", MuscleEngagementLevel.Yes),
            ("Chest", MuscleEngagementLevel.Some),
            ("Legs", MuscleEngagementLevel.Some)),
        BuildDefinition("Medicine Ball Slam", ExerciseCategory.Strength, "Core", "Shoulders", 60,
            ("Core", MuscleEngagementLevel.Yes),
            ("Shoulders", MuscleEngagementLevel.Some),
            ("Back", MuscleEngagementLevel.Some)),
        BuildDefinition("Cable Woodchop", ExerciseCategory.Strength, "Obliques", "Core", 60,
            ("Obliques", MuscleEngagementLevel.Yes),
            ("Core", MuscleEngagementLevel.Some),
            ("Shoulders", MuscleEngagementLevel.Some)),
        BuildDefinition("Dumbbell Row", ExerciseCategory.Strength, "Back", "Biceps", 90,
            ("Back", MuscleEngagementLevel.Yes),
            ("Biceps", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Incline Dumbbell Bench Press", ExerciseCategory.Strength, "Upper Chest", "Shoulders", 120,
            ("Chest", MuscleEngagementLevel.Yes),
            ("Shoulders", MuscleEngagementLevel.Some),
            ("Triceps", MuscleEngagementLevel.Some)),
        BuildDefinition("Goblet Squat", ExerciseCategory.Strength, "Quadriceps", "Core", 120,
            ("Quadriceps", MuscleEngagementLevel.Yes),
            ("Glutes", MuscleEngagementLevel.Some),
            ("Core", MuscleEngagementLevel.Some)),
        BuildDefinition("Good Morning", ExerciseCategory.Strength, "Hamstrings", "Lower Back", 120,
            ("Hamstrings", MuscleEngagementLevel.Yes),
            ("Lower Back", MuscleEngagementLevel.Some),
            ("Glutes", MuscleEngagementLevel.Some))
    };

    public static IReadOnlyList<ExerciseSeedDefinition> GetSeedDefinitions() => SeedDefinitions;

    public static IReadOnlyCollection<Exercise> CreateExercises()
        => SeedDefinitions.Select(CreateExercise).ToArray();

    public static Exercise CreateExercise(ExerciseSeedDefinition definition)
    {
        var exercise = new Exercise
        {
            Id = definition.ExerciseId,
            Name = definition.Name,
            Category = definition.Category,
            PrimaryMuscle = definition.PrimaryMuscle,
            SecondaryMuscle = definition.SecondaryMuscle,
            CreatedAt = DateTimeOffset.UtcNow
        };

        exercise.MuscleEngagements = definition.Engagements
            .Select(engagement => CreateEngagement(exercise.Id, definition.Name, engagement, exercise))
            .ToList();

        return exercise;
    }

    public static ExerciseMuscleEngagement CreateEngagement(
        Guid exerciseId,
        string exerciseName,
        MuscleEngagementSeed engagement,
        Exercise? exercise = null)
    {
        return new ExerciseMuscleEngagement
        {
            Id = engagement.GetEngagementId(exerciseName),
            MuscleGroup = engagement.MuscleGroup,
            Level = engagement.Level,
            ExerciseId = exerciseId,
            Exercise = exercise ?? null!
        };
    }

    private static ExerciseSeedDefinition BuildDefinition(
        string name,
        ExerciseCategory category,
        string primaryMuscle,
        string? secondaryMuscle,
        int restSeconds,
        params (string MuscleGroup, MuscleEngagementLevel Level)[] engagements)
    {
        var engagementSeeds = engagements
            .Select(tuple => new MuscleEngagementSeed(tuple.MuscleGroup, tuple.Level))
            .ToList();

        return new ExerciseSeedDefinition(name, category, primaryMuscle, secondaryMuscle, restSeconds, engagementSeeds);
    }

    private static Guid CreateDeterministicGuid(string value)
    {
        var bytes = MD5.HashData(Encoding.UTF8.GetBytes(value));
        return new Guid(bytes);
    }

    internal sealed record ExerciseSeedDefinition(
        string Name,
        ExerciseCategory Category,
        string PrimaryMuscle,
        string? SecondaryMuscle,
        int RestSeconds,
        IReadOnlyList<MuscleEngagementSeed> Engagements)
    {
        public Guid ExerciseId => CreateDeterministicGuid($"exercise:{Name.ToLowerInvariant()}");
    }

    internal sealed record MuscleEngagementSeed(string MuscleGroup, MuscleEngagementLevel Level)
    {
        public Guid GetEngagementId(string exerciseName)
            => CreateDeterministicGuid($"exercise:{exerciseName.ToLowerInvariant()}:muscle:{MuscleGroup.ToLowerInvariant()}");
    }
}
