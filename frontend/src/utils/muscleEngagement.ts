import type { ExerciseMuscleEngagementDto } from '../types/api'

/**
 * Converts a muscle engagement level to a normalized score (0-1 scale).
 * - "Yes" or 2: Full engagement (1.0)
 * - "Some" or 1: Partial engagement (0.5)
 * - "No" or 0: No engagement (0)
 */
export const getMuscleEngagementScore = (level: ExerciseMuscleEngagementDto['level']): number => {
  if (typeof level === 'number') {
    // 0 = No, 1 = Some, 2 = Yes
    return level === 2 ? 1 : level === 1 ? 0.5 : 0
  }
  switch (level) {
    case 'Yes':
      return 1
    case 'Some':
      return 0.5
    default:
      return 0
  }
}

/**
 * Converts a muscle engagement level to an intensity percentage (0-100 scale).
 */
export const getMuscleEngagementIntensity = (level: ExerciseMuscleEngagementDto['level']): number => {
  return getMuscleEngagementScore(level) * 100
}
