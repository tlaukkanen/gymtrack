using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymTrack.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveExerciseLevelRestSeconds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RestSeconds",
                table: "WorkoutSessionExercises");

            migrationBuilder.DropColumn(
                name: "RestSeconds",
                table: "WorkoutProgramExercises");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RestSeconds",
                table: "WorkoutSessionExercises",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RestSeconds",
                table: "WorkoutProgramExercises",
                type: "int",
                nullable: false,
                defaultValue: 60);
        }
    }
}
