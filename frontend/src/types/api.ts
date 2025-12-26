export interface AuthResponse {
  accessToken: string
  email: string
  displayName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  displayName: string
  invitationCode: string
}

export type MuscleEngagementLevel = 'No' | 'Some' | 'Yes' | 0 | 1 | 2

export interface ExerciseMuscleEngagementDto {
  muscleGroup: string
  level: MuscleEngagementLevel
}

export type ExerciseCategory = 'Strength' | 'Cardio' | 0 | 1

export interface ExerciseDto {
  id: string
  name: string
  category: ExerciseCategory
  primaryMuscle: string
  secondaryMuscle?: string | null
  muscleEngagements: ExerciseMuscleEngagementDto[]
}

export interface ExerciseSetDto {
  id?: string | null
  sequence: number
  targetWeight?: number | null
  targetReps?: number | null
  targetDurationSeconds?: number | null
  restSeconds?: number | null
}

export interface WorkoutProgramExerciseDto {
  id?: string | null
  exerciseId: string
  displayOrder: number
  notes?: string | null
  sets: ExerciseSetDto[]
}

export interface WorkoutProgramSummaryDto {
  id: string
  name: string
  description?: string | null
  exerciseCount: number
  createdAt: string
}

export interface WorkoutProgramDetailDto {
  id: string
  name: string
  description?: string | null
  exercises: WorkoutProgramExerciseDto[]
}

export interface CreateWorkoutProgramRequest {
  name: string
  description?: string | null
  exercises: WorkoutProgramExerciseDto[]
}

export type UpdateWorkoutProgramRequest = CreateWorkoutProgramRequest

export interface WorkoutSessionSetDto {
  id: string
  setIndex: number
  plannedWeight?: number | null
  plannedReps?: number | null
  plannedDurationSeconds?: number | null
  actualWeight?: number | null
  actualReps?: number | null
  actualDurationSeconds?: number | null
  isUserAdded: boolean
  lastWeight?: number | null
  lastReps?: number | null
  lastDurationSeconds?: number | null
}

export interface WorkoutSessionExerciseDto {
  id: string
  exerciseId?: string | null
  exerciseName: string
  customExerciseName?: string | null
  customCategory?: string | null
  category?: ExerciseCategory | null
  isAdHoc: boolean
  isCatalogExercise: boolean
  notes?: string | null
  orderPerformed: number
  sets: WorkoutSessionSetDto[]
}

export interface WorkoutSessionDto {
  id: string
  programId: string
  startedAt: string
  completedAt?: string | null
  notes?: string | null
  exercises: WorkoutSessionExerciseDto[]
  totalWeightLiftedKg?: number | null
}

export interface WorkoutSessionSummaryDto {
  id: string
  programId: string
  programName: string
  startedAt: string
  completedAt?: string | null
  duration: string
  exerciseCount: number
  loggedSetCount: number
  totalSetCount: number
  lastUpdatedAt: string
  totalWeightLiftedKg?: number | null
}

export interface WorkoutSessionProgressPointDto {
  sessionId: string
  completedAt: string
  totalWeightLiftedKg: number
}

export interface WorkoutSessionExerciseProgressPointDto {
  sessionId: string
  sessionExerciseId: string
  completedAt: string
  totalWeightLiftedKg: number
}

export type SessionListStatus = 'All' | 'InProgress' | 'Completed'

export interface SessionListRequest {
  page?: number
  pageSize?: number
  status?: SessionListStatus
  startedFrom?: string
  startedTo?: string
  search?: string
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

export interface StartWorkoutSessionRequest {
  notes?: string | null
}

export interface UpdateSessionSetRequest {
  actualWeight?: number | null
  actualReps?: number | null
  actualDurationSeconds?: number | null
}

export interface AddSessionExerciseSetDto {
  plannedWeight?: number | null
  plannedReps?: number | null
  plannedDurationSeconds?: number | null
}

export interface AddSessionExerciseRequest {
  exerciseId?: string | null
  customExerciseName?: string | null
  customCategory?: string | null
  customPrimaryMuscle?: string | null
  notes?: string | null
  sets?: AddSessionExerciseSetDto[] | null
}

export interface UpdateSessionExerciseRequest {
  notes?: string | null
}

export interface ReorderSessionExercisesRequest {
  orderedExerciseIds: string[]
}

export interface AddSessionSetRequest {
  plannedWeight?: number | null
  plannedReps?: number | null
  plannedDurationSeconds?: number | null
}

export interface UserPreferenceDto {
  userId: string
  defaultRestSeconds: number
  units: 'metric' | 'imperial' | string
}

export interface UpdateUserPreferenceRequest {
  defaultRestSeconds: number
  units: string
}
