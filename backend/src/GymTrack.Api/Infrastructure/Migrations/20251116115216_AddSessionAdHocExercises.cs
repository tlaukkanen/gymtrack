using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymTrack.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionAdHocExercises : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutSessionExercises_Exercises_ExerciseId",
                table: "WorkoutSessionExercises");

            migrationBuilder.AddColumn<bool>(
                name: "IsUserAdded",
                table: "WorkoutSessionSets",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<Guid>(
                name: "ExerciseId",
                table: "WorkoutSessionExercises",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<string>(
                name: "CustomCategory",
                table: "WorkoutSessionExercises",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomExerciseName",
                table: "WorkoutSessionExercises",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomPrimaryMuscle",
                table: "WorkoutSessionExercises",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAdHoc",
                table: "WorkoutSessionExercises",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "WorkoutSessionExercises",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutSessionExercises_Exercises_ExerciseId",
                table: "WorkoutSessionExercises",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutSessionExercises_Exercises_ExerciseId",
                table: "WorkoutSessionExercises");

            migrationBuilder.DropColumn(
                name: "IsUserAdded",
                table: "WorkoutSessionSets");

            migrationBuilder.DropColumn(
                name: "CustomCategory",
                table: "WorkoutSessionExercises");

            migrationBuilder.DropColumn(
                name: "CustomExerciseName",
                table: "WorkoutSessionExercises");

            migrationBuilder.DropColumn(
                name: "CustomPrimaryMuscle",
                table: "WorkoutSessionExercises");

            migrationBuilder.DropColumn(
                name: "IsAdHoc",
                table: "WorkoutSessionExercises");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "WorkoutSessionExercises");

            migrationBuilder.AlterColumn<Guid>(
                name: "ExerciseId",
                table: "WorkoutSessionExercises",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutSessionExercises_Exercises_ExerciseId",
                table: "WorkoutSessionExercises",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
