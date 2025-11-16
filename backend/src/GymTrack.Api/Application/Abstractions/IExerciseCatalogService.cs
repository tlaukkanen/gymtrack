using GymTrack.Application.Contracts.Exercises;

namespace GymTrack.Application.Abstractions;

public interface IExerciseCatalogService
{
    Task<IReadOnlyCollection<ExerciseDto>> GetExercisesAsync(CancellationToken cancellationToken = default);
}
