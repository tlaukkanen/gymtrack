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
  defaultRestSeconds: number
  muscleEngagements: ExerciseMuscleEngagementDto[]
}

export interface ExerciseSetDto {
  id?: string | null
  sequence: number
  targetWeight?: number | null
  targetReps?: number | null
  targetDurationSeconds?: number | null
  isWarmup: boolean
}

export interface WorkoutProgramExerciseDto {
  id?: string | null
  exerciseId: string
  displayOrder: number
  restSeconds: number
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
}

export interface WorkoutSessionExerciseDto {
  id: string
  exerciseId?: string | null
  exerciseName: string
  customExerciseName?: string | null
  isAdHoc: boolean
  isCatalogExercise: boolean
  notes?: string | null
  orderPerformed: number
  restSeconds: number
  sets: WorkoutSessionSetDto[]
}

export interface WorkoutSessionDto {
  id: string
  programId: string
  startedAt: string
  completedAt?: string | null
  notes?: string | null
  exercises: WorkoutSessionExerciseDto[]
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
  restSeconds: number
  sets?: AddSessionExerciseSetDto[] | null
}

export interface UpdateSessionExerciseRequest {
  notes?: string | null
  restSeconds?: number | null
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
