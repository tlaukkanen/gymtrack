using GymTrack.Application.Contracts.Sessions;

namespace GymTrack.Application.Abstractions;

public interface IWorkoutSessionService
{
    Task<WorkoutSessionDto> StartSessionAsync(Guid userId, Guid programId, StartWorkoutSessionRequest request, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> GetSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> UpdateSetAsync(Guid userId, Guid sessionId, Guid setId, UpdateSessionSetRequest request, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> CompleteSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
}
