import type {
  AuthResponse,
  ExerciseDto,
  WorkoutProgramSummaryDto,
  WorkoutSessionSummaryDto,
  WorkoutSessionDto,
  PagedResult,
  UserPreferenceDto,
} from '../types/api'

// Mock user
export const mockUser: AuthResponse = {
  accessToken: 'mock-token-12345',
  email: 'demo@gymtrack.app',
  displayName: 'Demo User',
}

// Mock exercises with muscle engagements
export const mockExercises: ExerciseDto[] = [
  {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    category: 'Strength',
    primaryMuscle: 'Chest',
    secondaryMuscle: 'Triceps',
    muscleEngagements: [
      { muscleGroup: 'Chest', level: 'Yes' },
      { muscleGroup: 'Triceps', level: 'Some' },
      { muscleGroup: 'Shoulders', level: 'Some' },
    ],
  },
  {
    id: 'ex-2',
    name: 'Barbell Back Squat',
    category: 'Strength',
    primaryMuscle: 'Quadriceps',
    secondaryMuscle: 'Glutes',
    muscleEngagements: [
      { muscleGroup: 'Quadriceps', level: 'Yes' },
      { muscleGroup: 'Glutes', level: 'Yes' },
      { muscleGroup: 'Hamstrings', level: 'Some' },
    ],
  },
  {
    id: 'ex-3',
    name: 'Deadlift',
    category: 'Strength',
    primaryMuscle: 'Back',
    secondaryMuscle: 'Hamstrings',
    muscleEngagements: [
      { muscleGroup: 'Back', level: 'Yes' },
      { muscleGroup: 'Hamstrings', level: 'Yes' },
      { muscleGroup: 'Glutes', level: 'Some' },
      { muscleGroup: 'Core', level: 'Some' },
    ],
  },
  {
    id: 'ex-4',
    name: 'Pull-Up',
    category: 'Strength',
    primaryMuscle: 'Lats',
    secondaryMuscle: 'Biceps',
    muscleEngagements: [
      { muscleGroup: 'Lats', level: 'Yes' },
      { muscleGroup: 'Biceps', level: 'Some' },
      { muscleGroup: 'Core', level: 'Some' },
    ],
  },
  {
    id: 'ex-5',
    name: 'Overhead Press',
    category: 'Strength',
    primaryMuscle: 'Shoulders',
    secondaryMuscle: 'Triceps',
    muscleEngagements: [
      { muscleGroup: 'Shoulders', level: 'Yes' },
      { muscleGroup: 'Triceps', level: 'Some' },
      { muscleGroup: 'Core', level: 'Some' },
    ],
  },
  {
    id: 'ex-6',
    name: 'Barbell Curl',
    category: 'Strength',
    primaryMuscle: 'Biceps',
    secondaryMuscle: 'Forearms',
    muscleEngagements: [
      { muscleGroup: 'Biceps', level: 'Yes' },
      { muscleGroup: 'Forearms', level: 'Some' },
    ],
  },
  {
    id: 'ex-7',
    name: 'Tricep Rope Pushdown',
    category: 'Strength',
    primaryMuscle: 'Triceps',
    secondaryMuscle: null,
    muscleEngagements: [
      { muscleGroup: 'Triceps', level: 'Yes' },
    ],
  },
  {
    id: 'ex-8',
    name: 'Lat Pulldown',
    category: 'Strength',
    primaryMuscle: 'Lats',
    secondaryMuscle: 'Biceps',
    muscleEngagements: [
      { muscleGroup: 'Lats', level: 'Yes' },
      { muscleGroup: 'Biceps', level: 'Some' },
    ],
  },
  {
    id: 'ex-9',
    name: 'Leg Press',
    category: 'Strength',
    primaryMuscle: 'Quadriceps',
    secondaryMuscle: 'Glutes',
    muscleEngagements: [
      { muscleGroup: 'Quadriceps', level: 'Yes' },
      { muscleGroup: 'Glutes', level: 'Some' },
      { muscleGroup: 'Hamstrings', level: 'Some' },
    ],
  },
  {
    id: 'ex-10',
    name: 'Standing Calf Raise',
    category: 'Strength',
    primaryMuscle: 'Calves',
    secondaryMuscle: null,
    muscleEngagements: [
      { muscleGroup: 'Calves', level: 'Yes' },
    ],
  },
  {
    id: 'ex-11',
    name: 'Plank',
    category: 'Strength',
    primaryMuscle: 'Core',
    secondaryMuscle: null,
    muscleEngagements: [
      { muscleGroup: 'Core', level: 'Yes' },
      { muscleGroup: 'Shoulders', level: 'Some' },
    ],
  },
  {
    id: 'ex-12',
    name: 'Russian Twist',
    category: 'Strength',
    primaryMuscle: 'Core',
    secondaryMuscle: null,
    muscleEngagements: [
      { muscleGroup: 'Core', level: 'Yes' },
      { muscleGroup: 'Obliques', level: 'Yes' },
    ],
  },
]

