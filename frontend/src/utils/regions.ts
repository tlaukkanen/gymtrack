import type { ExerciseDto } from '../types/api'

export type BodyRegion = 'Upper' | 'Core' | 'Lower' | 'Other'

export const resolveRegion = (primaryMuscle: ExerciseDto['primaryMuscle'] | string): BodyRegion => {
  const value = primaryMuscle.toLowerCase()

  const upper = [
    'chest',
    'upper chest',
    'back',
    'upper back',
    'lats',
    'shoulders',
    'rear delts',
    'biceps',
    'triceps',
    'forearms',
    'arms',
    'grip',
    'rotator cuff',
    'trapezius'
  ]

  const core = ['core', 'obliques', 'abdominals', 'abs', 'hip flexors', 'lower back']

  const lower = [
    'quadriceps',
    'quads',
    'hamstrings',
    'glutes',
    'adductors',
    'calves',
    'legs',
    'posterior chain',
    'ankles'
  ]

  if (upper.includes(value)) return 'Upper'
  if (core.includes(value)) return 'Core'
  if (lower.includes(value)) return 'Lower'

  return 'Other'
}
