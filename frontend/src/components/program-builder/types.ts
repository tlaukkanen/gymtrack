export type NormalizedCategory = 'Strength' | 'Cardio'

export interface BuilderSet {
  key: string
  sourceId?: string | null
  targetWeight?: number | ''
  targetReps?: number | ''
  targetDurationSeconds?: number | ''
  restSeconds?: number | ''
}

export interface BuilderExercise {
  key: string
  sourceId?: string | null
  exerciseId: string
  exerciseName: string
  primaryMuscle: string
  secondaryMuscle?: string | null
  category: NormalizedCategory
  notes?: string
  sets: BuilderSet[]
}
