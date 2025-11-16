using GymTrack.Application.Contracts.Programs;

namespace GymTrack.Application.Abstractions;

public interface IWorkoutProgramService
{
    Task<IReadOnlyCollection<WorkoutProgramSummaryDto>> GetProgramsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<WorkoutProgramDetailDto> GetProgramAsync(Guid userId, Guid programId, CancellationToken cancellationToken = default);
    Task<WorkoutProgramDetailDto> CreateProgramAsync(Guid userId, CreateWorkoutProgramRequest request, CancellationToken cancellationToken = default);
    Task<WorkoutProgramDetailDto> UpdateProgramAsync(Guid userId, Guid programId, UpdateWorkoutProgramRequest request, CancellationToken cancellationToken = default);
    Task DeleteProgramAsync(Guid userId, Guid programId, CancellationToken cancellationToken = default);
}
