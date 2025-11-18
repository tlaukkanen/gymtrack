using GymTrack.Application.Abstractions;
using GymTrack.Application.Contracts.Exercises;
using GymTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GymTrack.Infrastructure.Services.Exercises;

internal sealed class ExerciseCatalogService : IExerciseCatalogService
{
    private readonly GymTrackDbContext _dbContext;

    public ExerciseCatalogService(GymTrackDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<ExerciseDto>> GetExercisesAsync(CancellationToken cancellationToken = default)
    {
        var exercises = await _dbContext.Exercises
            .Include(x => x.MuscleEngagements)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return exercises
            .Select(e => new ExerciseDto(
                e.Id,
                e.Name,
                e.Category,
                e.PrimaryMuscle,
                e.SecondaryMuscle,
                e.MuscleEngagements
                    .OrderBy(m => m.MuscleGroup)
                    .Select(m => new ExerciseMuscleEngagementDto(m.MuscleGroup, m.Level))
                    .ToList()))
            .ToList();
    }
}
