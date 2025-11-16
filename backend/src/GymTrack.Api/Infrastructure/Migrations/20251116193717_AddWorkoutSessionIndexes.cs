using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymTrack.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutSessionIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_UserId_CompletedAt",
                table: "WorkoutSessions",
                columns: new[] { "UserId", "CompletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_UserId_StartedAt",
                table: "WorkoutSessions",
                columns: new[] { "UserId", "StartedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkoutSessions_UserId_CompletedAt",
                table: "WorkoutSessions");

            migrationBuilder.DropIndex(
                name: "IX_WorkoutSessions_UserId_StartedAt",
                table: "WorkoutSessions");
        }
    }
}