// Mock programs
export const mockPrograms: WorkoutProgramSummaryDto[] = [
  {
    id: 'prog-1',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps',
    exerciseCount: 5,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prog-2',
    name: 'Pull Day',
    description: 'Back and biceps',
    exerciseCount: 4,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prog-3',
    name: 'Leg Day',
    description: 'Quadriceps, hamstrings, glutes, and calves',
    exerciseCount: 5,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Helper to create dates relative to now
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

// Mock completed sessions
export const mockSessionSummaries: WorkoutSessionSummaryDto[] = [
  {
    id: 'sess-1',
    programId: 'prog-1',
    programName: 'Push Day',
    startedAt: daysAgo(1),
    completedAt: daysAgo(1),
    duration: '01:15:00',
    exerciseCount: 5,
    loggedSetCount: 15,
    totalSetCount: 15,
    lastUpdatedAt: daysAgo(1),
    totalWeightLiftedKg: 2500,
  },
  {
    id: 'sess-2',
    programId: 'prog-2',
    programName: 'Pull Day',
    startedAt: daysAgo(2),
    completedAt: daysAgo(2),
    duration: '01:00:00',
    exerciseCount: 4,
    loggedSetCount: 12,
    totalSetCount: 12,
    lastUpdatedAt: daysAgo(2),
    totalWeightLiftedKg: 1800,
  },
  {
    id: 'sess-3',
    programId: 'prog-3',
    programName: 'Leg Day',
    startedAt: daysAgo(3),
    completedAt: daysAgo(3),
    duration: '01:30:00',
    exerciseCount: 5,
    loggedSetCount: 18,
    totalSetCount: 18,
    lastUpdatedAt: daysAgo(3),
    totalWeightLiftedKg: 4000,
  },
  {
    id: 'sess-4',
    programId: 'prog-1',
    programName: 'Push Day',
    startedAt: daysAgo(5),
    completedAt: daysAgo(5),
    duration: '01:10:00',
    exerciseCount: 5,
    loggedSetCount: 15,
    totalSetCount: 15,
    lastUpdatedAt: daysAgo(5),
    totalWeightLiftedKg: 2400,
  },
  {
    id: 'sess-5',
    programId: 'prog-2',
    programName: 'Pull Day',
    startedAt: daysAgo(6),
    completedAt: daysAgo(6),
    duration: '00:55:00',
    exerciseCount: 4,
    loggedSetCount: 12,
    totalSetCount: 12,
    lastUpdatedAt: daysAgo(6),
    totalWeightLiftedKg: 1750,
  },
]

// Mock session details
export const mockSessionDetails: Record<string, WorkoutSessionDto> = {
  'sess-1': {
    id: 'sess-1',
    programId: 'prog-1',
    startedAt: daysAgo(1),
    completedAt: daysAgo(1),
    notes: 'Great push day workout',
    exercises: [
      { id: 'se-1', exerciseId: 'ex-1', exerciseName: 'Barbell Bench Press', isAdHoc: false, isCatalogExercise: true, orderPerformed: 1, restSeconds: 90, sets: [] },
      { id: 'se-2', exerciseId: 'ex-5', exerciseName: 'Overhead Press', isAdHoc: false, isCatalogExercise: true, orderPerformed: 2, restSeconds: 90, sets: [] },
      { id: 'se-3', exerciseId: 'ex-7', exerciseName: 'Tricep Rope Pushdown', isAdHoc: false, isCatalogExercise: true, orderPerformed: 3, restSeconds: 60, sets: [] },
    ],
    totalWeightLiftedKg: 2500,
  },
  'sess-2': {
    id: 'sess-2',
    programId: 'prog-2',
    startedAt: daysAgo(2),
    completedAt: daysAgo(2),
    notes: 'Solid pull day',
    exercises: [
      { id: 'se-4', exerciseId: 'ex-4', exerciseName: 'Pull-Up', isAdHoc: false, isCatalogExercise: true, orderPerformed: 1, restSeconds: 120, sets: [] },
      { id: 'se-5', exerciseId: 'ex-8', exerciseName: 'Lat Pulldown', isAdHoc: false, isCatalogExercise: true, orderPerformed: 2, restSeconds: 90, sets: [] },
      { id: 'se-6', exerciseId: 'ex-6', exerciseName: 'Barbell Curl', isAdHoc: false, isCatalogExercise: true, orderPerformed: 3, restSeconds: 60, sets: [] },
    ],
    totalWeightLiftedKg: 1800,
  },
  'sess-3': {
    id: 'sess-3',
    programId: 'prog-3',
    startedAt: daysAgo(3),
    completedAt: daysAgo(3),
    notes: 'Heavy leg day',
    exercises: [
      { id: 'se-7', exerciseId: 'ex-2', exerciseName: 'Barbell Back Squat', isAdHoc: false, isCatalogExercise: true, orderPerformed: 1, restSeconds: 180, sets: [] },
      { id: 'se-8', exerciseId: 'ex-3', exerciseName: 'Deadlift', isAdHoc: false, isCatalogExercise: true, orderPerformed: 2, restSeconds: 180, sets: [] },
      { id: 'se-9', exerciseId: 'ex-9', exerciseName: 'Leg Press', isAdHoc: false, isCatalogExercise: true, orderPerformed: 3, restSeconds: 120, sets: [] },
      { id: 'se-10', exerciseId: 'ex-10', exerciseName: 'Standing Calf Raise', isAdHoc: false, isCatalogExercise: true, orderPerformed: 4, restSeconds: 60, sets: [] },
    ],
    totalWeightLiftedKg: 4000,
  },
  'sess-4': {
    id: 'sess-4',
    programId: 'prog-1',
    startedAt: daysAgo(5),
    completedAt: daysAgo(5),
    notes: null,
    exercises: [
      { id: 'se-11', exerciseId: 'ex-1', exerciseName: 'Barbell Bench Press', isAdHoc: false, isCatalogExercise: true, orderPerformed: 1, restSeconds: 90, sets: [] },
      { id: 'se-12', exerciseId: 'ex-5', exerciseName: 'Overhead Press', isAdHoc: false, isCatalogExercise: true, orderPerformed: 2, restSeconds: 90, sets: [] },
    ],
    totalWeightLiftedKg: 2400,
  },
  'sess-5': {
    id: 'sess-5',
    programId: 'prog-2',
    startedAt: daysAgo(6),
    completedAt: daysAgo(6),
    notes: null,
    exercises: [
      { id: 'se-13', exerciseId: 'ex-4', exerciseName: 'Pull-Up', isAdHoc: false, isCatalogExercise: true, orderPerformed: 1, restSeconds: 120, sets: [] },
      { id: 'se-14', exerciseId: 'ex-8', exerciseName: 'Lat Pulldown', isAdHoc: false, isCatalogExercise: true, orderPerformed: 2, restSeconds: 90, sets: [] },
    ],
    totalWeightLiftedKg: 1750,
  },
}

// Mock user preferences
export const mockUserPreferences: UserPreferenceDto = {
  userId: 'user-1',
  defaultRestSeconds: 90,
  units: 'metric',
}
