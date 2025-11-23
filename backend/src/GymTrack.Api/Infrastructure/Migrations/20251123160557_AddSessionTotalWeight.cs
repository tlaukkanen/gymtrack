using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymTrack.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionTotalWeight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TotalWeightLiftedKg",
                table: "WorkoutSessions",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ws
SET TotalWeightLiftedKg = totals.TotalWeight
FROM WorkoutSessions ws
CROSS APPLY (
    SELECT SUM(CAST(wss.ActualWeight * wss.ActualReps AS decimal(18,2))) AS TotalWeight
    FROM WorkoutSessionExercises wse
    INNER JOIN WorkoutSessionSets wss ON wss.WorkoutSessionExerciseId = wse.Id
    WHERE wse.WorkoutSessionId = ws.Id
        AND wss.ActualWeight IS NOT NULL
        AND wss.ActualReps IS NOT NULL
) totals
WHERE ws.CompletedAt IS NOT NULL
    AND totals.TotalWeight IS NOT NULL;

UPDATE WorkoutSessions
SET TotalWeightLiftedKg = 0
WHERE CompletedAt IS NOT NULL
    AND TotalWeightLiftedKg IS NULL;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalWeightLiftedKg",
                table: "WorkoutSessions");
        }
    }
}
