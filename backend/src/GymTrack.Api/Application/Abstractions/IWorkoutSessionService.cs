using GymTrack.Application.Contracts.Sessions;

namespace GymTrack.Application.Abstractions;

public interface IWorkoutSessionService
{
    Task<WorkoutSessionDto> StartSessionAsync(Guid userId, Guid programId, StartWorkoutSessionRequest request, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> GetSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> UpdateSetAsync(Guid userId, Guid sessionId, Guid setId, UpdateSessionSetRequest request, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> CompleteSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> AddExerciseAsync(Guid userId, Guid sessionId, AddSessionExerciseRequest request, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> RemoveExerciseAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> ReorderExercisesAsync(Guid userId, Guid sessionId, ReorderSessionExercisesRequest request, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> UpdateExerciseAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, UpdateSessionExerciseRequest request, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> AddSetAsync(Guid userId, Guid sessionId, Guid sessionExerciseId, AddSessionSetRequest request, CancellationToken cancellationToken = default);
    Task<WorkoutSessionDto> RemoveSetAsync(Guid userId, Guid sessionId, Guid setId, CancellationToken cancellationToken = default);
    Task<PagedResult<WorkoutSessionSummaryDto>> ListSessionsAsync(Guid userId, SessionListQuery query, CancellationToken cancellationToken = default);
    Task DeleteSessionAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
}
