import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { MuscleMap, MuscleMapLegend, type MuscleEngagement } from '../../pages/analysis/MuscleMap'
import { getMuscleEngagementScore } from '../../utils/muscleEngagement'
import type { BuilderExercise } from './types'
import type { ExerciseDto } from '../../types/api'

interface WorkoutMuscleMapProps {
  builderExercises: BuilderExercise[]
  exerciseCatalog: ExerciseDto[]
}

const calculateWorkoutMuscleEngagements = (
  builderExercises: BuilderExercise[],
  exerciseCatalog: ExerciseDto[]
): MuscleEngagement[] => {
  if (builderExercises.length === 0) {
    return []
  }

  const exerciseMap = new Map(exerciseCatalog.map((e) => [e.id, e]))
  const muscleScores: Record<string, number> = {}

  builderExercises.forEach((builderExercise) => {
    const exercise = exerciseMap.get(builderExercise.exerciseId)
    if (!exercise) return

    // Weight the score by the number of sets
    const setCount = Math.max(builderExercise.sets.length, 1)

    exercise.muscleEngagements.forEach((engagement) => {
      const muscle = engagement.muscleGroup
      const score = getMuscleEngagementScore(engagement.level)
      if (score > 0) {
        muscleScores[muscle] = (muscleScores[muscle] || 0) + score * setCount
      }
    })
  })

  // Convert to intensity percentage (0-100)
  const maxScore = Math.max(...Object.values(muscleScores), 1)

  return Object.entries(muscleScores).map(([muscle, score]) => ({
    muscle,
    intensity: (score / maxScore) * 100,
  }))
}

const WorkoutMuscleMap = ({ builderExercises, exerciseCatalog }: WorkoutMuscleMapProps) => {
  const muscleEngagements = useMemo(
    () => calculateWorkoutMuscleEngagements(
      builderExercises,
      exerciseCatalog
    ),
    [builderExercises, exerciseCatalog]
  )

  const trainedMuscles = muscleEngagements.filter((e) => e.intensity > 0).length
  const totalSets = builderExercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0
  )

  if (builderExercises.length === 0) {
    return null
  }

  return (
    <Box className="flex flex-col items-center gap-4 py-4">
      <Typography
        variant="subtitle2"
        color="text.secondary"
        className="text-center"
      >
        {builderExercises.length} exercise{builderExercises.length !== 1 ? 's' : ''} · {totalSets} set{totalSets !== 1 ? 's' : ''} · {trainedMuscles} muscle group{trainedMuscles !== 1 ? 's' : ''}
      </Typography>
      <MuscleMap engagements={muscleEngagements} />
      <MuscleMapLegend />
    </Box>
  )
}

export default WorkoutMuscleMap
