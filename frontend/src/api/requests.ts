import { apiClient } from './client'
import type {
  AuthResponse,
  AddSessionExerciseRequest,
  AddSessionSetRequest,
  CreateWorkoutProgramRequest,
  LoginRequest,
  ReorderSessionExercisesRequest,
  RegisterRequest,
  SessionListRequest,
  PagedResult,
  UpdateSessionSetRequest,
  UpdateSessionExerciseRequest,
  UpdateUserPreferenceRequest,
  UpdateWorkoutProgramRequest,
  WorkoutProgramDetailDto,
  WorkoutProgramSummaryDto,
  WorkoutSessionDto,
  WorkoutSessionSummaryDto,
  ExerciseDto,
  UserPreferenceDto,
  StartWorkoutSessionRequest,
} from '../types/api'

export const authApi = {
  login: (payload: LoginRequest) => apiClient.post<AuthResponse>('/auth/login', payload).then((res) => res.data),
  register: (payload: RegisterRequest) => apiClient.post<AuthResponse>('/auth/register', payload).then((res) => res.data),
}

export const exerciseApi = {
  list: () => apiClient.get<ExerciseDto[]>('/exercises').then((res) => res.data),
}

export const programsApi = {
  list: () => apiClient.get<WorkoutProgramSummaryDto[]>('/programs').then((res) => res.data),
  detail: (id: string) => apiClient.get<WorkoutProgramDetailDto>(`/programs/${id}`).then((res) => res.data),
  create: (payload: CreateWorkoutProgramRequest) => apiClient.post<WorkoutProgramDetailDto>('/programs', payload).then((res) => res.data),
  update: (id: string, payload: UpdateWorkoutProgramRequest) => apiClient.put<WorkoutProgramDetailDto>(`/programs/${id}`, payload).then((res) => res.data),
  remove: (id: string) => apiClient.delete(`/programs/${id}`),
}

export const sessionsApi = {
  list: (params?: SessionListRequest) =>
    apiClient.get<PagedResult<WorkoutSessionSummaryDto>>('/sessions', { params }).then((res) => res.data),
  start: (programId: string, payload: StartWorkoutSessionRequest) =>
    apiClient.post<WorkoutSessionDto>(`/programs/${programId}/sessions`, payload).then((res) => res.data),
  detail: (sessionId: string) => apiClient.get<WorkoutSessionDto>(`/sessions/${sessionId}`).then((res) => res.data),
  updateSet: (sessionId: string, setId: string, payload: UpdateSessionSetRequest) =>
    apiClient.patch<WorkoutSessionDto>(`/sessions/${sessionId}/sets/${setId}`, payload).then((res) => res.data),
  complete: (sessionId: string) => apiClient.post<WorkoutSessionDto>(`/sessions/${sessionId}/complete`, {}).then((res) => res.data),
  addExercise: (sessionId: string, payload: AddSessionExerciseRequest) =>
    apiClient.post<WorkoutSessionDto>(`/sessions/${sessionId}/exercises`, payload).then((res) => res.data),
  removeExercise: (sessionId: string, sessionExerciseId: string) =>
    apiClient.delete<WorkoutSessionDto>(`/sessions/${sessionId}/exercises/${sessionExerciseId}`).then((res) => res.data),
  reorderExercises: (sessionId: string, payload: ReorderSessionExercisesRequest) =>
    apiClient.patch<WorkoutSessionDto>(`/sessions/${sessionId}/exercises/order`, payload).then((res) => res.data),
  updateExercise: (sessionId: string, sessionExerciseId: string, payload: UpdateSessionExerciseRequest) =>
    apiClient.patch<WorkoutSessionDto>(`/sessions/${sessionId}/exercises/${sessionExerciseId}`, payload).then((res) => res.data),
  addSet: (sessionId: string, sessionExerciseId: string, payload: AddSessionSetRequest) =>
    apiClient
      .post<WorkoutSessionDto>(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`, payload)
      .then((res) => res.data),
  removeSet: (sessionId: string, setId: string) =>
    apiClient.delete<WorkoutSessionDto>(`/sessions/${sessionId}/sets/${setId}`).then((res) => res.data),
  remove: (sessionId: string) => apiClient.delete<void>(`/sessions/${sessionId}`),
}

export const profileApi = {
  get: () => apiClient.get<UserPreferenceDto>('/profile').then((res) => res.data),
  update: (payload: UpdateUserPreferenceRequest) => apiClient.patch<UserPreferenceDto>('/profile', payload).then((res) => res.data),
}
