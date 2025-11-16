using System;
using System.Collections.Generic;
using System.Text;
using GymTrack.Infrastructure.Seed;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymTrack.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExpandedExerciseSeeds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Exercises_Name",
                table: "Exercises",
                column: "Name",
                unique: true);

            SeedExercises(migrationBuilder);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            RemoveNewExercises(migrationBuilder);

            migrationBuilder.DropIndex(
                name: "IX_Exercises_Name",
                table: "Exercises");
        }

        private static void SeedExercises(MigrationBuilder migrationBuilder)
        {
            foreach (var definition in ExerciseSeedData.GetSeedDefinitions())
            {
                var sql = BuildUpsertSql(definition);
                migrationBuilder.Sql(sql);
            }
        }

        private static void RemoveNewExercises(MigrationBuilder migrationBuilder)
        {
            var legacyNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Barbell Back Squat",
                "Barbell Bench Press",
                "Deadlift",
                "Pull-Up",
                "Overhead Press",
                "Romanian Deadlift",
                "Dumbbell Row",
                "Leg Press",
                "Rowing Machine",
                "Assault Bike"
            };

            foreach (var definition in ExerciseSeedData.GetSeedDefinitions())
            {
                if (legacyNames.Contains(definition.Name))
                {
                    continue;
                }

                var escapedName = Escape(definition.Name);
                var cleanupSql = $@"
DELETE FROM [ExerciseMuscleEngagements]
WHERE [ExerciseId] IN (SELECT [Id] FROM [Exercises] WHERE [Name] = '{escapedName}');

DELETE FROM [Exercises]
WHERE [Name] = '{escapedName}';";

                migrationBuilder.Sql(cleanupSql);
            }
        }

        private static string BuildUpsertSql(ExerciseSeedData.ExerciseSeedDefinition definition)
        {
            var builder = new StringBuilder();
            builder.AppendLine("DECLARE @ExistingId uniqueidentifier;");
            builder.AppendLine($"SELECT @ExistingId = [Id] FROM [Exercises] WHERE [Name] = '{Escape(definition.Name)}';");
            builder.AppendLine($"DECLARE @TargetId uniqueidentifier = ISNULL(@ExistingId, '{definition.ExerciseId}');");
            builder.AppendLine("IF (@ExistingId IS NULL)");
            builder.AppendLine("BEGIN");
            builder.AppendLine("    INSERT INTO [Exercises] ([Id], [Name], [Category], [PrimaryMuscle], [SecondaryMuscle], [DefaultRestSeconds], [CreatedAt], [UpdatedAt])");
            builder.AppendLine($"    VALUES (@TargetId, '{Escape(definition.Name)}', {(int)definition.Category}, '{Escape(definition.PrimaryMuscle)}', {FormatNullable(definition.SecondaryMuscle)}, {definition.RestSeconds}, SYSUTCDATETIME(), NULL);");
            builder.AppendLine("END");
            builder.AppendLine("ELSE");
            builder.AppendLine("BEGIN");
            builder.AppendLine("    UPDATE [Exercises]");
            builder.AppendLine($"    SET [Category] = {(int)definition.Category},");
            builder.AppendLine($"        [PrimaryMuscle] = '{Escape(definition.PrimaryMuscle)}',");
            builder.AppendLine($"        [SecondaryMuscle] = {FormatNullable(definition.SecondaryMuscle)},");
            builder.AppendLine($"        [DefaultRestSeconds] = {definition.RestSeconds},");
            builder.AppendLine("        [UpdatedAt] = SYSUTCDATETIME()");
            builder.AppendLine("    WHERE [Id] = @TargetId;");
            builder.AppendLine("END");

            foreach (var engagement in definition.Engagements)
            {
                builder.AppendLine($"IF NOT EXISTS (SELECT 1 FROM [ExerciseMuscleEngagements] WHERE [ExerciseId] = @TargetId AND [MuscleGroup] = '{Escape(engagement.MuscleGroup)}')");
                builder.AppendLine("BEGIN");
                builder.AppendLine("    INSERT INTO [ExerciseMuscleEngagements] ([Id], [ExerciseId], [MuscleGroup], [Level])");
                builder.AppendLine($"    VALUES ('{engagement.GetEngagementId(definition.Name)}', @TargetId, '{Escape(engagement.MuscleGroup)}', {(int)engagement.Level});");
                builder.AppendLine("END");
            }

            return builder.ToString();
        }

        private static string Escape(string value)
            => value.Replace("'", "''", StringComparison.Ordinal);

        private static string FormatNullable(string value)
            => value is null ? "NULL" : $"'{Escape(value)}'";
    }
}
