using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymTrack.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveExerciseDefaultRestAndAddSetRest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsWarmup",
                table: "ExerciseSets");

            migrationBuilder.DropColumn(
                name: "DefaultRestSeconds",
                table: "Exercises");

            migrationBuilder.AddColumn<int>(
                name: "RestSeconds",
                table: "ExerciseSets",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RestSeconds",
                table: "ExerciseSets");

            migrationBuilder.AddColumn<bool>(
                name: "IsWarmup",
                table: "ExerciseSets",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "DefaultRestSeconds",
                table: "Exercises",
                type: "int",
                nullable: false,
                defaultValue: 60);
        }
    }
}
